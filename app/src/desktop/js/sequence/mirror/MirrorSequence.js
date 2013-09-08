/**
 * @author Édouard Lanctôt  < edouardlb@gmail.com >
 *
 */
var MirrorSequence = Sequence._extend({

    _public:  {

        //mirrokid webcam
        webcamVideo: null,
        //webcamCanvas: null,
        //webcamTexture: null,
        webcamStarted: false,
        webcamLastUpdate: 0,
        WEBCAM_TEXTURE_SIZE: 512,

        //center data
        mirrorKidCenter: {},

        //video mask
        diffuseFbo: null,
        diffuseMaterial: null,
        mirrorMaskMaterial: null,
        mirrorMaskFbo: null,
        mirrorMaskPremultMaterial: null,
        mirrorMaskPremultFbo: null,

        //mirrorkid
        mirrorKidGradient: null,
        mirrorKidMaterial: null,
        mirrorKidFbo: null,

        //mirror rays
        paletteTexture: null,
        mirrorRaysMaterial: null,
        mirrorRaysFbo: null,
        mirrorRaysFboPing: null,
        mirrorRaysFboPong: null,
        mirrorRaysIsPing: false,
        raysIteration: 7,

        //final mix
        finalCompositeMaterial: null,
        finalCompositeFbo: null,


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

            console.log('initializing mirror');

            //
            // Localise some variables / references
            //
            var videoWidth = this.videoTexture.width,
                videoHeight = this.videoTexture.height,
                renderer = RendererController.getInstance().getRenderer();


            //
            // Parse Json
            //
            this.mirrorKidCenter = AssetsController.getInstance().getFile('media/tracking/mirrorBoy.json');


            //
            // Create webcam texture
            //
            // this.webcamCanvas = document.createElement('canvas');
            // this.webcamCanvas.width = this.WEBCAM_TEXTURE_SIZE;
            // this.webcamCanvas.height = this.WEBCAM_TEXTURE_SIZE;
            // this.webcamCanvas.c = this.webcamCanvas.getContext('2d');
            // this.webcamTexture = new THREE.Texture(this.webcamCanvas,
            //             new THREE.UVMapping(),
            //             THREE.MirroredRepeatWrapping,
            //             THREE.MirroredRepeatWrapping,
            //             THREE.LinearFilter, THREE.LinearFilter,
            //             THREE.RGBFormat, THREE.UnsignedByteType,1);
            // this.webcamTexture.generateMipmaps = false;
            // this.webcamTexture.needsUpdate = true;
            // this.webcamVideo = CameraController.getInstance().getVideo();


            //
            // Palette
            //
            this.paletteTexture = AssetsController.getInstance().getFile('media/images/noise_lumiere1.png');
            this.paletteTexture.wrapS = this.paletteTexture.wrapT = THREE.ClampToEdgeWrapping;
            this.paletteTexture.magFilter = THREE.NearestFilter;
            this.paletteTexture.minFilter = THREE.NearestFilter;
            this.paletteTexture.generateMipmaps = false;
            this.paletteTexture.needsUpdate = true;


            this.mirrorKidGradient = AssetsController.getInstance().getFile('media/images/gradient_miroir.png');
            this.mirrorKidGradient.wrapS = THREE.RepeatWrapping;
            this.mirrorKidGradient.wrapT = THREE.RepeatWrapping;
            this.mirrorKidGradient.magFilter = THREE.LinearFilter;
            this.mirrorKidGradient.minFilter = THREE.LinearFilter;
            this.mirrorKidGradient.generateMipmaps = false;
            this.mirrorKidGradient.needsUpdate = true;


            //
            // Extract Alpha From the video
            //
            this.mirrorMaskMaterial = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/mirror/mirrorMask.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/mirror/mirrorMask.frag'),
                attributes:{},
                uniforms: {
                    'texture':{type:'t',value:this.videoTexture.texture},
                    'maskRatio':{type:'f',value:0.25},
                    'maskScale':{type:'f',value:1.0},
                    'maskOffset':{type:'f',value:0.0},
                    'mirrorThreshold':{type:'f',value:0.45},
                    'offset':{type:'v2',value:new THREE.Vector2(1.5/videoWidth,1.5/videoHeight)},
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
            this.mirrorMaskFbo = new FramebufferWrapper(videoWidth/4,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.mirrorMaskMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });


            //
            // Extract Alpha From the video
            //
            this.diffuseMaterial = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/mirror/diffuseExtraction.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/mirror/diffuseExtraction.frag'),
                attributes:{},
                uniforms: {
                    'texture':{type:'t',value:this.videoTexture.texture},
                    'maskRatio':{type:'f',value:0.25}
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
            this.diffuseFbo = new FramebufferWrapper(Math.floor(videoWidth*3/4),videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.diffuseMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });


            //
            // Premultiply Alpha From the video for the mirror rays
            //
            this.mirrorMaskPremultMaterial = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/common/vertex.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/mirror/mirrorMaskMultiply.frag'),
                attributes:{},
                uniforms: {
                    'tVideo':{type:'t',value:this.diffuseFbo.texture},
                    'tMask':{type:'t',value:this.mirrorMaskFbo.texture},
                    'maskAlpha': {type:'v4', value: new THREE.Vector4(0.0,0.0,0.0,1.0)}
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
            this.mirrorMaskPremultFbo = new FramebufferWrapper(videoWidth/2,videoHeight/2,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.mirrorMaskPremultMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });



            //
            // The mirror kid
            //
            this.mirrorKidMaterial = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/common/vertex.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/mirror/simpleFoil.frag'),
                attributes:{},
                uniforms: {
                    'tVideo':{type:'t',value:this.diffuseFbo.texture},
                    'tWebcam':{type:'t',value:null},
                    'tDirection':{type:'t',value:this.mirrorMaskFbo.texture},
                    'tGradient': {type:'t', value:this.mirrorKidGradient},

                    'center':{type:'v2',value:new THREE.Vector2(0.5,0.5)},
                    'headCenter':{type:'v2',value:new THREE.Vector2(0.5,0.5)},
                    'effectAlpha':{type:'f',value:1.0},
                    'webcamAlpha':{type:'f',value:1.0},
                    'foilRadius':{type:'f',value:1.0},
                    'foilDisplacement':{type:'f',value:0.01},
                    'offset':{type:'v2',value:new THREE.Vector2(1.0/videoWidth,1.0/videoHeight)}
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

            this.mirrorKidFbo = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.mirrorKidMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });


            //
            // Composite
            //
            //this.mirrorRaysMaterial = this.reloadShaders();
            this.mirrorRaysMaterial  = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/common/vertex.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/mirror/lightRaysPalette.frag'),
                attributes:{},
                uniforms: {
                    'tAccum':{type:'t',value:null},
                    'tPalette':{type:'t',value:this.paletteTexture},

                    'center':{type:'v2',value:new THREE.Vector2(0.5,0.5)},
                    'lightPosition':{type:'v2',value:new THREE.Vector2(0.5,0.5)},
                    'pass':{type:'f',value:0.0},
                    'effectAlpha':{type:'f',value:1.0},
                    'raysAlpha':{type:'f',value:1.0},
                    'raysRadius':{type:'f',value:1.0},
                    'randomuv':{type:'v2',value:new THREE.Vector2(0.0,0.0)},
                    'offset':{type:'v2',value:new THREE.Vector2(1.0/videoWidth,1.0/videoHeight)},
                    'ratio':{type:'v2',value:new THREE.Vector2(videoHeight/videoWidth,1.0)}
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
            //
            // Final Composite
            //
            //
            //this.finalCompositeMaterial = reloadShadersComposite();
            this.finalCompositeMaterial = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/common/vertex.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/mirror/SimpleAdditive.frag'),
                attributes:{},
                uniforms: {
                    'tVideo':{type:'t',value:this.diffuseFbo.texture},
                    'tAccum':{type:'t',value:this.mirrorRaysFbo.texture},
                    'tMirrorKid':{type:'t',value:this.mirrorKidFbo.texture},
                    'center':{type:'v2',value:new THREE.Vector2(0.5,0.5)},
                    'lightPosition':{type:'v2',value:new THREE.Vector2(0.5,0.5)},
                    'randomuv':{type:'v2',value:new THREE.Vector2(0.0,0.0)},
                    'offset':{type:'v2',value:new THREE.Vector2(1.0/videoWidth,1.0/videoHeight)},
                    'ratio':{type:'v2',value:new THREE.Vector2(videoHeight/videoWidth,1.0)},
                    'globalColor': {type: 'v4', value:new THREE.Vector4(1,1,1,1)}
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
            this.finalCompositeFbo = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.finalCompositeMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:true,
                generateMipmaps:false,
                renderer:renderer
            });

        },

        begin: function () {

            Sequence.prototype.begin.call(this);

            console.log('begin mirror');

            this.diffuseFbo.alloc();
            this.mirrorMaskFbo.alloc();
            this.mirrorKidFbo.alloc();
            this.mirrorRaysFbo.alloc();
            this.mirrorRaysFboPing.alloc();
            this.mirrorRaysFboPong.alloc();
            this.finalCompositeFbo.alloc();
            this.mirrorMaskPremultFbo.alloc();


            this.diffuseMaterial.uniforms.texture.value = this.videoTexture.texture;

            this.mirrorMaskMaterial.uniforms.texture.value = this.videoTexture.texture;
            
            this.mirrorKidMaterial.uniforms.tVideo.value = this.diffuseFbo.texture;
            this.mirrorKidMaterial.uniforms.tDirection.value = this.mirrorMaskFbo.texture;


            this.finalCompositeMaterial.uniforms.tVideo.value = this.diffuseFbo.texture;
            this.finalCompositeMaterial.uniforms.tAccum.value = this.mirrorRaysFbo.texture;
            this.finalCompositeMaterial.uniforms.tMirrorKid.value = this.mirrorKidFbo.texture;
            this.mirrorMaskPremultMaterial.uniforms.tVideo.value = this.diffuseFbo.texture;
            this.mirrorMaskPremultMaterial.uniforms.tMask.value = this.mirrorMaskFbo.texture;

        },

        end: function () {

            Sequence.prototype.end.call(this);

            this.diffuseFbo.dispose();
            this.mirrorMaskFbo.dispose();
            this.mirrorKidFbo.dispose();
            this.mirrorRaysFbo.dispose();
            this.mirrorRaysFboPing.dispose();
            this.mirrorRaysFboPong.dispose();
            this.finalCompositeFbo.dispose();
            this.mirrorMaskPremultFbo.dispose();

        },

        changeVideoQuality: function(nw, nh) {

            console.log(this.videoTexture.texture);

            this.diffuseFbo.resizeTexture(Math.floor(nw*3/4),nh);
            this.mirrorMaskFbo.resizeTexture(nw/4,nh);


            this.diffuseMaterial.uniforms.texture.value = this.videoTexture.texture;
            this.mirrorMaskMaterial.uniforms.texture.value = this.videoTexture.texture;
            
            this.mirrorKidMaterial.uniforms.tVideo.value = this.diffuseFbo.texture;
            this.mirrorKidMaterial.uniforms.tDirection.value = this.mirrorMaskFbo.texture;

            this.mirrorMaskPremultMaterial.uniforms.tVideo.value = this.diffuseFbo.texture;
            this.mirrorMaskPremultMaterial.uniforms.tMask.value = this.mirrorMaskFbo.texture;

            this.finalCompositeMaterial.uniforms.tVideo.value = this.diffuseFbo.texture;
   
        },

        changeRenderQuality: function (nw, nh) {
            
            var renderer = RendererController.getInstance().getRenderer();

            this.renderWidth = nw;
            this.renderHeight = nh;

            this.mirrorMaskPremultFbo.resizeTexture(nw/2,nh/2);
            this.mirrorKidFbo.resizeTexture(nw, nh);
            this.mirrorRaysFbo.resizeTexture(nw, nh);
            this.mirrorRaysFboPing.resizeTexture(nw / 8, nh / 8);
            this.mirrorRaysFboPong.resizeTexture(nw / 16, nh / 16);
            this.finalCompositeFbo.resizeTexture(nw, nh);

            if (nw <= 512) {
                this.raysIteration = 5;
            } else if (nw <= 800) {
                this.raysIteration = 5
            } else if (nw <= 1440) {
                this.raysIteration = 7;
            } else if (nw <= 1920) {
                this.raysIteration = 9;
            }


            this.finalCompositeMaterial.uniforms.tAccum.value = this.mirrorRaysFbo.texture;
            this.finalCompositeMaterial.uniforms.tMirrorKid.value = this.mirrorKidFbo.texture;

            //this.mirrorKidMaterial.uniforms.offset.value.set(1.0 / nw, 1.0 / nh);
            this.mirrorRaysMaterial.uniforms.offset.value.set(1.0 / nw, 1.0 / nh);

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

        /**
         *
         * Update all parameters
         *
         */
        update: function (options, currentFrame, delta, time, progress, position, orientation, running) {


            //
            // Update controls
            //
            var finalPhonePosition = InputController.getInstance().getPositionDirectional(),
                finalPhonePositionRange = finalPhonePosition.clone();


            //remap the phone range
            if (options.phoneRangeLeft!==undefined || options.phoneRangeRight!==undefined) {
                finalPhonePositionRange.x = this.cmap(finalPhonePosition.x,-1.0,1.0,options.phoneRangeLeft,options.phoneRangeRight);
                finalPhonePositionRange.y = this.cmap(finalPhonePosition.y,-1.0,1.0,-options.phoneRangeY,options.phoneRangeY);
                //if (currentVideoLoop==='p5_top' || currentVideoLoop==='p5_broken') my = map(mouseY,-1.0,1.0,-1.5,-0.2);
            }
            

            var zValue = this.cmap(finalPhonePosition.z,0.1,0.9,0.0,1.0);

            //
            // Update the diffuse & masks
            //
            this.diffuseMaterial.uniforms.maskRatio.value = options.maskRatio;
            this.mirrorMaskPremultMaterial.uniforms.maskAlpha.value.set(
                options.mirrorKidGlowNear * Math.pow((1.0-finalPhonePosition.z),2.0),
                options.mirrorKidGlowNear * Math.pow((1.0-finalPhonePosition.z),2.0),
                0.0,
                options.mirrorMaskExposure
            );


            this.mirrorMaskMaterial.uniforms.maskRatio.value = options.maskRatio;
            this.mirrorMaskMaterial.uniforms.maskScale.value = options.maskScale;
            this.mirrorMaskMaterial.uniforms.maskOffset.value = options.maskOffset;

            var currentCenter = new THREE.Vector2(0.0,0.0);
            var centerData = this.mirrorKidCenter[ parseInt(currentFrame+5402).toString() ];
            if (centerData!==undefined && centerData.length) {
                currentCenter.x = centerData[0]-0.75;
                currentCenter.y = centerData[1]*-2.0+1.0;
            }
            var remappedPosition = new THREE.Vector2(
                //this.cmap(finalPhonePosition.x,-1)
                (finalPhonePosition.x < 0.0) ? ( finalPhonePosition.x / Math.abs(-1.0-currentCenter.x) ) : ( finalPhonePosition.x / Math.abs(1.0-currentCenter.x) ),
                (finalPhonePosition.y < 0.0) ? ( finalPhonePosition.y / Math.abs(-1.0-currentCenter.y) ) : ( finalPhonePosition.y / Math.abs(1.0-currentCenter.y) )
            );
            remappedPosition.y *= -1;
            remappedPosition.x -= (remappedPosition.x - currentCenter.x) * 0.25;
            remappedPosition.y -= (remappedPosition.y - currentCenter.y) * 0.25;
            //remappedPosition.x = currentCenter.x;
            //remappedPosition.y = currentCenter.y;

            //
            // Update materials with options
            //
            // Update the mirrorkid
            if (this.mirrorKidMaterial.uniforms.effectAlpha) this.mirrorKidMaterial.uniforms.effectAlpha.value = options.mirrorKidAlpha;
            if (this.mirrorKidMaterial.uniforms.center) this.mirrorKidMaterial.uniforms.center.value.set(remappedPosition.x*0.5+0.5,remappedPosition.y*0.5+0.5,0.0);
            if (this.mirrorKidMaterial.uniforms.headCenter) this.mirrorKidMaterial.uniforms.headCenter.value.set(currentCenter.x,1.0-currentCenter.y);
            if (this.mirrorKidMaterial.uniforms.webcamAlpha) this.mirrorKidMaterial.uniforms.webcamAlpha.value = options.webcamAlpha * options.mirrorKidAlpha;
            if (this.mirrorKidMaterial.uniforms.foilRadius) this.mirrorKidMaterial.uniforms.foilRadius.value = options.mirrorKidFoilRadius;
            if (this.mirrorKidMaterial.uniforms.foilDisplacement) this.mirrorKidMaterial.uniforms.foilDisplacement.value = options.mirrorKidFoilDisplacement;

            //update the rays
            var raysAlpha = (1.0-zValue) * (options.effectAlphaNear - options.effectAlphaFar) + options.effectAlphaFar;
            raysAlpha *=  1.0 + (( 7 / this.raysIteration) - 1.0)*0.5;

            if (this.mirrorRaysMaterial.uniforms.effectAlpha) this.mirrorRaysMaterial.uniforms.effectAlpha.value = raysAlpha;
            if (this.mirrorRaysMaterial.uniforms.lightPosition) this.mirrorRaysMaterial.uniforms.lightPosition.value.set(finalPhonePositionRange.x*-0.5+0.5,finalPhonePositionRange.y*0.5+0.5,0.0);
            if (this.mirrorRaysMaterial.uniforms.center && options.mirrorCenterX!==undefined) this.mirrorRaysMaterial.uniforms.center.value.set(options.mirrorCenterX,options.mirrorCenterY);
            if (this.mirrorRaysMaterial.uniforms.randomuv) this.mirrorRaysMaterial.uniforms.randomuv.value.set(Math.random(),Math.random());
            if (this.mirrorRaysMaterial.uniforms.raysAlpha) this.mirrorRaysMaterial.uniforms.raysAlpha.value = options.raysAlpha;
            if (this.mirrorRaysMaterial.uniforms.raysRadius) this.mirrorRaysMaterial.uniforms.raysRadius.value = options.raysRadius;    

            //color flashing
            var flashingRangeMax = 1.0 + options.colorFlash,
                flashingRangeMin = 1.0 - options.colorFlash;

            this.finalCompositeMaterial.uniforms.globalColor.value.set(
                this.random(1.0, flashingRangeMax),
                this.random(1.0, flashingRangeMax),
                this.random(1.0, flashingRangeMax),
                1.0);
        },

        /**
         *
         * Renders three.js scene in this sequence's Render Target
         *
         */
        render: function () {
            RendererController.getInstance().getRenderer().setClearColor(new THREE.Color(0));
            RendererController.getInstance().getRenderer().clear();

            //update webcam 
            // if (this.webcamVideo && Date.now() - this.webcamLastUpdate >= (1000 / 24)) {
            //     this.webcamLastUpdate = Date.now();
            //     this.webcamCanvas.c.drawImage(this.webcamVideo,0,0,this.WEBCAM_TEXTURE_SIZE,this.WEBCAM_TEXTURE_SIZE);
            //     this.webcamTexture.needsUpdate = true;
            // }

            //update mask and diffuse
            if (this.videoTexture.wasUpdatedThisframe) {
                this.mirrorMaskFbo.render();
                this.diffuseFbo.render();
                this.mirrorMaskPremultFbo.render();
            }

            //update mirrorkid
            this.mirrorKidFbo.render();

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

                this.mirrorRaysMaterial.uniforms.pass.value = 1.0 / i;
                this.mirrorRaysMaterial.uniforms.tAccum.value = (i===1) ? this.mirrorMaskPremultFbo.texture : pongFbo.texture;
                pingFbo.render();
            }

            //final full-res rays mix
            this.mirrorRaysMaterial.uniforms.pass.value = 1.0 / i;
            this.mirrorRaysMaterial.uniforms.tAccum.value = pingFbo.texture;
            this.mirrorRaysFbo.render();
            this.finalCompositeFbo.render();
            RendererController.getInstance().renderToScreen(this.finalCompositeFbo.texture,false,true);
        }
    },

    _private: {
        map: function(value, istart, istop, ostart, ostop) {
         return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
        },
        cmap: function(value, istart, istop, ostart, ostop) {
         return Math.max(Math.min(ostart + (ostop - ostart) * ((value - istart) / (istop - istart)),ostop),ostart);
        },
        random: function(min, max) {
            return (Math.random() * (max-min) + min)
        }
    }

});
