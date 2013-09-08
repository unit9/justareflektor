/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/5/13
 * Time: 3:21 PM
 */

var ExperienceLoadingView = View._extend({

    _static: {

        MIN_LOADING_TIME_MS: 20000,
        PHONE_NOT_DETECTED_TIMEOUT: 20000,
        SHOW_DESKTOP_PROGRESS_UNTIL: 25,
        MAX_DESKTOP_PROGRESS_STEP: 0.1,
        MAX_PROGRESS_STEP: 0.4

    },

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);
            this.loadingTimeoutId = -1;

        },

        show: function () {

            if (!View.prototype.show.call(this)) {
                return;
            }

            if (!this.interactionView) {
                // we don't initialise it earlier because it requires WebGL to work, would break other browsers
                this.interactionView = new WebcamControlView('WebcamControlView', '.ExperienceLoadingView .WebcamControlView');
            }

	        if (InputController.getInstance().mode === InputController.INPUT_TYPE_MOUSE) {
		        // put loading info in mouse-only dom element
		        var $newLoading = this.$container.find('.loading-mouse-only');
		        $newLoading.html(this.$loading.html());
		        this.$loading = $newLoading;
		        this.$progress = this.$loading.find('.progress');
		        this.$loading = this.$loading.find('.loading');
	        }

            this.paused = false;
            this.peerReady = false;
            this.selfReady = false;
            this.loaded = false;
            this.tweenedProgress = 0;
            this.peerProgress = 0;
            this.selfProgress = 0;
            this.phoneDetectedFrames = 0;
            this.bindEventsShown();
            this.loadingStartTime = InputController.getInstance().mode === InputController.INPUT_TYPE_TRACKING ? -1 : 0;
            OrientationController.getInstance().resetResetInformation();
            OrientationController.getInstance().start();

            if (InputController.getInstance().mode === InputController.INPUT_TYPE_TRACKING) {
                this.interactionView.show();
                this.video.src = Resource.get(DetectionController.getInstance().isChromeOnIOSonMobile ? 'media/video/instructions-touch-0.webm' : 'media/video/instructions-regular.webm');
                this.video.play();

                if (DetectionController.getInstance().isChromeOnIOSonMobile) {
                    this.video2.src = Resource.get('media/video/instructions-touch.webm');
                    this.video2.load();
                }
            }

            this.$loading.stop().show();

            if (DetectionController.getInstance().isChromeOnIOSonMobile) {
                this.$container.find('.instructions.regular').hide();
                this.$container.find('.instructions.touch').show();
            } else {
                this.$container.find('.instructions.regular').show();
                this.$container.find('.instructions.touch').hide();
            }

            // As long as the mobile is loading, it will not be able to keep sending gyro data fast enough, so disable the monitor.
            AnalyticsController.getInstance().trackPageView('ExperienceLoadingView');
            this.waitForPhoneDetected();

            this.loadingTimeoutId = setTimeout(function () {
                PreloadController.getInstance().preloadExperience();
            }, View.TRANSITION_TIME);

            Debug.openFolder('ExperienceLoading');

        },

        transitionHide: function () {

            var self = this;

            clearTimeout(this.showTimeoutId);
            clearTimeout(this.hideTimeoutId);

            this.$container.show();
            TweenLite.to(this.$page, View.TRANSITION_TIME * 0.001, {css: {opacity: 0}, ease: Power2.easeIn, delay: 0.05, onComplete: function () {
                self.endTransitionHide();
            }});

        },

        hide: function () {

            View.prototype.hide.call(this);
            clearTimeout(this.loadingTimeoutId);
            clearTimeout(this.phoneNotDetectedTimeoutId);
            clearTimeout(this.tryGoNextTimeoutId);
            this.unbindEventsHidden();

            Debug.closeFolder('ExperienceLoading');

        },

        /**
         * HelpView, when opening, pauses this page
         */
        pause: function () {

            if (!this.shown) {
                return;
            }

            this.paused = true;
            this.pauseTime = new Date().getTime();
            clearTimeout(this.phoneNotDetectedTimeoutId);

        },

        /**
         * HelpView, when closing, resumes this page
         */
        resume: function () {

            if (!this.shown) {
                return;
            }

            this.paused = false;
            this.loadingStartTime += new Date().getTime() - this.pauseTime;
            this.waitForPhoneDetected();

        }

    },

    _private: {

        $progress: null,
        $video: null,
        $error: null,
        paused: false,
        pauseTime: 0,
        video: null,
        interactionView: null,
        peerReady: false,
        peerProgress: 0,
        phoneDetectedFrames: 0,
        selfReady: false,
        loaded: false,
        selfProgress: 0,
        tweenedProgress: 0,
        loadingStartTime: -1,
        tryGoNextTimeoutId: -1,
        lastPosition: {x: 0, y: 0, z: 0},
        orientationReset: false,
        phoneNotDetectedTimeoutId: -1,
        loadingTimeoutId: -1,

        init: function () {

            this.$progress = this.$container.find('.progress');
            this.$loading = this.$container.find('.loading');
            this.$video = this.$container.find('video');
            this.$error = this.$container.find('.error');

            this.video = this.$video[0];
            this.video.loop = true;
            this.video2 = this.$video[1];
            this.video2.loop = true;
            $(this.video2).hide();

            this.$error.hide();

            // Debug
            Debug.add(this, 'selfProgress', 'ExperienceLoading');
            Debug.add(this, 'peerProgress', 'ExperienceLoading');

        },

        bindEventsShown: function () {

            var self = this;

            PreloadController.getInstance().events.bind(PreloadController.EVENT_EXPERIENCE_PROGRESS + '.ExperienceLoadingView', function (e, progress) {
                self.onProgress(progress);
            });

            PreloadController.getInstance().events.bind(PreloadController.EVENT_EXPERIENCE_COMPLETE + '.ExperienceLoadingView', function () {
                self.onComplete();
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_PEER_LOADING_PROGRESS + '.ExperienceLoadingView', function (event, data) {
                self.onPeerProgress(data);
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_PEER_READY + '.ExperienceLoadingView', function () {
                self.onPeerReady();
            });

            TrackingController.getInstance().events.bind(TrackingController.EVENT_UPDATE + '.ExperienceLoadingView', function () {
                self.onTrackingUpdate();
            });

            AnimationController.getInstance().events.bind(AnimationController.EVENT_FRAME + '.ExperienceLoadingView', function () {
                self.onFrame();
            });

        },

        unbindEventsHidden: function () {

            PreloadController.getInstance().events.unbind(PreloadController.EVENT_EXPERIENCE_PROGRESS + '.ExperienceLoadingView');
            PreloadController.getInstance().events.unbind(PreloadController.EVENT_EXPERIENCE_COMPLETE + '.ExperienceLoadingView');
            RemoteController.getInstance().events.unbind(RemoteController.EVENT_PEER_LOADING_PROGRESS + '.ExperienceLoadingView');
            RemoteController.getInstance().events.unbind(RemoteController.EVENT_PEER_READY + '.ExperienceLoadingView');
            TrackingController.getInstance().events.unbind(TrackingController.EVENT_UPDATE + '.ExperienceLoadingView');
            AnimationController.getInstance().events.unbind(AnimationController.EVENT_FRAME + '.ExperienceLoadingView');

        },

        tryGoNext: function () {

            var self = this;

            clearTimeout(this.tryGoNextTimeoutId);
            if (!this.shown || this.paused || (this.loadingStartTime === -1 && InputController.getInstance().mode === InputController.INPUT_TYPE_TRACKING)) {
                return;
            }

            if (this.loaded && this.selfReady && (this.peerReady || InputController.getInstance().mode === InputController.INPUT_TYPE_MOUSE)) {

                // If we're in tracking mode, ensure the interaction in the loading screen takes at least 20 seconds.
                if (InputController.getInstance().mode === InputController.INPUT_TYPE_TRACKING && new Date().getTime() - this.loadingStartTime < ExperienceLoadingView.MIN_LOADING_TIME_MS) {

                    this.tryGoNextTimeoutId = setTimeout(function () {
                        self.tryGoNext();
                    }, 1000);
                    return;

                }

                TrackingController.getInstance().events.unbind(TrackingController.EVENT_UPDATE + '.ExperienceLoadingView');
                AnalyticsController.getInstance().trackEvent(AnalyticsController.EVENT_SYNC_FULL);
                RemoteController.getInstance().start();
                this.hide();
                setTimeout(function () {
                    self.interactionView.hide();
                    RoutingController.getInstance().route('/experience');
                }, 2500);

            }

        },

        waitForPhoneDetected: function () {

            var self = this;

            clearTimeout(this.phoneNotDetectedTimeoutId);
            this.phoneNotDetectedTimeoutId = setTimeout(function () {
                self.onPhoneNotDetected();
            }, ExperienceLoadingView.PHONE_NOT_DETECTED_TIMEOUT);

        },

        getCombinedProgress: function () {

            var progress = 0;

            if (InputController.getInstance().mode === InputController.INPUT_TYPE_TRACKING) {
                if (this.peerProgress < ExperienceLoadingView.SHOW_DESKTOP_PROGRESS_UNTIL && this.selfProgress < ExperienceLoadingView.SHOW_DESKTOP_PROGRESS_UNTIL) {
                    progress = Math.max(this.selfProgress, this.peerProgress);
                } else if (this.peerProgress < ExperienceLoadingView.SHOW_DESKTOP_PROGRESS_UNTIL) {
                    progress = ExperienceLoadingView.SHOW_DESKTOP_PROGRESS_UNTIL;
                } else {
                    progress = Math.min(this.selfProgress, this.peerProgress);
                }
            } else {
                progress = this.selfProgress;
            }

            return progress;

        },

        updateComplete: function () {

            if (this.selfReady && (this.peerReady || InputController.getInstance().mode === InputController.INPUT_TYPE_MOUSE)) {

                if (InputController.getInstance().mode === InputController.INPUT_TYPE_MOUSE) {
                    this.tryGoNext();
                }

            }

        },

        onProgress: function (progress) {

            this.selfProgress = progress * 100;

        },

        onPeerProgress: function (progress) {

            this.peerProgress = progress * 100;

        },

        onComplete: function () {

            this.selfProgress = 100;
            this.selfReady = true;

        },

        onPeerReady : function () {

            this.peerReady = true;

        },

        onTrackingUpdate: function () {

            var position = TrackingController.getInstance().getFrameInfo();

            if (this.paused) {
                return;
            }

            if (ViewController.getInstance().getView('HelpView').shown) {
                return;
            }

            if ((position.x !== this.lastPosition.x || position.y !== this.lastPosition.y || position.z !== this.lastPosition.z) && TrackingController.getInstance().isVisible()) {
                this.onPhoneDetected();
            }

            this.lastPosition.x = position.x;
            this.lastPosition.y = position.y;
            this.lastPosition.z = position.z;

        },

        onPhoneDetected: function () {

            var self = this;

            if (++this.phoneDetectedFrames === 5) {
                if (DetectionController.getInstance().isChromeOnIOSonMobile) {
                    setTimeout(function () {
                        self.video2.style.display = 'block';
                        self.video2.play();
                        self.video.style.display = 'none';
                        self.video.pause();
                    }, (this.video.duration - this.video.currentTime) * 1000);
                }
            }

            if (this.loadingStartTime === -1) {
                this.loadingStartTime = new Date().getTime();
            }
            this.$error.fadeOut();
            clearTimeout(this.phoneNotDetectedTimeoutId);
            this.waitForPhoneDetected();
            this.tryGoNext();

        },

        onPhoneNotDetected: function () {

            this.$error.fadeIn();

        },

        onFrame: function () {

            // TurnItBack sequence starting at interaction0
            if (!ViewController.getInstance().getView('HelpView').shown && OrientationController.getInstance().timesReset > 0 && (Math.abs(OrientationController.getInstance().worldQuaternion.x) > TurnItBackSequence.MIN_ROTATION / 180 || Math.abs(OrientationController.getInstance().worldQuaternion.y) > TurnItBackSequence.MIN_ROTATION / 180)) {
                RemoteController.getInstance().showTurnItBack();
            } else {
                RemoteController.getInstance().hideTurnItBack();
            }


            if (!this.loaded) {

                this.tweenedProgress += Math.min(this.getCombinedProgress() - this.tweenedProgress, this.getCombinedProgress() <= ExperienceLoadingView.SHOW_DESKTOP_PROGRESS_UNTIL ? ExperienceLoadingView.MAX_DESKTOP_PROGRESS_STEP : ExperienceLoadingView.MAX_PROGRESS_STEP);
                this.$progress.text(Math.floor(this.tweenedProgress) + '%');

                if (Math.floor(this.tweenedProgress) >= 100) {
                    this.$progress.text('100%');
                    this.$loading.fadeOut();
                    this.loaded = true;
                    this.updateComplete();
                }

            }

        },

        onMouseMode: function () {

            this.tryGoNext();

        }

    }

});
