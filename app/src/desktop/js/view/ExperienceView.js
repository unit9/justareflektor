/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 5/29/13
 * Time: 4:23 PM
 */

var ExperienceView = View._extend({

    _static: {

        KEY_TOGGLE_PLAYBACK: 32, // spacebar

        BREAK_FREE_ENABLED: false,
        MOUSE_DISTANCE_TO_BREAK_FREE: 4,
        GYRO_DIFFERENCE_TO_BREAK_FREE: 0.018,
        BREAK_FREE_START_TIME: 282,
        GYRO_BREAK_FREE_START_TIME_OFFSET: 6

    },

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },


        show: function () {

            var self = this;

            if (!View.prototype.show.call(this)) {
                return;
            }

            if (InputController.getInstance().mode === InputController.INPUT_TYPE_TRACKING) {
                CameraController.getInstance().init();
            }

            TrackingController.getInstance().init();
            TrackingController.getInstance().start();
            OrientationController.getInstance().start();

            switch (InputController.getInstance().mode) {

            case InputController.INPUT_TYPE_MOUSE:
                AnalyticsController.getInstance().trackEvent(AnalyticsController.EVENT_MODE_MOUSE);
                break;

            case InputController.INPUT_TYPE_TRACKING:
                AnalyticsController.getInstance().trackEvent(AnalyticsController.EVENT_MODE_CAMERA);
                break;

            }

            this.onDeviceActive();
            this.$inactiveOverlay.css('display', 'none');
            this.wasExperiencePlayingBeforeInactive = false;
            this.hideOverlay();
            this.canShowOverlay = false;

            Player.getInstance().startPreloadingVideo();
            RoutingController.getInstance().historyStates = [];
            AnalyticsController.getInstance().trackPageView('ExperienceView');
            TimelineController.getInstance().start();
            ViewController.getInstance().getView('TimelineView').slideOut(true);
            ViewController.getInstance().getView('PersistentControlsView').showQuality();

            ViewController.getInstance().getView('PersistentControlsView').slideIn();
            ViewController.getInstance().getView('PersistentControlsView').canSlideOut = false;
            setTimeout(function () {
                ViewController.getInstance().getView('PersistentControlsView').canSlideOut = true;
            }, 9000);
            ViewController.getInstance().getView('PersistentControlsView').slideOut({delay: 10000, force: true});

            AnimationController.getInstance().events.bind(AnimationController.EVENT_FRAME + '.ExperienceView', function () {
                self.onFrame();
            });

            $(document).bind('mousemove.ExperienceView', function (event) {
                self.onMouseMove(event);
            });

            $(document).bind('click.ExperienceView', function () {
                self.onMouseClick();
            });

            RemoteController.getInstance().sleepMonitorEnabled = true;
            console.log('-- starting to monitor device sleep');
            
        },

        hide: function () {

            View.prototype.hide.call(this);
            AnimationController.getInstance().events.unbind(AnimationController.EVENT_FRAME + '.ExperienceView');
            $(document).unbind('mousemove.ExperienceView');
            $(document).unbind('click.ExperienceView');
            TimelineController.getInstance().stop();
            ViewController.getInstance().getView('PersistentControlsView').hideQuality();

        }

    },

    _private: {

        $breakFree: null,
        $inactiveOverlay: null,
        keyDown: false,
        breakFreeStyle: null,
        lastMousePosition: {x: 0, y: 0},
        currentMousePosition: {x: 0, y: 0},
        lastGyroVector: {x: 0, y: 0, z: 0},
        isBreakFree: false,
        canBreakFree: true,
        clicked: true,
        wasExperiencePlayingBeforeInactive: false,
        inactive: false,
        canShowOverlay: false,

        showOverlay: function () {

            if (this.canShowOverlay) {
                $(".ExperienceView .overlay").stop().fadeIn();
            } else {
                this.canShowOverlay = true;
            }

        },

        hideOverlay: function () {

            $(".ExperienceView .overlay").stop().fadeOut();

        },

        init: function () {

            this.$breakFree = this.$container.find('.break-free-content');
            this.$inactiveOverlay = this.$container.find('.inactive-overlay');
            this.$inactiveOverlay.css('display', 'none');
            this.breakFreeStyle = this.$breakFree[0].style;
            this.breakFreeStyle.opacity = 0;

        },

        breakFree: function () {

            var self = this;

            if (this.canBreakFree) {
                TweenLite.to(this.$breakFree, 0, {css: {opacity: 1}});
                TweenLite.to(this.$breakFree, 0, {css: {opacity: 0}, delay: 0.3});
                TweenLite.to(this.$breakFree, 0.3 + (InputController.getInstance().mode === InputController.INPUT_TYPE_TRACKING ? 3 : 0), {onComplete: function () {
                    self.canBreakFree = true;
                }});
                this.canBreakFree = false;
            }

        },

        unBreakFree: function () {

            return;

        },

        bindEvents: function () {

            var self = this;

            Player.getInstance().events.bind(Player.EVENT_CONNECTING_MESSAGE_SHOW + '.ExperienceView', function () {
                self.showOverlay();
            });

            Player.getInstance().events.bind(Player.EVENT_CONNECTING_MESSAGE_HIDE + '.ExperienceView', function () {
                self.hideOverlay();
            });

            Player.getInstance().events.bind(Player.EVENT_SEEKED + '.ExperienceView', function () {
                self.onSeeked();
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_DEVICE_ACTIVE + '.ExperienceView', function () {
                self.onDeviceActive();
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_DEVICE_INACTIVE + '.ExperienceView', function () {
                self.onDeviceInactive();
            });

            $(document).bind('keydown.ExperienceView', function (event) {
                self.onKeyDown(event);
            });

            $(document).bind('keyup.ExperienceView', function (event) {
                self.onKeyUp(event);
            });

        },

        onKeyDown: function (event) {

            if (this.shown && !this.keyDown) {
                if (event.which === ExperienceView.KEY_TOGGLE_PLAYBACK && !this.inactive && !ViewController.getInstance().getView('DeviceDisconnectedView').shown) {
                    this.keyDown = true;
                    TimelineController.getInstance().toggle();
                }
            }

        },

        onKeyUp: function (event) {

            if (event.which === ExperienceView.KEY_TOGGLE_PLAYBACK) {
                this.keyDown = false;
            }

        },

        onMouseMove: function (event) {

            this.currentMousePosition.x = event.originalEvent.pageX;
            this.currentMousePosition.y = event.originalEvent.pageY;

        },

        onMouseClick: function () {

            if (TimelineController.getInstance().currentTime > ExperienceView.BREAK_FREE_START_TIME) {
                this.clicked = true;
            }

        },

        onFrame: function () {

            var posDifX,
                posDifY,
                orientationVector,
                orientationDiffX,
                orientationDiffY,
                orientationDiffZ;

            if (!this.shown) {
                return;
            }

            if (ExperienceView.BREAK_FREE_ENABLED &&  TimelineController.getInstance().currentTime > ExperienceView.BREAK_FREE_START_TIME) {

                if (this.isBreakFree) {

                    this.unBreakFree();

                } else {

                    if (InputController.getInstance().mode === InputController.INPUT_TYPE_TRACKING) {

                        if (TimelineController.getInstance().currentTime > ExperienceView.BREAK_FREE_START_TIME + ExperienceView.GYRO_BREAK_FREE_START_TIME_OFFSET) {
                            orientationVector = new THREE.Vector3(0, 0, 1);
                            orientationVector.applyQuaternion(OrientationController.getInstance().worldQuaternion);

                            orientationDiffX = orientationVector.x - this.lastGyroVector.x;
                            orientationDiffY = orientationVector.y - this.lastGyroVector.y;
                            orientationDiffZ = orientationVector.z - this.lastGyroVector.z;

                            if (orientationDiffX > ExperienceView.GYRO_DIFFERENCE_TO_BREAK_FREE || orientationDiffX < -ExperienceView.GYRO_DIFFERENCE_TO_BREAK_FREE || orientationDiffY > ExperienceView.GYRO_DIFFERENCE_TO_BREAK_FREE || orientationDiffY < -ExperienceView.GYRO_DIFFERENCE_TO_BREAK_FREE || orientationDiffZ > ExperienceView.GYRO_DIFFERENCE_TO_BREAK_FREE || orientationDiffZ < -ExperienceView.GYRO_DIFFERENCE_TO_BREAK_FREE) {
                                this.breakFree();
                            }
                        }

                    } else {

//                        posDifX = this.currentMousePosition.x - this.lastMousePosition.x;
//                        posDifY = this.currentMousePosition.y - this.lastMousePosition.y;

                        if (this.currentMousePosition.y < window.innerHeight - 60 && (this.clicked)) {// || posDifX > ExperienceView.MOUSE_DISTANCE_TO_BREAK_FREE || posDifX < -ExperienceView.MOUSE_DISTANCE_TO_BREAK_FREE || posDifY > ExperienceView.MOUSE_DISTANCE_TO_BREAK_FREE || posDifY < -ExperienceView.MOUSE_DISTANCE_TO_BREAK_FREE)) {
                            this.breakFree();
                        }

                    }

                }

            }

            if (!orientationVector) {
                orientationVector = new THREE.Vector3(0, 0, 1);
                orientationVector.applyQuaternion(OrientationController.getInstance().worldQuaternion);
            }

            this.lastGyroVector.x = orientationVector.x;
            this.lastGyroVector.y = orientationVector.y;
            this.lastGyroVector.z = orientationVector.z;

            this.lastMousePosition.x = this.currentMousePosition.x;
            this.lastMousePosition.y = this.currentMousePosition.y;
            this.clicked = false;

        },

        onDeviceActive: function () {

            if (this.inactive) {

                this.inactive = false;
                ViewController.getInstance().getView('DeviceDisconnectedView').onPeerReady();

            }

        },

        onDeviceInactive: function () {

            if (!this.inactive) {
                this.inactive = true;
                if (TimelineController.getInstance().canShowDisconnectionError()) {
                    ViewController.getInstance().getView('DeviceDisconnectedView').show(true);
                }
            }

        },

        onSeeked: function () {

            if (this.inactive) {
                this.inactive = false;
                this.onDeviceInactive();
            }

        }

    }

});
