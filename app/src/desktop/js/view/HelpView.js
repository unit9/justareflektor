/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/9/13
 * Time: 11:32 AM
 */

var HelpView = View._extend({

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        show: function () {

            if (!View.prototype.show.call(this)) {
                return;
            }

            CameraController.getInstance().init();
            this.trackingDebugView.show();
            this.initTracking();
            RemoteController.getInstance().hideTurnItBack();
            this.$code.text(RemoteController.getInstance().getConnectionCode());
            this.$container.removeClass('active');

            if (CameraController.getInstance().videoReady) {
                this.onCameraReady();
            }

            if (DetectionController.getInstance().isChromeOnIOSonMobile) {
                this.$container.find('.two-columns .regular').hide();
                this.$container.find('.two-columns .touch').show();
            } else {
                this.$container.find('.two-columns .regular').show();
                this.$container.find('.two-columns .touch').hide();
            }

            ViewController.getInstance().getView('ExperienceLoadingView').pause();
            AnalyticsController.getInstance().trackPageView('HelpView');
            TrackingController.getInstance().start();
            RemoteController.getInstance().hideAxelle();

        },

        hide: function () {

            View.prototype.hide.call(this);
            ViewController.getInstance().getView('ExperienceLoadingView').resume();
            this.unbindEventsHidden();
            if (this.trackingDebugView) this.trackingDebugView.hide();
            this.stopTracking();

        }

    },

    _private: {

        trackingDebugView: null,
        $code: null,
        $buttonClose: null,
        $camera: null,
        $buttonDownloadChrome: null,
        cameraInitialised: false,


        init: function () {

            this.$code = this.$container.find('.code');
            this.$buttonClose = this.$container.find('button.close');
            this.$camera = this.$container.find('.camera');
            this.$buttonDownloadChrome = this.$container.find('.disconnected p a');
            this.$buttonDownloadChrome.attr('target', '_blank');
//            this.trackingDebugView = new HelpOrientationView('HelpOrientationView', '.HelpView .display.orientation');
            this.trackingDebugView = new DebugView('HelpTrackingView', '.HelpView .display.trackingDebug');
            TrackingController.getInstance().addDebugView(this.trackingDebugView);

        },

        bindEvents: function () {

            var self = this;

            if (!CameraController.getInstance().videoReady) {

                CameraController.getInstance().events.bind(CameraController.EVENT_VIDEO_READY + '.HelpView', function () {
                    self.onCameraReady();
                });

            } else {

                this.onCameraReady();

            }

            RemoteController.getInstance().events.bind(RemoteController.EVENT_PEER_ENTER + '.HelpView', function () {
                self.onPeerEnter();
            });

            this.$buttonClose.bind('click', function () {
                self.onButtonCloseClick();
            });

        },

        initTracking: function () {

            TrackingController.getInstance().init();
            TrackingController.getInstance().start();

        },

        stopTracking: function () {

        },

        unbindEventsHidden: function () {

            TrackingController.getInstance().events.unbind(TrackingController.EVENT_UPDATE + '.HelpView');

        },

        onButtonCloseClick: function () {

            ViewController.getInstance().getView('PersistentControlsView').onButtonHelpClick();

        },

        onCameraReady: function () {

            this.$container.addClass('active');
            this.$container.removeClass('break-free');

            if (TimelineController.getInstance().currentTime > ExperienceView.BREAK_FREE_START_TIME) {
                this.$container.addClass('break-free');
            } else if (RemoteController.getInstance().isConnected()) {
                this.$container.addClass('connected');
            } else {
                this.$container.removeClass('connected');
            }

        },

        onPeerEnter: function () {

            if (this.shown) {
                this.onButtonCloseClick();
            }

        }

    }

});
