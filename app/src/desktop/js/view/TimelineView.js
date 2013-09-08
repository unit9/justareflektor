/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 7/7/13
 * Time: 11:05 PM
 */

var TimelineView = View._extend({

    _static: {

        SHOW_TRUE_BUFFER: false

    },

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        show: function () {

            if (!View.prototype.show.call(this)) {
                return;
            }

            this.isSlidIn = true;
            this.slideOut();
            MouseCursorAppearanceController.getInstance().startTrackMouseActivity();

        },

        hide: function () {

            View.prototype.hide.call(this);
            MouseCursorAppearanceController.getInstance().stopTrackMouseActivity();

        },

        slideIn: function (opts) {

            if (this.isSlidIn || (InputController.getInstance().mode === InputController.INPUT_TYPE_TRACKING && !RemoteController.getInstance().isActive && TimelineController.getInstance().currentTime < ExperienceView.BREAK_FREE_START_TIME)) {
                return;
            }

            if(opts && opts.delay) {

                var self = this;

                clearTimeout(this.slideInDelayId);
                clearTimeout(self.slideOutTimeoutId);

                this.slideInDelayId = setTimeout(function () {

                    clearTimeout(self.slideOutTimeoutId);
                    self.isSlidIn = true;
                    self.$container.addClass('in');
                    self.$container.removeClass('out');
                    ViewController.getInstance().getView('PersistentControlsView').slideIn();

                }, 2000);

                return;

            }

        
            this.isSlidIn = true;
            this.$container.addClass('in');
            this.$container.removeClass('out');
            ViewController.getInstance().getView('PersistentControlsView').slideIn();

        },

        slideOut: function (skipPersistentControls) {

            var self = this;

            if (!this.isSlidIn) {
                return;
            }

            if (ViewController.getInstance().getView('PersistentControlsView') && ViewController.getInstance().getView('PersistentControlsView').isQualityMenuOpen()) {
                this.slideOutTimeoutId = setTimeout(function () {
                    self.slideOut(skipPersistentControls);
                }, 100);
                return;
            }

            clearTimeout(this.slideInDelayId);

            this.isSlidIn = false;
            this.$container.addClass('out');
            this.$container.removeClass('in');
            if (!skipPersistentControls && ViewController.getInstance().getView('PersistentControlsView')) {
                ViewController.getInstance().getView('PersistentControlsView').slideOut();
            }

        }

    },

    _private: {

        $buttonPlayPause: null,
        $timeElapsed: null,
        $timeTotal: null,
        $seekButton: null,

        timeElapsedElement: null,
        timeTotalElement: null,

        draggingSeek: false,
        draggingPoint: { x: 0, y: 0 },
        isSlidIn: false,
        seekButtonEnabled: true,
        slideInDelayId: -1,
        slideOutTimeoutId: -1,

        currentlySyncingDevices: false,

        captions: [],

        init: function () {

            this.$buttonPlayPause = this.$container.find('button.play-pause');
            this.$timeElapsed = this.$container.find('.time .elapsed');
            this.$timeTotal = this.$container.find('.time .total');
            this.$seekButton = $('#seeker-button');
            this.bufferCanvas = this.$container.find('canvas.buffer')[0];
            this.bufferCanvas.height = 4;
            this.bufferContext = this.bufferCanvas.getContext('2d');

            this.timeElapsedElement = this.$timeElapsed[0];
            this.timeTotalElement = this.$timeTotal[0];

            this.isSlidIn = true;
            this.slideOut();

        },

        changeButtonsBehaviour: function () {

            this.currentlySyncingDevices=true;

        },

        restoreButtonsBehaviour: function () {

            this.currentlySyncingDevices=false;

        },

        bindEvents: function () {

            var self = this;

            Player.getInstance().events.bind(Player.EVENT_CONNECTING_MESSAGE_SHOW, function () {
                self.changeButtonsBehaviour();
            });

            Player.getInstance().events.bind(Player.EVENT_CONNECTING_MESSAGE_HIDE, function () {
                self.restoreButtonsBehaviour();
            });

            Player.getInstance().events.bind(Player.EVENT_CONNECTING_MESSAGE_SHOW + '.TimelineView', function () {
                self.onConnecting();
            });

            Player.getInstance().events.bind(Player.EVENT_CONNECTING_MESSAGE_HIDE + '.TimelineView', function () {
                self.onConnected();
            });

            AnimationController.getInstance().events.on(AnimationController.EVENT_FRAME, function () {
                self.onFrame();
            });

            TimelineController.getInstance().events.bind(TimelineController.EVENT_START, function () {
                self.onStart();
            });

            TimelineController.getInstance().events.bind(TimelineController.EVENT_RESUME, function () {
                self.onResume();
            });

            TimelineController.getInstance().events.bind(TimelineController.EVENT_PAUSE, function () {
                self.onPause();
            });

            TimelineController.getInstance().events.bind(TimelineController.EVENT_END, function () {
                self.onEnd();
            });

            TimelineController.getInstance().events.bind(TimelineController.ENABLE_SEEK_INTERACTION, function () {
                self.seekButtonEnabled = true;
            });

            TimelineController.getInstance().events.bind(TimelineController.DISABLE_SEEK_INTERACTION, function () {
                self.seekButtonEnabled = false;
            });

            TimelineController.getInstance().events.on(TimelineController.ACTION_ADD_CAPTION, function (event, data) {
                self.addDebugCaption(data.name, data.startTime, data.endTime, data.scene, data.totalTime);
            });

            MouseCursorAppearanceController.getInstance().events.bind(MouseCursorAppearanceController.EVENT_MOUSE_ACTIVE + '.TimelineView', function () {
                self.onMouseActive();
            });

            MouseCursorAppearanceController.getInstance().events.bind(MouseCursorAppearanceController.EVENT_MOUSE_INACTIVE + '.TimelineView', function () {
                self.onMouseInactive();
            });

            this.$buttonPlayPause.bind('click', function () {
                self.onPlayPauseClick();
            });

            this.$seekButton.bind('mousedown', function (e) {
                if (!self.seekButtonEnabled) return;

                self.startDragSeekButton(e);
            });

            this.$seekButton.bind('mouseup', function () {
                self.stopDragSeekButton();
            });

            $("body").bind('mouseup', function () {
                self.stopDragSeekButton();
            });

            $(".seeker .bar").bind('mouseup', function (e) {
                if (!self.seekButtonEnabled) return;
                self.draggingSeek = true;
                self.draggingPoint = { x: 0, y: 0 }
                self.stopDragSeekButton();
            });

        },

        startDragSeekButton: function (e) {

            this.draggingPoint = { x: e.offsetX, y: e.offsetY }
            this.draggingSeek = true;

        },

        stopDragSeekButton: function () {


            if (!this.draggingSeek) {
                return;
            }

            this.draggingSeek = false;
            if (Viewport.MOUSE_Y < window.innerHeight - 100) {
                return;
            }

            var seekPercentage = (Viewport.MOUSE_X - this.draggingPoint.x) / Viewport.WIDTH;

            TimelineController.getInstance().seekTarget = seekPercentage;
            TimelineController.getInstance().events.trigger(TimelineController.EVENT_SEEK, [
                {position: seekPercentage}
            ]);

        },

        secondsToMinutesString: function (seconds) {

            var minutes = Math.floor(seconds / 60);
            var secondsAdd = Math.round(seconds - minutes * 60);
            if (secondsAdd === 60) {
                minutes += 1;
                secondsAdd = 0;
            }
            return minutes + ':' + (secondsAdd < 10 ? ('0' + secondsAdd) : secondsAdd);

        },

        updateTime: function () {

            this.timeElapsedElement.innerHTML = this.secondsToMinutesString(Player.getInstance().getCurrentTime());
            this.timeTotalElement.innerHTML = isNaN(Player.getInstance().getDuration()) ? '--:--' : this.secondsToMinutesString(Player.getInstance().getDuration());
            $('.seeker .bar .progress').width(Player.getInstance().getProgress() * 100 + '%');

        },

        updateBuffer: function () {

            var ranges = TimelineView.SHOW_TRUE_BUFFER ? Player.getInstance().getBufferRanges() : [{start: 0, end: 1}],
                i,
                start;

            this.bufferContext.fillStyle = '#ffffff';
            this.bufferContext.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);

            for (i = 0; i < ranges.length; ++i) {
                start = ranges[i].start * this.bufferCanvas.width;
                this.bufferContext.fillRect(start, 0, ranges[i].end * this.bufferCanvas.width - start, this.bufferCanvas.height);
            }

        },

        milisecondsToTime: function (ms) {

            function pad(n) {
                return (n < 10 ? '0' : '') + n;
            }

            s = (ms) / 1000;
            var secs = s % 60;
            s = (s - secs) / 60;
            var mins = s % 60;
            var hrs = (s - mins) / 60;

            return pad(mins) + ':' + pad(secs);
        },

        addDebugCaption: function (name, startTime, endTime, scene, totalTime) {

            var capitonObject = $('<div class="caption ' + name + '" style="width: ' + (endTime - startTime) * 100 / totalTime + '%' + '">' +
                '<div class="progress"></div>' +
                '<div class="caption-extra-info">' +
                '<p class="time"><i>' + this.milisecondsToTime(startTime * 1000).toPrecision(4) + ' - ' + this.milisecondsToTime(endTime * 1000).toPrecision(4) + ' </i></p>' +
                '</div>' +
                '<p class="name"><u>' + name + '</u></p>' +
                '</div>');


            this.captions.push({object: capitonObject, position: startTime / totalTime, length: (endTime - startTime) / totalTime });

            $("#timeline-captions").append(capitonObject);

        },

        onPlayPauseClick: function () {

            if(this.currentlySyncingDevices) {

            } else {

                TimelineController.getInstance().toggle();
                
            }

            
            ViewController.getInstance().getView('HelpView').hide();

        },

        onStart: function () {

            this.$buttonPlayPause.addClass('on');

        },

        onResume: function () {

            this.$buttonPlayPause.addClass('on');

        },

        onPause: function () {

            this.$buttonPlayPause.removeClass('on');

        },

        onEnd: function () {

            return;

        },

        onConnecting: function () {

            TweenLite.to(this.$buttonPlayPause, 0, {css: {opacity: 0}});

        },

        onConnected: function () {

            TweenLite.to(this.$buttonPlayPause, 0.5, {css: {opacity: 1}});

        },

        onMouseInactive: function () {

            this.slideOut();

        },

        onMouseActive: function () {

            if(InputController.getInstance().mode === InputController.INPUT_TYPE_MOUSE) {

                if(MouseCursorAppearanceController.getInstance().lastPoint.y > $(window).height() - 30 ) {

                    this.slideIn({ delay : true });
                    return;

                } else if (MouseCursorAppearanceController.getInstance().lastPoint.y < $(window).height() - 70) {

                    this.slideOut();
                    return;

                }

            }

            this.slideIn();

        },

        onFrame: function () {

            this.updateTime();
            this.updateBuffer();

            for (var i = 0; i <= this.captions.length - 1; i++) {
                this.captions[i].object.css({"-webkit-transform": "translateX(" + (this.captions[i].position * Viewport.WIDTH) + "px)"});
                this.captions[i].object.find(".actual-time").css({"width": (this.captions[i].length * Viewport.WIDTH) + "px"});
            }

            if (this.draggingSeek) {
                this.$seekButton.css(
                    {
                        "position": "absolute",
                        "-webkit-transform": "translateX(" + ( Viewport.MOUSE_X - this.draggingPoint.x ) + "px)",
                        "-moz-transform": "translateX(" + ( Viewport.MOUSE_X - this.draggingPoint.x ) + "px)"
                    });
            } else {
                this.$seekButton.css(
                    {
                        "position": "absolute",
                        "-webkit-transform": "translateX(" + Math.floor(Player.getInstance().getProgress() * window.innerWidth) + "px)",
                        "-moz-transform": "translateX(" + Math.floor(Player.getInstance().getProgress() * window.innerWidth) + "px)",
                        "transform": "translateX(" + Math.floor(Player.getInstance().getProgress() * window.innerWidth) + "px)"
                    });
            }

        },

        onResize: function () {

            this.bufferCanvas.width = window.innerWidth;
            this.updateBuffer();

        }

    }

});
