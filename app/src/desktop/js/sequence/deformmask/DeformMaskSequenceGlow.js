/**
 *
 * @author Édouard Lanctôt  < edouardlb@gmail.com >
 *
 */
var DeformMaskSequenceGlow = Sequence._extend({

    _public:  {

        /**
         *
         * Rendering state
         *
        */
        drawingMaterial: null,
        drawingFboPing: null,
        drawingFboPong: null,
        drawingIsPing: false,

        drawingFeedbackMaterial: null,
        drawingFeedbackFboPing: null,
        drawingFeedbackFboPong: null,
        drawingFeedbackIsPing: false,

        preAddMaterial: null,
        preAddFbo: null,


        revealGlowMaterial: null,
        revealGlowFboPing: null,
        revealGlowFboPong: null,
        revealGlowIsPing: false,


        lightGlowMaterial: null,
        lightGlowFboPing: null,
        lightGlowFboPong: null,
        lightGlowIsPing: false,


        raysMaterial: null,
        raysFboPing: null,
        raysFboPong: null,
        raysFbo: null,

        compositeMaterial: null,
        compositeFbo: null,


        useGodRays: false,


        //the mask / blob texture
        blobTexturePaths: [
            'media/images/mask_encre_scene0/mask_encre0.jpg',
            'media/images/mask_encre_scene0/mask_encre1.jpg',
            'media/images/mask_encre_scene0/mask_encre2.jpg',
            'media/images/mask_encre_scene0/mask_encre3.jpg',
            'media/images/mask_encre_scene0/mask_encre4.jpg',
            'media/images/mask_encre_scene0/mask_encre5.jpg',
            'media/images/mask_encre_scene0/mask_encre6.jpg',
            'media/images/mask_encre_scene0/mask_encre7.jpg',
            'media/images/mask_encre_scene0/mask_encre8.jpg',
            'media/images/mask_encre_scene0/mask_encre9.jpg',
            'media/images/mask_encre_scene0/mask_encre10.jpg'
        ],
        blobTextures: [],
        lastMaskFrameUpdate: 0,
        currentMask: 0,
        maskRate: 1000 / 24,


        //construct sequence
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
            // console.log(this,this.video,this.audio,this.videoTexture); 

            console.log('initializing deformmask');


            //
            // Localise some variables / references
            //
            var videoWidth = this.videoTexture.width,
                videoHeight = this.videoTexture.height,
                renderer = RendererController.getInstance().getRenderer(); 



            for (var i=0; i<this.blobTexturePaths.length; i++) {

                this.blobTextures[i] = AssetsController.getInstance().getFile(this.blobTexturePaths[i]);
                this.blobTextures[i].minFilter = THREE.LinearMipMapLinearFilter;
                this.blobTextures[i].generateMipmaps = true;
                this.blobTextures[i].needsUpdate = true;

            }


            //
            //
            //  First Pass -> Accumulating the direction / distance 
            //
            //
            this.drawingMaterial = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/deformmask/vertexRatio.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/deformmask/drawingDirection.frag'),
                attributes:{},
                uniforms: {
                    'tAccum': {type:'t', value: null},
                    'center': {type:'v2', value: new THREE.Vector2()},
                    'drawingSize': {type: 'f', value: 0.25},
                    'drawingOpacity': {type: 'f', value: 0.1},
                    'accumSpeed': {type: 'f', value: 0.25}

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
            // Drawing accumulation
            //
            this.drawingFboPing = new FramebufferWrapper(videoWidth/2,videoHeight/2,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.drawingMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });
            this.drawingFboPong = new FramebufferWrapper(videoWidth/2,videoHeight/2,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.drawingMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });



            //
            //
            //  Second Pass -> Accumulating the direction / distance 
            //
            //
            this.drawingFeedbackMaterial = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/deformmask/vertexRatio.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/deformmask/drawingFeedbackRadial2.frag'),
                attributes:{},
                uniforms: {

                    'tVideo': {type:'t', value:this.videoTexture.texture},
                    'tAccum': {type:'t', value: null},
                    'tDrawing': {type:'t', value: null},

                    'center': {type:'v2', value: new THREE.Vector2()},
                    'drawingSize': {type: 'f', value: 0.25},
                    'drawingOpacity': {type: 'f', value: 0.1},
                    'accumSpeed': {type: 'f', value: 0.25},
                    'drawingDiffExp': {type: 'f', value: 1.5},
                    'centerFadeSize': {type: 'f', value: 0.1},
                    'offset': {type: 'v2', value: new THREE.Vector2(2/videoWidth, 2/videoHeight)},

                    'rayRadius': {type:'f', value: 100.0},
                    'noiseAlpha': {type:'f', value: 100.0},
                    'randomUV': {type:'v2', value: new THREE.Vector2()}

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
            // Drawing accumulation
            //
            this.drawingFeedbackFboPing = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.drawingFeedbackMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });
            this.drawingFeedbackFboPong = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.drawingFeedbackMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });




            //
            // Pre-compose the drawing
            //
            this.preAddMaterial = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/common/vertex.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/deformmask/addDrawing.frag'),
                attributes:{},
                uniforms: {
                    'tVideo':{type:'t', value: this.videoTexture.texture},
                    'tDrawing':{type:'t', value: this.drawingFboPing.texture},
                    'drawingAdditive': {type:'f', value: 0.0},
                    'drawingDiffExp': {type:'f',value: 0.0},
                    'drawingAlpha': {type:'f', value: 1.0}
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
            this.preAddFbo = new FramebufferWrapper(videoWidth/2,videoHeight/2,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.preAddMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });


            //
            // Pre-compose the drawing
            //
            this.revealGlowMaterial = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/deformmask/vertexRatio.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/deformmask/revealGlow.frag'),
                attributes:{},
                uniforms: {
                    'tVideo':{type:'t', value: this.preAddFbo.texture},
                    'tDrawing':{type:'t', value: null},
                    'tAccum':{type:'t', value: null},
                    'tBlob':{type:'t', value: null},

                    'offset': {type:'v2', value: new THREE.Vector2(1.66/videoWidth,1.66/videoHeight)},
                    'center': {type:'v2', value: new THREE.Vector2(0.5,0.5)},
                    'drawingSize': {type:'f', value: 0.5},
                    'blobScale': {type:'f', value: 3.0},
                    'accumSpeed': {type:'f', value: 0.98},
                    'exposure': {type:'f', value: 1.0}
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
            this.revealGlowFboPing = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.revealGlowMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });
            this.revealGlowFboPong = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.revealGlowMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });



            //
            // Pre-compose the drawing
            //
            this.lightGlowMaterial = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/deformmask/vertexRatio.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/deformmask/lightGlow.frag'),
                attributes:{},
                uniforms: {

                    'tVideo':{type:'t', value: this.preAddFbo.texture},
                    'tDrawing':{type:'t', value: null},
                    'tAccum':{type:'t', value: null},
                    'tBlob':{type:'t', value: null},
                    'tReveal': {type:'t', value: null},

                    'center': {type:'v2', value: new THREE.Vector2(0.5,0.5)},
                    'drawingSize': {type:'f', value: 0.5},
                    'blobScale': {type:'f', value: 3.0},
                    'accumSpeed': {type:'f', value: 0.99},
                    'pass': {type:'f', value: 1.0},
                    'offset': {type:'v2', value: new THREE.Vector2(3.5/videoWidth,3.5/videoHeight)}

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
            this.lightGlowFboPing = new FramebufferWrapper(videoWidth/4,videoHeight/4,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.lightGlowMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });
            this.lightGlowFboPong = new FramebufferWrapper(videoWidth/8,videoHeight/8,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.lightGlowMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });




            //
            // The light refraction composite
            //
            this.raysMaterial = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/common/vertex.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/deformmask/drawingGodRays.frag'),
                attributes:{},
                uniforms: {
                    'tVideo':{type:'t', value: this.videoTexture.texture},
                    'tDrawing':{type:'t', value: null},
                    'tAccum': {type:'t', value:null},

                    'randomUV': {type: 'v2', value: new THREE.Vector2()},
                    'noiseOffset': {type: 'f', value: 0.05},

                    'drawingAdditive': {type:'f', value: 0.0},

                    'offset': {type:'v2', value: new THREE.Vector2(1.0/videoWidth,1.0/videoHeight)},
                    'center': {type:'v2', value: new THREE.Vector2(0.5,0.5)},
                    'alpha':{type:'f',value:1.0},
                    'raysExp':{type:'f',value:1.0},
                    'fStepSize': {type:'f', value: 0.0},
                    'rotation': {type:'v2', value: new THREE.Vector2(0,0)}
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
            this.raysFboPing = new FramebufferWrapper(videoWidth/8,videoHeight/8,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.raysMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });
            this.raysFboPong = new FramebufferWrapper(videoWidth/2,videoHeight/2,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.raysMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });
            this.raysFbo = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.raysMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });




            //
            //  Add everything over video
            //
            this.compositeMaterial = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/common/vertex.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/deformmask/add.frag'),
                attributes:{},
                uniforms: {

                    'tVideo':{type:'t',value:this.videoTexture.texture},
                    'tDrawing':{type:'t',value:this.videoTexture.texture},
                    'tRays':{type:'t',value:this.videoTexture.texture},

                    'videoAlpha': {type: 'f', value: 1.0},
                    'drawingAlpha': {type: 'f', value: 0.1},
                    'raysAlpha': {type: 'f', value: 1.0}

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

            this.compositeFbo = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.compositeMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });

        },

        begin: function () {

            Sequence.prototype.begin.call(this);

            console.log('begin deformmask');

            this.drawingFboPing.alloc();
            this.drawingFboPong.alloc();
            this.drawingFeedbackFboPing.alloc();
            this.drawingFeedbackFboPong.alloc();

            this.preAddFbo.alloc();
            this.raysFboPing.alloc();
            this.raysFboPong.alloc();
            this.raysFbo.alloc();

            this.compositeFbo.alloc();


            this.drawingFeedbackMaterial.uniforms.tVideo.value = this.videoTexture.texture;
            this.raysMaterial.uniforms.tVideo.value = this.videoTexture.texture;
            this.preAddMaterial.uniforms.tVideo.value = this.videoTexture.texture;
            this.compositeMaterial.uniforms.tVideo.value = this.videoTexture.texture;

        },

        end: function () {

            Sequence.prototype.end.call(this);

            this.drawingFboPing.dispose();
            this.drawingFboPong.dispose();
            this.drawingFeedbackFboPing.dispose();
            this.drawingFeedbackFboPong.dispose();


            this.preAddFbo.dispose();
            this.raysFboPing.dispose();
            this.raysFboPong.dispose();
            this.raysFbo.dispose();

            this.compositeFbo.dispose();
        },


        changeVideoQuality: function(nw, nh) {
            this.drawingFeedbackMaterial.uniforms.tVideo.value = this.videoTexture.texture;
            this.raysMaterial.uniforms.tVideo.value = this.videoTexture.texture;
            this.preAddMaterial.uniforms.tVideo.value = this.videoTexture.texture;
            this.compositeMaterial.uniforms.tVideo.value = this.videoTexture.texture;
        },

        changeRenderQuality: function (nw, nh) {
            var renderer = RendererController.getInstance().getRenderer();

            this.renderWidth = nw;
            this.renderHeight = nh;

            this.drawingFboPing.resizeTextureAndCopy(nw/2, nh/2);
            this.drawingFboPong.resizeTextureAndCopy(nw/2, nh/2);
            this.drawingFeedbackFboPing.resizeTextureAndCopy(nw/2, nh/2);
            this.drawingFeedbackFboPong.resizeTextureAndCopy(nw/2, nh/2);


            this.preAddFbo.resizeTexture(nw/2, nh/2);
            this.raysFboPing.resizeTexture(nw / 8, nh / 8);
            this.raysFboPong.resizeTexture(nw / 2, nh / 2);
            this.raysFbo.resizeTexture(nw, nh);

            this.compositeFbo.resizeTexture(nw, nh);
            
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
        update: function (options, currentFrame, delta, time, progress, position, orientation) {

            //
            // Update controls
            //
            var finalPhonePosition = InputController.getInstance().getPositionDirectional();

            var rangeX = 0.9; // + (finalPhonePosition.z) * 0.2;
            var rangeY = 1.25; // + (finalPhonePosition.z) * 0.2;

            if (InputController.getInstance().isMouseVersion()) {
                rangeX += (0.5-rangeX) * (1.0-finalPhonePosition.z);
                rangeY += (0.5-rangeY) * (1.0-finalPhonePosition.z);
            } else {
                rangeX += (0.5-rangeX) * (1.0-finalPhonePosition.z) * 0.2;
                rangeY += (0.5-rangeY) * (1.0-finalPhonePosition.z) * 0.2;
            }

            this.drawingMaterial.uniforms.center.value.set(finalPhonePosition.x*rangeX+0.5, finalPhonePosition.y*-rangeY+0.5);
            this.drawingFeedbackMaterial.uniforms.center.value.set(finalPhonePosition.x*rangeX+0.5, finalPhonePosition.y*-rangeY+0.5);
            this.raysMaterial.uniforms.center.value.set(finalPhonePosition.x*rangeX+0.5, finalPhonePosition.y*rangeY+0.5);
            this.revealGlowMaterial.uniforms.center.value.set(finalPhonePosition.x*-rangeX+0.5, finalPhonePosition.y*rangeY+0.5);
            this.lightGlowMaterial.uniforms.center.value.set(finalPhonePosition.x*-rangeX+0.5, finalPhonePosition.y*rangeY+0.5);


            if (Date.now() - this.lastMaskFrameUpdate >= this.maskRate) {

                this.lastMaskFrameUpdate = Date.now();
                this.currentMask++;
                if (this.currentMask>=this.blobTextures.length) this.currentMask = 0;
                this.revealGlowMaterial.uniforms.tBlob.value = this.blobTextures[this.currentMask];
                this.lightGlowMaterial.uniforms.tBlob.value = this.blobTextures[this.currentMask];

            }




            //update uniforms with options
            this.revealGlowMaterial.uniforms.drawingSize.value = options.drawingSize;// + (1.0-options.drawingSize*0.1)*finalPhonePosition.z; //  * Math.random();
            this.lightGlowMaterial.uniforms.drawingSize.value = options.drawingSize;// + (1.0-options.drawingSize)*finalPhonePosition.z; //  * Math.random();


            this.drawingMaterial.uniforms.drawingSize.value =1.0*options.drawingSize;// + (1.0-options.drawingSize)*finalPhonePosition.z; //  * Math.random();
            //this.drawingMaterial.uniforms.drawingSize.value += (1.0-this.drawingMaterial.uniforms.drawingSize.value) * options.fade;
            this.drawingMaterial.uniforms.drawingOpacity.value = options.drawingOpacity;
            this.drawingMaterial.uniforms.accumSpeed.value = options.accumSpeed; 

            this.drawingFeedbackMaterial.uniforms.drawingSize.value = options.drawingSizeRays; //  * Math.random();
            this.drawingFeedbackMaterial.uniforms.drawingOpacity.value = options.drawingOpacityRays + 0.2 * finalPhonePosition.z;
            this.drawingFeedbackMaterial.uniforms.accumSpeed.value = options.accumSpeedRays * (1.0 + 0.033 * finalPhonePosition.z);

            this.drawingFeedbackMaterial.uniforms.rayRadius.value = options.noiseRadiusRays;
            this.drawingFeedbackMaterial.uniforms.noiseAlpha.value = options.noiseAlphaRays;
            this.drawingFeedbackMaterial.uniforms.randomUV.value.set(Math.random(),Math.random()*1.5);
            this.drawingFeedbackMaterial.uniforms.drawingDiffExp.value = options.drawingDiffExp;
            this.drawingFeedbackMaterial.uniforms.centerFadeSize.value = options.centerFadeSizeRays * (finalPhonePosition.z);
            if (!this.useGodRays) this.drawingFeedbackMaterial.uniforms.centerFadeSize.value = 0.0;

            this.preAddMaterial.uniforms.drawingAdditive.value = options.drawingAdditive;
            this.preAddMaterial.uniforms.drawingAlpha.value = options.drawingAlphaComposite * (1.0-options.fade);


            /*this.raysMaterial.uniforms.randomUV.value.set(Math.random(),Math.random());
            this.raysMaterial.uniforms.noiseOffset.value = options.noiseOffset;
            this.raysMaterial.uniforms.alpha.value = 1.0; //options.alpha;
            this.raysMaterial.uniforms.drawingAdditive.value = 0.0; //options.drawingAdditive;
            this.raysMaterial.uniforms.raysExp.value = 1.5; //options.raysExp;*/

            this.raysMaterial.uniforms.randomUV.value.set(Math.random(),Math.random());
            this.raysMaterial.uniforms.noiseOffset.value = 0.0; //options.noiseOffset;
            this.raysMaterial.uniforms.alpha.value = 1.0; // - 0.25 * finalPhonePosition.z; //options.alpha;
            this.raysMaterial.uniforms.drawingAdditive.value = 0.0; //options.drawingAdditive;
            this.raysMaterial.uniforms.raysExp.value = 1.0 + finalPhonePosition.z*2.0 + 2.0 * options.fade; //options.raysExp;
            this.raysMaterial.uniforms.alpha.value = (1.0-options.fade);

            //subtle spin effect on phone Z rotation
            this.raysMaterial.uniforms.rotation.value.set(Math.cos(InputController.getInstance().getRotationX()*0.5),Math.sin(InputController.getInstance().getRotationX()*0.5)); //Math.cos(Date.now()*0.01),Math.sin(Date.now()*0.01));


            this.compositeMaterial.uniforms.videoAlpha.value = options.videoAlphaComposite;
            this.compositeMaterial.uniforms.drawingAlpha.value = options.drawingAlphaComposite;
            this.compositeMaterial.uniforms.raysAlpha.value = options.godRaysAlphaComposite * (1.0-options.fade);
            

            if (!this.useGodRays) {


                // this.lightGlowMaterial.uniforms.drawingSize.value = options.drawingSize;// + (1.0-options.drawingSize)*finalPhonePosition.z; //  * Math.random();


                // this.drawingMaterial.uniforms.drawingSize.value =1.0*options.drawingSize;// + (1.0-options.drawingSize)*finalPhonePosition.z; //  * Math.random();
                // //this.drawingMaterial.uniforms.drawingSize.value += (1.0-this.drawingMaterial.uniforms.drawingSize.value) * options.fade;
                // this.drawingMaterial.uniforms.drawingOpacity.value = options.drawingOpacity;
                // this.drawingMaterial.uniforms.accumSpeed.value = options.accumSpeed; 

                var drawingSize = this.map(finalPhonePosition.z,0.0,1.0,0.1,0.3);
                var drawingSizeRandom = 0.0 * (1.0-finalPhonePosition.z);
                drawingSizeRandom = this.random(1.0-drawingSizeRandom,1.0+drawingSizeRandom);
                this.revealGlowMaterial.uniforms.drawingSize.value = drawingSize*drawingSizeRandom;
                this.lightGlowMaterial.uniforms.drawingSize.value = drawingSize;


                this.drawingMaterial.uniforms.drawingSize.value = drawingSize*drawingSizeRandom;// + (1.0-options.drawingSize)*finalPhonePosition.z; //  * Math.random();
                this.drawingMaterial.uniforms.drawingOpacity.value = this.map(finalPhonePosition.z,1.0,0.0,0.45,2.0);
                this.drawingMaterial.uniforms.accumSpeed.value = this.map(finalPhonePosition.z,1.0,0.0,0.95,0.98);
       

                this.drawingFeedbackMaterial.uniforms.drawingSize.value = this.map(finalPhonePosition.z,1.0,0.0,0.7,2.0);; //  * Math.random();
                this.drawingFeedbackMaterial.uniforms.drawingOpacity.value = this.cmap(finalPhonePosition.z,1.0,0.0,0.9,1.2); // + 0.2 * finalPhonePosition.z;
                this.drawingFeedbackMaterial.uniforms.accumSpeed.value = options.accumSpeedRays; // * (1.0 + 0.033 * finalPhonePosition.z);

                this.revealGlowMaterial.uniforms.exposure.value = this.map(finalPhonePosition.z,0.0,1.0,0.5,1.0);
                this.revealGlowMaterial.uniforms.accumSpeed.value = this.map(finalPhonePosition.z,1.0,0.0,0.98,0.995);


            // this.drawingMaterial.uniforms.accumSpeed.value = options.accumSpeed; 

            }


        },

        /**
         *
         * Renders three.js scene in this sequence's Render Target
         *
         */
        render: function () {


            if (!this.useGodRays) {


                var ping = this.drawingIsPing ? this.drawingFboPing : this.drawingFboPong;
                var pong = this.drawingIsPing ? this.drawingFboPong : this.drawingFboPing;
                this.drawingMaterial.uniforms.tAccum.value = pong.texture;
                ping.render(); 
                this.drawingIsPing = !this.drawingIsPing;


                var revealPing = this.revealGlowIsPing ? this.revealGlowFboPing : this.revealGlowFboPong;
                var revealPong = this.revealGlowIsPing ? this.revealGlowFboPong : this.revealGlowFboPing;
                this.revealGlowIsPing = !this.revealGlowIsPing;

                this.revealGlowMaterial.uniforms.tVideo.value = this.videoTexture.texture;
                this.revealGlowMaterial.uniforms.tDrawing.value = ping.texture;
                this.revealGlowMaterial.uniforms.tAccum.value = revealPong.texture;
                revealPing.render();
                
                
                var iterations = 4;
                var glowPing;
                var glowPong;
                for (var i=0; i<iterations; i++) {
                    glowPing = this.lightGlowIsPing ? this.lightGlowFboPing : this.lightGlowFboPong;
                    glowPong = this.lightGlowIsPing ? this.lightGlowFboPong : this.lightGlowFboPing;
                    this.lightGlowIsPing = !this.lightGlowIsPing;

                    this.lightGlowMaterial.uniforms.tVideo.value = this.videoTexture.texture;
                    this.lightGlowMaterial.uniforms.tDrawing.value = ping.texture;
                    this.lightGlowMaterial.uniforms.tAccum.value = (i===0) ? revealPing.texture : glowPong.texture;
                    this.lightGlowMaterial.uniforms.tReveal.value = revealPing.texture;
                    this.lightGlowMaterial.uniforms.pass.value = i+1;
                    glowPing.render();
                }
                
                
                var pingRays = this.drawingFeedbackIsPing ? this.drawingFeedbackFboPing : this.drawingFeedbackFboPong;
                var pongRays = this.drawingFeedbackIsPing ? this.drawingFeedbackFboPong : this.drawingFeedbackFboPing;
                this.drawingFeedbackMaterial.uniforms.tVideo.value = revealPing.texture;
                this.drawingFeedbackMaterial.uniforms.tAccum.value = pongRays.texture;
                this.drawingFeedbackMaterial.uniforms.tDrawing.value = ping.texture;
                pingRays.render(); 
                this.drawingFeedbackIsPing = !this.drawingFeedbackIsPing;

                this.preAddMaterial.uniforms.tDrawing.value = pingRays.texture;
                this.preAddFbo.render();
                
                RendererController.getInstance().renderToScreen(glowPing.texture,false,true);

                
            
            } else {

                var ping = this.drawingIsPing ? this.drawingFboPing : this.drawingFboPong;
                var pong = this.drawingIsPing ? this.drawingFboPong : this.drawingFboPing;
                this.drawingMaterial.uniforms.tAccum.value = pong.texture;
                ping.render(); 
                this.drawingIsPing = !this.drawingIsPing;


                var pingRays = this.drawingFeedbackIsPing ? this.drawingFeedbackFboPing : this.drawingFeedbackFboPong;
                var pongRays = this.drawingFeedbackIsPing ? this.drawingFeedbackFboPong : this.drawingFeedbackFboPing;
                this.drawingFeedbackMaterial.uniforms.tAccum.value = pongRays.texture;
                this.drawingFeedbackMaterial.uniforms.tDrawing.value = ping.texture;
                pingRays.render(); 
                this.drawingFeedbackIsPing = !this.drawingFeedbackIsPing;

                this.preAddMaterial.uniforms.tVideo.value = this.videoTexture.texture;



                this.preAddMaterial.uniforms.tDrawing.value = pingRays.texture;
                this.preAddFbo.render();

                this.raysMaterial.uniforms.tVideo.value = this.preAddFbo.texture;
                this.raysMaterial.uniforms.tDrawing.value = ping.texture;


                var filterLen = 1.0;
                var TAPS_PER_PASS = 6.0;

                var pass = 1.0;
                var stepLen = filterLen * Math.pow( TAPS_PER_PASS, -pass );

                this.raysMaterial.uniforms.center.value.y = 1.0-this.raysMaterial.uniforms.center.value.y;
                this.raysMaterial.uniforms.fStepSize.value = stepLen;
                this.raysMaterial.uniforms.tAccum.value = this.videoTexture.texture;
                this.raysFboPing.renderPlane.scale.y = 1;
                this.raysFboPing.render();

                pass = 2.0;
                stepLen = filterLen * Math.pow( TAPS_PER_PASS, -pass );
                this.raysMaterial.uniforms.fStepSize.value = stepLen;
                this.raysMaterial.uniforms.tAccum.value = this.raysFboPing.texture;
                this.raysFboPong.renderPlane.scale.y = 1;
                this.raysFboPong.render();

                pass = 3.0;
                stepLen = filterLen * Math.pow( TAPS_PER_PASS, -pass );
                this.raysMaterial.uniforms.fStepSize.value = stepLen;
                this.raysMaterial.uniforms.tAccum.value = this.raysFboPong.texture;
                this.raysFbo.renderPlane.scale.y = 1;
                this.raysFbo.render();



                this.compositeMaterial.uniforms.tDrawing.value = pingRays.texture;
                this.compositeMaterial.uniforms.tRays.value = this.raysFbo.texture;
                //this.compositeFbo.render();
                RendererController.getInstance().renderToScreen(this.raysFbo.texture,false,true);

            }
            

        },

        random: function(min,max) {
         return (min + Math.random()*(max-min));
        },
        map: function(value, istart, istop, ostart, ostop) {
         return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
        },
        cmap: function(value, istart, istop, ostart, ostop) {
         return Math.max(Math.min(ostart + (ostop - ostart) * ((value - istart) / (istop - istart)),ostop),ostart);
        }
    },

});