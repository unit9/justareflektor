/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 6/19/13
 * Time: 3:58 PM
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

            PreloadController.getInstance().preloadMain();

            AnalyticsController.getInstance().trackPageView('PreloaderView');

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
                return e;
            });

            PreloadController.getInstance().events.on(PreloadController.EVENT_MAIN_COMPLETE, function () {
                self.onComplete();
            });

        },

        proceed: function () {

            this.hide();

            RoutingController.getInstance().enabled = true;
            RoutingController.getInstance().route();

            if ( /controller/g.test(window.location.href.toString())) {
                ViewController.getInstance().getView('ControllerView').show();
                MobileController.getInstance().preventSleep();
            }

        },

        tryReconnect: function (code) {

            var self = this;

            RemoteController.getInstance().tryReconnect(code, function () {
                // success
                console.log('*** reconnect success ***');
                self.hide();
                RoutingController.getInstance().enabled = true;
                RemoteController.getInstance().resynced = true;
                ViewController.getInstance().getView('JoinView').show(code);
            }, function () {
                // failure
                console.log('*** reconnect failure ***');
                self.proceed();
                return;
            });

        },

        onProgress: function (progress) {

            return progress;

        },

        onComplete: function () {

            if ($.cookie('code') && $.cookie('code').length === 5) {
                this.tryReconnect($.cookie('code'));
            } else {
                this.proceed();
            }

        }

    }

});
