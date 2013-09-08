/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 8/28/13
 * Time: 10:56 AM
 */

var FullScreenController = Class._extend(Class.SINGLETON, {

    _static:  {

        EVENT_FULLSCREEN_ON: 'FullScreenController_EVENT_FULLSCREEN_ON',
        EVENT_FULLSCREEN_OFF: 'FullScreenController_EVENT_FULLSCREEN_OFF',
        EVENT_FULLSCREEN_CHANGE: 'FullScreenController_EVENT_FULLSCREEN_CHANGE'

    },

    _public: {

        construct: function () {

            var self = this;

            if (document.documentElement.requestFullScreen) {

                this.isPropertyName = 'fullScreen';
                this.requestFunctionName = 'requestFullScreen';
                this.cancelFunctionName = 'cancelFullScreen';

            } else if (document.documentElement.webkitRequestFullScreen) {

                this.isPropertyName = 'webkitIsFullScreen';
                this.requestFunctionName = 'webkitRequestFullScreen';
                this.cancelFunctionName = 'webkitCancelFullScreen';

            } else if (document.documentElement.mozRequestFullScreen) {

                this.isPropertyName = 'mozfullScreen';
                this.requestFunctionName = 'mozRequestFullScreen';
                this.cancelFunctionName = 'mozCancelFullScreen';

            } else if (document.documentElement.mozRequestFullScreen) {

                this.requestFunctionName = 'mozRequestFullScreen';
                this.cancelFunctionName = 'mozCancelFullScreen';

            }

            $(document).bind('webkitfullscreenchange mozfullscreenchange fullscreenchange', function () {
                self.onFullScreenChange();
            });

        },

        toggle: function (target) {

            if (this.isPropertyName) {

                if (this.isFullScreen()) {

                    this.cancel(target);

                } else {

                    this.request(target);

                }

            }

        },

        request: function (target) {

            if (this.requestFunctionName) {

                target[this.requestFunctionName](Element.ALLOW_KEYBOARD_INPUT);

            }

        },

        cancel: function (target) {

            if (this.cancelFunctionName) {

                document[this.cancelFunctionName]();

            }

            return target;

        },

        isFullScreen: function () {

            return document[this.isPropertyName];

        }

    },

    _private: {

        isPropertyName: null,
        requestFunctionName: null,
        cancelFunctionName: null,

        onFullScreenChange: function () {

            this.events.trigger(FullScreenController.EVENT_FULLSCREEN_CHANGE);

            if (this.isFullScreen()) {

                this.events.trigger(FullScreenController.EVENT_FULLSCREEN_ON);

            } else {

                this.events.trigger(FullScreenController.EVENT_FULLSCREEN_OFF);

            }

        }

    }

});
