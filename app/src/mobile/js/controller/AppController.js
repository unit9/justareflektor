/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 6/19/13
 * Time: 3:08 PM
 */

var AppController = Class._extend(Class.SINGLETON, {

    _public: {

        construct: function () {

            this.init();
            this.bindEvents();

        },

        init: function () {

            DetectionController.getInstance().detectAll();

        },

        bindEvents: function () {

            var self = this;

            PreloadController.getInstance().events.on(PreloadController.EVENT_INITIAL_COMPLETE, function () {

                self.onPreloadInitialComplete();

            });

        },

        start: function () {

            var run = function () {
                PreloadController.getInstance().preloadInitial();
                AnimationController.getInstance().start();
            };

            switch (Config.getInstance()._class) {
                case ConfigLocal:
                case ConfigDev:
//                case ConfigTest:
//                case ConfigProd:
                    Debug.enabled = true;
                    Debug.init(function () {
                        run();
                    });
                    break;

                default:
                    run();
            }

        },

        onPreloadInitialComplete: function () {

            MobileController.getInstance().hideAddressBar();
            if (DetectionController.getInstance().isChrome) {
                // only chrome starts early because it needs touch input to work
                MobileController.getInstance().preventSleep();
            }
            RoutingController.getInstance().route();

        }

    }

});
