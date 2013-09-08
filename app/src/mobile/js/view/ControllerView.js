/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/2/13
 * Time: 2:50 PM
 */

var ControllerView = View._extend({

    _static: {

        ORIENTATION_SEND_INTERVAL: 10,
        COLOUR_ACTIVE: '00ffff',
        COLOUR_INACTIVE: '4f4f4f',
        BUTTON_TOUCH_TIMEOUT: 30000,
        MAX_EXPERIENCE_TIME_TIMEOUT: 15 * 60 * 1000, // 15 minutes
        MAX_TRACKER_SIZE: 350

    },

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        show: function () {

            if (this.shown || !View.prototype.show.call(this)) {
                return;
            }

            this.buttonTouchView.show();

            this.bindEventsShown();

            //moved after the animation

            //if (!DetectionController.getInstance().isChrome) {
            //    // only Safari starts here, because if started earlier, the hack makes it difficult to navigate across the page
            //    MobileController.getInstance().preventSleep();
            //}

            OrientationController.getInstance().start();

            if (DetectionController.getInstance().isChrome) {
                //need to detect if chrome because sometimes, the address bar is not on "top" of the page but it is moving it down
                //so we force the page to be as height as innerHeight. If resize occurs, the page height will be set again correctly.
                $('.main').height(window.innerHeight);
            }

            //this.drawTracker();
            TimelineController.getInstance().start();
            $.cookie('code', RemoteController.getInstance().mesh.id, {expires: 1});
            AnalyticsController.getInstance().trackPageView('ControllerView');

            this.buildTimeline();

        },

        hide: function () {

            View.prototype.hide.call(this);
            this.buttonTouchView.hide();
            TimelineController.getInstance().stop();
            this.unbindEventsHidden();

        }

    },

    _private: {

        // debug
        x: 0.0001,
        y: 0.0001,
        z: 0.0001,
        uTime: 0.0001,
        sTime: 0.0001,
        lastUpdateTime: 0,

        $buttonTouch: null,
        buttonTouchView: null,
        $time: null,
        $canvas: null,
        canvas: null,
        context: null,
        contextMirror: null,
        touchMode: false,
        isTouched: false,
        isLandscape: false,
        buttonTouchTimeoutId: -1,
        lightpc: 1.0,
        holepc: 0.5,
        blackScreen: false,
        lastOrientationSendTime: 0,
        lastLuminosityMessage: 0,
        drawAnimation: false,
        animOptions: {},
        timeline: null,

        imageLogo: null,
        imageLogo2: null,


        init: function () {

            this.buttonTouchView = ViewController.getInstance().getView('TouchButtonView');
            this.$buttonTouch = this.buttonTouchView.$container.find('button.touch');
            this.$canvas = this.$container.find('canvas.tracker');
            this.$time = this.$container.find('.debug .time');
            this.canvas = this.$canvas[0];
            this.context = this.canvas.getContext('2d');
            this.touchMode = (DetectionController.getInstance().isIos && DetectionController.getInstance().isChrome) || window.top.document !== window.document;
            this.drawAnimation = true;

            if (this.touchMode) {
                this.$buttonTouch.show();
            }

            this.currentColor = ControllerView.COLOUR_ACTIVE;

            Debug.add(this, 'x', 'Gyro');
            Debug.add(this, 'y', 'Gyro');
            Debug.add(this, 'z', 'Gyro');
            Debug.add(this, 'uTime', 'Gyro');
            Debug.add(this, 'sTime', 'Gyro');

            window.startTime = Date.now();

        },

        /**
         * Sets maximum experience time timeout.
         * If the user stays longer in the experience we disconnect.
         */
        setMaxExperienceTimeTimeout: function () {

            clearTimeout(this.maxExperienceTimeTimeoutId);
            this.maxExperienceTimeTimeoutId = setTimeout(function () {
                window.location.href = '/m/disconnected';
            }, ControllerView.MAX_EXPERIENCE_TIME_TIMEOUT);

        },

        lightDebug: function (e) {

            this.holepc = 0.25 + 0.4 * e.touches[0].pageX / window.innerWidth;
            this.lightpc = 1.0 - 0.5 * (e.touches[0].pageX / window.innerWidth);
            this.drawTracker();

        },

        onLuminosityChange: function (data) {

            this.lightpc = data[0];
            this.holepc = data[1];
            this.lastLuminosityMessage = Math.floor(Date.now() - window.startTime);
            this.drawTracker();

        },

        bindEvents: function () {

            var self = this;

//            this.$buttonTouch.bind('touchstart', function () {
//                self.onButtonTouchTouchStart();
//            });
//
//            this.$buttonTouch.bind('touchend', function () {
//                alert('touch end');
//                self.onButtonTouchTouchEnd();
//            });

        },

        bindEventsShown: function () {

            var self = this;

            RemoteController.getInstance().events.bind(RemoteController.EVENT_AXELLE_START + '.ControllerView', function (e, data) {
                self.onAxelleStart(data);
                return e;
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_AXELLE_PAUSE + '.ControllerView', function (e, data) {
                self.onAxellePause(data);
                return e;
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_AXELLE_HIDE + '.ControllerView', function () {
                self.onAxelleHide();
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_LUMINOSITY_CHANGE + '.ControllerView', function (e, data) {
                self.onLuminosityChange(data);
            });

            OrientationController.getInstance().events.bind(OrientationController.EVENT_ORIENTATION_CHANGE + '.ControllerView', function () {
                self.onOrientationChange();
            });

            MobileController.getInstance().events.bind(MobileController.STATE_FINGER_DOWN + '.ControllerView', function () {
                self.onButtonTouchTouchStart();
            });

            MobileController.getInstance().events.bind(MobileController.STATE_FINGER_UP + '.ControllerView', function () {
                self.onButtonTouchTouchEnd();
            });

            AnimationController.getInstance().events.bind(AnimationController.EVENT_FRAME + '.ControllerView', function () {
                self.onFrame();
            });

        },

        unbindEventsHidden: function () {

            RemoteController.getInstance().events.unbind(RemoteController.EVENT_AXELLE_START + '.ControllerView');
            RemoteController.getInstance().events.unbind(RemoteController.EVENT_AXELLE_PAUSE + '.ControllerView');
            RemoteController.getInstance().events.unbind(RemoteController.EVENT_AXELLE_HIDE + '.ControllerView');
            RemoteController.getInstance().events.unbind(RemoteController.EVENT_LUMINOSITY_CHANGE + '.ControllerView');
            OrientationController.getInstance().events.unbind(OrientationController.EVENT_ORIENTATION_CHANGE + '.ControllerView');
            MobileController.getInstance().events.unbind(MobileController.STATE_FINGER_DOWN + '.ControllerView');
            AnimationController.getInstance().events.unbind(AnimationController.EVENT_FRAME + '.ControllerView');

        },

        onPortraitLandscapeChange: function () {
            switch (window.orientation) {
                case -90:
                    this.$buttonTouch.removeClass('right').addClass('left');
                    this.isLandscape = true;
                    break;
                case 90:
                    this.$buttonTouch.removeClass('left').addClass('right');
                    this.isLandscape = true;
                    break;
                default:
                    this.$buttonTouch.removeClass('left right');
                    this.isLandscape = false;
                    break;
            }
        },

        buildTimeline: function () {

            var self = this,
                onAnimComplete = function () {
                self.drawAnimation = false;

                // The no sleep hack is moved to loading complete handler as it sometimes seems to cancel currently ongoing http requests. See ExperienceLoadingView:onComplete()
//                if (!DetectionController.getInstance().isChrome) {
//                    // only Safari starts here, because if started earlier, the hack makes it difficult to navigate across the page
//                    MobileController.getInstance().preventSleep();
//                }

                self.drawTracker();
            };

            this.drawAnimation = true;

            if (RemoteController.getInstance().resynced) {
                onAnimComplete();
            } else {
                this.animOptions = {
                    gridProgress: 1,
                    grid: true,
                    squareFillProgress: 0,
                    squareFill: false,
                    squareRotation: -Math.PI/4,
                    squareScale: this.holepc,
                    circleFillProgress: 0,
                    circleFill: false
                };
                var self = this;
                var t = this.timeline = new TimelineLite({
                    delay: 0,
                    onUpdate: function () {
                        self.drawTracker();
                    },
                    onComplete: function () {
                        onAnimComplete();
                    }
                });

                t.to(this.animOptions, 1, {delay: 2, gridProgress: 0, squareFillProgress: 1});
                t.to(this.animOptions, 0.05, {squareFillProgress: 0});
                t.to(this.animOptions, 0.5, {squareRotation: 0, squareScale: 1});
                t.to(this.animOptions, 0.05, {circleFillProgress: 1, squareFillProgress: 1});
                t.to(this.animOptions, 0.05, {squareFillProgress: 0});
                t.to(this.animOptions, 0.05, {squareFillProgress: 1});
                t.to(this.animOptions, 0.05, {squareFillProgress: 0});
                t.to(this.animOptions, 0.05, {squareFillProgress: 1});
                t.to(this.animOptions, 0.05, {squareFillProgress: 0});
                t.to(this.animOptions, 0.05, {squareFillProgress: 1});

                t.play();
            }
        },

        drawTrackerAnim: function () {
            var clientHeight = Math.max(window.innerHeight, $('.main').height()),
                smallSquare = window.innerHeight < $(window).height(), //Chrome with the address bar
                sizeOffset = (this.touchMode && !this.isLandscape) ? (smallSquare ? -165 : -135) : 0,
                border = 20,
                cw = Math.min($(window).width() + (this.isLandscape ? -135 * 2 : 0) - border, clientHeight + sizeOffset - border, ControllerView.MAX_TRACKER_SIZE), //,ch = window.innerHeight;
                color,
                rectW,
                rectH,
                rectX,
                rectY,
                holeSize,
                c = this.context;


            this.canvas.width = $(window).width();
            this.canvas.height = clientHeight;

            c.fillStyle = 'black';
            c.fillRect(0, 0, this.canvas.width, this.canvas.height);

            //draw rect
            rectW = cw*this.animOptions.squareScale - border * 2;
            rectH = cw*this.animOptions.squareScale - border * 2;
            rectX = (this.canvas.width - rectW) / 2;
            rectY = (this.canvas.height - rectH) / 2 + sizeOffset * 0.5;
            holeSize = cw * this.holepc - border * 2 ;

            c.lineWidth = 2;
            c.strokeStyle = '#ffffff';
            c.save();
            c.translate(this.canvas.width / 2, this.canvas.height / 2 + sizeOffset * 0.5);
            c.rotate(this.animOptions.squareRotation);
            c.translate(-this.canvas.width / 2, -this.canvas.height / 2 - sizeOffset * 0.5);
            c.beginPath();

            c.rect(rectX, rectY, rectW, rectH);

            c.closePath();
            c.stroke();

            if (this.animOptions.squareFillProgress < 0.1) {
                this.animOptions.squareFill = false;
            } else if (this.animOptions.squareFillProgress > 0.9) {
                this.animOptions.squareFill = true;
            }

            if (this.animOptions.squareFill) {
                c.fillStyle = '#ffffff';
                c.fill();
            }

            if (this.animOptions.gridProgress < 0.1) {
                this.animOptions.grid = false;
            } else if (this.animOptions.gridProgress > 0.9) {
                this.animOptions.grid = true;
            }

            if (this.animOptions.grid) {
                c.beginPath();
                for (var i=1; i<3; i++) {
                    var dx = rectW/3*i;

                    c.moveTo(rectX + dx,rectY);
                    c.lineTo(rectX + dx, rectY + rectH);

                    c.moveTo(rectX,rectY + dx);
                    c.lineTo(rectX + rectW, rectY + dx);

                }
                c.closePath();
                c.stroke();
            }

            c.restore();

            c.fillStyle = 'black';
            c.globalAlpha = 1.0;
            c.beginPath();
            c.arc(rectX + rectW / 2, rectY + rectH / 2, holeSize / 2, 0, Math.PI * 2, true);
            c.closePath();

            c.lineWidth = 2;
            c.strokeStyle = '#ffffff';
            c.stroke();

            if (this.animOptions.circleFillProgress < 0.1) {
                this.animOptions.circleFill = false;
            } else if (this.animOptions.circleFillProgress > 0.9) {
                this.animOptions.circleFill = true;
            }

            if (this.animOptions.circleFill) {
                c.fillStyle = '#000000';
                c.fill();                
            }

        },

        drawTracker: function () {
            if(!this.shown) {
                return;
            }
            if(this.drawAnimation) {
                return this.drawTrackerAnim();
            }

            var clientHeight = Math.max(window.innerHeight, $('.main').height()),
                smallSquare = window.innerHeight < $(window).height(), //Chrome with the address bar
                sizeOffset = (this.touchMode && !this.isLandscape) ? (smallSquare ? -165 : -135) : 0,
                border = 20,
                cw = Math.min(Math.min($(window).width() + (this.isLandscape ? -135 * 2 : 0) - border, clientHeight + sizeOffset - border), ControllerView.MAX_TRACKER_SIZE),
                color,
                rectW,
                rectH,
                rectX,
                rectY,
                holeSize,
                c = this.context;


            this.canvas.width = $(window).width();
            this.canvas.height = clientHeight;

            c.fillStyle = 'black';
            c.fillRect(0, 0, this.canvas.width, this.canvas.height);

            rectW = cw - border * 2;
            rectH = cw - border * 2;
            rectX = (this.canvas.width - rectW) / 2;
            rectY = (this.canvas.height - rectH) / 2 + sizeOffset * 0.5;
            holeSize = rectW * this.holepc;

            c.lineWidth = 2;
            c.strokeStyle = '#ffffff';
            c.beginPath();

            c.rect(rectX, rectY, rectW, rectH);

            c.closePath();
            c.stroke();

            color = '#' + this.currentColor;
            c.globalAlpha = (!this.blackScreen) ? this.lightpc : 0.0;
            c.fillStyle = color;

            c.fillRect(rectX, rectY, rectW, rectH);
            c.fillStyle = 'black';
            c.globalAlpha = 1.0;
            //c.fillRect(rectX + rectW/2 - holeSize/2, rectY + off/2 + rectH/2 - holeSize/2, holeSize, holeSize - (off));
            c.beginPath();
            c.arc(rectX + rectW / 2, rectY + rectH / 2, holeSize / 2, 0, Math.PI * 2, true);
            c.closePath();

            c.lineWidth = 4;
            c.strokeStyle = '#ffffff';
            c.stroke();
            c.fillStyle = '#000000';
            c.fill();

            //c.drawImage(phoneScreen,rectX, rectY + off, rectW, rectH - (off * 2));

            /*c.globalAlpha = 0.0;

             c.fillStyle = '#ffffff';
             var imageExtra = 4;
             c.drawImage(this.imageLogo,rectX + rectW / 2 - holeSize/2 - imageExtra, rectY + rectH / 2 - holeSize/2 - imageExtra, holeSize + 8, holeSize + imageExtra * 2.0);
             c.drawImage(this.imageLogo2,rectX + rectW / 2 - holeSize/2 - imageExtra, rectY + rectH / 2 - holeSize/2 - imageExtra, holeSize + 8, holeSize + imageExtra * 2.0);
             */
            c.globalAlpha = 1.0;


            //c.fillStyle = '#444444';
            // c.fillText(this.lastLuminosityMessage, rectX + (rectW / 2), rectY + (rectH / 2));


        },

        secondsToMinutesString: function (seconds) {

            var minutes = Math.floor(seconds / 60);
            var secondsAdd = Math.round(seconds - minutes * 60);
            return minutes + ':' + (secondsAdd < 10 ? ('0' + secondsAdd) : secondsAdd);

        },

        onButtonTouchTouchStart: function () {

            var self = this;

            clearTimeout(this.buttonTouchTimeoutId);
            this.$buttonTouch.addClass('over');
            this.currentColor = ControllerView.COLOUR_ACTIVE;
            this.drawTracker();
            clearTimeout(this.buttonTouchTimeoutId);
            this.buttonTouchTimeoutId = setTimeout(function () {
                self.$buttonTouch.removeClass('over').addClass('inactive');
                self.$buttonTouch.removeClass('inactive');
                self.drawTracker();
            }, ControllerView.BUTTON_TOUCH_TIMEOUT);
        },

        onButtonTouchTouchEnd: function () {

            var self = this;
            this.$buttonTouch.removeClass('over').addClass('inactive');
            clearTimeout(this.buttonTouchTimeoutId);
            this.buttonTouchTimeoutId = setTimeout(function () {
                self.$buttonTouch.removeClass('inactive');
                self.drawTracker();

            }, ControllerView.BUTTON_TOUCH_TIMEOUT);

        },

        onAxelleStart: function (progress) {

            ViewController.getInstance().getView('AxelleVideoView').show(progress);

        },

        onAxellePause: function (progress) {

            ViewController.getInstance().getView('AxelleVideoView').pause(progress);

        },

        onAxelleHide: function () {

            ViewController.getInstance().getView('AxelleVideoView').hide();

        },

        onFrame: function () {

            this.$time.text(this.secondsToMinutesString(TimelineController.getInstance().getCurrentTime() * 0.001) + ' / ' + (TimelineController.getInstance().getCurrentTime() * 0.001).toFixed(2));

        },

        onResize: function () {

            this.onPortraitLandscapeChange();
            if(this.shown) {
                this.drawTracker();
            }

        },

        onOrientationChange: function () {

            var currentTime = new Date().getTime();

            if (currentTime - this.lastOrientationSendTime > ControllerView.ORIENTATION_SEND_INTERVAL) {

                this.lastOrientationSendTime = currentTime;
                this.sTime = ((currentTime - this.lastOrientationSendTime) * 0.001).toFixed(2);
                RemoteController.getInstance().sendOrientation(OrientationController.getInstance().worldQuaternion.x, OrientationController.getInstance().worldQuaternion.y, OrientationController.getInstance().worldQuaternion.z, OrientationController.getInstance().worldQuaternion.w, OrientationController.getInstance().worldAcceleration.x, OrientationController.getInstance().worldAcceleration.y, OrientationController.getInstance().worldAcceleration.z);

            }

            this.x = OrientationController.getInstance().worldQuaternion.x.toFixed(2);
            this.y = OrientationController.getInstance().worldQuaternion.y.toFixed(2);
            this.z = OrientationController.getInstance().worldQuaternion.z.toFixed(2);
            this.uTime = ((currentTime - this.lastUpdateTime) * 0.001).toFixed(2);
            this.lastUpdateTime = currentTime;

        }

    }

});
