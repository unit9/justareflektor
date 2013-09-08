/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 8/16/13
 * Time: 1:49 PM
 */

var MouseAllowCameraView = View._extend({

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        bindEventsShown: function () {

            var self = this;

            CameraController.getInstance().events.bind(CameraController.EVENT_ALLOW + '.MouseAllowCameraView', function () {
                self.onCameraAllow();
            });

            CameraController.getInstance().events.bind(CameraController.EVENT_DENY + '.MouseAllowCameraView', function () {
                self.onCameraDeny();
            });

        },

        unbind: function () {

            CameraController.getInstance().events.unbind(CameraController.EVENT_ALLOW + '.MouseAllowCameraView');
            CameraController.getInstance().events.unbind(CameraController.EVENT_DENY + '.MouseAllowCameraView');

        },

        show: function () {

            if (!View.prototype.show.call(this)) {
                return;
            }

            this.bindEventsShown();

        },

        hide: function () {

            this.unbind();
            View.prototype.hide.call(this);

        }

    },

    _private: {

        onCameraAllow: function () {

            this.unbind();
            RoutingController.getInstance().route('/experience-loading');

        },

        onCameraDeny: function () {

            this.unbind();
            RoutingController.getInstance().route('/experience-loading');
        }

    }

});
