/**
 * @author Édouard Lanctôt  < edouardlb@gmail.com >
 *
 */
var FinaleSequence = Sequence._extend({

    _public:  {

        breakFreeTexture: null,
        breakFreeMaterial: null,
        breakFreeFbo: null,
        breakFreeSpeed: 0.0,
        mouseSpeed: 0.0,
        lastMouse: new THREE.Vector2(),

        paletteTexture: null,
        mirrorRaysMaterial: null,
        mirrorRaysFboPing: null,
        mirrorRaysFboPong: null,
        mirrorRaysFbo: null,
        mirrorRaysFboIsPing: false,
        raysIteration: 4,
        glitchTextures: [],


        lastGlitchUpdate: 0,
        glitchUpdateRate: (1000/30), //or just sync it with video update?

        //not using an fbo, we render fullscreen directly in this scene
        scene: null,
        camera: null,
        renderPlane: null,



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

            console.log('initializing finale');


            //
            // Localise some variables / references
            //
            var videoWidth = this.videoTexture.width,
                videoHeight = this.videoTexture.height,
                renderer = RendererController.getInstance().getRenderer();


            for (var i=0; i<3; i++) {
                this.glitchTextures[i] = AssetsController.getInstance().getFile('media/images/brokenmirror/glitch4/noise_'+(i+1)+'.jpg');
                this.glitchTextures[i].format = THREE.RGBFormat;
                this.glitchTextures[i].wrapS = this.glitchTextures[i].wrapT = THREE.RepeatWrapping;
                this.glitchTextures[i].minFilter = THREE.LinearFilter;
                this.glitchTextures[i].generateMipmaps = false;
                this.glitchTextures[i].needsUpdate = true;
            }

            //the break free image
            this.breakFreeTexture = AssetsController.getInstance().getFile('media/images/break_free.png');
            this.breakFreeTexture.needsUpdate = true;

            //the break free + noise overlay material
            this.breakFreeMaterial  = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/finale/breakFreeNoiseFS.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/finale/breakFreeNoiseFS.frag'),
                attributes:{},
                uniforms: {

                    'tVideo':{type:'t', value: this.videoTexture.texture },
                    'tBreakFree':{type:'t', value: this.breakFreeTexture },
                    'tNoise':{type:'t', value: this.glitchTextures[0] },

                    'randomUV':{type:'v2',value:new THREE.Vector2(Math.random(),Math.random())},

                    'glitchScale':{type:'v2',value: new THREE.Vector2(1,1)},
                    'noiseAlpha':{type:'f',value: 0.1},
                    'blackAndWhite': {type:'f', value:0.0},
                    'breakFreeAlpha':{type:'f',value: 1.0},
                    'breakFreeSize': {type:'f', value:2.0},

                    'minBlack': {type:'f', value:0.0},
                    'maxWhite': {type:'f', value:1.0},

                    'screenAlpha':{type:'f',value: 0.5},
                    'darkenAlpha':{type:'f',value: 0.5},
                    'exposureMultiply':{type:'f',value: 2.0},
                    'exposureOffset':{type:'f',value: 1.0}
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

            //the break free + noise overlay fbo
            this.breakFreeFbo = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.breakFreeMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });

            this.scene = new THREE.Scene();
            this.camera = new THREE.OrthographicCamera( -1, 1, -1, 1, -1, 1 );
            this.renderPlane = new THREE.Mesh(
                new THREE.PlaneGeometry(2,2,2,2),
                this.breakFreeMaterial
            );
            this.scene.add(this.renderPlane);


        },

        begin: function () {

            Sequence.prototype.begin.call(this);

            console.log('begin finale');

            MouseCursorAppearanceController.getInstance().setMode(MouseCursorAppearanceController.MODE_NON_INTERACTIVE);

            this.breakFreeMaterial.uniforms.tVideo.value = this.videoTexture.texture;
            this.breakFreeFbo.alloc();

        },

        end: function () {

            Sequence.prototype.end.call(this);
            this.breakFreeFbo.dispose();
            MouseCursorAppearanceController.getInstance().setMode(MouseCursorAppearanceController.MODE_INTERACTIVE);

        },

        changeVideoQuality: function(nw, nh) {

            this.breakFreeMaterial.uniforms.tVideo.value = this.videoTexture.texture;
            this.breakFreeFbo.resizeTexture(Math.max(nw,this.renderWidth), Math.max(nh,this.renderHeight));

        },

        changeRenderQuality: function (nw, nh) {

            this.breakFreeFbo.resizeTexture(Math.max(nw,this.videoTexture.width), Math.max(nh,this.videoTexture.height));

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


            //testing
            if (!TimelineController.getInstance().initialised) {
                RendererController.getInstance().disablePhoneInteraction();
            }
            
            //use the renderer noise
            if (this.glitchTextures && this.glitchTextures.length>0 && (Date.now()-this.lastGlitchUpdate >= this.glitchUpdateRate)) {

                this.lastGlitchUpdate = Date.now();
                this.breakFreeMaterial.uniforms.tNoise.value  = this.glitchTextures[Math.floor(Math.random()*this.glitchTextures.length)]; //mousep * options.breakFreeAlpha;
                this.breakFreeMaterial.uniforms.randomUV.value.set(Math.random()*3.0,Math.random()*3.0);

            }

            //
            // Flicker breakfree and noise with motion
            //
            if (InputController.getInstance().isMouseVersion()) {

                this.mouseSpeed = this.mouseSpeed*(1.0-0.05*delta) + (this.lastMouse.clone().sub(finalPhonePosition).length()) * 0.5*delta
                this.mouseSpeed = Math.min(this.mouseSpeed,1.0);
                this.lastMouse.copy(finalPhonePosition);

                var mousep = Math.min(this.mouseSpeed*0.01 + (1.0-finalPhonePosition.z) * 2.0,1.0);
                mousep = Math.pow(mousep,3.0);
                this.breakFreeMaterial.uniforms.noiseAlpha.value  = mousep * options.motionNoise;
                this.breakFreeMaterial.uniforms.breakFreeAlpha.value  =  ((mousep > 0.9) ? 1.0 : 0.0) * (1.0 - Math.random()*options.breakFreeFlickering); //mousep * options.breakFreeAlpha;
                this.breakFreeMaterial.uniforms.blackAndWhite.value = Math.min(Math.pow(mousep,1.5)*1.5,1.0);
                
            } else {
            
                this.mouseSpeed += OrientationController.getInstance().rawMotionSpeed * 13.5;
                //if (OrientationController.getInstance().rawMotionSpeed>0.01) this.mouseSpeed += OrientationController.getInstance().rawMotionSpeed * 2.0;
                //else this.mouseSpeed = this.mouseSpeed*(1.0-0.2*delta);
                this.mouseSpeed = Math.min(this.mouseSpeed,2.15);

                var mousep = Math.min(this.mouseSpeed,1.0);
                mousep = Math.pow(mousep,1.3);
                mousep = isNaN(mousep) ? 0.0: mousep;
                this.breakFreeMaterial.uniforms.noiseAlpha.value  = mousep * options.motionNoise;
                this.breakFreeMaterial.uniforms.breakFreeAlpha.value  = ((mousep > 0.75) ? 1.0 : 0.0) * (1.0 - Math.random()*options.breakFreeFlickering); //mousep * options.breakFreeAlpha;
                this.breakFreeMaterial.uniforms.blackAndWhite.value = Math.min(Math.pow(Math.max(mousep-0.5,0.0)*2.0,3.5),1.0);
            
                if (mousep <= 0.75) this.mouseSpeed*=(1.0-0.25*delta); else this.mouseSpeed*=(1.0-0.06*delta);
            }


            if (options.fade > 0.5) this.breakFreeMaterial.uniforms.breakFreeAlpha.value = 0.0;
            this.breakFreeMaterial.uniforms.noiseAlpha.value *= (1.0-options.fade);
            this.breakFreeMaterial.uniforms.blackAndWhite.value *= (1.0-options.fade);

            //
            // update break-free material for fullscreen effect and blending modes
            //
            var rendererWidth = RendererController.getInstance().width;
            var rendererScale = rendererWidth / 1280;
            this.breakFreeMaterial.uniforms.breakFreeSize.value = options.breakFreeSize;// * rendererScale;
            this.breakFreeMaterial.uniforms.glitchScale.value.set(options.glitchScale * rendererScale,options.glitchScale * rendererScale);//options.glitchScale*rendererScale,options.glitchScale*rendererScale);

            this.breakFreeMaterial.uniforms.screenAlpha.value = options.screenAlpha;
            this.breakFreeMaterial.uniforms.darkenAlpha.value = options.darkenAlpha;
            this.breakFreeMaterial.uniforms.exposureMultiply.value = options.exposureMultiply;
            this.breakFreeMaterial.uniforms.exposureOffset.value = options.exposureOffset;
            this.breakFreeMaterial.uniforms.minBlack.value = options.minBlack;
            this.breakFreeMaterial.uniforms.maxWhite.value = options.maxWhite;


            OrientationController.getInstance().rawMotionSpeed *= 1.0 - 0.49 * delta;
        },

        /**
         *
         * Renders three.js scene in this sequence's Render Target
         *
         */
        render: function () {
            RendererController.getInstance().getRenderer().setClearColor(new THREE.Color(0));
            RendererController.getInstance().getRenderer().clear();

            this.breakFreeFbo.render();
            RendererController.getInstance().renderToScreen(this.breakFreeFbo.texture,false,true);
            //RendererController.getInstance().renderMaterialFullScreen(this.scene,this.camera);


        }
    }

});
