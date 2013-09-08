/**
 * @author Édouard Lanctôt  < edouardlb@gmail.com >
 *
 */

var LanmeSequence = Sequence._extend({

    _public:  {

        DRAWING_EFFECT_SIZE: 0.25,

        //feedback
        allTextures: [],
        NUM_TEXTURES: 10,

        //drawing
        currentDrawingShader: 'drawingBlurDirection.frag',
        drawingMaterial: null,
        drawingFboPing: null,
        drawingFboPong: null,
        drawingIsPing: false,

        compTimeMaterial: null,
        compTimeFboPing: null,
        compTimeFboPong: null,
        compTimeIsPing: false,

        currentCompositeShader: 'chromadiffDirectionStatic.frag',
        finalCompositeMaterial: null,
        finalCompositeFbo: null,
        currentPassShown: null,
        firstFrame: true,



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

            console.log('initializing lanme');

        
            //
            // Localise some variables / references
            //
            var videoWidth = this.videoTexture.width,
                videoHeight = this.videoTexture.height,
                renderer = RendererController.getInstance().getRenderer();


            //
            // Textures feedback saving
            //
            var feedbackMaterial = new THREE.MeshBasicMaterial( {
                map:this.videoTexture.texture,
                side:THREE.DoubleSide,
                transparent:false,
                depthTest:false });
            for (var i=0; i<this.NUM_TEXTURES; i++) {
                this.allTextures[i] = new FramebufferWrapper(videoWidth,videoHeight,{
                    minFilter:THREE.LinearFilter,
                    magFilter:THREE.LinearFilter,
                    format:THREE.RGBFormat,
                    type:THREE.UnsignedByteType,
                    renderMaterial:feedbackMaterial,
                    depthBuffer:false,
                    stencilBuffer:false,
                    premultiplyAlpha:true,
                    generateMipmaps:false,
                    renderer:renderer
                });
            };

            //
            // Drawing brush (with time)
            //
            this.drawingMaterial = this.reloadShader(this.currentDrawingShader);
            this.drawingFboPing = new FramebufferWrapper(videoWidth*this.DRAWING_EFFECT_SIZE,videoHeight*this.DRAWING_EFFECT_SIZE,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.drawingMaterial,
                depthBuffer:true,
                stencilBuffer:false,
                premultiplyAlpha:true,
                generateMipmaps:false,
                renderer:renderer
            });
            this.drawingFboPong = new FramebufferWrapper(videoWidth*this.DRAWING_EFFECT_SIZE,videoHeight*this.DRAWING_EFFECT_SIZE,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.drawingMaterial,
                depthBuffer:true,
                stencilBuffer:false,
                premultiplyAlpha:true,
                generateMipmaps:false,
                renderer:renderer
            });


            //
            //
            // The Time composite passes
            // Merge multiple frames together
            //
            //
            this.compTimeMaterial = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/lanme/EdgeBlurCompositeTime.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/lanme/EdgeBlurCompositeTime.frag'),
                attributes:{},
                uniforms: {
                    'timeGradient':{type:'t',value:this.drawingFboPong.texture},
                    'tAccum':{type:'t',value: null},
                    'tFrame':{type:'t',value: this.allTextures[0].texture},
                    'tFrameNext':{type:'t',value: this.allTextures[0].texture},
                    "frameDiff":{type:'f',value: 1 / this.NUM_TEXTURES},
                    "frameMin":{type:'f',value: 0.0},
                    "frameMax":{type:'f',value: 1.0}
                },
                //equation/parameters to allow for RGBA encoding
                depthTest:false,
                transparent:false,
                blending:THREE.CustomBlending,
                blendEquation:THREE.AddEquation,
                blendSrc:THREE.OneFactor,
                blendDst:THREE.ZeroFactor,
                side:THREE.DoubleSide
            });
            this.compTimeFboPing = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.compTimeMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });
            this.compTimeFboPong = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.compTimeMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });



            //
            // Composite an effect over the timeComposite by using the drawing brush info
            //
            this.finalCompositeMaterial = this.reloadShader(this.currentCompositeShader);
            this.finalCompositeFbo = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.finalCompositeMaterial,
                depthBuffer:true,
                stencilBuffer:false,
                premultiplyAlpha:true,
                generateMipmaps:false,
                renderer:renderer
            });

        },

        begin: function () {

            Sequence.prototype.begin.call(this);

            console.log('begin lanme');
            
            for (var i=0; i<this.NUM_TEXTURES; i++) {
                this.allTextures[i].alloc();
            }
            this.drawingFboPing.alloc();
            this.drawingFboPong.alloc();
            this.compTimeFboPing.alloc();
            this.compTimeFboPong.alloc();
            this.finalCompositeFbo.alloc();
            this.firstFrame = true;
            if (this.drawingMaterial.uniforms.tDiffuse) this.drawingMaterial.uniforms.tDiffuse.value = this.videoTexture.texture;

        },

        end: function () {

            Sequence.prototype.end.call(this);
            for (var i=0; i<this.NUM_TEXTURES; i++) {
                this.allTextures[i].dispose();
            }
            this.drawingFboPing.dispose();
            this.drawingFboPong.dispose();
            this.compTimeFboPing.dispose();
            this.compTimeFboPong.dispose();
            this.finalCompositeFbo.dispose();
            this.firstFrame = true;

        },

        changeVideoQuality: function(nw, nh) {
            if (this.drawingMaterial.uniforms.tDiffuse) this.drawingMaterial.uniforms.tDiffuse.value = this.videoTexture.texture;
            for (var i=0; i<this.NUM_TEXTURES; i++) {
                this.allTextures[i].renderPlane.material.map = this.videoTexture.texture;
                this.allTextures[i].resizeTextureAndCopy(nw, nh);
            }
        },

        changeRenderQuality: function (nw, nh) {
            var renderer = RendererController.getInstance().getRenderer();

            this.renderWidth = nw;
            this.renderHeight = nh;

            //resize fbo
            this.drawingFboPing.resizeTextureAndCopy(nw*this.DRAWING_EFFECT_SIZE,nh*this.DRAWING_EFFECT_SIZE);
            this.drawingFboPong.resizeTextureAndCopy(nw*this.DRAWING_EFFECT_SIZE,nh*this.DRAWING_EFFECT_SIZE);
            this.compTimeFboPing.resizeTextureAndCopy(nw,nh);
            this.compTimeFboPong.resizeTextureAndCopy(nw,nh);
            this.finalCompositeFbo.resizeTexture(nw,nh);

            //update uniforms
            //uniforms are updated every frame in this case so not much to do
            //this.compTimeMaterial.uniforms.offset.value.set(1.33/nw*this.DRAWING_EFFECT_SIZE, 1.33/nh*this.DRAWING_EFFECT_SIZE)
           // if (this.drawingMaterial.uniforms.offset) this.drawingMaterial.uniforms.offset.value.set(options.blurSize/nw*this.DRAWING_EFFECT_SIZE,options.blurSize/nh*this.DRAWING_EFFECT_SIZE);

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
            var finalPhonePosition = InputController.getInstance().getPositionDirectional(),
                videoWidth = this.videoTexture.width,
                videoHeight = this.videoTexture.height,
                self = this;


            //
            // reload shaders
            //
            /*if (options.shaderBrush !== this.currentDrawingShader) {
                this.currentDrawingShader = options.shaderBrush;
                this.drawingMaterial = this.reloadShader(this.currentDrawingShader);
                this.drawingFboPing.renderPlane.material = this.drawingMaterial;
                this.drawingFboPong.renderPlane.material = this.drawingMaterial;
            }
            */
            if (options.shader !== this.currentCompositeShader) {
                this.currentCompositeShader = options.shader;

                $.get('shaders/lanme/'+this.currentCompositeShader).done(function (data) {
                    self.finalCompositeMaterial = self.reloadShader(self.currentCompositeShader,data);
                    self.finalCompositeFbo.renderPlane.material = self.finalCompositeMaterial;
                }).error(function () {
                    alert('Shader Loading Error: ' + self.currentCompositeShader);
                });
            }

            //
            // Update the various materials
            //
            if (this.drawingMaterial.uniforms.center) this.drawingMaterial.uniforms.center.value.set(finalPhonePosition.x*0.75+0.5,finalPhonePosition.y*0.5+0.5);
            if (this.drawingMaterial.uniforms.offset) this.drawingMaterial.uniforms.offset.value.set(options.blurSize/videoWidth*this.DRAWING_EFFECT_SIZE,options.blurSize/videoHeight*this.DRAWING_EFFECT_SIZE);
            if (this.drawingMaterial.uniforms.timep) this.drawingMaterial.uniforms.timep.value = performance.now()*0.01;
            if (this.drawingMaterial.uniforms.accumulationpc) {this.drawingMaterial.uniforms.accumulationpc.value = options.accumulation;}
            if (this.drawingMaterial.uniforms.fade) this.drawingMaterial.uniforms.fade.value = options.fade;

            if (this.finalCompositeMaterial.uniforms.center) this.finalCompositeMaterial.uniforms.center.value.set(finalPhonePosition.x*0.75+0.5,finalPhonePosition.y*0.5+0.5);
            if (this.finalCompositeMaterial.uniforms.offset) this.finalCompositeMaterial.uniforms.offset.value.set(options.blurSize/videoWidth*this.DRAWING_EFFECT_SIZE,options.blurSize/videoHeight*this.DRAWING_EFFECT_SIZE);
            if (this.finalCompositeMaterial.uniforms.timep) this.finalCompositeMaterial.uniforms.timep.value = performance.now()*0.01;
            if (this.finalCompositeMaterial.uniforms.accumulationpc) {this.finalCompositeMaterial.uniforms.accumulationpc.value = options.accumulation;}
            if (this.finalCompositeMaterial.uniforms.drawingSize) this.finalCompositeMaterial.uniforms.drawingSize.value = options.drawingSize;
            if (this.finalCompositeMaterial.uniforms.fade) this.finalCompositeMaterial.uniforms.fade.value = 1.0-options.fade;
            if (this.finalCompositeMaterial.uniforms.randomUV) this.finalCompositeMaterial.uniforms.randomUV.value.set(Math.random(),Math.random());


            var zValue = this.cmap(finalPhonePosition.z,0.1,0.9,0.0,1.0);

            var effectAlpha = this.map(zValue,0.0,1.0,options.effectAlphaNear,options.effectAlphaFar);

            this.finalCompositeMaterial.uniforms.effectAlpha.value = effectAlpha;
            
            var drawingSize = (options.drawingSizeFar-options.drawingSizeNear) * zValue + options.drawingSizeNear;
            drawingSize = drawingSize*(1.0-options.pulse) + drawingSize*Math.random()*(options.pulse);
            this.finalCompositeMaterial.uniforms.drawingSize.value = drawingSize;
            this.drawingMaterial.uniforms.drawingSize.value = drawingSize;

            this.currentPassShown = options.pass;
        },

        /**
         *
         * Renders three.js scene in this sequence's Render Target
         *
         */
        render: function () {
            RendererController.getInstance().getRenderer().setClearColor(new THREE.Color(0));
            RendererController.getInstance().getRenderer().clear();
          

            //
            // Accumulate textures
            //
            if (this.videoTexture.wasUpdatedThisframe) {
                this.allTextures.unshift(this.allTextures.pop());
                this.allTextures[0].render();

                //first frame -> render all textures to prevent black framebuffers
                if (this.firstFrame) {
                    this.firstFrame = false;
                    for (var i=0; i<this.allTextures.length; i++) {
                        this.allTextures.unshift(this.allTextures.pop());
                        this.allTextures[0].render();
                    }
                }
            }   
            
            //
            // draw accumulation
            //
            var drawingFbo = (this.drawingIsPing) ? this.drawingFboPing : this.drawingFboPong;
            this.drawingMaterial.uniforms.tAccum.value = (this.drawingIsPing) ? this.drawingFboPong.texture : this.drawingFboPing.texture;
            drawingFbo.render();
            this.drawingIsPing = !this.drawingIsPing;
                

            //
            // Time feedback composite
            //
            var timeFbo;
            for (var i=0; i<this.NUM_TEXTURES; i++) {
                timeFbo = (this.compTimeIsPing) ? this.compTimeFboPing : this.compTimeFboPong;
                this.compTimeMaterial.uniforms.tAccum.value = (this.compTimeIsPing) ? this.compTimeFboPong.texture : this.compTimeFboPing.texture;
                this.compTimeMaterial.uniforms.timeGradient.value = drawingFbo.texture;
                this.compTimeMaterial.uniforms.tFrame.value = this.allTextures[(this.NUM_TEXTURES-i-1)].texture;

                if (this.NUM_TEXTURES-i-2>=0)
                    this.compTimeMaterial.uniforms.tFrameNext.value = this.allTextures[this.NUM_TEXTURES-i-2].texture; //NUM_TEXTURES-i-2
                else
                    this.compTimeMaterial.uniforms.tFrameNext.value = this.allTextures[0].texture;

                this.compTimeMaterial.uniforms.frameMin.value = i/this.NUM_TEXTURES;
                this.compTimeMaterial.uniforms.frameMax.value = (i+1)/this.NUM_TEXTURES;
                timeFbo.render();
                this.compTimeIsPing = !this.compTimeIsPing;
            }

            //
            // final composite
            //
            this.finalCompositeMaterial.uniforms.tDiffuse.value = timeFbo.texture;
            if (this.finalCompositeMaterial.uniforms.tDrawing) this.finalCompositeMaterial.uniforms.tDrawing.value = drawingFbo.texture;
            this.finalCompositeFbo.render();


            //render to screen
            var passToShow = {'drawing':drawingFbo,'timeComposite':timeFbo,'finalComposite':this.finalCompositeFbo}[this.currentPassShown].texture;
            RendererController.getInstance().renderToScreen(passToShow,false,false);
        }
    },


    _private: {

        map: function(value, istart, istop, ostart, ostop) {
         return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
        },
        cmap: function(value, istart, istop, ostart, ostop) {
         return Math.max(Math.min(ostart + (ostop - ostart) * ((value - istart) / (istop - istart)),ostop),ostart);
        },

        reloadShader: function(shaderName,data) {
            var material,
                videoWidth = this.videoTexture.width,
                videoHeight = this.videoTexture.height;

            switch(shaderName) {
                case 'pass.frag':
                    material = new THREE.ShaderMaterial( {
                        vertexShader:   AssetsController.getInstance().getFile('shaders/common/vertex.vert'),
                        fragmentShader: AssetsController.getInstance().getFile('shaders/common/pass.frag'),
                        attributes:{},
                        uniforms: {
                            'tDiffuse':{type:'t',value:null}
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
                    break;


                case 'vibranceNoise.frag':
                case 'vibrance.frag':
                    data = data || AssetsController.getInstance().getFile('shaders/lanme/'+shaderName);
                    material = new THREE.ShaderMaterial( {
                        vertexShader:   AssetsController.getInstance().getFile('shaders/common/vertex.vert'),
                        fragmentShader: data,
                        attributes:{},
                        uniforms: {
                            'tDiffuse':{type:'t',value:null},
                            'tDrawing':{type:'t',value:null},
                            'center':{type:'v2',value:new THREE.Vector2( 0.5, 0.5 )},
                            'drawingSize':{type:'f',value:0.175},
                            'effectAlpha':{type:'f',value:1.0},
                            'timep':{type:'f',value:0.00},
                            'ratio':{type:'v2',value:new THREE.Vector2( videoWidth/videoHeight,1.0 )},
                            'offset':{type:'v2',value:new THREE.Vector2( 1.33/videoWidth*this.DRAWING_EFFECT_SIZE, 1.33/videoHeight*this.DRAWING_EFFECT_SIZE )}
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
                    break;


                case 'drawingSine.frag':
                case 'drawingBlur.frag':
                case 'drawingBlurDirection.frag':
                    material = new THREE.ShaderMaterial( {
                        vertexShader:   AssetsController.getInstance().getFile('shaders/lanme/drawingBlurDirection.vert'),
                        fragmentShader: AssetsController.getInstance().getFile('shaders/lanme/'+shaderName),
                        attributes:{},
                        uniforms: {
                            'tDiffuse':{type:'t',value:this.videoTexture.texture},
                            'tAccum':{type:'t',value:null},
                            'offset':{type:'v2',value:new THREE.Vector2( 1.33/videoWidth*this.DRAWING_EFFECT_SIZE, 1.33/videoHeight*this.DRAWING_EFFECT_SIZE )},
                            'center':{type:'v2',value:new THREE.Vector2( 0.5, 0.5 )},
                            'drawingSize':{type:'f',value:0.175},
                            'accumulationpc':{type:'f',value:0.05},
                            'timep':{type:'f',value:0.00},
                            'ratio':{type:'v2',value:new THREE.Vector2( videoWidth/videoHeight,1.0 )},
                            'fade':{type:'f',value:0.0}
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
                    break;


                case 'difference.frag':
                    data = data || AssetsController.getInstance().getFile('shaders/lanme/'+shaderName);
                    material = new THREE.ShaderMaterial( {
                        vertexShader:   AssetsController.getInstance().getFile('shaders/common/vertex.vert'),
                        fragmentShader: data,
                        attributes:{},
                        uniforms: {
                            'tDiffuse':{type:'t', value: null},
                            'tDrawing':{type:'t', value: null},
                            'tVideo': {type:'t', value: this.videoTexture.texture},
                            'center':{type:'v2', value: new THREE.Vector2( 0.5, 0.5 )},
                            'drawingSize':{type:'f', value: 0.175},
                            'effectAlpha':{type:'f', value: 1.0},
                            "randomUV": {type:'v2', value: new THREE.Vector2()},
                            'timep':{type:'f', value: 0.00},
                            'ratio':{type:'v2', value: new THREE.Vector2( videoWidth/videoHeight,1.0 )},
                            'offset':{type:'v2', value: new THREE.Vector2( 1.33/videoWidth*this.DRAWING_EFFECT_SIZE, 1.33/videoHeight*this.DRAWING_EFFECT_SIZE )}
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
                    break;

                default:
                    data = data || AssetsController.getInstance().getFile('shaders/lanme/'+shaderName);
                    material = new THREE.ShaderMaterial( {
                        vertexShader:   AssetsController.getInstance().getFile('shaders/common/vertex.vert'),
                        fragmentShader: data,
                        attributes:{},
                        uniforms: {
                            'tDiffuse':{type:'t', value: null},
                            'tDrawing':{type:'t', value: null},
                            'center':{type:'v2', value: new THREE.Vector2( 0.5, 0.5 )},
                            'drawingSize':{type:'f', value: 0.175},
                            'effectAlpha':{type:'f', value: 1.0},
                            "randomUV": {type:'v2', value: new THREE.Vector2()},
                            'timep':{type:'f', value: 0.00},
                            'ratio':{type:'v2', value: new THREE.Vector2( videoWidth/videoHeight,1.0 )},
                            'offset':{type:'v2', value: new THREE.Vector2( 1.33/videoWidth*this.DRAWING_EFFECT_SIZE, 1.33/videoHeight*this.DRAWING_EFFECT_SIZE )}
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
                    break;
            }
            return material;
        }
    }

});
