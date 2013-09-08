/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 7/8/13
 * Time: 12:30 AM
 */

var AnimationController = Class._extend(Class.SINGLETON, {

    _static: {

        EVENT_FRAME: 'AnimationController_EVENT_FRAME'

    },

    _public: {

        construct: function () {

            this.requestAnimationFrame = window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                function(callback) {
                    window.setTimeout(callback, 1000 / 60);
                };

        },

        start: function () {

            var self = this;

            if (this.running) {
                return;
            }

            this.running = true;

            this.requestAnimationFrame.call(window, function () {
                self.onFrame();
            });

        },

        stop: function () {

            this.running = false;

        }

    },

    _private: {

        requestAnimationFrame: null,
        running: false,

        onFrame: function () {

            var self = this;

            this.events.trigger(AnimationController.EVENT_FRAME);

            if (this.running) {

                if (window.stats) {
                    window.stats.begin();
                }

                this.requestAnimationFrame.call(window, function () {
                    self.onFrame();
                });

                if (window.stats) {
                    window.stats.end();
                }

            }

        }

    }

});