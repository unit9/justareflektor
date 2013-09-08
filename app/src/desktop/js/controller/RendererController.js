/**
 *
 * @author Édouard Lanctôt < edouardlb@gmail.com >
 *
 * Rendering pipeline for the entire project
 * Adds a
 *
 */
var RendererController = Class._extend(Class.SINGLETON, {

    _static: {

        SCALE_TYPE_CSS: 'RendererController_SCALE_TYPE_CSS',
        SCALE_TYPE_WEBGL: 'RendererController_SCALE_TYPE_WEBGL',
        RATIO: 1920.0 / 1008.0,

        SIDE_FLARE_SIZE_MIN: 0.5,
        SIDE_FLARE_SIZE_MAX: 4.0,

        SIDE_FLARE_SIDE_DURATION: 2000,
        SIDE_FLARE_ALPHA_STANDARD: 0.35,
        SIDE_FLARE_ALPHA_INCREASE: 0.75,
        NOISE_PATH: [
            'media/images/noise/noise_ps_gray_1/noise_couleur0.jpg',
            'media/images/noise/noise_ps_gray_1/noise_couleur1.jpg',
            'media/images/noise/noise_ps_gray_1/noise_couleur2.jpg'
        ]

    },

    _public: {

        noiseTextures: null,
        currentNoiseTexture: 0,

        defaultMaterial: null,
        material: null,
        flareTexture: null,
        initialised: false,
        scene: null,
        camera: null,
        renderer: null,
        plane: null,
        guiPlanes: [],
        lastTime: 0,

        hitSideTime: 0,
        hitSide: false,
        interactionEnabled: true,

        width: 1280,
        height: 672,

        //noise and flickering parameters
        blendingMode: 5, //sub
        noiseAlpha: 0.1,
        nearExposure: 0.7,
        flickerNear: 0.2,
        flickerFar: 0.03,
        crazyMotionExposure: 0.5,
        crazyMotionRandom: 1.5,

        //the gui to render over the main screen
        construct: function () {

        },

        init: function() {

            var self = this;

            if (this.initialised) {
                return;
            }

            console.log('-- render');
            this.renderer = new THREE.WebGLRenderer({antialias: false, alpha: false}); // Optimization: turning off antialias to save ~80MB VRAM
            window.renderer = this.renderer;
            //init the three.js scene
            this.scene = new THREE.Scene();
            this.camera = new THREE.Camera(-1, 1, -1, 1, -1, 1);
            /*this.defaultMaterial = this.material = new THREE.ShaderMaterial({
                vertexShader: "varying highp vec2 vUv; void main() {vUv = vec2(uv.x,1.0-uv.y); gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );}",
                fragmentShader: "varying highp vec2 vUv; uniform sampler2D tDiffuse; void main() {vec4 col = texture2D(tDiffuse,vUv); col.rgb *= col.a; gl_FragColor = col;}",
                //fragmentShader: "varying highp vec2 vUv; uniform sampler2D tDiffuse; void main() {gl_FragColor = vec4(1.0,0.0,0.0,1.0);}",
                uniforms: {
                    'tDiffuse': {type: 't', value: null}
                },
                attributes: {},
                side: THREE.DoubleSide
            });*/

            //renderer material
            this.flareTexture = AssetsController.getInstance().getFile('media/images/interface/sides.png');
            this.flareTexture.format = THREE.RGBAFormat;
            this.flareTexture.minFilter = THREE.LinearMipMapLinearFilter;
            this.flareTexture.generateMipmaps = true;
            this.flareTexture.needsUpdate = true;

            this.defaultMaterial = this.material = new THREE.ShaderMaterial({
                vertexShader: AssetsController.getInstance().getFile('shaders/renderer/textureNoiseSides.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/renderer/textureNoiseSides.frag'),
                uniforms: {
                    'tDiffuse': {type: 't', value: null},
                    'tNoise': {type: 't', value: null},
                    'tFlare':{type:'t', value: this.flareTexture},

                    'saturation': {type:'f',value:1.0},
                    'exposure': {type:'f',value:1.0},
                    'randomOffset': {type:'v2', value:new THREE.Vector2()},
                    'blending':{type: 'i', value: this.blendingMode},
                    'noiseAlpha':{type: 'f', value: 1.0},
                    'sidesSize': {type: 'v2', value: new THREE.Vector2( 0.005 * 0.525, 0.005)},
                    'sidesSizeInverse': {type: 'v2', value: new THREE.Vector2( 1.0 - 0.005 * 0.525, 1.0 - 0.005)},

                    'sideFlarePosition': {type:'v2', value: new THREE.Vector2(0.25,0.25)},
                    'sideFlareSize': {type:'f', value: 1.0},
                    'sideFlareAlpha': {type:'f', value: RendererController.SIDE_FLARE_ALPHA_STANDARD}

                },
                attributes: {},
                side: THREE.DoubleSide
            });

            this.plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 1, 1), this.material);
            this.scene.add(this.plane);


            //init the gui rendering scene
            this.guiPlanes = [];
            

            //init the noise textures
            if (RendererController.NOISE_PATH && RendererController.NOISE_PATH.length)  {
                this.noiseTextures = [];
                for (var i=0; i<RendererController.NOISE_PATH.length; i++) {
                    this.noiseTextures[i] = AssetsController.getInstance().getFile(RendererController.NOISE_PATH[i]);
                    this.noiseTextures[i].wrapS = THREE.RepeatWrapping;
                    this.noiseTextures[i].wrapT = THREE.RepeatWrapping;
                    this.noiseTextures[i].format = THREE.RGBFormat;
                    this.noiseTextures[i].magFilter = THREE.LinearFilter;
                    this.noiseTextures[i].minFilter = THREE.LinearMipMapLinearFilter;
                    this.noiseTextures[i].generateMipmaps = true;
                    this.noiseTextures[i].needsUpdate = true;
                }
            }


            //prepare for rendering
            $(window).bind('resize', function () {
                if (self.container) {
                    self.onResize();
                }
            });
            //this.onResize(true);
            this.initialised = true;
            this.lastTime = Date.now();
        },


        setNoiseTextures: function (_noiseTextures) {
            this.noiseTextures = _noiseTextures;
        },

        setMaterial: function (mat,_noiseTextures) {
            this.noiseTextures = _noiseTextures;
            this.material = this.plane.material = mat;
        },

        setDefaultMaterial: function () {
            this.noiseTextures = null;
            this.material = this.plane.material = this.defaultMaterial;
        },

        setMaterialUniform: function (key, value) {
            if (this.material.uniforms[key]) this.material.uniforms[key].value = value;
        },

        getRenderer: function () {
            return this.renderer;
        },


        /*
         *
         * Resize and place the renderer's domElement so it's always the right ratio and nothing more
         *
         */
        onResize: function () {

            var w,
                h,
                nw = 0,
                nh = 0,
                nx = 0,
                ny = 0;

            if (!this.container) {
                return;
            }

            
            w = this.container.width();
            h =  this.container.height();


            //scale to ratio
            if (w / h > 1920.0 / 1008.0) {
                nh = h;
                nw = h * (1920 / 1008);
            } else {
                nw = w;
                nh = w * (1008 / 1920);
            }
            nx = (w - nw) / 2;
            ny = (h - nh) / 2;

            //translate and scale the renderer
            this.width = Math.min(1280, nw);
            this.height = Math.min(672, nh);
            this.renderer.setSize(this.width, this.height); // Optimization: save VRAM by not making canvas too larger than 1280x672.

            $(this.renderer.domElement).css(
                {
                    //"position": "absolute",
                    "-webkit-transform": "translate(" + nx + "px," + ny + "px)",
                    "-moz-transform": "translate(" + nx + "px," + ny + "px)",
                    "transform": "translate(" + nx + "px," + ny + "px)",
                    "width": nw + 'px',
                    "height": nh + 'px'
                }
            );

            //re-render to prevent white screen on window scaling
            if (!this.initialised) return;
            this.renderer.render(this.scene, this.camera);
        },


        /*
         *
         * Render a scene's FBO to the global/dom rt
         *
         */
        renderToScreen: function (renderTarget, flipX, flipY) {

            if (!this.initialised) throw new Error('Trying to render before renderer was initialised.');

            //update main material. Apply an effect over everything.
            this.material.uniforms.tDiffuse.value = renderTarget;
            this.plane.scale.x = flipX ? -1 : 1;
            this.plane.scale.y = flipY ? -1 : 1;

            //update gui
            if (this.material.uniforms.sideFlarePosition) {
                var position = InputController.getInstance().getPositionRaw();

                var minPos = this.material.uniforms.sidesSize.value.x;
                var maxPos = 1.0 - this.material.uniforms.sidesSize.value.x;
                this.material.uniforms.sideFlarePosition.value.set(
                    Math.max(Math.min(position.x*0.5*this.plane.scale.x+0.5,maxPos),minPos),
                    Math.max(Math.min(position.y*0.5*this.plane.scale.y+0.5,maxPos),minPos));
                this.material.uniforms.sideFlareSize.value = RendererController.SIDE_FLARE_SIZE_MIN + position.z * (RendererController.SIDE_FLARE_SIZE_MAX - RendererController.SIDE_FLARE_SIZE_MIN);
            
                if (this.hitSide && !TrackingController.getInstance().isTouchingSide()) {
          
                    this.hitSide = false;
                    this.material.uniforms.sideFlareAlpha.value = RendererController.SIDE_FLARE_ALPHA_STANDARD;
           
                } else if (TrackingController.getInstance().isTouchingSide()) {

                    if (!this.hitSide) {this.hitSide = true; this.hitSideTime = Date.now();}
                    var hitSidePc = 1.0 - Math.min((Date.now() - this.hitSideTime) / RendererController.SIDE_FLARE_SIDE_DURATION, 1.0);
                    hitSidePc = Math.sin( hitSidePc * Math.PI * 0.5); //cosinus exp decrement
                    this.material.uniforms.sideFlareAlpha.value = hitSidePc * RendererController.SIDE_FLARE_ALPHA_INCREASE + RendererController.SIDE_FLARE_ALPHA_STANDARD;
                }

                if (InputController.getInstance().isUsingMouse() || !this.interactionEnabled) this.material.uniforms.sideFlareAlpha.value = 0.0; //~~TODO: switch shaders
            }

            //update noise
            if (this.noiseTextures) {
                this.currentNoiseTexture++;
                if (this.currentNoiseTexture >= this.noiseTextures.length) this.currentNoiseTexture = 0;
                this.material.uniforms.tNoise.value = this.noiseTextures[this.currentNoiseTexture];
                this.material.uniforms.randomOffset.value.set(Math.random(), Math.random());
                this.material.uniforms.noiseAlpha.value = this.noiseAlpha;
            }
            

            //update exposure
            var zValue = 1.0 - InputController.getInstance().getPositionDirectional().z;
            zValue = this.cmap(zValue,0.15,0.9,0.0,1.0);
            zValue = Math.pow(zValue,1.5);
            if (!this.interactionEnabled) zValue = 0.0;
            var flickeringValue = this.cmap(zValue,0.0,1.0,this.flickerFar,this.flickerNear);
            this.material.uniforms.exposure.value =
                1.0 +
                this.nearExposure * zValue +
                (Math.random()*2.0-1.0) * flickeringValue;

            //
            //
            //
            if (this.interactionEnabled) {

                this.material.uniforms.exposure.value +=
                //     InputController.getInstance().crazyMotion * this.crazyMotionExposure +
                  InputController.getInstance().crazyMotion * Math.random() * this.crazyMotionRandom;
                this.material.uniforms.saturation.value =
                    1.0 + InputController.getInstance().crazyMotion * 0.75;
            }
            
            //render the target RT to the main RT
            this.renderer.render(this.scene, this.camera);
        },


        //
        // Alternative to render-to-screen function for a sequence to render a material in full-resolution without a framebuffer
        // Only used by finale sequence
        //
        renderMaterialFullScreen: function(scene,camera) {
            this.renderer.render(scene, camera);
        },


        disablePhoneInteraction: function() {
            this.interactionEnabled = false;
        },

        enablePhoneInteraction: function() {
            this.interactionEnabled = true;
        },


        /*
         *
         * Remove, add the renderer to the dom
         *
         */
        add: function (container) {
            this.container = container; //ViewController.getInstance().getView('ExperienceView'); //.$container.find('.interactions');
            this.container.append(this.renderer.domElement);
            this.onResize();
            //this.container = container;
            //this.container.append(this.renderer.domElement);
            //this.onResize();
        },
        remove: function () {
            //this.container.remove(this.renderer.domElement);
            //this.container = null;
            return;
        }
    },

    _private: {
        cmap: function(value, istart, istop, ostart, ostop) {
            return Math.max(Math.min(ostart + (ostop - ostart) * ((value - istart) / (istop - istart)),ostop),ostart);
        }
    }

});
