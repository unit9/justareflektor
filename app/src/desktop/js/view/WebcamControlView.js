/**
 *
 * @author Édouard Lanctôt < edouardlb@gmail.com >
 * 
 */
var WebcamControlView = View._extend({

        _static: {

            WIDTH: 1280,
            HEIGHT: 672,
            MARGIN_RIGHT: 530,

            vertexShader: [

                "varying mediump vec2 vUv;",
                "void main() {",
                "   vUv = vec2(uv.x,uv.y);",
                "    gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );",
                "}"

            ].join('\n'),

            
            webcamFragmentShader: [

                "varying mediump vec2 vUv;",
                "uniform sampler2D tWebcam;",
                "uniform lowp float exposure;",
                "uniform lowp float offset;",
                "uniform lowp float noiseAlpha;",
                "uniform mediump vec2 randomUV;",
                "uniform mediump float minBlack;",
                //"const lowp vec3 rgb2luma = vec3(0.299,0.587,0.114);",
                //"const lowp vec3 rgb2luma = vec3(0.114,0.587,0.299);",
                //"const lowp vec3 rgb2luma = vec3(0.114,0.500,0.386);",
                "const lowp vec3 rgb2luma = vec3(0.1,0.550,0.400);", //use much more teal than real luma to see the tracker
                "mediump float rand( mediump vec2 co ){",
                "    return fract( sin( dot( co.xy ,vec2( 12.9898,78.233 ) ) ) * 43758.5453 );",
                "}",
                "void main() {",
                "   gl_FragColor = vec4(vec3(  max((dot(texture2D(tWebcam, vUv).rgb,rgb2luma) + offset) * exposure * (1.0 + rand(randomUV+vUv) * noiseAlpha - noiseAlpha*0.5),minBlack) ),1.0);",
                "}"

            ].join('\n'),


            linesFragmentShader: [

                "varying vec2 vUv;",
                "uniform mediump vec2 randomUV;",
                "uniform mediump float lineNoise;",
                "uniform mediump float opacity;",
                "mediump float rand( mediump vec2 co ){",
                "    return fract( sin( dot( co.xy ,vec2( 12.9898,78.233 ) ) ) * 43758.5453 );",
                "}",
                "void main() {",
                "   mediump float side = 1.0 - max(0.5-vUv.x,0.0) * 2.0 - max(vUv.x-0.5,0.0) * 2.0;",
                "   side = side * side;",
                "   mediump float noise = side * rand(randomUV+vUv) * 2.0 - 1.0;",
                "   side = side + noise * lineNoise;",
                "   gl_FragColor = vec4(",
                "       side,",
                "       side,",
                "       side,",
                "       opacity",
                "   );",
                "}"
            ].join('\n'),


            lightHaloShader: [

                "varying vec2 vUv;",
                "uniform sampler2D tBeam;",
                "uniform mediump vec2 randomUV;",
                "uniform mediump float noiseAlpha;",
                "uniform mediump float beamAlpha;",
                "uniform mediump float blobSize;",
                "uniform mediump float exp;",
                "uniform mediump float opacity;",
                "mediump float rand( mediump vec2 co ){",
                "    return fract( sin( dot( co.xy ,vec2( 12.9898,78.233 ) ) ) * 43758.5453 );",
                "}",
                "void main() {",
                "   mediump float haloExp = pow( max(min(0.5-length(0.5-vUv), 1.0), 0.0),exp)*10.0;",
                "   haloExp *= 1.0 + rand(haloExp*randomUV)*noiseAlpha - noiseAlpha*0.5;",
                "   gl_FragColor = vec4(",
                "       vec3(haloExp) + beamAlpha * (1.0-texture2D(tBeam,(vUv-0.5)*blobSize+0.5).rgb),",
                "       opacity",
                "   );",
                "}"
                
            ].join('\n'),


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
            ]
    },


    _public: {

        running: false,
        runAsSequence: true,
        renderer: null,
        options: {
            "exposure": 1.800,
            "offset": -0.6000,
            "noise": 0.15,
            "lineNoise":0.5,
            "lineWidthMin": 10.0,
            "lineWidthMax": 10.0,
            "lineOffsetMin": 0,
            "lineOffsetMax": 0,
            "beamSize": 675*2.0,
            "beamDistance": 120,
            "beamOpacity": 0.8,
            "blobOpacity": 0.9,
            "blobSize":2.0
        },
        owidth: 1280,
        oheight: 672,
        phonePosition: new THREE.Vector3(0,0,1),

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },


        show: function () {

            var self = this;
            if (!View.prototype.show.call(this)) {
                return;
            }
            console.log('showing Webcam Control View');

            CameraController.getInstance().init();
            TrackingController.getInstance().init();
            TrackingController.getInstance().start();

            //initialise sequence
            this.renderer = new THREE.WebGLRenderer({antialias: false, alpha: false});
            this.renderer.setClearColor(0x000000, 1);
            this.renderer.setSize(WebcamControlView.WIDTH, WebcamControlView.HEIGHT);
            this.$container.append(this.renderer.domElement);


            $(this.renderer.domElement).css(
                {
                'border-style' : 'solid',
                'border-width' : '1px',
                 'border-color': '#ffffff'
                });

            this.runAsSequence = false;

            //add loop
            if (!this.running) AnimationController.getInstance().events.bind(AnimationController.EVENT_FRAME+'.WebcamControlView',function() {
                self.onFrame( null );
            });

            this.onResize();
            this.initLinesRendering();
            AnimationController.getInstance().start();
            if (this.sceneFbo) this.sceneFbo.alloc();
            this.running = true;

        },

        hide: function () {

            View.prototype.hide.call(this);
            AnimationController.getInstance().events.unbind(AnimationController.EVENT_FRAME+'.WebcamControlView');
            if (this.sceneFbo) this.sceneFbo.dispose();


            //dispose of all textures
            if (this.blobTexturesReady && this.blobTextures) {
                for (var i=0; i< this.blobTextures.length; i++) {
                    this.blobTextures[i].dispose();
                }

                this.blobTexturesReady = false;
                this.blobTextures = [];
            }

            if (this.webcamTexture) {
                this.webcamTexture.dispose();
            }

        },


        //
        // Initialise sequence
        //
        initLinesRendering: function () {


            //
            // Localise some variables / references
            //
            var videoWidth = WebcamControlView.WIDTH, //this.videoTexture.width,
                videoHeight = WebcamControlView.HEIGHT, //this.videoTexture.height,
                renderer = (this.runAsSequence) ? RendererController.getInstance().getRenderer() : this.renderer;
                this.owidth = videoWidth;
                this.oheight = videoHeight;

            //
            // Create the render target
            //
            this.sceneFbo = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBFormat,
                type:THREE.UnsignedByteType,
                camera:new THREE.PerspectiveCamera( 45, videoWidth/videoHeight, 0.001, 10000.0 ),
                depthBuffer:true,
                stencilBuffer:false,
                premultiplyAlpha:true,
                generateMipmaps:false,
                renderer:renderer
            });
            this.sceneFbo.camera.position.z = this.getCameraZ(this.sceneFbo.camera,videoHeight);
            //this.sceneFbo.camera.lookAt(new THREE.Vector3(0,0,0));

            //
            // Get the blob textures
            //
            this.loadBlobTextures();


            //
            // Create webcam texture
            //
            this.webcamCanvas = document.createElement('canvas');
            this.webcamCanvas.width = 512;
            this.webcamCanvas.height = 512;
            this.webcamCanvas.c = this.webcamCanvas.getContext('2d');
            this.webcamTexture = new THREE.Texture(
                this.webcamCanvas,
                new THREE.UVMapping(),
                THREE.ClampToEdgeWrapping,
                THREE.ClampToEdgeWrapping,
                THREE.LinearFilter, THREE.LinearFilter,
                THREE.RGBAFormat, THREE.UnsignedByteType,1);
            this.webcamTexture.generateMipmaps = false;
            this.webcamTexture.needsUpdate = true;
            this.webcamVideo = CameraController.getInstance().getVideo();


            //
            // Add the webcam plane
            //
            this.webcamMaterial = new THREE.ShaderMaterial( {
                vertexShader:   WebcamControlView.vertexShader, //AssetsController.getInstance().getFile('shaders/common/vertex.vert'),
                fragmentShader: WebcamControlView.webcamFragmentShader, //AssetsController.getInstance().getFile('shaders/webcamfeed/WebcamFeedExposure.frag'),
                attributes:{},
                uniforms: {
                    'tWebcam':{type: 't', value: this.webcamTexture},

                    'exposure':{type: 'f', value: 1.0},
                    'offset':{type: 'f', value: 0.0},
                    'noiseAlpha':{type: 'f', value: 0.05},
                    'minBlack': {type:'f', value: 0.0},
                    'randomUV':{type:'v2', value: new THREE.Vector2(0.0,0.0)}
                },
                //equation/parameters to allow for RGBA encoding
                depthTest:false,
                transparent:true,
                blending: THREE.AdditiveBlending,
                side:THREE.DoubleSide
            });
            this.webcamPlane = new THREE.Mesh(new THREE.PlaneGeometry(videoWidth,videoHeight,1,1), this.webcamMaterial);
            this.webcamPlane.scale.x = -1;
            this.sceneFbo.scene.add(this.webcamPlane);


            //
            // add the lines
            //
            this.lineMaterial = new THREE.ShaderMaterial( {
                vertexShader:   WebcamControlView.vertexShader, //AssetsController.getInstance().getFile('shaders/common/vertex.vert'),
                fragmentShader: WebcamControlView.linesFragmentShader, //AssetsController.getInstance().getFile('shaders/webcamfeed/lines.frag'),
                attributes:{},
                uniforms: {
                    "randomUV": {type:'v2', value: new THREE.Vector2(0.0,0.0)},
                    "lineNoise": {type:'f', value: 0.5},
                    "opacity": {type:'f',value: 0.0}
                },
                //equation/parameters to allow for RGBA encoding
                depthTest:false,
                transparent:true,
                blending: THREE.AdditiveBlending,
                side:THREE.DoubleSide
            });

            var lineGeom = new THREE.PlaneGeometry(1,1,2,1);
            this.lineLeftA = new THREE.Mesh(lineGeom, this.lineMaterial);
            this.lineRightA = new THREE.Mesh(lineGeom, this.lineMaterial);
            this.lineLeftB = new THREE.Mesh(lineGeom, this.lineMaterial);
            this.lineRightB = new THREE.Mesh(lineGeom, this.lineMaterial);
            

            this.lineLeftA.scale.x = 10.0;
            this.lineLeftA.scale.y = videoWidth*5;
            this.lineLeftA.rotation.z = Math.PI*0.25;

            this.lineRightA.scale.x = 10.0;
            this.lineRightA.scale.y = videoWidth*5;
            this.lineRightA.rotation.z = Math.PI*0.25;

            this.lineLeftB.scale.x = 10.0;
            this.lineLeftB.scale.y = videoWidth*5;
            this.lineLeftB.rotation.z = -Math.PI*0.25;

            this.lineRightB.scale.x = 10.0;
            this.lineRightB.scale.y = videoWidth*5;
            this.lineRightB.rotation.z = -Math.PI*0.25;

            //this.lineRightB.scale.x = 10.0;
            //this.lineRightB.scale.z = 10.0;
            //this.lineRightB.scale.y = 200.0;
            //this.lineRightB.rotation.y = Math.PI*0.5;


            this.lineContainer = new THREE.Object3D();
            this.lineContainer.add(this.lineLeftA);
            this.lineContainer.add(this.lineRightA);
            this.lineContainer.add(this.lineLeftB);
            this.lineContainer.add(this.lineRightB);
            this.lineContainer.add(this.lineForward);
            this.sceneFbo.scene.add(this.lineContainer);


            //
            // Add the cone
            //
            this.lightConeMaterial = new THREE.MeshBasicMaterial({
                color:0xffffff,
                opacity:0.1,
                transparent:true,
                vertexColors:THREE.VertexColors,
                blending: THREE.AdditiveBlending
            });

            var coneGeometry = new THREE.CylinderGeometry(
                300, 30.0,  //radiusTop, radiusBottom, 
                500.0,  //height, 
                32, 5, //radiusSegments, heightSegments,
                true );//openEnded

            coneGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,250,0));
            coneGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI*0.5));
            
            coneGeometry.colors = [];
            for (var i=0; i<coneGeometry.vertices.length; i++) {
                coneGeometry.colors[i] = new THREE.Color(0xff0000);
                //if (coneGeometry.vertices[i].y > 1) coneGeometry.colors[i].setRGB(0,0,0);
            }
            coneGeometry.colorsNeedUpdate = true;

            this.lightCone = new THREE.Mesh(coneGeometry, this.lightConeMaterial);




            //
            // Add the light beam
            //
            this.lightBeamMaterial = new THREE.ShaderMaterial( {
                vertexShader:   WebcamControlView.vertexShader, //AssetsController.getInstance().getFile('shaders/common/vertex.vert'),
                fragmentShader: WebcamControlView.lightHaloShader, //AssetsController.getInstance().getFile('shaders/webcamfeed/lines.frag'),
                attributes:{},
                uniforms: {
                    "tBeam": {type:'t',value:null},
                    "randomUV": {type:'v2', value: new THREE.Vector2(0.0,0.0)},
                    "beamAlpha": {type:'f', value: 0.5},
                    "noiseAlpha": {type:'f', value: 0.2},
                    "exp":{type:'f', value: 2.0},
                    "opacity": {type:'f',value: 0.0},
                    "blobSize":{type:'f',value:1.0}
                },
                //equation/parameters to allow for RGBA encoding
                depthTest:false,
                transparent:true,
                blending: THREE.AdditiveBlending,
                side:THREE.DoubleSide
            });

            this.lightBeamPlane = new THREE.Mesh(
                new THREE.PlaneGeometry(1,1,1,1),
                this.lightBeamMaterial);

            //this.sceneFbo.scene.add(this.lightBeamPlane);
            //this.sceneFbo.scene.add(this.lightCone);
        },

        //update and render sequence on frame
        onFrame: function (options) {

            this.update( options || this.options );
            this.render();

        },

        transitionShow: function () {

            this.$container.fadeIn();

        },

        transitionHide: function () {

            this.$container.fadeOut();

        },

        begin: function() {
            this.initLinesRendering();
        },


        //for debugging
        changeVideoQuality: function() {},
        changeRenderQuality: function() {}

    },

    _private: {

        sceneFbo: null,
        webcamVideo: null,
        webcamCanvas: null,
        webcamTexture: null,
        webcamMaterial: null,
        webcamPlane: null,

        lineMaterial: null,
        lineLeftA: null,
        lineRightA: null,
        lineLeftB: null,
        lineRightB: null,


        lightBeamPlane: null,
        lightBeamMaterial: null,

        lightCone: null,
        lightConeMaterial: null,

        lineContainer: null,
        blobTextures: [],
        blobTexturesReady: false,

        //state and time
        lastMaskFrameUpdate: 0,
        currentMask: 0,
        maskRate: 1000 / 24,


        bindEvents: function () {

            var self = this;

        },

        loadBlobTextures: function() {
            if (this.blobTexturesReady) return;
            this.blobTexturesReady = true;
            for (var i=0; i<WebcamControlView.blobTexturePaths.length; i++) {
                if (!AssetsController.getInstance().hasFile(WebcamControlView.blobTexturePaths[i])) this.blobTexturesReady = false;
            }


            if (this.blobTexturesReady) {
                for (var i=0; i<WebcamControlView.blobTexturePaths.length; i++) {

                    this.blobTextures[i] = AssetsController.getInstance().getFile(WebcamControlView.blobTexturePaths[i]);
                    this.blobTextures[i].minFilter = THREE.LinearMipMapLinearFilter;
                    this.blobTextures[i].generateMipmaps = true;
                    this.blobTextures[i].needsUpdate = true;

                }
            }
        },

        update: function(options) {

            if (!this.runAsSequence) InputController.getInstance().update(TrackingController.getInstance().isReady(), TrackingController.getInstance().getFrameInfo(), OrientationController.getInstance().getFrameInfo());


            //
            // Update controls
            //
            var finalPhonePosition = this.phonePosition.lerp(InputController.getInstance().getPositionRaw().clone(),0.75),
                videoWidth = WebcamControlView.WIDTH,
                videoHeight = WebcamControlView.HEIGHT;

            this.sceneFbo.camera.position.z = this.getCameraZ(this.sceneFbo.camera,videoHeight);

            finalPhonePosition.z = Math.max(finalPhonePosition.z,0.01);

            //update lines based on tracking

            var lineOffset = (options.lineOffsetMax-options.lineOffsetMin) * (1.0-finalPhonePosition.z) + options.lineOffsetMin;
            this.lineRightA.position.x = lineOffset * Math.cos(Math.PI*0.25);
            this.lineRightA.position.y = lineOffset * Math.sin(Math.PI*0.25);

            this.lineLeftA.position.x = -lineOffset * Math.cos(Math.PI*0.25);
            this.lineLeftA.position.y = -lineOffset * Math.sin(Math.PI*0.25);

            this.lineRightB.position.x = lineOffset * Math.cos(-Math.PI*0.25);
            this.lineRightB.position.y = lineOffset * Math.sin(-Math.PI*0.25);

            this.lineLeftB.position.x = -lineOffset * Math.cos(-Math.PI*0.25);
            this.lineLeftB.position.y = -lineOffset * Math.sin(-Math.PI*0.25);


            // this.lineContainer.position.set(0,0,0);
            // //this.lineContainer.useQuaternion = true;
            // //this.lineContainer.quaternion.copy(InputController.getInstance().getQuaternionSmooth());
            // this.lineContainer.lookAt(new THREE.Vector3(
            //     InputController.getInstance().getDirectionSmooth().x*150,
            //     InputController.getInstance().getDirectionSmooth().y*150
            //     ,100.0));
            this.lineContainer.position.set(finalPhonePosition.x * videoWidth * 0.5, finalPhonePosition.y * -videoHeight * 0.15, 0.0);

            //
            // Update lines rotation
            //
            this.lineContainer.rotation.z = InputController.getInstance().getRotationX() * - 1.0 + Math.PI/2;

            //
            // Udpate mask image
            //
            if (Date.now() - this.lastMaskFrameUpdate >= this.maskRate && this.blobTexturesReady) {

                this.lastMaskFrameUpdate = Date.now();
                this.currentMask++;
                if (this.currentMask>=this.blobTextures.length) this.currentMask = 0;
                this.lightBeamMaterial.uniforms.tBeam.value = this.blobTextures[this.currentMask];

            } else if (!this.blobTexturesReady) {
                
                this.loadBlobTextures();

            }


            //update beam

            var beamDist = (OrientationController.getInstance().timesReset > 0) ? options.beamDistance*0.75 : options.beamDistance*0.5;
            if (OrientationController.getInstance().timesReset > 1) beamDist = options.beamDistance;

            this.lightBeamPlane.position.copy(this.lineContainer.position);
            var dir = new THREE.Vector3(0,0,1).applyQuaternion(InputController.getInstance().getQuaternionSmooth());
            dir.multiplyScalar( beamDist * (finalPhonePosition.z) + beamDist ); // * (finalPhonePosition.z) * 0.5 + options.beamDistance );
            dir.x *= -1;
            dir.z = Math.abs(dir.z);
            dir.z *= this.sceneFbo.camera.position.z / 800;
            this.lightBeamPlane.position.add(dir);

            //var beamSizeAdd = videoWidth / 
            var beamWidth = 1280/videoWidth * options.beamSize * finalPhonePosition.z;
            this.lightBeamPlane.scale.set(beamWidth,beamWidth,beamWidth);
            this.lightBeamPlane.scale.z = 1;
            if (this.lightBeamPlane.scale.length() <= 0.01) this.lightBeamPlane.scale.set(0.001,0.001,1);
            this.lightBeamMaterial.uniforms.opacity.value = (options.beamOpacity + Math.random()*0.1) * InputController.getInstance().smoothPersistence;




            //console.log(this.lightBeamPlane.position.z, this.getCameraZ(this.sceneFbo.camera,this.sceneFbo.height));


            //this.lightCone.useQuaternion = true;
            this.lightCone.position.copy(this.lineContainer.position);
            this.lightCone.lookAt(this.lightBeamPlane.position);


            this.lightBeamMaterial.uniforms.exp.value = 1.95 + Math.random()*0.1; ////TrackingController.getInstance().getPersistence();

            this.lightBeamMaterial.uniforms.beamAlpha.value = options.blobOpacity;
            this.lightBeamMaterial.uniforms.blobSize.value = options.blobSize;




            //update uniforms based on options
            this.webcamMaterial.uniforms.randomUV.value.set(Math.random(),Math.random());
            this.lineMaterial.uniforms.randomUV.value.set(Math.random(),Math.random());
            this.lightBeamMaterial.uniforms.randomUV.value.set(Math.random(),Math.random());

            this.webcamMaterial.uniforms.exposure.value = options.exposure;
            this.webcamMaterial.uniforms.noiseAlpha.value = options.noise;
            this.webcamMaterial.uniforms.offset.value +=  0.1 * (options.offset * (1.0-TrackingController.getInstance().tracking.lowLightScore) - this.webcamMaterial.uniforms.offset.value);

            this.lineMaterial.uniforms.opacity.value = TrackingController.getInstance().getPersistence();
            this.lineMaterial.uniforms.lineNoise.value = options.lineNoise;


            this.lineRightA.scale.x = this.lineLeftA.scale.x = this.lineLeftB.scale.x = this.lineRightB.scale.x =
                Math.max(options.lineWidthMin + (1.0-finalPhonePosition.z) * (options.lineWidthMax-options.lineWidthMin),0.01);



        },

        render: function() {

            var renderer = (this.runAsSequence) ? RendererController.getInstance().getRenderer() : this.renderer;
            renderer.setClearColor(new THREE.Color(0));
            renderer.clear();

            if (this.webcamVideo && this.webcamVideo.readyState === this.webcamVideo.HAVE_ENOUGH_DATA) {
                if (this.webcamCanvas.width !== this.webcamVideo.videoWidth) this.webcamCanvas.width = this.webcamVideo.videoWidth;
                if (this.webcamCanvas.height !== this.webcamVideo.videoHeight) this.webcamCanvas.height = this.webcamVideo.videoHeight;
                this.webcamCanvas.c.drawImage(this.webcamVideo,0,0,this.webcamVideo.videoWidth,this.webcamVideo.videoHeight);
                this.webcamTexture.needsUpdate = true;
            }

            if (this.runAsSequence) {
                this.sceneFbo.render();
                RendererController.getInstance().renderToScreen(this.sceneFbo.texture,false,true);
            } else {
                this.renderer.render(this.sceneFbo.scene,this.sceneFbo.camera);
            }
            
        },

        getCameraZ: function(camera,vh) {
            return vh / (2 * Math.tan(camera.fov / 2 * (Math.PI / 180)));
        },

        onResize: function () {

            if (this.runAsSequence) return;

            var aspect = CameraController.getInstance().getRatio(), // / WebcamControlView.HEIGHT,
                availableWidth = $(window).width() - 40 - WebcamControlView.MARGIN_RIGHT, // 2 * 20px margins
                availableHeight = $(window).height() - 120,  // 2 * 60px margins
                availableAspect = availableWidth / availableHeight,
                newWidth = 0,
                newHeight = 0,
                element,
                $element;

            if (!this.renderer) {
                return;
            }

            element = this.renderer.domElement;
            $element = $(this.renderer.domElement);

            if (aspect > availableAspect) {

                newWidth = availableWidth;
                newHeight = newWidth / aspect;

            } else {

                newHeight = availableHeight;
                newWidth = newHeight * aspect;

            }

            element.width = newWidth;
            element.height = newHeight;
            WebcamControlView.WIDTH = newWidth;
            WebcamControlView.HEIGHT = newHeight;
            this.$container.closest('.content').css('margin-top', (availableHeight - newHeight) * 0.5);
            this.renderer.setSize(newWidth, newHeight);

        }


    }

});
