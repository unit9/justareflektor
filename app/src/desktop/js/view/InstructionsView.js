/**
 * @author Paweł Klimkowski pawel.klimkowski@unit9.com / pawe@sqrtx.pl
 * @copyright UNIT9 Ltd.
 * Date: 5/29/13
 * Time: 4:22 PM
 */

var InstructionsView = View._extend({

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        init: function () {

            this.$buttonMouseMode = this.$container.find('.mouse-mode-camera a');

        },

        bindEvents: function () {

            var self = this;

            this.$buttonMouseMode.bind('click', function () {
                self.onButtonMouseModeClick();
            });

        },

        bindEventsShown: function () {

            var self = this;

            CameraController.getInstance().events.bind(CameraController.EVENT_ALLOW + '.InstructionsView', function () {
                self.onCameraAllow();
            });

            CameraController.getInstance().events.bind(CameraController.EVENT_DENY + '.InstructionsView', function () {
                self.onCameraDeny();
            });

        },

        unbind: function () {

            CameraController.getInstance().events.unbind(CameraController.EVENT_ALLOW + '.InstructionsView');
            CameraController.getInstance().events.unbind(CameraController.EVENT_DENY + '.InstructionsView');

        },

        show: function () {

            if (!View.prototype.show.call(this)) {
                return;
            }

            this.bindEventsShown();

            setTimeout(function () {

                CameraController.getInstance().init();

            }, 1);

            //Player.getInstance().startPreloadingVideo();
            AnalyticsController.getInstance().trackPageView('InstructionsView');

        },

        hide: function () {

            this.unbind();
            View.prototype.hide.call(this);

        }

    },

    _private: {

        $buttonMouseMode: null,

        onCameraAllow: function () {

            this.unbind();
            RoutingController.getInstance().route('/setup');

        },

        onCameraDeny: function () {

            this.unbind();
            RoutingController.getInstance().route('/cameradenied');
        },

        onButtonMouseModeClick: function () {

            InputController.getInstance().setMode(InputController.INPUT_TYPE_MOUSE);
            RoutingController.getInstance().route('/mousecamera');

        }

    }

});
