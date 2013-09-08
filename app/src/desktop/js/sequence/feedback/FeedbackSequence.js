/**
 * @author Édouard Lanctôt  < edouardlb@gmail.com >
 *
 */
var FeedbackSequence = Sequence._extend({

    _public:  {

        //some constants
        MAX_TEXTURES: 35,
        //MAX_TEXTURES_LARGE: 5,
        //MAX_TEXTURES_SMALL: 40,
        NUM_PLANES: -1,
        PLANE_DEPTH: -800,
        PLANE_OFFSET: -2,

        //the planes scene
        sceneFbo: null,
        scene: null,
        camera: null,

        //the planes and feedbacl
        isBlackAndWhite: false,
        blackAndWhiteMaterial: null,
        colorMaterial: null,
        allPlanes: [],
        allTextures: [],
        currentFrameSkip: 0,

        //accumulation shader
        useAccumulation: false,
        accumMaterial: null,
        accumFboPing: null,
        accumFboPong: null,
        accumIsPing: false,

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

            console.log('initializing feedback');

            //
            // Localise some variables / references
            //
            var videoWidth = this.videoTexture.width,
                videoHeight = this.videoTexture.height,
                renderer = RendererController.getInstance().getRenderer();


            //the 2d video scene
            this.scene = new THREE.Scene();
            this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, -10, 10 );
            var sceneCamera = new THREE.PerspectiveCamera( 55, videoWidth/videoHeight, 1,10000 );
            sceneCamera.position.set(0,0,1);
            sceneCamera.lookAt(new THREE.Vector3());
            this.sceneFbo = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBFormat,
                type:THREE.UnsignedByteType,
                camera:sceneCamera,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });


            //
            // planes rendering material
            //
            this.blackAndWhiteMaterial  = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/common/vertexinv.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/feedback/blackAndWhite.frag'),
                attributes:{},
                uniforms: {
                    'tDiffuse':{type:'t',value:this.videoTexture.texture},
                    'tColor':{type:'c',value:new THREE.Color(0xffffff)}
                },
                side:THREE.DoubleSide
            });
            this.colorMaterial = new THREE.MeshBasicMaterial( {
                color:0xffffff,
                map:this.videoTexture.texture,
                opacity:0.5,
                side:THREE.DoubleSide
            });


            //
            // Create the textures history feedback
            //
            for (var i=0; i<this.MAX_TEXTURES; i++) {
                var bw = this.blackAndWhiteMaterial;
                //this.allTextures[i] = new FramebufferWrapper(videoWidth * (i<this.MAX_TEXTURES_LARGE ? 1.0 : 0.25),videoHeight * (i<this.MAX_TEXTURES_LARGE ? 1.0 : 0.25),{
                var wsize = (i%3==0) ? 0.25 : (i%2==0 ? 1.0:0.5)
                this.allTextures[i] = new FramebufferWrapper(videoWidth * wsize, videoHeight * wsize ,{
                    minFilter:THREE.LinearFilter,
                    magFilter:THREE.LinearFilter,
                    format:THREE.RGBFormat,
                    type:THREE.UnsignedByteType,
                    renderMaterial:bw,
                    usePerspectiveCamera:false,
                    depthBuffer:false,
                    stencilBuffer:false,
                    premultiplyAlpha:false,
                    generateMipmaps:false,
                    renderer:renderer
                });
                //if (i>=this.MAX_TEXTURES_LARGE)  this.allTextures[i].renderPlane.scale.y = -1;
                this.allTextures[i].wsize = wsize;
                this.allTextures[i].bwMaterial = bw;
                this.allTextures[i].colorMaterial = this.colorMaterial.clone();
                this.allTextures[i].renderPlane.material = this.allTextures[i].colorMaterial;

                this.allTextures[i].currentFrame =i;
            }


            //
            // Accumulation blur shader (not used)
            //
            this.accumMaterial = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/common/vertex.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/feedback/linesBlurAccumulation.frag'),
                attributes:{},
                uniforms: {
                    'videoTexture':{type:'t',value:this.sceneFbo.texture},
                    'texture':{type:'t',value:null},

                    'offset':{type:'v2',value:new THREE.Vector2(1.0/videoWidth,1.0/videoHeight)},
                    'blurA':{type:'f',value:0.25},
                    'blurB':{type:'f',value:0.25},
                    'blurC':{type:'f',value:0.25},
                    'blurD':{type:'f',value:0.25},
                    'off':{type:'f',value:-8.0/255},
                },
                //equation/parameters to allow for RGBA encoding
                depthTest:false,
                transparent:true,
                blending:THREE.CustomBlending,
                blendEquation:THREE.AddEquation,
                blendSrc:THREE.OneFactor,
                blendDst:THREE.ZeroFactor,
                side:THREE.BackSide
            });

            //create the FBO
            this.accumFboPing = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.accumMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });

            //create the FBO
            this.accumFboPong = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.accumMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });

        },

        begin: function () {

            Sequence.prototype.begin.call(this);

            console.log('begin feedback');

            for (var i=0; i<this.allTextures.length; i++) {
                this.allTextures[i].alloc();
            }
            this.sceneFbo.alloc();

            //accum - wont be used
            this.accumFboPing.alloc();
            this.accumFboPong.alloc();
            this.accumMaterial.uniforms.videoTexture.value = this.sceneFbo.texture;

        },

        end: function () {

            Sequence.prototype.end.call(this);
            for (var i=0; i<this.allTextures.length; i++) {
                this.allTextures[i].dispose();
            }
            this.sceneFbo.dispose();

            //accum - wont be used
            this.accumMaterial.uniforms.videoTexture.value = this.sceneFbo.texture;
            this.accumFboPing.dispose();
            this.accumFboPong.dispose();
        },

        changeVideoQuality: function(nw, nh) {
            for (var i=0; i<this.allTextures.length; i++) {
                this.allTextures[i].bwMaterial.map = this.videoTexture.texture;
                this.allTextures[i].colorMaterial.map = this.videoTexture.texture;
                this.allTextures[i].resizeTextureAndCopy(nw*this.allTextures[i].wsize, nh*this.allTextures[i].wsize);
            }
        },

        changeRenderQuality: function (nw, nh) {
            var renderer = RendererController.getInstance().getRenderer();

            this.renderWidth = nw;
            this.renderHeight = nh;
            this.sceneFbo.resizeTexture(nw,nh);

            //accum - wont be used
            this.accumMaterial.uniforms.videoTexture.value = this.sceneFbo.texture;
            this.accumMaterial.uniforms.offset.value.set(1.0/nw,1.0/nh)
            this.accumFboPing.resizeTextureAndCopy(nw,nh);
            this.accumFboPong.resizeTextureAndCopy(nw,nh);
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
                videoHeight = this.videoTexture.height;

            //
            // BlackAndWhite check
            //
            if (this.isBlackAndWhite!==options.blackAndWhite) {
                this.isBlackAndWhite = options.blackAndWhite;
                if (this.isBlackAndWhite) {
                    for (var i=0; i<this.allTextures.length; i++) {
                        this.allTextures[i].setRenderMaterial(this.allTextures[i].bwMaterial);
                    }
                } else {
                    for (var i=0; i<this.allTextures.length; i++) {
                        this.allTextures[i].setRenderMaterial(this.allTextures[i].colorMaterial);
                    }
                }
            }

            //
            // Setup number of planes 
            //
            if (this.allPlanes.length !== this.NUM_PLANES || this.NUM_PLANES != parseInt(options.numberOfPlanes)) {
                this.NUM_PLANES = parseInt(options.numberOfPlanes);
                
                for (var i=0; i<this.NUM_PLANES; i++) {
                    this.sceneFbo.scene.remove(this.allPlanes[i]);
                }
                this.allPlanes = [];

                var geom = new THREE.PlaneGeometry( 1280, 672, 1, 1 );
                geom.applyMatrix( new THREE.Matrix4().makeScale(1,-1,1));
                var p,sp;
                for (var i=0; i<this.NUM_PLANES; i++) {
                    p = new THREE.Mesh(
                        geom,
                        new THREE.MeshBasicMaterial( {
                            //map:this.allTextures[Math.floor(this.MAX_TEXTURES/this.NUM_PLANES) * i].texture,
                            blending:THREE.AdditiveBlending,
                            transparent:true,
                            color:new THREE.Color(0xffffff),
                            side:THREE.DoubleSide
                        })
                    );
                    p.position.z = this.PLANE_DEPTH; // - this.PLANE_OFFSET*i;
                    this.sceneFbo.scene.add(p);
                    p.quaternion = new THREE.Quaternion();
                    this.allPlanes[i] = p;
                    this.allPlanes[i].scale.set(options.scaleFar,options.scaleFar,options.scaleFar);
                }

            }

            //clone the latest video texture
            if (this.videoTexture.wasUpdatedThisframe)  {
                //this.currentFrameSkip++;
                //if (this.currentFrameSkip>options.frameSkip) {
                //    this.currentFrameSkip = 0;
                    //var t = this.allTextures.pop(); //splice(NUM_PLANES,1)[0];
                    //this.allTextures.unshift(t);
                    // var t = this.allTextures.splice(this.MAX_TEXTURES_LARGE-1,1)[0]; //splice(NUM_PLANES,1)[0];
                    // this.allTextures.unshift(t);

                    // var t2 = this.allTextures.pop();
                    // t2.renderPlane.material.map = t.texture;
                    // this.allTextures.splice(this.MAX_TEXTURES_LARGE,0,t2);


                    var t = this.allTextures.pop(); //splice(NUM_PLANES,1)[0];
                    this.allTextures.unshift(t);

                //}
            }

            //update allPlanes materials and colors
            for (var i=0; i<this.allPlanes.length; i++) {
                this.allPlanes[i].material.map = this.allTextures[ Math.round(this.MAX_TEXTURES / this.NUM_PLANES * i)].texture;
  
                if (!options.colors || options.colors==='none') {
                
                    this.allPlanes[i].material.color.setHex(0xffffff);
                
                } else if (options.colors && options.colors==='blue/green') {
                 
                    this.allPlanes[i].material.color.setRGB(0, i / this.NUM_PLANES, (this.NUM_PLANES-i) / this.NUM_PLANES);

                } else  if (options.colors && options.colors==='hsv') {

                    this.allPlanes[i].material.color.setHSV(i / this.NUM_PLANES, 1.0, 1.0);

                }
                this.allPlanes[i].material.color.r *= 1.0-options.fade;
                this.allPlanes[i].material.color.g *= 1.0-options.fade;
                this.allPlanes[i].material.color.b *= 1.0-options.fade;
            }


            //update planes position and snake chain
            var phoneRotation = new THREE.Vector3().setEulerFromQuaternion(orientation);
            for (var i=0; i<this.allPlanes.length; i++) {
                this.allPlanes[i].useQuaternion = options.useRotation;
            }
            for (var i=0; i<this.allPlanes.length-1; i++) {
                this.allPlanes[i].position.lerp(this.allPlanes[i+1].position, 0.15*delta);
                this.allPlanes[i].quaternion.slerp(this.allPlanes[i+1].quaternion, 0.1*delta);
                this.allPlanes[i].scale.lerp(this.allPlanes[i+1].scale,0.2*delta);

            }
            this.allPlanes[this.allPlanes.length-1].position.lerp(
                new THREE.Vector3(finalPhonePosition.x * videoWidth/2,-finalPhonePosition.y * videoHeight/2,this.PLANE_DEPTH)
                ,0.07*delta
            );
            

            var targetScale = options.scaleFar + (options.scaleNear-options.scaleFar) * (1.0-finalPhonePosition.z);
            this.allPlanes[this.allPlanes.length-1].scale.lerp(new THREE.Vector3(targetScale,targetScale,targetScale),0.4*delta);

            this.allPlanes[i].quaternion.slerp(orientation,0.1*delta);


            //update accumulation uniforms
            this.useAccumulation = options.useAccumulation;
            this.accumMaterial.uniforms.offset.value.set(options.blurOffset/videoWidth,options.blurOffset/videoHeight);
            this.accumMaterial.uniforms.off.value = -7/255 * delta;

        },

        /**
         *
         * Renders three.js scene in this sequence's Render Target
         *
         */
        render: function () {
            RendererController.getInstance().getRenderer().setClearColor(new THREE.Color(0));
            RendererController.getInstance().getRenderer().clear();
           
            if (this.videoTexture.wasUpdatedThisframe) {
                //this.allTextures[this.MAX_TEXTURES_LARGE].render();
                this.allTextures[0].render();
            }
            this.sceneFbo.render();

            if (!this.useAccumulation) {

                RendererController.getInstance().renderToScreen(this.sceneFbo.texture,false,true);

            } else {

                var ping = (this.accumIsPing) ? this.accumFboPing : this.accumFboPong;
                var pong = (this.accumIsPing) ? this.accumFboPong : this.accumFboPing;
                this.accumMaterial.uniforms.texture.value = pong.texture;
                ping.render();
                RendererController.getInstance().renderToScreen(this.ping.texture,false,false)
                this.accumIsPing = !this.accumIsPing;
                
            }
        }
    }

});
