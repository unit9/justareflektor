/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/12/13
 * Time: 4:16 PM
 */

var CameraDeniedView = View._extend({

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        show: function () {

            if (!View.prototype.show.call(this)) {
                return;
            }

            AnalyticsController.getInstance().trackPageView('CameraDeniedView');

        }

    },

    _private: {

        init: function () {

            this.$mouseMode = this.$container.find('a');

        },

        bindEvents: function () {

            var self = this;

            this.$mouseMode.bind('click', function () {
                self.onMouseModeClick();
            });

        },

        onMouseModeClick: function () {

            InputController.getInstance().setMode(InputController.INPUT_TYPE_MOUSE);
            RoutingController.getInstance().route('/experience-loading');

        }

    }

});
