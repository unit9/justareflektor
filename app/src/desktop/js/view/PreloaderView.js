/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 5/28/13
 * Time: 4:35 PM
 */

var PreloaderView = View._extend({

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        show: function () {

            if (!View.prototype.show.call(this)) {
                return;
            }

            $('.code-loader').remove();
            PreloadController.getInstance().preloadMain();

            AnalyticsController.getInstance().trackPageView('PreloaderView');

        },

        hide: function () {

            View.prototype.hide.call(this);
            $('.code-loader').remove();

        }

    },

    _protected: {

        init: function () {

            this.$loaderIcon = this.$container.find('.loader-icon');

        }

    },

    _private: {

        $loaderIcon: null,

        bindEvents: function () {

            var self = this;

            PreloadController.getInstance().events.on(PreloadController.EVENT_MAIN_PROGRESS, function (e, progress) {

                self.onProgress(progress);

            });

            PreloadController.getInstance().events.on(PreloadController.EVENT_MAIN_COMPLETE, function () {

                self.onComplete();

            });

        },

        onProgress: function (progress) {

        },

        onComplete: function () {

            this.hide();
            RoutingController.getInstance().enabled = true;
            RoutingController.getInstance().route();

        }

    }

});
