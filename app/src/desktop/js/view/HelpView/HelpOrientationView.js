/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/10/13
 * Time: 5:24 PM
 */

var HelpOrientationView = View._extend({

    _static: {

        WIDTH: 320,
        HEIGHT: 240

    },

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        show: function () {

            if (!View.prototype.show.call(this)) {
                return;
            }
            this.initShown();
            this.bindEventsShown();

        },

        hide: function () {

            View.prototype.hide.call(this);
            this.unbindEventsHidden();
            
        }

    },

    _private: {

        $buttonReset: null,
        initialised: false,
        camera: null,
        renderer: null,
        scene: null,
        phoneModel: null,

        init: function () {

            this.$buttonReset = this.$container.find('button.reset-orientation');

        },

        initShown: function () {

            if (this.initialised) {
                return;
            }

            var phoneMaterial;

            this.camera = new THREE.PerspectiveCamera();
            this.camera.position.z = 200;
            this.renderer = new THREE.WebGLRenderer();
            this.renderer.setClearColor(0xffffff);
            this.renderer.setSize(HelpOrientationView.WIDTH, HelpOrientationView.HEIGHT);
            this.scene = new THREE.Scene();

            this.$container.find('.three').append(this.renderer.domElement);

            phoneMaterial = new THREE.MeshLambertMaterial({color: 0x44ff44});
            this.phoneModel = new THREE.Mesh(new THREE.CubeGeometry(40, 80, 7), phoneMaterial);
            this.phoneModel.useQuaternion = true;

            var pointLight = new THREE.PointLight(0xffffff);
            pointLight.position.x = 10;
            pointLight.position.y = 50;
            pointLight.position.z = 130;
            this.scene.add(pointLight);

            this.scene.add(this.phoneModel);

            this.initialised = true;

        },

        bindEvents: function () {

            var self = this;

            this.$buttonReset.bind('click', function () {
                self.onButtonResetClick();
            });

        },

        bindEventsShown: function () {

            var self = this;

            AnimationController.getInstance().events.bind(AnimationController.EVENT_FRAME + '.HelpOrientationView', function () {
                self.onFrame();
            });

        },

        unbindEventsHidden: function () {

            AnimationController.getInstance().events.unbind(AnimationController.EVENT_FRAME + '.HelpOrientationView');

        },

        rotatePhone: function () {

            //this.phoneModel.quaternion = new THREE.Quaternion(OrientationController.getInstance().worldQuaternion.x, OrientationController.getInstance().worldQuaternion.y, OrientationController.getInstance().worldQuaternion.z, OrientationController.getInstance().worldQuaternion.w);
            this.phoneModel.quaternion.copy(OrientationController.getInstance().getQuaternionSmooth());

        },

        render: function () {

            this.renderer.render(this.scene, this.camera);

        },

        onFrame: function () {

            this.rotatePhone();
            this.render();

        },

        onButtonResetClick: function () {

            OrientationController.getInstance().resetOrientation();

        }

    }

});
