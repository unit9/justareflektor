/**
 * @author Édouard Lanctôt  < edouardlb@gmail.com >
 *
 */

var OpticalFeedbackSequence = Sequence._extend({

    _public:  {

        //
        // Planes feedback scene
        //
        scene: null,
        windowCamera: null,
        planesFbo: null,
        allTextures: [],
        allPlanes: [],
        numPlanes: 10,
        MAX_TEXTURES: 35,
        MAX_TEXTURES_SHARP: 5,  //only 3 first frames are full res

        //
        // Render passes
        //
        alphaExtractionMaterial: null,
        alphaExtractionFbo: null,
        noAlphaMaterial: null,
        precompMaterial: null,
        feedbackSpeed: 0.5,
        scalingmax: 0.5,
        firstFrame: true,


        //deformmask
        lastMaskFrameUpdate: 0,
        currentMask: 0,
        maskRate: 1000/24,
        deformTextures: [],
        deformImagesPaths: [
            'media/images/encre/texture_encre0.jpg',
            'media/images/encre/texture_encre1.jpg',
            'media/images/encre/texture_encre2.jpg',
            //'media/images/encre/texture_encre3.jpg',
            'media/images/encre/texture_encre4.jpg',
            'media/images/encre/texture_encre5.jpg',
            'media/images/encre/texture_encre6.jpg',
            'media/images/encre/texture_encre7.jpg',
            'media/images/encre/texture_encre8.jpg'
        ],

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

            console.log('init opticalfeedback');


            //
            // Localise some variables / references
            //
            var videoWidth = this.videoTexture.width,
                videoHeight = this.videoTexture.height,
                renderer = RendererController.getInstance().getRenderer();


            //
            // the deform textures
            //
            for (var i = 0; i < this.deformImagesPaths.length; i++) {
                this.deformTextures[i] = AssetsController.getInstance().getFile(this.deformImagesPaths[i]);
                this.deformTextures[i].minFilter = THREE.LinearMipMapLinearFilter;
                this.deformTextures[i].generateMipmaps = true;
                this.deformTextures[i].needsUpdate = true;
            }



            //the final rendering scene/camera/fbo
            this.scene = new THREE.Scene();
            this.camera = new THREE.OrthographicCamera( -0.5, 0.5, -0.5, 0.5, -10000, 10000 );
            //this.windowCamera = new THREE.PerspectiveCamera( 45, videoWidth/videoHeight, 1, 10000 )
            //this.windowCamera.position.z = this.getCameraZ(this.windowCamera,videoHeight);
            this.windowCamera = new THREE.OrthographicCamera( -videoWidth/2,videoWidth/2,videoHeight/2,-videoHeight/2,-10000,10000);
            this.windowCamera.lookAt(new THREE.Vector3());

            this.planesFbo = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                camera:this.windowCamera,
                scene:new THREE.Scene(),
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });


            //------------
            //
            //  Create the Alpha Shader
            //
            //------------
            this.alphaExtractionMaterial = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/opticalfeedback/alphaExtraction.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/opticalfeedback/alphaExtraction.frag'),
                attributes:{},
                uniforms: {
                    'texture':{type:'t',value:this.videoTexture.texture},
                    'alphaRatio':{type:'f',value:0.25},
                    'pixelFix':{type:'f',value:0.0/videoWidth}
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
            this.alphaExtractionFbo = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.alphaExtractionMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });


            //------------
            //
            //  Create the Alpha Shader
            //
            //------------
            this.noAlphaMaterial = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/common/vertexinv.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/opticalfeedback/diffuseExtraction.frag'),
                attributes:{},
                uniforms: {
                    'texture':{type:'t',value:this.alphaExtractionFbo.texture}
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

            //
            // Pre-comp material
            // 
            this.precompMaterial = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/common/vertex.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/opticalfeedback/chromaticdiff.frag'),
                attributes:{},
                uniforms: {
                    'tVideo':{type:'t',value:this.alphaExtractionFbo.texture},
                    'tMask':{type:'t',value:this.deformTextures[0]},
                    'offset':{type:'v2',value:new THREE.Vector2(1.0/videoWidth,1.0/videoHeight)},
                    'center':{type:'v2',value:new THREE.Vector2( 0.5, 0.5 )},
                    'alpha':{type:'f',value:0.1},
                    'time':{type:'f',value:0.00}
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
            // Pre-comp material2
            // 
            this.precompMaterial2 = new THREE.MeshBasicMaterial( {
                map: this.allTextures[0],
                depthTest:false,
                transparent:true,
                blending:THREE.CustomBlending,
                blendEquation:THREE.AddEquation,
                blendSrc:THREE.OneFactor,
                blendDst:THREE.ZeroFactor,
                side:THREE.DoubleSide
            } );

            //
            // Create the texture history feedback
            //
            for (var i=0; i<this.MAX_TEXTURES; i++) {

                var ws = (i < this.MAX_TEXTURES_SHARP) ? 1.0 : 0.25;
                var mat = (i < this.MAX_TEXTURES_SHARP) ? this.precompMaterial : this.precompMaterial2;
                this.allTextures[i] = new FramebufferWrapper(Math.floor(videoWidth*ws),Math.floor(videoHeight*ws),{
                    minFilter:THREE.LinearFilter,
                    magFilter:THREE.LinearFilter,
                    format:THREE.RGBAFormat,
                    type:THREE.UnsignedByteType,
                    renderMaterial:mat, //this.precompMaterial,
                    depthBuffer:false,
                    stencilBuffer:false,
                    premultiplyAlpha:false,
                    generateMipmaps:false,
                    renderer:renderer
                });
                if (i>=this.MAX_TEXTURES_SHARP) this.allTextures[i].renderPlane.scale.y = -1;

            }

            //
            // Create the planes
            //
            this.createPlanes(this.numPlanes);

        },

        begin: function () {

            Sequence.prototype.begin.call(this);

            console.log('begin opticalfeedback');

            this.alphaExtractionFbo.alloc();
            for (var i=0; i<this.MAX_TEXTURES; i++) {
                this.allTextures[i].alloc()
            }
            this.planesFbo.alloc();
            this.precompMaterial.uniforms.tVideo.value = this.alphaExtractionFbo.texture;
            this.alphaExtractionMaterial.uniforms.texture.value = this.videoTexture.texture;

            this.firstFrame = true;

        },

        end: function () {

            Sequence.prototype.end.call(this);
            for (var i=0; i<this.MAX_TEXTURES; i++) {
                this.allTextures[i].dispose()
            }
            this.alphaExtractionFbo.dispose();
            this.planesFbo.dispose();

        },

        changeVideoQuality: function(nw, nh) {

            this.alphaExtractionFbo.resizeTexture(nw,nh);
            this.alphaExtractionMaterial.uniforms.texture.value = this.videoTexture.texture;
            this.precompMaterial.uniforms.tVideo.value = this.alphaExtractionFbo.texture;
            this.precompMaterial.uniforms.offset.value.set(1.0 / nw, 1.0 / nh);

            for (var i=this.MAX_TEXTURES_SHARP; i<this.MAX_TEXTURES; i++) {
                this.allTextures[i].resizeTextureAndCopy(nw,nh);
            }
        },

        changeRenderQuality: function (nw, nh) {
            
            var renderer = RendererController.getInstance().getRenderer();

            this.renderWidth = nw;
            this.renderHeight = nh;

            for (var i=this.MAX_TEXTURES_SHARP; i<this.MAX_TEXTURES; i++) {
                var ws = 0.25
                this.allTextures[i].resizeTextureAndCopy(Math.floor(nw*ws), Math.floor(nh*ws));
            }

            this.planesFbo.resizeTexture(nw,nh);
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
                rx = InputController.getInstance().getRotationX();
            rx = 1.0-(rx*rx);

            var rdiff = 1.0; //1.1-Math.min(new THREE.Vector2(finalPhonePosition.x,finalPhonePosition.y*0.75).length(),1.1);


            //
            // Update options
            // 
            if (this.numPlanes!==Math.floor(Math.max(options.numPlanesClose,options.numPlanesFar))) this.createPlanes(Math.floor(Math.max(options.numPlanesClose,options.numPlanesFar)));


            //udpate mask image
            if (Date.now() - this.lastMaskFrameUpdate >= this.maskRate) {
                this.lastMaskFrameUpdate = Date.now();
                this.currentMask++;
                if (this.currentMask>=this.deformTextures.length) this.currentMask = 0;
                this.precompMaterial.uniforms.tMask.value = this.deformTextures[this.currentMask];
            }

            //update options
            this.precompMaterial.uniforms.alpha.value = options.effectAlpha;
            this.precompMaterial.uniforms.center.value.set(finalPhonePosition.x*-1.0+0.5,finalPhonePosition.y*-1.0+0.5);
            
            this.precompMaterial.uniforms.alpha.value = (0.25 + (options.effectAlpha-0.25)*(1.0-finalPhonePosition.z) ) * (1.0-options.fade);



            this.feedbackSpeed = this.cmap(1.0-finalPhonePosition.z,0.0,1.0, options.feedbackSpeedNear, options.feedbackSpeedFar);

            //
            // Update snake chain + distance to camera
            //
            var allPlanes = this.allPlanes,
                videoWidth = 1280,
                videoHeight = 672;


            allPlanes[allPlanes.length-1].position.set(
                    finalPhonePosition.x*options.rangeX,
                    Math.min(finalPhonePosition.y,1)*options.rangeY*-1, //(Math.max(finalPhonePosition.y,-1)*-0.5)*options.rangeY, // - 672/2,
                    0
            );



            allPlanes[allPlanes.length-1].position.z = (allPlanes.length-1);
            for (var i=allPlanes.length-2; i>0; i--) {
                var fpc = (i-1)/(allPlanes.length-1);
                fpc = fpc; //

                allPlanes[i].position.set(0,0,0).lerp(allPlanes[allPlanes.length-1].position,fpc);

                    //allPlanes[i+1].position,1.0).lerp(new THREE.Vector3(),fpc); //
                allPlanes[i].position.z = i; //i*zIncr;
            }

            //
            // Update number of planes shown
            //
            var numPlanesShown = Math.floor(this.cmap(finalPhonePosition.z,0.0,1.0,options.numPlanesClose,options.numPlanesFar));

            //Math.floor(this.cmap(rdiff*(1.0-options.fade),0.25,0.8,1,options.numPlanes));
            for (var i=0; i<allPlanes.length; i++) {
                var plane = allPlanes[i];
                if (!plane.visible && i < numPlanesShown) plane.visible = true;
                if (plane.visible && i > numPlanesShown) plane.visible = false;
                plane.position.z = i; //*this.cmap(finalPhonePosition.z,0.2,0.75,0.0,options.zSpacing);
                //if (!allPlanes[i].parent && i<=numPlanesShown) this.planesFbo.scene.add(allPlanes[i]);
                //else if (allPlanes[i].parent && i>numPlanesShown) this.planesFbo.scene.remove(allPlanes[i]);
            }

            //
            // Update planes material
            //
            var opmax = this.cmap(finalPhonePosition.z, 0.0, 1.0, options.opacityNear, options.opacityFar);
            this.scalingmax = this.scalingmax * 0.8 + 0.2 * this.cmap(1.0-finalPhonePosition.z, 0.0, 1.0, options.scalingFar, options.scalingNear);

            for (var i=1; i<allPlanes.length; i++) {
               
                var dstToCenter = new THREE.Vector2(finalPhonePosition.x,finalPhonePosition.y*0.5).length();
                dstToCenter = Math.min(dstToCenter,0.75);
                op = this.map(dstToCenter,0.75,0.0,opmax,options.centerOpacityDec*opmax);
                op *= (1.0-options.fade);
                op = op * (1.0 - options.opacityDiff *((i-1)/(allPlanes.length-2)));
                op *= rdiff;

                allPlanes[i].material.opacity = op;
                allPlanes[i].material.blending = (options.blending==='alpha') ? THREE.NormalBlending : THREE.AdditiveBlending;
                //allPlanes[i].scale.set(options.scaling,options.scaling,options.scaling);

                var fpc = i/(allPlanes.length-1);
                var scaling = 1.0 + (fpc*fpc) * this.scalingmax;
                allPlanes[i].scale.set(scaling,scaling,scaling);
            }
            allPlanes[0].material.opacity = 1.0;



            //snap positions
            for (var i=0; i<allPlanes.length; i++) {
                allPlanes[i].position.y = Math.min(allPlanes[i].position.y,(this.videoTexture.height/2 * allPlanes[i].scale.y)-this.videoTexture.height/2);
            }
            
        },

        /**
         *
         * Renders three.js scene in this sequence's Render Target
         *
         */
        render: function () {

            if (this.firstFrame) {
                RendererController.getInstance().getRenderer().setClearColor(new THREE.Color(0));
                RendererController.getInstance().getRenderer().clear();
            } else {
                RendererController.getInstance().getRenderer().setClearColor(new THREE.Color(0));
                RendererController.getInstance().getRenderer().clear();
            }
                //  
                // Update the feedback line
                //
                if (this.videoTexture.wasUpdatedThisframe) {
                    this.alphaExtractionFbo.render();
                    var t = this.allTextures.splice(this.MAX_TEXTURES_SHARP-1,1)[0];
                    var ts = this.allTextures.pop();
                    ts.renderPlane.material.map = t.texture;
                    ts.render();
                    t.render();
                    this.allTextures.unshift(t);
                    this.allTextures.splice(this.MAX_TEXTURES_SHARP,0,ts);
                }

                //update planes material
                for (var i=0; i<this.allPlanes.length; i++) {
                    this.allPlanes[i].material.map = this.allTextures[Math.floor(i*this.feedbackSpeed)+1].texture;
                }
                this.allPlanes[0].material.map = this.allTextures[0].texture; //this.videoTexture.texture;
                this.allPlanes[0].material.uniforms.texture.value = this.allTextures[0].texture;
                this.planesFbo.render();


                //render to screen
                if (!this.firstFrame) RendererController.getInstance().renderToScreen(this.planesFbo.texture,false,true);
                this.firstFrame = false;
        }
    },


    _private: {

        createPlanes: function(numPlanes) {
            //
            // Remove existing planes
            //
            if (this.allPlanes) {
                for (var i=0; i<this.allPlanes.length; i++) {
                    this.planesFbo.scene.remove(this.allPlanes[i]);
                }
            }
            this.allPlanes = [];


            //
            // Create max number of planes
            //
            this.numPlanes = numPlanes;
            for (var i=0; i<numPlanes; i++) {
                this.allPlanes[i] = new THREE.Mesh(
                    new THREE.PlaneGeometry( this.videoTexture.width, this.videoTexture.height, 1, 1 ),
                    new THREE.MeshBasicMaterial( {
                        map:this.allTextures[0].texture,
                        side:THREE.DoubleSide,
                        transparent:true,
                        depthTest:true,
                        depthWrite:true,
                        blending:THREE.AdditiveBlending
                    } )
                );
                //this.allPlanes[i].geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,this.videoTexture.height/2,0))
                this.allPlanes[i].position.z = 0;
                this.planesFbo.scene.add(this.allPlanes[i]);
            }
            this.allPlanes[0].material = this.noAlphaMaterial;
            this.allPlanes[1].material = this.noAlphaMaterial;
        },

        getCameraZ: function(camera,videoHeight) {
            return videoHeight / (2 * Math.tan(camera.fov / 2 * (Math.PI / 180)));
        },
        map: function(value, istart, istop, ostart, ostop) {
         return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
        },
        cmap: function(value, istart, istop, ostart, ostop) {
         return Math.max(Math.min(ostart + (ostop - ostart) * ((value - istart) / (istop - istart)),ostop),ostart);
        }
    }

});
