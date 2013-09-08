/**
 *
 * @author Édouard Lanctôt  < edouardlb@gmail.com >
 *
 */
var BrokenMirrorSequence = Sequence._extend({

    _public:  {

        sceneFbo: null,
        webcamVideo: null,
        webcamCanvas: null,
        webcamTexture: null,
        webcamStarted: false,
        webcamCanvasSize: 512,

        textureDiffuse:null,
        textureEdges: null,
        textureMask: null,
        textureLight: null,

        mirrorFbo: null,
        mirrorMaterial:null,
        perlin: null,

        mirrorFboMask:null,
        mirrorMaterialMask:null,

        //mirror rays light effect
        paletteTexture: null,
        glitchTextures: [],
        mirrorRaysMaterial: null,
        mirrorRaysFbo: null,
        mirrorRaysFboPing: null,
        mirrorRaysFboPong: null,
        mirrorRaysIsPing: false,
        raysIteration: 6,
        lastGlitchUdpate: 0,
        firstFrame: true,


        //interaction
        lastMouse: new THREE.Vector3(0,0,0),
        mouseSpeed: 0.0,

        construct: function (id, $container, video, audio, videoTexture) {

            Sequence.call(this, id, $container, video, audio, videoTexture);

        },


        /**
         *
         * 
         *
        */
        init: function () {

            if (this.wasInitialised) return;

            Sequence.prototype.init.call(this);

            console.log('initializing brokenmirror');

            //pre-init some textures for a smoother transition at the cost of global memory
            this.textureDiffuse = AssetsController.getInstance().getFile('media/images/brokenmirror/mirror_diffuse.jpg');
            this.textureDiffuse.format = THREE.RGBFormat;
            this.textureDiffuse.minFilter = THREE.LinearMipMapLinearFilter;
            this.textureDiffuse.wrapS = this.textureDiffuse.wrapT = THREE.MirroredRepeatWrapping;
            this.textureDiffuse.generateMipmaps = true;
            this.textureDiffuse.needsUpdate = true;

            this.textureMask = AssetsController.getInstance().getFile('media/images/brokenmirror/mirror_mask.png');
            this.textureMask.format = THREE.RGBAFormat;
            this.textureMask.wrapS = this.textureMask.wrapT = THREE.MirroredRepeatWrapping;
            this.textureMask.minFilter = THREE.LinearMipMapLinearFilter;
            this.textureMask.generateMipmaps = true;
            this.textureMask.needsUpdate = true;

            

            //
            // Localise some variables / references
            //
            var videoWidth = 1280,
                videoHeight = 672,
                renderer = RendererController.getInstance().getRenderer();

            this.perlin = new SimplexNoise(Math);


            //
            // Create the mirror scene and textures
            //
            this.textureEdges = AssetsController.getInstance().getFile('media/images/brokenmirror/mirror_edges_and_dust.jpg');
            this.textureEdges.format = THREE.RGBFormat;
            this.textureEdges.wrapS = this.textureEdges.wrapT = THREE.MirroredRepeatWrapping;
            this.textureEdges.minFilter = THREE.LinearMipMapLinearFilter;
            this.textureEdges.generateMipmaps = true;
            this.textureEdges.needsUpdate = true;

            this.textureLight = AssetsController.getInstance().getFile('media/images/brokenmirror/mirror_light.jpg');
            this.textureLight.format = THREE.LuminanceFormat;
            this.textureLight.wrapS = this.textureEdges.wrapT = THREE.MirroredRepeatWrapping;
            this.textureLight.minFilter = THREE.LinearFilter;
            this.textureLight.generateMipmaps = false;
            this.textureLight.needsUpdate = true;



            for (var i=0; i<3; i++) {
                this.glitchTextures[i] = AssetsController.getInstance().getFile('media/images/brokenmirror/glitch4/noise_'+(i+1)+'.jpg');
                this.glitchTextures[i].format = THREE.RGBFormat;
                this.glitchTextures[i].wrapS = this.glitchTextures[i].wrapT = THREE.RepeatWrapping;
                this.glitchTextures[i].minFilter = THREE.LinearFilter;
                this.glitchTextures[i].generateMipmaps = false;
                this.glitchTextures[i].needsUpdate = true;
            }


            //
            //
            //  All in one simple shader
            //
            this.mirrorMaterial = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/brokenmirror/brokenmirror.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/brokenmirror/brokenmirror.frag'),
                attributes:{},
                uniforms: {
                    'tWebcam':{type:'t',value:this.videoTexture.texture},
                    'tDiffuse':{type:'t',value:this.textureDiffuse},
                    'tMask':{type:'t',value:this.textureMask},
                    'tEdges':{type:'t',value:this.textureEdges},
                    'tGlitch':{type:'t',value: this.glitchTextures[0]},

                    //giro motion
                    'center':{type:'v2',value:new THREE.Vector2(0.5,0.5)},
                    
                    //offset
                    'offset':{type:'v2',value:new THREE.Vector2(1.0/this.videoTexture.width,1.0/this.videoTexture.height)},
                    'maxOffset':{type:'v2',value:new THREE.Vector2(1.0/this.videoTexture.width,1.0/this.videoTexture.height)},
                    'rotation':{type:'v2',value:new THREE.Vector2(0.0,0.0)},
                    'rotationPerspective':{type:'f',value:1.0},
                    'parallax':{type:'f',value:0.5},
                    'uvRatio': {type:'v2', value:new THREE.Vector2(0.525,1.0)},
                    'uvOffset': {type:'v2', value:new THREE.Vector2(0.0,0.15)},
                    'uvScale': {type:'f', value:1.0},
                    'uvRandom':{type:'v2',value:new THREE.Vector2(0.0,0.0)},

                    //other settings/constants
                    'maxScale':{type:'f',value:0.0},
                    'chromaticAberration':{type:'f',value:0.0},
                    'perspective':{type:'f',value:0.0},
                    'edgesDiffraction':{type:'f',value:0.0},
                    'globalColor': {type:'v4', value:new THREE.Vector4(1,1,1,1)},
                    'dustOpacity': {type:'f', value: 1.0},
                    'glitchOpacity': {type:'f', value: 0.0},
                    'glitchScale': {type:'f', value: 2.0},
                    'blackAndWhite': {type:'f', value:0.0},
                    'glitchOpacityFade':{type:'f',value:0.0}
                },
                //equation/parameters to allow for RGBA encoding
                depthTest:false,
                transparent:true,
                blending:THREE.CustomBlending,
                blendEquation:THREE.AddEquation,
                blendSrc:THREE.OneFactor,
                blendDst:THREE.ZeroFactor,
                side:THREE.DoubleSide
            });


            //
            // Create webcam texture
            //
            if (CameraController.getInstance().isVideoEnabled()) {
                this.setupWebcam();
            }

            //
            // Mirror rendering scene & target
            //
            var geom = new THREE.PlaneGeometry( videoWidth*2, videoHeight*2, 12, 12 );
            var uvs = geom.faceVertexUvs[0];
            for (var i=0; i<uvs.length; i++) {
                for (var j=0; j<uvs[i].length; j++) {
                    uvs[i][j].x = Math.abs((uvs[i][j].x)*2.0-0.5);//*2.0;
                    uvs[i][j].y = Math.abs((uvs[i][j].y)*2.0-0.5);//*2.0;
                }
            }
            geom.uvsNeedUpdate = true;
            geom.verticesNeedUpdate = true;

            console.log('videoWidth', videoWidth);
            console.log('videoHeight', videoHeight);

            this.mirrorFbo = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBFormat,
                type:THREE.UnsignedByteType,
                //renderMaterial:mirrorMaterial,
                renderPlane:new THREE.Mesh(geom,this.mirrorMaterial),
                camera:new THREE.PerspectiveCamera( 45, videoWidth/videoHeight, 0.001, 10000.0 ),
                depthBuffer:true,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });

            this.mirrorFbo.camera.position.z = this.getCameraZ(this.mirrorFbo.camera,videoHeight);


            //
            //the mask
            //
            this.mirrorMaterialMask = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/brokenmirror/brokenmirrorMask.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/brokenmirror/brokenmirrorMask.frag'),
                attributes:{},
                uniforms: {

                    'tVideo':{type:'t',value:this.mirrorFbo.texture},
                    'tMask':{type:'t',value:this.textureLight},

                },
                //equation/parameters to allow for RGBA encoding
                depthTest:false,
                transparent:true,
                blending:THREE.CustomBlending,
                blendEquation:THREE.AddEquation,
                blendSrc:THREE.OneFactor,
                blendDst:THREE.ZeroFactor,
                side:THREE.DoubleSide
            });
            this.mirrorFboMask = new FramebufferWrapper(videoWidth/2,videoHeight/2,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                //renderMaterial:mirrorMaterial,
                renderPlane:new THREE.Mesh(geom,this.mirrorMaterialMask),
                camera:this.mirrorFbo.camera,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });



            //
            // Palette texture
            //
            this.paletteTexture = AssetsController.getInstance().getFile('media/images/noise_lumiere1.png');
            this.paletteTexture.wrapS = this.paletteTexture.wrapT = THREE.ClampToEdgeWrapping;
            this.paletteTexture.magFilter = THREE.NearestFilter;
            this.paletteTexture.minFilter = THREE.NearestFilter;
            this.paletteTexture.generateMipmaps = false;
            this.paletteTexture.needsUpdate = true;

            // 
            // Mirror Rays light effect
            //
            this.mirrorRaysMaterial  = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/brokenmirror/lightRays.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/brokenmirror/lightRays.frag'),
                attributes:{},
                uniforms: {
                    'tVideo':{type:'t',value:this.mirrorFbo.texture},
                    'tAccum':{type:'t',value:null},
                    'tPalette':{type:'t',value: this.paletteTexture},

                    'center':{type:'v2',value:new THREE.Vector2(0.5,0.5)},
                    'lightPosition':{type:'v2',value:new THREE.Vector2(0.5,0.5)},

                    'pass':{type:'f',value:0.0},
                    'FINAL_PASS':{type:'f', value: (1.002/this.raysIteration) },

                    'effectAlpha':{type:'f',value:1.0},
                    'raysAlpha':{type:'f',value:1.0},
                    'raysRadius':{type:'f',value:1.0},
                    'randomuv':{type:'v2',value:new THREE.Vector2(0.0,0.0)},
                    'offset':{type:'v2',value:new THREE.Vector2(1.0/videoWidth,1.0/videoHeight)},
                    'ratio':{type:'v2',value:new THREE.Vector2(videoHeight/videoWidth,1.0)},
                    'finalAlpha':{type:'f',value:0.0}

                },
                //equation/parameters to allow for RGBA encoding
                depthTest:false,
                transparent:true,
                blending:THREE.CustomBlending,
                blendEquation:THREE.AddEquation,
                blendSrc:THREE.OneFactor,
                blendDst:THREE.ZeroFactor,
                side:THREE.DoubleSide
            });
            this.mirrorRaysFbo = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.mirrorRaysMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:true,
                generateMipmaps:false,
                renderer:renderer
            });
            this.mirrorRaysFboPing = new FramebufferWrapper(videoWidth/8,videoHeight/8,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.mirrorRaysMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:true,
                generateMipmaps:false,
                renderer:renderer
            });
            this.mirrorRaysFboPong = new FramebufferWrapper(videoWidth/16,videoHeight/16,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.mirrorRaysMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:true,
                generateMipmaps:false,
                renderer:renderer
            });



            //
            // Pre-Update all the textures (sorry for your VRAM)
            //
            RendererController.getInstance().getRenderer().setTexture(this.textureLight,0);
            RendererController.getInstance().getRenderer().setTexture(this.textureEdges,0);
            RendererController.getInstance().getRenderer().setTexture(this.textureMask,0);
            RendererController.getInstance().getRenderer().setTexture(this.textureDiffuse,0);

            this.textureLight.needsUpdate = false;
            this.textureEdges.needsUpdate = false;
            this.textureMask.needsUpdate = false;
            this.textureDiffuse.needsUpdate = false;

        },


        begin: function () {

            Sequence.prototype.begin.call(this);

            console.log('begin brokenmirror');

            this.mirrorFbo.alloc();
            this.mirrorFboMask.alloc();
            this.mirrorRaysFboPing.alloc();
            this.mirrorRaysFboPong.alloc();
            this.mirrorRaysFbo.alloc();




            //reset textures references
            if (!this.webcamVideo) {

                this.mirrorMaterial.uniforms.tWebcam.value = this.videoTexture.texture;

            } else {

                this.mirrorMaterial.uniforms.tWebcam.value = this.webcamTexture;
                this.webcamCanvas.c.drawImage(this.webcamVideo,0,0,this.webcamCanvasSize,this.webcamCanvasSize);
                this.webcamTexture.needsUpdate = true;
                this.videoTexture.pauseBrokenMirror();

            }

            this.mirrorMaterialMask.uniforms.tVideo.value = this.mirrorFbo.texture;
            this.mirrorRaysMaterial.uniforms.tAccum.value = this.mirrorFbo.texture;
            this.mirrorRaysMaterial.uniforms.tVideo.value = this.mirrorFbo.texture;

            this.firstFrame = true;

        },

        end: function () {

            Sequence.prototype.end.call(this);
            this.mirrorFbo.dispose();
            this.mirrorFboMask.dispose();
            this.mirrorRaysFboPing.dispose();
            this.mirrorRaysFboPong.dispose();
            this.mirrorRaysFbo.dispose();
            this.videoTexture.resumeBrokenMirror();
        },

        changeVideoQuality: function(nw, nh) {


            if (!this.webcamVideo) {
                
                this.mirrorMaterial.uniforms.tWebcam.value = this.videoTexture.texture;
                this.mirrorMaterial.uniforms.offset.value.set(1.0/nw,1.0/nh);
                this.mirrorMaterial.uniforms.maxOffset.value.set(1.0/nw,1.0/nh);
            
            }

        },

        changeRenderQuality: function (nw, nh) {

            var renderer = RendererController.getInstance().getRenderer();

            this.renderWidth = nw;
            this.renderHeight = nh;

            this.mirrorFbo.resizeTexture(nw,nh);
            this.mirrorFboMask.resizeTexture(nw/2,nh/2);

            this.mirrorRaysFbo.resizeTexture(nw,nh);
            this.mirrorRaysFboPing.resizeTexture(nw/8, nh/8);
            this.mirrorRaysFboPong.resizeTexture(nw/16, nh/16);

            this.mirrorMaterialMask.uniforms.tVideo.value = this.mirrorFbo.texture;

            //this.webcamCanvasSize = Math.max(Math.pow(2, Math.round( Math.log(nw * 0.4)/Math.log(2) ) ), 128);
            this.webcamCanvasSize = 256;
            if (nw >= 640) this.webcamCanvasSize = 256;
            if (nw >= 1080) this.webcamCanvasSize = 512;
            if (nw >= 1600) this.webcamCanvasSize = 1024;
            if (this.webcamCanvas) {
                this.webcamCanvas.width = this.webcamCanvasSize;
                this.webcamCanvas.height = this.webcamCanvasSize;


                this.webcamTexture = new THREE.Texture(this.webcamCanvas,
                        new THREE.UVMapping(),
                        THREE.MirroredRepeatWrapping,
                        THREE.MirroredRepeatWrapping,
                        THREE.LinearFilter, THREE.LinearMipMapLinearFilter,
                        THREE.RGBFormat, THREE.UnsignedByteType,1);
                this.webcamTexture.generateMipmaps = true;
                this.mirrorMaterial.uniforms.tWebcam.value = this.webcamTexture;
                this.mirrorMaterial.uniforms.offset.value.set(1.0/this.webcamVideo.videoWidth,1.0/this.webcamVideo.videoHeight);
                this.mirrorMaterial.uniforms.maxOffset.value.set(1.0/this.webcamVideo.videoWidth,1.0/this.webcamVideo.videoHeight);

                if (this.webcamVideo.videoWidth) 
                    this.mirrorMaterial.uniforms.uvRatio.value.set(this.webcamVideo.videoHeight / this.webcamVideo.videoWidth,1);
            
                this.mirrorMaterial.uniforms.uvOffset.value.set(0.0,0.2);
            }
            this.mirrorRaysMaterial.uniforms.tVideo.value = this.mirrorFbo.texture;
        }

    },


    /**
     *
     *
     * Main Update/Render Loop
     * 
     *
    */
    _protected: {

        setupWebcam: function() {

            if (this.webcamVideo) return;
            
            this.webcamVideo = CameraController.getInstance().getVideo();

            this.webcamCanvas = document.createElement('canvas');
            this.webcamCanvas.width = this.webcamCanvasSize;
            this.webcamCanvas.height = this.webcamCanvasSize;
            this.webcamCanvas.c = this.webcamCanvas.getContext('2d');
            this.webcamTexture = new THREE.Texture(this.webcamCanvas,
                        new THREE.UVMapping(),
                        THREE.MirroredRepeatWrapping,
                        THREE.MirroredRepeatWrapping,
                        THREE.LinearFilter, THREE.LinearFilter,
                        THREE.RGBFormat, THREE.UnsignedByteType,1);
            this.webcamTexture.generateMipmaps = false;
            //this.webcamTexture.needsUpdate = true;

            this.mirrorMaterial.uniforms.tWebcam.value = this.webcamTexture;
 
            this.mirrorMaterial.uniforms.offset.value.set(1.0/this.webcamCanvasSize,1.0/this.webcamCanvasSize);
            this.mirrorMaterial.uniforms.maxOffset.value.set(1.0/this.webcamCanvasSize,1.0/this.webcamCanvasSize);

            if (this.webcamVideo.videoWidth) 
                this.mirrorMaterial.uniforms.uvRatio.value.set(this.webcamVideo.videoHeight / this.webcamVideo.videoWidth, 1.0);
            this.mirrorMaterial.uniforms.uvOffset.value.set(0.0,0.2);

        },

        /**
         *
         * Update all parameters
         *
         */
        update: function (options, currentFrame, delta, time, progress, position, orientation) {

            //
            // Update controls
            //
            var finalPhonePosition = InputController.getInstance().getPositionDirectional(),
                videoWidth = 1280,
                videoHeight = 672;


            //testing
            if (!TimelineController.getInstance().initialised) {
                RendererController.getInstance().disablePhoneInteraction();
            }

            //webcam canvas
            if (!this.webcamVideo && CameraController.getInstance().isVideoEnabled()) { //in case the webcam is activated at this point
                this.setupWebcam();
                this.videoTexture.pauseBrokenMirror();
            }

            if (this.webcamVideo) {
                this.mirrorMaterial.uniforms.maxOffset.value.set(options.maxOffset/512,options.maxOffset/512);
            } else {
                this.mirrorMaterial.uniforms.maxOffset.value.set(options.maxOffset/this.videoTexture.width,options.maxOffset/this.videoTexture.height);
            }

            //update the mirror effect
            this.mirrorMaterial.uniforms.center.value.set(finalPhonePosition.x,finalPhonePosition.y);
            this.mirrorMaterial.uniforms.maxScale.value = options.maxScale;
            this.mirrorMaterial.uniforms.chromaticAberration.value = options.chromaticAberration;
            this.mirrorMaterial.uniforms.perspective.value = options.perspective;
            this.mirrorMaterial.uniforms.edgesDiffraction.value = options.edgesDiffraction;
            this.mirrorMaterial.uniforms.parallax.value = options.parallax;
            this.mirrorMaterial.uniforms.uvScale.value = options.scale;
            this.mirrorMaterial.uniforms.dustOpacity.value = options.dustOpacity;
            this.mirrorMaterial.uniforms.uvRandom.value.set(Math.random()*2.0-1.0,Math.random()*2.0-1.0);
            this.mirrorMaterial.uniforms.glitchScale.value = options.glitchScale;

            if (this.webcamVideo && this.webcamVideo.videoWidth) 
                    this.mirrorMaterial.uniforms.uvRatio.value.set(this.webcamVideo.videoHeight / this.webcamVideo.videoWidth, 1);

            //update the mirror camera
            var target = new THREE.Vector3();
            target.x = videoWidth*options.rangeXYB*this.perlin.noise(Date.now()*options.cameraSpeedB*0.0001,0.0);
            target.y = videoHeight*options.rangeXYB*this.perlin.noise(0.0,Date.now()*options.cameraSpeedB*0.0001);
            target.z = 0.0;

            this.mirrorFbo.camera.position.x = videoWidth*options.rangeXYA*this.perlin.noise(Date.now()*options.cameraSpeedA*0.0001,0.0);
            this.mirrorFbo.camera.position.y = videoHeight*options.rangeXYA*this.perlin.noise(0.0,Date.now()*options.cameraSpeedA*0.0001);
            this.mirrorFbo.camera.position.z = this.getCameraZ(this.mirrorFbo.camera,videoHeight);
            this.mirrorFbo.camera.position.z += 0.5*videoWidth*options.rangeZB*this.perlin.noise(Date.now()*options.cameraSpeedB*0.5*0.001,Date.now()*options.cameraSpeedB*0.5*0.0001);
            this.mirrorFbo.camera.position.z += 0.5*videoHeight*options.rangeZA*this.perlin.noise(Date.now()*options.cameraSpeedA*0.5*0.001,Date.now()*options.cameraSpeedA*0.5*0.0001);
            this.mirrorFbo.camera.lookAt(target);
            //this.mirrorMaterial.uniforms.tWebcam.value = (options.useWebcam) ? this.webcamTexture : null;


            //
            // Update the glitch noise at 24fps
            //
            if (Date.now() - this.lastGlitchUdpate >= (1000/24)) {
                this.lastGlitchUdpate = Date.now();
                this.mirrorMaterial.uniforms.tGlitch.value = this.glitchTextures[Math.floor(Math.random()*this.glitchTextures.length)];
            }


            //
            //color flashing
            //
            var flashingRangeMax = 1.0 + options.colorFlash,
                flashingRangeMin = 1.0 - options.colorFlash;

            this.mirrorMaterial.uniforms.globalColor.value.set(
                this.random(1.0, flashingRangeMax),
                this.random(1.0, flashingRangeMax),
                this.random(1.0, flashingRangeMax),
                1.0);

            this.mirrorMaterial.uniforms.globalColor.value.addScalar(options.fadeOut);


            //
            // Update the mirror rays
            //
            if (this.mirrorRaysMaterial.uniforms.effectAlpha) this.mirrorRaysMaterial.uniforms.effectAlpha.value = options.raysBrightness;
            if (this.mirrorRaysMaterial.uniforms.lightPosition) this.mirrorRaysMaterial.uniforms.lightPosition.value.set(finalPhonePosition.x*-1.0+0.5,finalPhonePosition.y*-1.0+0.5); //finalPhonePositionRange.x*-0.5+0.5,finalPhonePositionRange.y*0.5+0.5,0.0);
            if (this.mirrorRaysMaterial.uniforms.center) this.mirrorRaysMaterial.uniforms.center.value.set(0.5,0.5);
            if (this.mirrorRaysMaterial.uniforms.randomuv) this.mirrorRaysMaterial.uniforms.randomuv.value.set(Math.random(),Math.random());
            if (this.mirrorRaysMaterial.uniforms.raysAlpha) this.mirrorRaysMaterial.uniforms.raysAlpha.value =  0.7 + Math.random()*0.2;
            if (this.mirrorRaysMaterial.uniforms.raysRadius) this.mirrorRaysMaterial.uniforms.raysRadius.value = 0.2 + Math.random()*0.1;
            this.mirrorRaysMaterial.uniforms.finalAlpha.value = options.raysFinalAlpha * Math.random();
            this.mirrorRaysMaterial.uniforms.randomuv.value.set(Math.random(),Math.random());

            if (InputController.getInstance().isMouseVersion()) {

                this.mouseSpeed = this.mouseSpeed*(1.0-0.15*delta) + (this.lastMouse.clone().sub(finalPhonePosition).length()) * 0.5*delta
                this.mouseSpeed = Math.min(this.mouseSpeed,1.0);
                this.lastMouse.copy(finalPhonePosition);
                this.mirrorRaysMaterial.uniforms.finalAlpha.value  = options.raysFinalAlpha * Math.min(this.mouseSpeed * 2.5 + (1.0-finalPhonePosition.z)*0.5,1.0) * Math.random();

                //breakfree
                var mousep = Math.min(this.mouseSpeed*0.01 + (1.0-finalPhonePosition.z) * 2.0,1.0);
                mousep = Math.pow(mousep,4.0);

                this.mirrorMaterial.uniforms.glitchOpacity.value = Math.min(mousep * options.mouseNoise + options.glitchOpacity,0.85); //* (this.webcamVideo ? 1.0 : 0.0)
                //this.mirrorMaterial.uniforms.blackAndWhite.value = Math.min(Math.pow(mousep,1.5)*1.5 + options.glitchOpacity * (this.webcamVideo ? 1.0 : 0.0),1.0);


            } else {


                this.mouseSpeed = this.mouseSpeed*(1.0-0.5*delta) + OrientationController.getInstance().rawMotionSpeed * 2.5;
                this.mirrorRaysMaterial.uniforms.finalAlpha.value  = options.raysFinalAlpha * Math.min( this.mouseSpeed * 9.0,1.0) * Math.random();

                //breakfree
                this.breakFreeSpeed = this.mouseSpeed*(1.0-0.2*delta) + OrientationController.getInstance().rawMotionSpeed * 3.0;;
                var mousep = Math.max(Math.min(this.breakFreeSpeed,1.0),0.0);
                mousep = Math.pow(this.breakFreeSpeed, 2.0);
                this.mirrorMaterial.uniforms.glitchOpacity.value = Math.min(mousep * options.motionNoise + options.glitchOpacity,0.85); //* (this.webcamVideo ? 1.0 : 0.0)
                //this.mirrorMaterial.uniforms.blackAndWhite.value = Math.min(Math.pow(mousep  * options.motionNoise ,1.5)*1.5 + options.glitchOpacity * (this.webcamVideo ? 1.0 : 0.0),1.0);

            }
            this.mirrorMaterial.uniforms.glitchOpacityFade.value = options.glitchOpacityFade;

        },

        /**
         *
         * Renders three.js scene in this sequence's Render Target
         *
         */
        render: function () {

            if (this.firstFrame) {

                //
                // Pre-Initialialize
                //
                RendererController.getInstance().getRenderer().setClearColor(new THREE.Color(0xffffff)); //.setHSL(Math.random(),1.0,0.5));
                RendererController.getInstance().getRenderer().clear();

                if (this.webcamVideo && this.webcamVideo.readyState === this.webcamVideo.HAVE_ENOUGH_DATA) {
                    this.webcamCanvas.c.drawImage(this.webcamVideo,0,0,this.webcamCanvasSize,this.webcamCanvasSize);
                    this.webcamTexture.needsUpdate = true;
                }
                this.mirrorFbo.render();

                this.firstFrame = false;


            } else {

                //
                // Main Rendering
                //
                RendererController.getInstance().getRenderer().setClearColor(new THREE.Color(0));
                RendererController.getInstance().getRenderer().clear();

                if (!this.isPaused && this.webcamVideo && this.webcamVideo.readyState === this.webcamVideo.HAVE_ENOUGH_DATA) {
                    this.webcamCanvas.c.drawImage(this.webcamVideo,0,0,this.webcamCanvasSize,this.webcamCanvasSize);
                    this.webcamTexture.needsUpdate = true;
                }
                this.mirrorFbo.render();
                this.mirrorFboMask.render();

                //update rays (options.iterations) times
                var pingFbo,
                    pongFbo,
                    i = 1;
                for (i; i<this.raysIteration; i++) {
                    if (this.mirrorIsPing) {
                        pingFbo = this.mirrorRaysFboPing;
                        pongFbo = this.mirrorRaysFboPong;
                    } else {
                        pongFbo = this.mirrorRaysFboPing;
                        pingFbo = this.mirrorRaysFboPong;
                    }
                    this.mirrorIsPing = !this.mirrorIsPing;

                    this.mirrorRaysMaterial.uniforms.pass.value = 1.0/i;
                    this.mirrorRaysMaterial.uniforms.tAccum.value = (i <= 1) ? this.mirrorFboMask.texture : pongFbo.texture;
                    pingFbo.render();

                }
                
                // //final full-res rays mix
                this.mirrorRaysMaterial.uniforms.pass.value = 1.0 / this.raysIteration;
                this.mirrorRaysMaterial.uniforms.tAccum.value = pingFbo.texture;
                this.mirrorRaysFbo.render();
                RendererController.getInstance().renderToScreen(this.mirrorRaysFbo.texture,false,false);
                this.firstFrame = false;
            }

        }
    },

    _private: {
        getCameraZ: function(camera,vh) {
            return vh / (2 * Math.tan(camera.fov / 2 * (Math.PI / 180)));
        },
        random: function(min, max) {
            return (Math.random() * (max-min) + min)
        }
    }

});