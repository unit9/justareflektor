/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 7/6/13
 * Time: 10:17 PM
 */

var ExperienceLoadingView = View._extend({

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        init: function () {

            this.$progress = this.$container.find('.progress');

        },

        show: function () {

            if (!View.prototype.show.call(this)) {
                return;
            }

            this.bindEventsShown();
            setTimeout(function () {
                PreloadController.getInstance().preloadExperience();
            }, 4500);
            MobileController.getInstance().disableMagnifyingGlass();
            AnalyticsController.getInstance().trackPageView('ExperienceFullView');

        },

        hide: function () {

            this.unbindEventsHidden();

        }

    },

    _private: {

        $progress: null,
        selfReady: false,
        peerReady: false,
        lastSendTime: -1,

        bindEventsShown: function () {

            var self = this;

            PreloadController.getInstance().events.bind(PreloadController.EVENT_EXPERIENCE_PROGRESS + '.ExperienceLoadingView', function (e, progress) {
                self.onProgress(progress);
                return e;
            });

            PreloadController.getInstance().events.bind(PreloadController.EVENT_EXPERIENCE_COMPLETE + '.ExperienceLoadingView', function () {
                self.onComplete();
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_EXPERIENCE_START + '.ExperienceLoadingView', function () {
                self.onExperienceStart();
            });

        },

        unbindEventsHidden: function () {

            PreloadController.getInstance().events.unbind(PreloadController.EVENT_EXPERIENCE_PROGRESS + '.ExperienceLoadingView');
            PreloadController.getInstance().events.unbind(PreloadController.EVENT_EXPERIENCE_COMPLETE + '.ExperienceLoadingView');
            RemoteController.getInstance().events.unbind(RemoteController.EVENT_EXPERIENCE_START + '.ExperienceLoadingView');

        },

        tryGoNext: function () {

            if (this.selfReady && this.peerReady) {

                this.hide();
                ViewController.getInstance().getView('ControllerView').show();
                ViewController.getInstance().getView('ControllerView').setMaxExperienceTimeTimeout();

            }

        },

        onProgress: function (progress) {

            var currentTime = new Date().getTime();

            this.$progress.text(Math.round(progress * 100));
            if (currentTime - this.lastSendTime > 1000) {
                this.lastSendTime = currentTime;
                RemoteController.getInstance().reportLoadingProgress(progress);
            }

        },

        onComplete: function () {

            this.selfReady = true;
            ViewController.getInstance().getView('AxelleVideoView').initAsync();
            RemoteController.getInstance().reportLoadingProgress(1);
            RemoteController.getInstance().ready(true);
            this.tryGoNext();

            // Run the no sleep hack for iOS Safari
            if (!DetectionController.getInstance().isChrome) {
                // only Safari starts here, because if started earlier, the hack makes it difficult to navigate across the page
                MobileController.getInstance().preventSleep(true);  // true to force immediate hack cycle
            }

        },

        onExperienceStart: function () {

            this.peerReady = true;
            this.tryGoNext();

        }

    }

});
