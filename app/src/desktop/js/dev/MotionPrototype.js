/**
 * @author Édouard Lanctôt  < edouardlb@gmail.com >
 *
 */
var MotionPrototype = Sequence._extend({

    _public:  {

        sceneFbo: null,
        model: null,
        smoothModel: null,
        rawModel: null,
        referenceModel: null,


        construct: function (id, $container, video, audio, videoTexture) {

            Sequence.call(this, id, $container, video, audio, videoTexture);

        },

        /**
         *
         *
         *
        */
        init: function () {

            Sequence.prototype.init.call(this);


            //
            // Localise some variables / references
            //
            var videoWidth = 1280, //this.videoTexture.width,
                videoHeight = 672, //this.videoTexture.height,
                renderer = RendererController.getInstance().getRenderer();

            this.sceneFbo = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                //camera: new THREE.PerspectiveCamera(45, videoWidth/videoHeight, 0.001, 10000),
                camera:new THREE.PerspectiveCamera( 45, videoWidth/videoHeight, 0.001, 10000.0 ),
                depthBuffer:true,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                backgroundColor: 0xccbbaa,
                backgroundAlpha: 1.0,
                renderer:renderer
            });
            this.sceneFbo.camera.position.z = 400;
            this.sceneFbo.camera.lookAt(new THREE.Vector3(0,0,0));



            //phone model
            var modelScale = 1;
            var geometryPhone = new THREE.CubeGeometry(37 * modelScale, 70 * modelScale, 10 * modelScale);
            var geometryScreen = new THREE.CubeGeometry(31 * modelScale, 55 * modelScale, 2 * modelScale);

            var materialBody = new THREE.MeshLambertMaterial({color: new THREE.Color(0x44ffaa),transparent:true,opacity:1.0});
            var materialScreen = new THREE.MeshLambertMaterial({color: new THREE.Color(0x333333),transparent:true,opacity:1.0});

            var meshPhone = new THREE.Mesh(geometryPhone, materialBody);
            var meshScreen = new THREE.Mesh(geometryScreen, materialScreen);
            meshScreen.position.y = 3 * modelScale;
            meshScreen.position.z = 5 * modelScale;
            var axis = new THREE.AxisHelper();
            axis.scale.set(50,50,50);

            this.model = new THREE.Object3D();
            this.model.add(meshPhone);
            this.model.add(meshScreen);
            this.model.add(axis);
            this.sceneFbo.scene.add(this.model);


            //raw phone model
            meshPhone = new THREE.Mesh(geometryPhone, materialBody.clone());
            meshScreen = new THREE.Mesh(geometryScreen, materialScreen.clone());
            meshPhone.material.opacity = 0.4;
            meshPhone.material.color.setRGB(1.0,0.0,0.0);
            meshScreen.opacity = 0.4;
            meshScreen.position.y = 3 * modelScale;
            meshScreen.position.z = 5 * modelScale;
            axis = new THREE.AxisHelper();
            axis.scale.set(50,50,50);

            this.rawModel = new THREE.Object3D();
            this.rawModel.add(meshPhone);
            this.rawModel.add(meshScreen);
            this.rawModel.add(axis);
            this.sceneFbo.scene.add(this.rawModel);


            //smooth model
            meshPhone = new THREE.Mesh(geometryPhone, materialBody.clone());
            meshScreen = new THREE.Mesh(geometryScreen, materialScreen.clone());
            meshPhone.material.opacity = 0.4;
            meshPhone.material.color.setRGB(0.0,0.0,1.0);
            meshScreen.opacity = 0.4;
            meshScreen.position.y = 3 * modelScale;
            meshScreen.position.z = 5 * modelScale;
            axis = new THREE.AxisHelper();
            axis.scale.set(50,50,50);

            this.smoothModel = new THREE.Object3D();
            this.smoothModel.add(meshPhone);
            this.smoothModel.add(meshScreen);
            this.smoothModel.add(axis);
            this.sceneFbo.scene.add(this.smoothModel);


            //reference model
            meshPhone = new THREE.Mesh(geometryPhone, materialBody.clone());
            meshScreen = new THREE.Mesh(geometryScreen, materialScreen.clone());
            meshPhone.material.opacity = 0.1;
            meshPhone.material.color.setRGB(0.0,0.0,0.0);
            meshScreen.opacity = 0.1;
            meshScreen.position.y = 3 * modelScale;
            meshScreen.position.z = 5 * modelScale;
            axis = new THREE.AxisHelper();
            axis.scale.set(50,50,50);

            this.referenceModel = new THREE.Object3D();
            this.referenceModel.add(meshPhone);
            this.referenceModel.add(meshScreen);
            this.referenceModel.add(axis);
            this.sceneFbo.scene.add(this.referenceModel);



            //position everything
            this.rawModel.position.x = -100;
            this.smoothModel.position.x = 0;
            this.model.position.x = 100;
            this.referenceModel.position.x = 0;
            this.referenceModel.position.y = -100;


            //light
            var directionalLight = new THREE.DirectionalLight(0xffffff);
            directionalLight.position.set(0, 0, 1).normalize();
            this.sceneFbo.scene.add(directionalLight);


        },

        begin: function () {

            Sequence.prototype.begin.call(this);

        },

        end: function () {

            Sequence.prototype.end.call(this);

        },

        changeVideoQuality: function(nw, nh) {},

        changeRenderQuality: function (nw, nh) { }

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


            //update phones
            this.rawModel.useQuaternion = true;
            this.rawModel.quaternion.copy(OrientationController.getInstance().getRawQuaternion());

            this.model.useQuaternion = true;
            this.model.quaternion.copy(OrientationController.getInstance().getFrameInfo());

            this.smoothModel.useQuaternion = true;
            this.smoothModel.quaternion.copy(InputController.getInstance().getQuaternionSmooth());


            this.referenceModel.useQuaternion = true;
            this.referenceModel.quaternion.copy(OrientationController.getInstance().referenceQuaternion)



        },

        /**
         *
         * Renders three.js scene in this sequence's Render Target
         *
         */
        render: function () {
            RendererController.getInstance().getRenderer().setClearColor(new THREE.Color(0));
            RendererController.getInstance().getRenderer().clear();
            this.sceneFbo.render();
            RendererController.getInstance().renderToScreen(this.sceneFbo.texture,false,true);
        }
    }

});
