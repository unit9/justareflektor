/**
 * @author Édouard Lanctôt  < edouardlb@gmail.com >
 *
 */
var SmoothingPrototype = Sequence._extend({

    _public:  {

        sceneFbo: null,

        phoneTexture: null,
        phonePlane: null,

        gyroTexture: null,
        gyroPlane: null,

        resultTexture: null,
        resultPlane: null,


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
                //camera:new THREE.PerspectiveCamera( 45, videoWidth/videoHeight, 0.001, 10000.0 ),
                depthBuffer:true,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                backgroundColor: 0xccbbaa,
                backgroundAlpha: 1.0,
                renderer:renderer
            });



            //
            // The TRACKING pointer
            //
            var canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            var c = canvas.getContext('2d');


            //draw the phone
            c.fillStyle = '#00ffff';
            c.fillRect(0,0,256,256);
            c.fillStyle = 'black';
            c.beginPath();
            c.arc(128,128,30,0,Math.PI * 2, true);
            c.closePath();
            c.fill();

            //add the phone
            this.phoneTexture = new THREE.Texture(canvas);
            this.phoneTexture.needsUpdate = true;
            renderer.setTexture(this.phoneTexture,0);
            this.phonePlane = new THREE.Mesh(
                new THREE.PlaneGeometry( 0.0525*6.0,0.6, 1, 1 ),
                new THREE.MeshBasicMaterial( {
                    map:this.phoneTexture,
                    transparent:true,
                    //blending:THREE.AdditiveBlending,
                    side:THREE.DoubleSide
                } )
            );
            this.sceneFbo.scene.add(this.phonePlane);


            //draw the gyro
            c.clearRect(0,0,256,256)
            c.strokeStyle = '#ff0000';
            c.lineWidth = 20.0;
            c.beginPath();
            c.moveTo(0,0);
            c.lineTo(256,256);
            c.moveTo(256,0);
            c.lineTo(0,256);
            c.closePath();
            c.stroke();


            //add the gyro
            this.gyroTexture = new THREE.Texture(canvas);
            this.gyroTexture.needsUpdate = true;
            renderer.setTexture(this.gyroTexture,0);
            this.gyroPlane = new THREE.Mesh(
                new THREE.PlaneGeometry( 0.0525*6.0,0.6, 1, 1 ),
                new THREE.MeshBasicMaterial( {
                    map:this.gyroTexture,
                        transparent:true,
                    side:THREE.DoubleSide
                } )
            );
            this.sceneFbo.scene.add(this.gyroPlane);



            //draw the result
            c.clearRect(0,0,256,256)
            c.fillStyle = '#555555';
            c.beginPath();
            c.arc(128,128,120,0,Math.PI * 2, true);
            c.closePath();
            c.fill();

            //add the phone
            this.resultTexture = new THREE.Texture(canvas);
            this.resultTexture.needsUpdate = true;
            renderer.setTexture(this.resultTexture,0);
            this.resultPlane = new THREE.Mesh(
                new THREE.PlaneGeometry( 0.0525*6.0,0.6, 1, 1 ),
                new THREE.MeshBasicMaterial({
                    map:this.resultTexture,
                    transparent:true,
                    side:THREE.DoubleSide
                })
            );
            this.sceneFbo.scene.add(this.resultPlane);


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

            if (options.simulateLowFps && Math.random()<0.4) return;


            this.phonePlane.position.set(
                InputController.getInstance().getPositionSmooth().x,
                InputController.getInstance().getPositionSmooth().y,
                0.0
            );

            this.gyroPlane.position.set(
                InputController.getInstance().getDirectionSmooth().x,
                InputController.getInstance().getDirectionSmooth().y,
                0.0
            );
            this.resultPlane.position.set(
                InputController.getInstance().getPositionDirectional().x,
                InputController.getInstance().getPositionDirectional().y,
                0.0
            );


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
