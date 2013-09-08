/**
 * @author Maciej Zasada maciej@unit9.com
 * @author Paweł Klimkowski pawel.klimkowski@unit9.com / pawel@sqrtx.pl
 * @copyright UNIT9 Ltd.
 * Date: 5/28/13
 * Time: 1:13 PM
 */

var AppController = Class._extend(Class.SINGLETON, {

    _public: {

        construct: function () {

            this.init();
            this.bindEvents();

        },

        init: function () {

            DetectionController.getInstance().detectAll();

            Resource.local = Config.getInstance().localResources;

            //TrackingController.getInstance().DEBUG_MODE = true;
            //TrackingController.getInstance().USE_WEBWORKER_FOR_OPENCV = false;

        },

        bindEvents: function () {

            var self = this;

            PreloadController.getInstance().events.on(PreloadController.EVENT_INITIAL_COMPLETE, function () {

                self.onPreloadInitialComplete();

            });

        },

        beginPreload: function () {

            var preload = function () {
                PreloadController.getInstance().preloadInitial();
                PreloadController.getInstance().preloadResources();
                PreloadController.getInstance().preloadTimelineData();
            };

            switch (Config.getInstance()._class) {

                case ConfigLocal:
                case ConfigDev:
//                case ConfigTest:
//                case ConfigProd:
                    console.log('// INIT DEBUG //');
                    window.Debug.enabled = true;
                    window.Debug.init(preload);
                    break;

                default:
                    console.log('// INIT DEFAULT //');
                    preload();
                    break;

            }

        },

        start: function () {

            var self = this;

            AnimationController.getInstance().start();
            PerformanceController.getInstance().initialize();

            var modesFPS = [
                {name: 'LOW', min: 0, max: 20},
                {name: 'MEDIUM', min: 20, max: 40},
                {name: 'HIGH', min: 40, max: Infinity}
            ];

            var modesSPEED = [
                {name: 'LOW', min: 0, max: 6},
                {name: 'MEDIUM', min: 7, max: 14},
                {name: 'HIGH', min: 20, max: Infinity}
            ];

            // Unlimited mode
            // PerformanceController.getInstance().startMonitoringPerformance(PerformanceController.THRESHOLD_UNLIMITED);
            // PerformanceController.getInstance().setPerformanceThresholds({ step: 5, min: 30, max: 40});

            // Limited mode
            PerformanceController.getInstance().startMonitoringPerformance(PerformanceController.THRESHOLD_LIMITED);
            PerformanceController.getInstance().setPerformanceThresholds(modesFPS);

            // Connection speed test before preload.
            PerformanceController.getInstance().events.on(PerformanceController.EVENT_BANDWIDTH_READY, function () {
               // DetectionController.getInstance().detectBandwidth();
                
            });

            PerformanceController.getInstance().setBandwidthThresholds(modesSPEED);
            PerformanceController.getInstance().detectBandwidth();
            PerformanceController.getInstance().detectLowFPS(10);
            PerformanceController.getInstance().detectHighLowFramerate(true);

            // We're no longer showing the performance warning message
//            PerformanceController.getInstance().events.on(PerformanceController.EVENT_LOW_FPS, function () {
//                ViewController.getInstance().getView('PerformanceWarningView').show();
//            });

            Viewport.getInstance().update();

            self.beginPreload();

        },

        onPreloadInitialComplete: function () {

            RoutingController.getInstance().route();

        }

    }

});
