/**
 *
 * @author Édouard Lanctôt < edouardlb@gmail.com >
 *
 */
(function(window) {

    window.TrackingMotion = function() {
        //constants
        this.TRACKING_SIZE = 256;
        this.USE_ANIMATION_FRAME = true;
        this.USE_WEBWORKER_FOR_OPENCV = true;
        this.PATH_TO_TRACKING_WORKER = 'js/worker/';
        this.PATH_TO_SHADERS = 'shaders/tracking/';
        this.SHADERS_LIST = [
            'vertex.vert',
            'simpleExposure.frag',
            'frameDiff.frag',
            'hueLumaSaturationThreshold.frag',
            'MotionDirection.frag',
            'Blur.vert',
            'BlurMotion.frag'
        ];
        this.BUFFER_SIZE = this.TRACKING_SIZE * this.TRACKING_SIZE * 4;
        this.VIDEO_UPDATE_RATE = ( 1000 / 24);
        this.RESET_TIMEOUT = 5000;
        this.LUMINOSITY_SEND_DELAY = 500;


        //default settings
        this.defaultSettings = {
            edgesOffset: 1.0,
            blurOffset: 0.25,
            hardEdges: 5.0,
            blurThreshold: 0.2,
            minLuminosity: 0.135,
            minChroma: 0.135,
            hueRange: 0.3
        };

        this.defaultSettingsColor = {
            edgesOffset: 0.75,
            blurOffset: 0.5,
            hardEdges: 9.0,
            blurThreshold: 0.25,
            minLuminosity: 0.11,
            minChroma: 0.13,
            hueRange: 0.3
        };

        this.defaultSettingsHalo = {
            edgesOffset: 1.0,
            blurOffset: 0.0,
            hardEdges: 3.0,
            blurThreshold: 0.2,
            minLuminosity: 0.3,
            minChroma: 0.15,
            hueRange: 0.3
        };

        //rendering
        this.options = null;
        this.renderer = null;
        this.separateRender = false;
        this.shaders = {};
        this.shaderMaterial = {};
        this.renderPasses = {};
        this.projector = null;
        this.projectionCamera = null;
        this.frameDiffIsPing = false;

        //loading
        this.videoReady = false;
        this.numShadersLoaded = 0;


        //the worker
        this.CVWorker = null
        this.workerIsBusy = false;
        this.buff = null;


        //the getUserMedia video
        this.video = null;
        this.videoCanvas = null;
        this.videoTexture = null;
        this.lastVideoUpdateTime = 0;
        this.currentVideoFrame = 0;
        this.trackingPause = false;


        //state 
        this.READY = false;
        this.initialised = false;
        this.position = null;
        this.rotation = null;
        this.normalizedPosition = new THREE.Vector3(0.5,0.5,0.5);

        this.lastFrameTime = 0;
        this.phoneLife = 0
        this.phoneDeath = 0;
        this.foundHole = false;
        this.orientationReset = false;
        this.orientationResetTime = -1;
        this.isFrontal = false;
        this.averageHoleRatio = 0.0;
        this.lastPhoneLuminosityMessage = 0;
        this.targetLuminosity = 0.8;
        this.targetHoleRatio = 0.4;
        this.averageColorBlob = 0.0;
        this.averageColorHalo = 0.0;
        this.averageMotionX = 0.0;
        this.averageMotionY = 0.0;

        //external callbacks
        this.debugView = null
        this.onerror = null;
        this.onready = null;
        this.onluminosity = null;
        this.onupdate = null;
        this.onresetorientation = null;


        /**
         *
         * Start the tracking
         *
         * @params.renderer -> three.js renderer to use
         *
         * @params.workerPath -> path to tracking worker
         * @params useWebWorkers -> Boolean
         * @params useAnimationFrame -> (Boolean) Auto-Update Tracking.run() every frame or not
         *
         * @params.video -> getUserMedia video to use
         * @loadVideo -> handle getUserMedia directly from the tracking module
         *
         * @params.shaders -> {} list of shaders by name
         * @params.shaderPath -> path to shaders
         * @params.loadExternalShaders -> Boolean
         * @params.options -> list of external options to watch for / update (to link with a gui). Otherwise static.
         * 
         * // Callbacks //
         * @params.onready -> initialisation and video and 
         * @params.onerror -> initialisation errors callback
         * @params.onresetorientation -> reset the phone orientation once in a while when fronta
         * @params.debugView -> a debug view object to update once in a while with the textures
         *
        */
        this.start = function(params) {

            var self = this;

            //callbacks
            this.onerror = params.onerror || function(message) { throw new Error(message); }
            this.onready = params.onready;
            this.onluminosity = params.onluminosity;
            this.onresetorientation = params.onresetorientation;
            this.onupdate = params.onupdate;
            this.debugView = params.debugView;

            //dependencies
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL || window.oURL;
            if (!navigator.getUserMedia || !window.URL) this.onerror('Tracking Error : getUserMedia not supported');   
            if (!window.THREE) this.onerror('Tracking Error: THREE.js Required for tracking.')


            //set constant parameters 
            this.PATH_TO_TRACKING_WORKER = params.workerPath !== undefined ? params.workerPath : 'js/worker/';
            this.PATH_TO_SHADERS  = params.shaderPath !== undefined ? params.shaderPath : 'shaders/tracking/';
            this.USE_WEBWORKER_FOR_OPENCV = params.useWebWorkers !== undefined ? params.useWebWorkers : true;
            this.USE_ANIMATION_FRAME = params.useAnimationFrame !== undefined ? params.useAnimationFrame : true;

            //get renderer
            this.renderer = params.renderer;
            if (!this.renderer) {
                this.renderer = new THREE.WebGLRenderer({antialias: false, alpha: false});
                this.renderer.setClearColor(0x000000, 1);
                this.renderer.setSize(this.TRACKING_SIZE,this.TRACKING_SIZE);
                this.renderer.autoClear = false;
                this.separateRender = true;
            }


            //shader parameters (with possible external gui link) and default parameters
            this.options = params.options || {"static": false};
            this.options.edgesOffset = this.options.edgesOffset === undefined ? this.defaultSettings.edgesOffset : this.options.edgesOffset;
            this.options.blurOffset = this.options.blurOffset === undefined ? this.defaultSettings.blurOffset : this.options.blurOffset;
            this.options.hardEdges = this.options.hardEdges === undefined ? this.defaultSettings.hardEdges : this.options.hardEdges;
            this.options.blurThreshold = this.options.blurThreshold === undefined ? this.defaultSettings.blurThreshold : this.options.blurThreshold;
            this.options.minLuminosity = this.options.minLuminosity === undefined ? this.defaultSettings.minLuminosity : this.options.minLuminosity;
            this.options.minChroma = this.options.minChroma === undefined ? this.defaultSettings.minChroma : this.options.minChroma;
            this.options.hueRange = this.options.hueRange === undefined ? this.defaultSettings.hueRange : this.options.hueRange;


            //load video if not pre-loaded
            if (!params.video || params.loadVideo) {
                this.video = document.createElement('video');
                navigator.getUserMedia(
                    {
                        video: {mandatory: {minWidth: this.TRACKING_SIZE, minHeight: this.TRACKING_SIZE}}
                    },
                    function (stream) {
                        self.video.play();
                        self.video.src = window.URL.createObjectURL(stream);
                        self.video.addEventListener('loadeddata', function () {
                            self.videoReady = true;
                            self.loadProgress();
                        });
                    },
                    function (e) {
                        console.log(e);
                        self.onerror('Tracking Error: Camera Denied',e);
                    }
                );
            } else {
                //use pre-loaded video
                this.video = params.video;
                if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
                    this.videoReady = true;
                    this.loadProgress();
                } else {
                    this.video.addEventListener('loadeddata', function () {
                        self.videoReady = true;
                        self.loadProgress();
                    });
                }
            }


            //load shaders
            if (!params.shaders || params.loadExternalShaders) {
                this.shaders = params.shaders || {};
                for (var i=0; i<this.SHADERS_LIST.length; i++) {
                    (function(shaderPath,self) {

                        self.shaders[shaderPath] = undefined;

                        var xhr = new XMLHttpRequest();
                        xhr.onreadystatechange = function() {
                            if ( xhr.readyState === 4 ) {
                                if ( xhr.status === 200 ) {
                                    loaded = true;
                                    self.numShadersLoaded++;
                                    self.shaders[shaderPath] = xhr.responseText;
                                    self.loadProgress();
                                } else {
                                    self.onerror('XHR Loading Error for tracking shader: '+shaderPath);
                                }
                            }
                        }

                        xhr.responseType = 'text';
                        xhr.open("GET", self.PATH_TO_SHADERS + shaderPath, true);
                        xhr.overrideMimeType("text/plain; charset=x-user-defined");
                        xhr.send(null);

                    })(this.SHADERS_LIST[i],this);
                }

            //use pre-loaded shaders
            } else {
                this.shaders = params.shaders;
                for (var i=0; i<this.SHADERS_LIST.length; i++) {
                    if (!this.shaders[this.SHADERS_LIST[i]]) {
                        this.onerror('Missing Shader For Tracking: '+this.SHADERS_LIST[i]);
                    } else {
                        self.numShadersLoaded++;
                    }
                }
                this.loadProgress();
            }


            //load webworker
            this.CVWorker = (!this.USE_WEBWORKER_FOR_OPENCV) ? window.TrackingWorker : new Worker(this.PATH_TO_TRACKING_WORKER + 'TrackingWorker.js');
            this.CVWorker.postMessage = this.CVWorker.webkitPostMessage || this.CVWorker.postMessage;
            this.CVWorker.addEventListener('message', function () {
                self.receiveTrackingDataFromOpenCV.apply(self, arguments);
            }, false);
        }


        /**
         *
         * Make sure the tracking is fully loaded before setting up
         *
        */
        this.loadProgress = function() {
            if (!this.initialised && this.videoReady && this.numShadersLoaded === this.SHADERS_LIST.length) this.init();
        }


        /**
         *
         * Init the webgl part of the tracking
         *
        */
        this.init = function() {

            //local vars
            var self = this,
                cshader = null;

            //data state and analysis basics
            this.projector = new THREE.Projector();
            this.projectionCamera = new THREE.PerspectiveCamera(45, 1.0, 1, 1000),
            this.position = new THREE.Vector3(0, 0, 0.5);
            this.rotation = new THREE.Vector3(0, 0, 0);
            this.normalizedPosition = new THREE.Vector3(0, 0, 0.5);

            //
            // Video
            // Texture upload to the gpu is a major bottleneck
            // so we're using a small canvas to upload as less texture to the gpu as possible
            //
            this.video.play();
            this.videoCanvas = document.createElement('canvas');
            this.videoCanvas.width = this.TRACKING_SIZE;
            this.videoCanvas.height = this.TRACKING_SIZE;
            this.videoCanvas.c = this.videoCanvas.getContext('2d');
            this.videoCanvas.c.drawImage(this.video, 0, 0, this.TRACKING_SIZE, this.TRACKING_SIZE);

            //video texture
            this.videoTexture = new THREE.Texture(
                this.videoCanvas,
                new THREE.UVMapping(),
                THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping,
                THREE.LinearFilter,
                THREE.LinearFilter,
                THREE.RGBFormat,
                THREE.UnsignedByteType,
            1);
            this.videoTexture.generateMipmaps = false;
            this.videoTexture.needsUpdate = true;


             //
            // Exposure (make the whites be white and the blacks be black)
            //
            cshader = 'simpleExposure'
            this.shaderMaterial[cshader] = new THREE.ShaderMaterial({
                vertexShader: this.shaders['vertex.vert'],
                fragmentShader: this.shaders['simpleExposure.frag'],
                attributes: {},
                uniforms: {
                    'texture': {type: 't', value: this.videoTexture},
                    'exposure': {type: 'f', value: 1.0},
                    'offset': {type: 'f', value: 0.00}
                },
                //equation/parameters to allow for RGBA encoding
                depthTest: false,
                transparent: false,
                blending: THREE.CustomBlending,
                blendEquation: THREE.AddEquation,
                blendSrc: THREE.OneFactor,
                blendDst: THREE.ZeroFactor,
                side: THREE.DoubleSide
            });

            //create the FBO
            this.renderPasses['simpleExposure'] = new FramebufferWrapper(this.TRACKING_SIZE, this.TRACKING_SIZE, {
                minFilter: THREE.LinearMipMapLinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                type: THREE.UnsignedByteType,
                renderMaterial: this.shaderMaterial[cshader],
                depthBuffer: false,
                stencilBuffer: false,
                premultiplyAlpha: false,
                generateMipmaps: true,
                renderer: this.renderer
            });


            //
            // Peform a large (5x5) blur and threshold/group the pixels
            //
            this.renderPasses['lastFrame'] = new FramebufferWrapper(this.TRACKING_SIZE, this.TRACKING_SIZE, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                type: THREE.UnsignedByteType,
                renderMaterial: new THREE.MeshBasicMaterial({map: this.renderPasses['simpleExposure'].texture, side: THREE.DoubleSide}),
                depthBuffer: false,
                stencilBuffer: false,
                premultiplyAlpha: false,
                generateMipmaps: false,
                renderer: this.renderer
            });
            this.renderPasses['lastFrame'].renderPlane.scale.y = -1;

            cshader = 'frameDiff'
            this.shaderMaterial[cshader] = new THREE.ShaderMaterial({
                vertexShader: this.shaders['vertex.vert'],
                fragmentShader: this.shaders['frameDiff.frag'],
                attributes: {},
                uniforms: {
                    'tCurrent': {type: 't', value: this.renderPasses['simpleExposure'].texture},
                    'tLast': {type: 't', value: this.renderPasses['lastFrame'].texture},
                    'tAccum': {type: 't', value: null},
                    'accumDelta': {type: 'f', value: 0.3},
                    'minDiff': {type: 'f', value: 80 / 256}
                },
                //equation/parameters to allow for RGBA encoding
                depthTest: false,
                transparent: false,
                blending: THREE.CustomBlending,
                blendEquation: THREE.AddEquation,
                blendSrc: THREE.OneFactor,
                blendDst: THREE.ZeroFactor,
                side: THREE.DoubleSide
            });

            //create the FBO
            this.renderPasses[cshader] = new FramebufferWrapper(this.TRACKING_SIZE, this.TRACKING_SIZE, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                type: THREE.UnsignedByteType,
                renderMaterial: this.shaderMaterial[cshader],
                depthBuffer: false,
                stencilBuffer: false,
                premultiplyAlpha: false,
                generateMipmaps: false,
                renderer: this.renderer
            });
            this.renderPasses['frameDiffPong'] = new FramebufferWrapper(this.TRACKING_SIZE, this.TRACKING_SIZE, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                type: THREE.UnsignedByteType,
                renderMaterial: this.shaderMaterial[cshader],
                depthBuffer: false,
                stencilBuffer: false,
                premultiplyAlpha: false,
                generateMipmaps: false,
                renderer: this.renderer
            });



            //
            // Peform a large (5x5) motion direction detection for diff'ed pixels
            //
            cshader = 'blur'
            this.shaderMaterial[cshader] = new THREE.ShaderMaterial({
                vertexShader: this.shaders['Blur.vert'],
                fragmentShader: this.shaders['BlurMotion.frag'],
                attributes: {},
                uniforms: {
                    'texture': {type: 't', value: this.renderPasses['simpleExposure'].texture},
                    'tLastFrame': {type: 't', value: this.renderPasses['lastFrame'].texture},
                    'tFrameDiff': {type: 't', value: this.renderPasses['frameDiff'].texture},
                    'offset': {type: 'v2', value: new THREE.Vector2(1.25 / this.TRACKING_SIZE, 1.25 / this.TRACKING_SIZE)}
                },
                //equation/parameters to allow for RGBA encoding
                depthTest: false,
                transparent: false,
                blending: THREE.CustomBlending,
                blendEquation: THREE.AddEquation,
                blendSrc: THREE.OneFactor,
                blendDst: THREE.ZeroFactor,
                side: THREE.DoubleSide
            });

            //create the FBO
            this.renderPasses[cshader] = new FramebufferWrapper(this.TRACKING_SIZE, this.TRACKING_SIZE, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                type: THREE.UnsignedByteType,
                renderMaterial: this.shaderMaterial[cshader],
                depthBuffer: false,
                stencilBuffer: false,
                premultiplyAlpha: false,
                generateMipmaps: false,
                renderer: this.renderer
            });
            this.renderPasses[cshader].renderPlane.scale.y = -1;


            //
            // Peform a large (5x5) motion direction detection for diff'ed pixels
            //
            cshader = 'direction'
            this.shaderMaterial[cshader] = new THREE.ShaderMaterial({
                vertexShader: this.shaders['Blur.vert'],
                fragmentShader: this.shaders['MotionDirection.frag'],
                attributes: {},
                uniforms: {
                    'texture': {type: 't', value: this.renderPasses['blur'].texture},
                    'tLastFrame': {type: 't', value: this.renderPasses['lastFrame'].texture},
                    'tFrameDiff': {type: 't', value: this.renderPasses['frameDiff'].texture},
                    'offset': {type: 'v2', value: new THREE.Vector2(1.25 / this.TRACKING_SIZE, 1.25 / this.TRACKING_SIZE)}
                },
                //equation/parameters to allow for RGBA encoding
                depthTest: false,
                transparent: false,
                blending: THREE.CustomBlending,
                blendEquation: THREE.AddEquation,
                blendSrc: THREE.OneFactor,
                blendDst: THREE.ZeroFactor,
                side: THREE.DoubleSide
            });

            //create the FBO
            this.renderPasses[cshader] = new FramebufferWrapper(this.TRACKING_SIZE, this.TRACKING_SIZE, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                type: THREE.UnsignedByteType,
                renderMaterial: this.shaderMaterial[cshader],
                depthBuffer: false,
                stencilBuffer: false,
                premultiplyAlpha: false,
                generateMipmaps: false,
                renderer: this.renderer
            });
            this.renderPasses[cshader].renderPlane.scale.y = -1;



            //debugview
            if (this.debugView) {
                this.debugView.setup(this.renderer,false);
                this.debugView.initTexturePlanes(this.videoTexture,this.renderPasses);
            }

            //animationFrame closure
            (function(self) {
                self.animationFrame = function() {
                    self.run.call(self,self.animationFrame);
                }
            })(this);

            //ready
            this.lastVideoUpdateTime = Date.now();
            this.running = true;
            this.initialised = true;
            if (this.onready) this.onready();
            if (this.USE_ANIMATION_FRAME) this.run();
        }


        this.addDebugView = function(_debugView) {
            //debugview
            this.debugView = _debugView;
            this.debugView.setup(this.renderer,false);
            this.debugView.initTexturePlanes(this.videoTexture,this.renderPasses);
        }



        /**
         *
         *
         * Run Tracking(main loop)
         *
         *
        */
        this.run = function() {
            if (this.USE_ANIMATION_FRAME && this.running) window.requestAnimationFrame(this.animationFrame);
            if (!this.initialised) return;

            //update video
            if (Date.now() - this.lastVideoUpdateTime >= this.VIDEO_UPDATE_RATE) {
                this.lastVideoUpdateTime += Math.floor( ( Date.now() - this.lastVideoUpdateTime ) / this.VIDEO_UPDATE_RATE) * this.VIDEO_UPDATE_RATE;

                //update video canvas
                this.videoCanvas.c.drawImage(this.video, 0, 0, this.TRACKING_SIZE, this.TRACKING_SIZE);
                this.videoTexture.needsUpdate = true;
                this.currentVideoFrame++;

                //get luminosity / exposure data from canvas
                if (this.currentVideoFrame % 24 == 0 && !this.trackingPause) {

                    var vData = this.videoCanvas.c.getImageData(0, 0, this.TRACKING_SIZE, this.TRACKING_SIZE),
                        data = vData.data,
                        dataSize = this.TRACKING_SIZE * this.TRACKING_SIZE * 4,
                        tempLum = 0,
                        maxLum = 0,
                        minLum = 765; //255*3

                    for (var i = 0; i < dataSize; i += 4) { //sampler 1/4 of the pixels
                        tempLum = data[i] + data[i + 1] + data[i + 2];
                        maxLum = Math.max(tempLum, maxLum);
                        minLum = Math.min(tempLum, minLum);
                    }
                    minLum *= 1 / 765;
                    maxLum *= 1 / 765;

                    this.shaderMaterial['simpleExposure'].uniforms.offset.value = -minLum;
                    this.shaderMaterial['simpleExposure'].uniforms.exposure.value = 1.0 / (maxLum - minLum); 

                }


                //update uniforms
                if (!this.options["static"]) {
                }

                //compute tracking shaders
                this.renderer.setClearColor(0, 0);
                //if (this.separateRender)
                this.renderer.clear();
                this.renderPasses['simpleExposure'].render();


                var ping = this.frameDiffIsPing ? this.renderPasses['frameDiff'] : this.renderPasses['frameDiffPong'];
                var pong = this.frameDiffIsPing ? this.renderPasses['frameDiffPong'] : this.renderPasses['frameDiff'];
                this.shaderMaterial['frameDiff'].uniforms.tAccum.value = pong.texture;
                ping.render();
                this.frameDiffIsPing = !this.frameDiffIsPing;

                this.shaderMaterial['direction'].uniforms.tFrameDiff.value = ping.texture;
                this.shaderMaterial['blur'].uniforms.tFrameDiff.value = ping.texture;

                this.renderPasses['blur'].render();
                this.renderPasses['direction'].render();



                //extract pixel data
                if (!this.buff || !this.buff.byteLength) this.buff = new Uint8Array(this.BUFFER_SIZE);
                var gl = this.renderer.getContext();
                gl.readPixels(0, 0, this.TRACKING_SIZE, this.TRACKING_SIZE, gl.RGBA, gl.UNSIGNED_BYTE, this.buff);


                var averageX = 0.0;
                var averageY = 0.0;
                var averageMag = 0.0;
                var numMotion = 1;
                var t  = 0;
                var buffer = this.buff;
                for (var y = 0; y < 256; y++) {
                    for (var x = 0; x < 256; x++) {
                        t = (y * 256 + x) * 4;
                        if (buffer[t+2] > 0) {
                            averageX += buffer[t] / 256 * 2.0 -1.0;
                            averageY += buffer[t+1] / 256 * 2.0 -1.0;
                            averageMag += buffer[t+2] / 256;
                            numMotion++;
                        }
                    }
                }
                averageX  = averageX / numMotion;
                averageY  = averageY / numMotion;
                this.averageMotionX = averageX * 0.5 + this.averageMotionX * 0.5;
                this.averageMotionY = averageY * 0.5 + this.averageMotionY * 0.5;
                averageMag = Math.min(Math.max( (numMotion / 3000) , 0.0), 1.0); //averageMag / numMotion;
                console.log(numMotion,averageMag);
                
                if (this.debugView) this.debugView.updateDirection(this.averageMotionX,this.averageMotionY,averageMag);



                //send to opencv worker
                //this.CVWorker.postMessage(this.buff, [this.buff.buffer]);
                this.renderPasses['lastFrame'].render();

                //update debug view
                if (this.debugView) this.debugView.render();
            }
        }


        /**
         *
         *
         * External controls
         *
         *
        */
        this.pause =  function () {
            this.running = false;
        }
        this.resume =  function () {
            if (!this.running) {
                this.running = true;
                if (this.USE_ANIMATION_FRAME) this.run();
            }
        }
        this.getPosition = function () {

            return this.normalizedPosition;

        },
        this.isFrontal = function () {

            return this.isFrontal;

        }

    }

})(window);