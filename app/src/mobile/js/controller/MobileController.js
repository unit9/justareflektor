/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/9/13
 * Time: 2:22 PM
 */

var MobileController = Class._extend(Class.SINGLETON, {


    _static : {

        STATE_FINGER_DOWN: 'MobileController_STATE_FINGER_DOWN',
        STATE_FINGER_UP: 'MobileController_STATE_FINGER_UP',
        PAGE_VISIBILITY : true

    },

    _public: {


        construct: function () {

            var self = this;

            $(document).bind('touchstart.MobileController', function () {
                self.onTouchStart();
            });

            $(document).bind('touchmove.MobileController', function () {
                self.onTouchMove();
            });

            $(document).bind('touchend.MobileController', function () {
                self.onTouchEnd();
            });

            document.addEventListener("webkitvisibilitychange", this.pageVisibilityChange.bind(this), false);


        },

        pageVisibilityChange: function(e) {

            MobileController.PAGE_VISIBILITY = document.webkitHidden;

            if(!MobileController.PAGE_VISIBILITY) {

                RemoteController.getInstance().onPeerPause();
                RemoteController.getInstance().sendSleepPauseInfo();

            }

        },

        preventSleep: function () {

            if (DetectionController.getInstance().isDebug) {

                $("body").append($("<div id='sleep-debug'></div>"));
                AnimationController.getInstance().events.on(AnimationController.EVENT_FRAME, this.displayDebugData);

            }

            switch (DetectionController.getInstance().os) {

                case DetectionController.OS_IOS:
                    this.preventSleepIos();
                    break;

                case DetectionController.OS_ANDROID:
                    this.preventSleepAndroid();
                    break;

            }

        },

        allowSleep: function () {

            switch (DetectionController.getInstance().os) {

                case DetectionController.OS_IOS:
                    this.allowSleepIos();
                    break;

                case DetectionController.OS_ANDROID:
                    this.allowSleepAndroid();
                    break;

            }

        },

        disableMagnifyingGlass: function () {

            if(DetectionController.getInstance().os != DetectionController.OS_IOS) return;
            this.glassIntervalID = setInterval(this.preventMagnfyingGlassiOS.bind(this),1000);

        },

        enableMagnifyingGlass: function () {

            clearInterval(this.glassIntervalID);

            $("*").unbind("touchstart.StopMouseEvents");

        },

        preventMagnfyingGlassiOS: function () {

            $("*").not(".connection-code").css({  "-webkit-user-drag": "none",
                                                  "-webkit-user-modify": "none",
                                                  "-webkit-highlight": "none",
                                                  "-webkit-user-callout":  "none",
                                                  "-webkit-touch-callout":  "none",
                                                  "-webkit-user-select":    "none"  });

;
            $("*").bind( "touchstart.StopMouseEvents", this.stopMouseEvents.bind(this));
             
        },

        preventUndoShake: function () {

            $(".connection-code").unbind("input").bind("input", this.unfocusInput);
            $(window).unbind("keydown").bind("keydown", this.handleInput); 

        },

        unfocusInput: function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(window).unbind("keydown"); 
        },

        handleInput: function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(".connection-code").unbind("input");

            var currentText = $(".connection-code").val();

            if (e.keyCode === 8 && currentText.length) {
                $(".connection-code").val(currentText.slice(0, currentText.length - 1));
                return;
            } else {
                $(".connection-code").val(currentText + String.fromCharCode(e.keyCode).toLowerCase());
            }

        },

        stopMouseEvents: function (e) {

            
//            if($(e.currentTarget).hasClass("blocker")) {
//
//               MobileController.getInstance().events.trigger(MobileController.STATE_FINGER_DOWN, true);
//
//            }

            this.onTouchStart();

            e.preventDefault();
            e.stopPropagation();

            return false;

        },

        showAddressBar: function () {

            this.hideAddressBarAllowed = false;


        },

        hideAddressBar: function () {

            var page = $('.main')[0],
                fullscreen = window.navigator.standalone,
                lastWidth = 0,
                lastHeight = 0,
                firstHeight = 0,
                self = this;

            this.hideAddressBarAllowed = true;

            if (DetectionController.getInstance().isIos || true) {

                window.setupScroll = window.onload = function (e) {
                    var height = document.documentElement.clientHeight;
                    if(!firstHeight || lastWidth != document.documentElement.clientWidth) {
                        firstHeight = height;
                    }
                    if (DetectionController.getInstance().isIos && !fullscreen && height == firstHeight && !DetectionController.getInstance().isTablet) {
                        height += (DetectionController.getInstance().isChrome || DetectionController.getInstance().osVersion === '7_0') ? 0 : 60;
                    }
                    var focusedInput = $('input:focus');
                    if(DetectionController.getInstance().isIos || !focusedInput.length) {
                        page.style.height = height + 'px';
                    } 
                    setTimeout(function () {
                        if(focusedInput.length && DetectionController.getInstance().isIos) {
                            var offset = focusedInput.offset();
                            window.scrollTo(0, offset.top - 20 );
                        } else  {
                            window.scrollTo(0, 1);
                        }
                    }, 0);
                };

                $(window).bind('resize orientationchange webkitfullscreenchange mozfullscreenchange fullscreenchange', function (e) {
                    var pageWidth = document.documentElement.clientWidth;
                    var pageHeight = document.documentElement.clientHeight;
                    var focusedInput = $('input:focus');
                    var doBlur = !DetectionController.getInstance().isIos && focusedInput.length && e.type === 'orientationchange';
                    if(doBlur) {
                        focusedInput.blur();
                    }
                    
                    if(!self.hideAddressBarAllowed) return;

                    if (lastWidth === pageWidth && lastHeight === pageHeight && !doBlur) {

                    } else {
                        window.setupScroll(e);                        
                        lastWidth = pageWidth;
                        lastHeight = pageHeight;
                    }
                    
                });

                $(window).trigger('resize');
            }
        }

    },

    _private: {

        iOsSleepIntervalId: -1,
        androidSleepStarted: false,
        androidSleepMethod: 0,
        glassIntervalID: -1,
        lastMoveSendTime: 0,
        isTouchDown: false,

        hideAddressBarAllowed: false,

        preventSleepIos: function (immediate) {

            this.allowSleepIos();

            if (DetectionController.getInstance().isSafari && this.iOsSleepIntervalId === -1) {

                console.log('+++ NO SLEEP HACK iOS +++');
                this.iOsSleepIntervalId = setInterval(function () {

//                $.cookie('sph', '1', { expires: (1 / 24 / 60 / 60) * 5, path: '/' });
                    window.location.href = Config.getInstance().sleepPreventionHackHelperUrl;
                    window.setTimeout(function() {
                        window.stop();
                    }, 0);
                }, 20000);

                if (immediate) {
                    window.location.href = Config.getInstance().sleepPreventionHackHelperUrl;
                    window.setTimeout(function() {
                        window.stop();
                    }, 0);
                }

            }

        },

        allowSleepIos: function () {

            // TEMP. disabled, debugging
//            if(this.iOsSleepIntervalId == -1) return;
//            clearInterval(this.iOsSleepIntervalId);
//            window.stop();
            return;

        },

        displayDebugData: function () {

            switch (DetectionController.getInstance().os) {
                case DetectionController.OS_IOS:
                    $("sleep-debug").html("this.iOsSleepIntervalId: " + this.iOsSleepIntervalId);
                    break;
                case DetectionController.OS_ANDROID:
                    switch (this.androidSleepMethod) {
                        case 0:
                            $("#sleep-debug").html("this.iOsSleepIntervalId: " + $("#videoAudioLoop")[0].currentTime);
                            break;
                        case 1:
                            $("#sleep-debug").html("this.iOsSleepIntervalId: " + $("#videoLoop")[0].currentTime);
                            break;
                    }

                    break;
            }
        },

        preventSleepAndroid: function () {

            var self = this;
            console.log('+++ NO SLEEP HACK ANDROID +++');
            window.addEventListener('touchstart', function () {
                self.__preventSleepAndroid();
            });

        },

        __preventSleepAndroid: function (e) {

            var video,
                self = this;

            if (this.androidSleepStarted) {
                return;
            }

            $('#videoAudioLoop').remove();

            this.androidSleepStarted = true;
            video = document.createElement('video'); //Use a video element. Video playback prevents sleep.
            video.setAttribute('id', 'videoAudioLoop')
            video.setAttribute('loop', true);
            video.src = Resource.get('media/video/silence.mp4');
            video.addEventListener('progress', function () {
                if (video.currentTime === 0) {
                    video.removeEventListener('progress', arguments.callee, false);
                    self.androidSleepStarted = false;
                }
            });
            video.play();
            document.body.appendChild(video);

        },

        allowSleepAndroid: function () {

            return;

        },

        onTouchStart: function () {

            if (this.isTouchDown) {
                return;
            }

            this.isTouchDown = true;
            MobileController.getInstance().events.trigger(MobileController.STATE_FINGER_DOWN, true);
            RemoteController.getInstance().sendTouchInfo('start');

        },

        onTouchMove: function () {

            MobileController.getInstance().events.trigger(MobileController.STATE_FINGER_DOWN, true);
            if (new Date().getTime() - this.lastMoveSendTime > 1000) {
                RemoteController.getInstance().sendTouchInfo('move');
                this.lastMoveSendTime = new Date().getTime();
            }

        },

        onTouchEnd: function () {

            this.isTouchDown = false;
            MobileController.getInstance().events.trigger(MobileController.STATE_FINGER_UP, true);
            RemoteController.getInstance().sendTouchInfo('end');

        }

    }

});
