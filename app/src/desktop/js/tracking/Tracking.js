/**
 *
 * @author Édouard Lanctôt < edouardlb@gmail.com >
 *
 */
(function (window) {

    window.Tracking = function () {
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
            'Blur.vert',
            'Blur.frag',
            'Edge.frag',
            'BlurRemove.frag',
            'MotionDirection.frag',
            'BlurMotion.frag'
        ];
        this.BUFFER_SIZE = this.TRACKING_SIZE * this.TRACKING_SIZE * 4;
        this.VIDEO_UPDATE_RATE = (1000 / 24);
        this.RESET_TIMEOUT = 10000;
        this.LUMINOSITY_SEND_DELAY = 500;


        //default settings
        this.defaultSettings = {
            edgesOffset: 1.0,
            blurOffset: 0.25,
            hardEdges: 4.0,
            blurThreshold: 0.2,
            minLuminosity: 0.15,
            minChroma: 0.14,
            hueRange: 0.35
        };

        this.defaultSettingsColor = {
            edgesOffset: 0.75,
            blurOffset: 0.5,
            hardEdges: 9.0,
            blurThreshold: 0.25,
            minLuminosity: 0.11,
            minChroma: 0.155,
            hueRange: 0.35
        };

        this.defaultSettingsHalo = {
            edgesOffset: 1.0,
            blurOffset: 0.0,
            hardEdges: 1.5,
            blurThreshold: 1.0,
            minLuminosity: 0.4,
            minChroma: 0.2,
            hueRange: 0.35
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
        this.normalizedPosition = new THREE.Vector3(0,0,1.0);

        this.lastFrameTime = 0;
        this.phoneLife = 0;
        this.phoneDeath = 0;
        this.foundHole = false;
        this.lastPhoneLuminosityMessage = 0;


        //phone tracker calibation
        this.targetHoleRatio = 0.3;
        this.targetLuminosity = 1.0;

        this.averageColorBlob = 0.5;
        this.averageHoleRatio = 0.4;
        this.averageColorHalo = 0.0;
        this.firstLuminosityMessageSent = false;

        this.frameDiffIsPing = false;
        this.persistence = 0.0;
        this.isTouchingSide = false;


        //camera levels
        this.offset = 0.0;
        this.exposure = 1.0;
        this.lowLightScore = 0.0;
        this.highLightScore = 0.0;


        //orientation reset / frontal position
        this.orientationReset = false;
        this.orientationResetTime = -1;
        this.numFrontal = 0;
        this.smoothRotation = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Vector3(0, 0, 1);
        this.rotationMatrix = new THREE.Matrix3();
        this.frontalTolerance = {x: 0.5, y: 0.6, z: 0.7, num: 8};

        //external callbacks
        this.debugView = null;
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
        this.start = function (params) {

            var self = this;

            //callbacks
            this.onerror = params.onerror || function (message) {
                throw new Error(message);
            }
            this.onready = params.onready;
            this.onluminosity = params.onluminosity;
            this.onresetorientation = params.onresetorientation;
            this.onupdate = params.onupdate;
            this.debugView = params.debugView;

            //dependencies
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL || window.oURL;
            if (!navigator.getUserMedia || !window.URL) this.onerror('Tracking Error : getUserMedia not supported');
            if (!window.THREE) this.onerror('Tracking Error: THREE.js Required for tracking.');

            //set constant parameters 
            this.PATH_TO_TRACKING_WORKER = params.workerPath !== undefined ? params.workerPath : 'js/worker/';
            this.PATH_TO_SHADERS = params.shaderPath !== undefined ? params.shaderPath : 'shaders/tracking/';
            this.USE_WEBWORKER_FOR_OPENCV = params.useWebWorkers !== undefined ? params.useWebWorkers : true;
            this.USE_ANIMATION_FRAME = params.useAnimationFrame !== undefined ? params.useAnimationFrame : true;

            //get renderer
            this.renderer = params.renderer;
            if (!this.renderer) {
                this.renderer = new THREE.WebGLRenderer({antialias: false, alpha: false});
                this.renderer.setClearColor(0x000000, 1);
                this.renderer.setSize(this.TRACKING_SIZE, this.TRACKING_SIZE);
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

            //score and others
            this.options.lowLightScore = 0.00001;
            this.options.highLightScore = 0.0001;

            //load video if not pre-loaded
            if (!params.video || params.loadVideo) {
                this.video = document.createElement('video');
                navigator.getUserMedia(
                    {
                        video: {mandatory: {minWidth: 1280, minHeight: 720}} //{minWidth: this.TRACKING_SIZE, minHeight: this.TRACKING_SIZE}}
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
                        self.onerror('Tracking Error: Camera Denied', e);
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
                for (var i = 0; i < this.SHADERS_LIST.length; i++) {
                    (function (shaderPath, self) {

                        self.shaders[shaderPath] = undefined;

                        var xhr = new XMLHttpRequest();
                        xhr.onreadystatechange = function () {
                            if (xhr.readyState === 4) {
                                if (xhr.status === 200) {
                                    loaded = true;
                                    self.numShadersLoaded++;
                                    self.shaders[shaderPath] = xhr.responseText;
                                    self.loadProgress();
                                } else {
                                    self.onerror('XHR Loading Error for tracking shader: ' + shaderPath);
                                }
                            }
                        }

                        //xhr.responseType = 'text';
                        xhr.open("GET", self.PATH_TO_SHADERS + shaderPath, true);
                        xhr.overrideMimeType("text/plain; charset=x-user-defined");
                        xhr.send(null);

                    })(this.SHADERS_LIST[i], this);
                }

                //use pre-loaded shaders
            } else {
                this.shaders = params.shaders;
                for (var i = 0; i < this.SHADERS_LIST.length; i++) {
                    if (!this.shaders[this.SHADERS_LIST[i]]) {
                        this.onerror('Missing Shader For Tracking: ' + this.SHADERS_LIST[i]);
                    } else {
                        self.numShadersLoaded++;
                    }
                }
                this.loadProgress();
            }


            //load webworker
            this.CVWorker = Boolean(!this.USE_WEBWORKER_FOR_OPENCV && window.TrackingWorker) ? window.TrackingWorker : new Worker(this.PATH_TO_TRACKING_WORKER + 'TrackingWorker.js');
            this.CVWorker.postMessage = this.CVWorker.webkitPostMessage || this.CVWorker.postMessage;
            this.CVWorker.addEventListener('message', function () {
                self.receiveTrackingDataFromOpenCV.apply(self, arguments);
            }, false);
            console.log('Using Web Workers for OpenCV:' + !Boolean(!this.USE_WEBWORKER_FOR_OPENCV && window.TrackingWorker));
        };

        this.resume = function () {
            this.running = true;
            window.requestAnimationFrame(this.animationFrame);
        };

        this.stop = function () {
            this.running = false;
        };


        /**
         *
         * Make sure the tracking is fully loaded before setting up
         *
         */
        this.loadProgress = function () {
            if (!this.initialised && this.videoReady && this.numShadersLoaded === this.SHADERS_LIST.length) this.init();
        };


        /**
         *
         * Init the webgl part of the tracking
         *
         */
        this.init = function () {

            //local vars
            var self = this,
                cshader = null;

            //data state and analysis basics
            this.projector = new THREE.Projector();
            this.projectionCamera = new THREE.PerspectiveCamera(45, 1.0, 1, 1000),
                this.position = new THREE.Vector3(0, 0, 1.0);
            this.rotation = new THREE.Vector3(0, 0, 0);
            this.normalizedPosition = new THREE.Vector3(0, 0, 1.0);

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
            //this.videoCanvas.c.drawImage(this.video, 0, 0, this.TRACKING_SIZE, this.TRACKING_SIZE);

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


            //send ratio to the worker
            this.sendWebcamRatio();

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
            // Peform a large (5x5) sobel edge detection
            //
            cshader = 'blur'
            this.shaderMaterial[cshader] = new THREE.ShaderMaterial({
                vertexShader: this.shaders['Blur.vert'],
                fragmentShader: this.shaders['Blur.frag'],
                attributes: {},
                uniforms: {
                    'texture': {type: 't', value: this.renderPasses['simpleExposure'].texture},
                    'offset': {type: 'v2', value: new THREE.Vector2(0.75 / this.TRACKING_SIZE, 0.75 / this.TRACKING_SIZE)}
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
            // Peform a large (5x5) sobel edge detection
            //
            cshader = 'edges'
            this.shaderMaterial[cshader] = new THREE.ShaderMaterial({
                vertexShader: this.shaders['Blur.vert'],
                fragmentShader: this.shaders['Edge.frag'],
                attributes: {},
                uniforms: {
                    'texture': {type: 't', value: this.renderPasses['blur'].texture},
                    'offset': {type: 'v2', value: new THREE.Vector2(0.75 / this.TRACKING_SIZE, 0.75 / this.TRACKING_SIZE)},
                    'hardEdgeThreshold': {type: 'f', value: 8.5}
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
            // Peform a hue / saturation / luma threshold
            //
            cshader = 'hueLuma'
            this.shaderMaterial[cshader] = new THREE.ShaderMaterial({
                vertexShader: this.shaders['vertex.vert'],
                fragmentShader: this.shaders['hueLumaSaturationThreshold.frag'],
                attributes: {},
                uniforms: {
                    'texture': {type: 't', value: this.renderPasses['simpleExposure'].texture},
                    'tEdges': {type: 't', value: this.renderPasses['edges'].texture},
                    'targetHue': {type: 'f', value: 0.0},
                    'hueRange': {type: 'f', value: 0.2},
                    'minLuminosity': {type: 'f', value: 0.2},
                    'minChroma': {type: 'f', value: 0.12}
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
                    'minDiff': {type: 'f', value: 200 / 256}
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
            cshader = 'blurmotion'
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
                    'texture': {type: 't', value: this.renderPasses['blurmotion'].texture},
                    'tLastFrame': {type: 't', value: this.renderPasses['lastFrame'].texture},
                    'tFrameDiff': {type: 't', value: this.renderPasses['frameDiff'].texture},
                    'offset': {type: 'v2', value: new THREE.Vector2(1.5 / this.TRACKING_SIZE, 1.5 / this.TRACKING_SIZE)}
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
            // Peform a large (5x5) blur and threshold/group the pixels
            //
            cshader = 'edges2'
            this.shaderMaterial[cshader] = new THREE.ShaderMaterial({
                vertexShader: this.shaders['Blur.vert'],
                fragmentShader: this.shaders['BlurRemove.frag'],
                attributes: {},
                uniforms: {
                    'texture': {type: 't', value: this.renderPasses['hueLuma'].texture},
                    'tDiffDirection': {type: 't', value: this.renderPasses['direction'].texture},
                    'offset': {type: 'v2', value: new THREE.Vector2(0.5 / this.TRACKING_SIZE, 0.5 / this.TRACKING_SIZE)},
                    'threshold': {type: 'f', value: 0.75}
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
                this.debugView.setup(this.renderer, false);
                this.debugView.initTexturePlanes(this.videoTexture, this.renderPasses);
            }

            //animationFrame closure
            (function (self) {
                self.animationFrame = function () {
                    self.run.call(self, self.animationFrame);
                }
            })(this);

            //ready
            this.lastVideoUpdateTime = Date.now();
            this.running = true;
            this.initialised = true;
            if (this.onready) this.onready();
            if (this.USE_ANIMATION_FRAME) this.run();
        }


        this.addDebugView = function (_debugView) {
            //debugview
            this.debugView = _debugView;
            this.debugView.setup(this.renderer, false);
            this.debugView.initTexturePlanes(this.videoTexture, this.renderPasses);
        }


        /**
         *
         *
         * Run Tracking(main loop)
         *
         *
         */
        this.run = function () {
            if (!this.initialised) return;
            if (this.USE_ANIMATION_FRAME && this.running) window.requestAnimationFrame(this.animationFrame);

            //update video
            if (Date.now() - this.lastVideoUpdateTime >= this.VIDEO_UPDATE_RATE && !this.trackingPause) {
                var delta = Math.min(Math.max(Date.now() - this.lastVideoUpdateTime / (1000 / 24), 0.5), 2.0);
                this.lastVideoUpdateTime += Math.floor(( Date.now() - this.lastVideoUpdateTime ) / this.VIDEO_UPDATE_RATE) * this.VIDEO_UPDATE_RATE;

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
                        lowLum = 0,
                        highNum = 0,
                        maxLum = 0,
                        minLum = 765; //255*3

                    for (var i = 0; i < dataSize; i += 4) { //sampler 1/4 of the pixels
                        tempLum = data[i] + data[i + 1] + data[i + 2];
                        if (tempLum < 128)  {
                            ++lowLum;
                        } else if (tempLum > 700) {
                            ++highNum;
                        }
                        if (tempLum > maxLum) maxLum = tempLum;
                        if (tempLum < minLum) minLum = tempLum;
                    }
                    minLum *= 1 / 765;
                    maxLum *= 1 / 765;
                    this.options.lowLightScore = this.lowLightScore = this.lowLightScore * 0.5 + 0.5 * (lowLum / (dataSize/4));
                    this.options.highLightScore = this.highLightScore = this.highLightScore * 0.5 + 0.5 * (highNum / (dataSize/4));


                    this.shaderMaterial['simpleExposure'].uniforms.offset.value = -minLum;
                    this.shaderMaterial['simpleExposure'].uniforms.exposure.value = 1.0 / (maxLum - minLum);
                    this.offset = -minLum;
                    this.exposure = 1.0 / (maxLum - minLum);
                }


                //update uniforms
                //if (!this.options["static"]) {

                this.shaderMaterial['hueLuma'].uniforms.minChroma.value = this.options.minChroma;
                this.shaderMaterial['hueLuma'].uniforms.minLuminosity.value = this.options.minLuminosity;
                this.shaderMaterial['hueLuma'].uniforms.hueRange.value = this.options.hueRange;
                this.shaderMaterial['edges'].uniforms.hardEdgeThreshold.value = this.options.hardEdges;
                this.shaderMaterial['edges2'].uniforms.threshold.value = this.options.blurThreshold;
                this.shaderMaterial['blur'].uniforms.offset.value.set(this.options.edgesOffset / this.TRACKING_SIZE, this.options.edgesOffset / this.TRACKING_SIZE);
                this.shaderMaterial['edges'].uniforms.offset.value.set(1 / this.TRACKING_SIZE, 1 / this.TRACKING_SIZE);
                this.shaderMaterial['edges2'].uniforms.offset.value.set(this.options.blurOffset / this.TRACKING_SIZE, this.options.blurOffset / this.TRACKING_SIZE);

                this.shaderMaterial['frameDiff'].uniforms.accumDelta.value = 0.35 - 0.1 * delta; //delta * 0.5;
                //}


                //compute tracking shaders
                this.renderer.setClearColor(0, 0);
                //if (this.separateRender)
                this.renderer.clear();
                this.renderPasses['simpleExposure'].render();

                //check difference between frames
                var ping = this.frameDiffIsPing ? this.renderPasses['frameDiff'] : this.renderPasses['frameDiffPong'];
                var pong = this.frameDiffIsPing ? this.renderPasses['frameDiffPong'] : this.renderPasses['frameDiff'];
                this.shaderMaterial['frameDiff'].uniforms.tAccum.value = pong.texture;
                ping.render();
                this.frameDiffIsPing = !this.frameDiffIsPing;

                //check direction of motion
                this.shaderMaterial['direction'].uniforms.tFrameDiff.value = ping.texture;
                this.shaderMaterial['blurmotion'].uniforms.tFrameDiff.value = ping.texture;
                this.renderPasses['blurmotion'].render();
                this.renderPasses['direction'].render();

                //render edges, luma and blur
                this.renderPasses['blur'].render();
                this.renderPasses['edges'].render();
                this.renderPasses['hueLuma'].render();
                this.renderPasses['edges2'].render();


                //extract pixel data
                if (!this.buff || !this.buff.byteLength) this.buff = new Uint8Array(this.BUFFER_SIZE);
                var gl = this.renderer.getContext();
                gl.readPixels(0, 0, this.TRACKING_SIZE, this.TRACKING_SIZE, gl.RGBA, gl.UNSIGNED_BYTE, this.buff);


                //send to opencv worker
                this.CVWorker.postMessage(this.buff, [this.buff.buffer]);
                this.renderPasses['lastFrame'].render();
                //this.renderPasses['BinaryEncode'].render();


                //update debug view
                if (this.debugView) this.debugView.render();
            }
        }


        /**
         *
         *
         * Get Tracking Results from the CV webworker
         *
         *
         */
        this.receiveTrackingDataFromOpenCV = function (message) {
            var data = message.data;
            this.READY = true;

            if (this.currentVideoFrame - data.currentFrame > 3) this.trackingPause = true;
            else if (this.currentVideoFrame - data.currentFrame <= 1) this.trackingPause = false;



            //smoothing
            var delta = (Date.now() - this.lastFrameTime) / (1000 / 24);
            delta = Math.min(Math.max(delta, 0.5), 2.0);
            this.lastFrameTime = Date.now();

            this.isTouchingSide = data.isTouchingSide;



            //some constants for calibration
            var CALIBRATION_SMOOTHING = 0.1;
            var dlt = CALIBRATION_SMOOTHING * delta;

            var CALIBRATION_CHANGE_MAGNITUDE = 1.0;
            var HALO_AVERAGE_MULTIPLY = 10;
            var PHONE_LIFE_REQUIRED = 4;

            var HEALTHY_HOLE_RATIO = 0.325;
            var HOLE_RATIO_SMALLEST = 0.25;
            var HOLE_RATIO_LARGEST = 0.65;

            var LUMINOSITY_RELATION_TO_HOLE_RATIO = 0.4;
            var LUMINOSITY_RELATION_TO_COLOR = 0.2;
            var LUMINOSITY_HALO_DECREASE = 0.25;


            //helping the calibration a bit with some edge cases of the extremely low light situations
            var LOW_LIGHT_SCORE_THRESHOLD = 0.85; 
            var LOW_LIGHT_SCORE_EFFECT_ON_RATIO = 0.12;


            // extra parameter, light score ratio


            //update phone luminosity and hole size dynamically
            if (data.foundHole && data.life >= PHONE_LIFE_REQUIRED && data.holeRatio) {


                //
                // update rendering settings based on blob luminosity
                // blob luminosity is calculated based on two things: colorfulness, and size of halo around it
                //
                this.averageHoleRatio = this.averageHoleRatio * (1.0 - dlt) + data.holeRatio * dlt;
                this.averageColorBlob = this.averageColorBlob * (1.0 - dlt) + data.colorBlob * dlt;
                this.averageColorHalo = this.averageColorHalo * (1.0 - dlt) + data.colorHalo * dlt;

                var halopc = Math.min(Math.max(
                    (this.averageColorHalo * HALO_AVERAGE_MULTIPLY) * (1.0 - this.averageColorBlob)
                    , 0.0), 1.0);
                halopc *= 1.0 - this.averageColorBlob;
             
                //
                // Update tracking settings directly
                //
                if (!this.options['static']) {
                    for (var setting in this.defaultSettings) {
                        this.options[setting] = this.defaultSettings[setting] * (1.0 - this.averageColorBlob) + this.defaultSettingsColor[setting] * this.averageColorBlob;
                        this.options[setting] = this.options[setting] * (1.0 - halopc) + this.defaultSettingsHalo[setting] * halopc;
                    }
                }


                //send hole update message
                if (data.life >= PHONE_LIFE_REQUIRED && Date.now() - this.lastPhoneLuminosityMessage > this.LUMINOSITY_SEND_DELAY) {
                    this.lastPhoneLuminosityMessage = Date.now();
                    this.firstLuminosityMessageSent = true;
                    
                    //linked values almost always
                    //this.targetHoleRatio;
                    //this.targetLuminosity
                    var colorBlobEffectOnHoleRatio = Math.max(this.averageColorBlob - 0.5,0.0) * 2.0;
                    var currentHoleRatio = this.averageHoleRatio * (1.0-colorBlobEffectOnHoleRatio) + HOLE_RATIO_LARGEST * colorBlobEffectOnHoleRatio;

                    //get target magnitude
                    var dir = this.averageHoleRatio < HEALTHY_HOLE_RATIO ? 1 : -1;
                    var magnitude = Math.abs(this.averageHoleRatio - HEALTHY_HOLE_RATIO);
                    magnitude *= magnitude;

                    //update
                    this.targetHoleRatio = this.targetHoleRatio + (magnitude * dir * CALIBRATION_CHANGE_MAGNITUDE);
                    if (this.lowLightScore > LOW_LIGHT_SCORE_THRESHOLD) {
                        this.targetHoleRatio +=  (this.lowLightScore-LOW_LIGHT_SCORE_THRESHOLD) / (1.0-LOW_LIGHT_SCORE_THRESHOLD) * LOW_LIGHT_SCORE_EFFECT_ON_RATIO;
                    }
                    this.targetHoleRatio = Math.min(Math.max(this.targetHoleRatio, HOLE_RATIO_SMALLEST), HOLE_RATIO_LARGEST);
                    var holeRatioPc = (this.targetHoleRatio - HOLE_RATIO_SMALLEST) / (HOLE_RATIO_LARGEST-HOLE_RATIO_SMALLEST);
                    this.targetLuminosity = 1.0 - LUMINOSITY_RELATION_TO_HOLE_RATIO * holeRatioPc -  (1.0-this.averageColorBlob) * LUMINOSITY_RELATION_TO_COLOR;
                    //var targetLum = 1.0 - 0.5 * (this.targetHoleRatio - 0.25) / 0.4 - (1.0 - colorpc) * 0.1;

                    if (halopc > 0.15) {
                        this.targetLuminosity = Math.max(this.targetLuminosity - halopc * LUMINOSITY_HALO_DECREASE, 0.5)
                    }
                    console.log(this.averageHoleRatio,magnitude,dir,this.targetHoleRatio);

                   // console.log(this.targetHoleRatio,targetLum,colorpc,halopc);
                    if (this.onluminosity) this.onluminosity(this.targetLuminosity, this.targetHoleRatio);

                }

            }

            //start with lower settings if low light is detected
            if (!this.firstLuminosityMessageSent && this.lowLightScore > LOW_LIGHT_SCORE_THRESHOLD && Date.now() - this.lastPhoneLuminosityMessage > this.LUMINOSITY_SEND_DELAY) {
             
                this.lastPhoneLuminosityMessage = Date.now();
                this.targetLuminosity = 1.0 - 0.45 * (this.lowLightScore-LOW_LIGHT_SCORE_THRESHOLD) / (1.0-LOW_LIGHT_SCORE_THRESHOLD);
                this.targetHoleRatio = HOLE_RATIO_SMALLEST + (HOLE_RATIO_LARGEST - HOLE_RATIO_SMALLEST)/2;
                if (this.onluminosity) this.onluminosity(this.targetLuminosity, this.targetHoleRatio);
             
                console.log('Low Webcam Luminosity Detected - Lowering default Phone Brightness');
            }


            //analyse and smooth tracking data
            if (data.pose) {

                if (data.foundHole) {
                    var newblobpc = Math.min(data.life / 3, 1.0); // smooth out new blobs

                    //set position and rotation directly (snap it)
                    this.position.x += (data.pose.bestTranslation[0] - this.position.x) * newblobpc; //(delta * 0.35);
                    this.position.y += (data.pose.bestTranslation[1] - this.position.y) * newblobpc; //(delta * 0.35);
                    this.position.z += (data.pose.bestTranslation[2] - this.position.z) * newblobpc * (delta * 0.35);

                    //set rotation
                    this.rotation.set(
                        -Math.asin(-data.pose.bestRotation[1][2]),
                        -Math.atan2(data.pose.bestRotation[0][2], data.pose.bestRotation[2][2]),
                        -Math.atan2(data.pose.bestRotation[1][0], data.pose.bestRotation[1][1]) - Math.PI / 2
                    );

                } else {
                    //smooth position and rotation
                    this.position.x += (data.pose.bestTranslation[0] - this.position.x) * (delta * 0.4 + 0.1);
                    this.position.y += (data.pose.bestTranslation[1] - this.position.y) * (delta * 0.4 + 0.1);
                    this.position.z += (data.pose.bestTranslation[2] - this.position.z) * (delta * 0.1);

                }
                //if no good square was found, smooth out the estimated position a lot
            } else if (data.useEstimate && data.estimatedPose) {

                //smooth position and rotation
                this.position.x += (data.estimatedPose.bestTranslation[0] - this.position.x) * (delta * 0.5);
                this.position.y += (data.estimatedPose.bestTranslation[1] - this.position.y) * (delta * 0.5);
                //this.position.z += (data.estimatedPose.bestTranslation[2] - this.position.z) * (delta * 0.25);


            }

            this.normalizedPosition.copy(this.position);
            this.projector.projectVector(this.normalizedPosition, this.projectionCamera);
            //this.normalizedPosition.x *= -1;
            //this.normalizedPosition.y *= -1;
            this.normalizedPosition.z = Math.max(Math.min(Math.abs(this.position.z + 150) / 1000, 1.0), 0.0);

            //quick fix, keep for security's sake
            if (isNaN(this.normalizedPosition.x) || isNaN(this.normalizedPosition.y) || isNaN(this.normalizedPosition.z)) {
                this.normalizedPosition.set(0, 0, 0.5);
                this.position.set(0,0,0.5);
            }

            //normalize and set life
            //self.normalizedPosition.copy(self.position).divide(PHONE_RANGE);
            this.phoneLife = data.life;
            this.phoneDeath = data.lastLife;
            this.foundHole = data.foundHole;
            if (this.phoneLife >= 2)
                this.persistence += (1.0 - this.persistence) * (0.2 * delta * Math.min(this.phoneLife / 5, 1.0));
            //else if (data.pose)
            //    this.persistence -= this.persistence * (0.05 * delta * Math.min(this.phoneDeath / 6, 1.0));
            else 
                this.persistence -= this.persistence * (0.1 * delta * Math.min(this.phoneDeath / 6, 1.0));


            //tmp orientation reset
            //console.log(data.pose);
            if (data.pose && data.pose.bestRotation) {
                this.rotationMatrix.set(
                    data.pose.bestRotation[0][0], data.pose.bestRotation[0][1], data.pose.bestRotation[0][2],
                    data.pose.bestRotation[1][0], data.pose.bestRotation[1][1], data.pose.bestRotation[1][2],
                    data.pose.bestRotation[2][0], data.pose.bestRotation[2][1], data.pose.bestRotation[2][2]
                );
                var appliedRotation = new THREE.Vector3(0, 0, 1).applyMatrix3(this.rotationMatrix);
                /*var appliedRotation = new THREE.Vector3(
                 -Math.asin(-data.pose.bestRotation[1][2]),
                 -Math.atan2(data.pose.bestRotation[0][2], data.pose.bestRotation[2][2])/ Math.PI,
                 -Math.atan2(data.pose.bestRotation[1][0], data.pose.bestRotation[1][1]) - Math.PI / 2);*/
                //


                if (Math.abs(appliedRotation.x) < this.frontalTolerance.x && Math.abs(appliedRotation.y) < this.frontalTolerance.y && Math.abs(appliedRotation.z) > this.frontalTolerance.z) {
                    this.numFrontal = Math.max(this.numFrontal + 1, 0);
                } else {
                    this.numFrontal = Math.min(this.numFrontal - 1, 0);
                }
                //console.log(this.rotation.x,this.rotation.y,this.rotation.z);
                //console.log(this.numFrontal, Math.abs(appliedRotation.x),Math.abs(appliedRotation.y),Math.abs(appliedRotation.z));

                if (!this.orientationReset && this.numFrontal >= this.frontalTolerance.num && this.phoneLife >= this.frontalTolerance.num) {
                    this.orientationReset = true;
                    this.orientationResetTime = new Date().getTime();
                    if (this.onresetorientation) this.onresetorientation();
                }

            } else {

                if (new Date().getTime() - this.orientationResetTime > this.RESET_TIMEOUT) {
                    this.orientationReset = false;
                }

            }
            //console.log(this.isFrontal());


            //update debug view if available
            if (this.debugView) this.debugView.updateData(data, this.video, this.position, this.rotation, this.normalizedPosition);
            if (this.onupdate) this.onupdate();
        }


        /**
         *
         *
         * External controls
         *
         *
         */
        this.pause = function () {
            this.running = false;
        }
        this.resume = function () {
            if (!this.running) {
                this.running = true;
                if (this.USE_ANIMATION_FRAME) this.run();
            }
        }
        this.getPosition = function () {

            return this.normalizedPosition;

        }

        this.isFrontal = function () {
            return this.numFrontal >= 5;
        }

        this.showDebugContours = function (showContours) {
            this.CVWorker.postMessage({
                "action": "setReturnContours",
                "returnContours": showContours
            })
        }

        this.sendWebcamRatio = function () {
            this.CVWorker.postMessage({
                "action": "setWebcamRatio",
                "width": this.video.videoWidth,
                "height": this.video.videoHeight
            })
        }

    }

})(window);
