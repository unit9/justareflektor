/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 8/18/13
 * Time: 6:47 PM
 */


var TimelineController = Class._extend(Class.SINGLETON, {

    _public: {

        construct: function () {

            var self = this;

            RemoteController.getInstance().events.bind(RemoteController.EVENT_PLAY, function () {
                self.onPlay();
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_PAUSE, function () {
                self.onPause();
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_RESYNC, function (event, globalTime, localTime) {
                self.onResync(globalTime, localTime);
            });

        },

        start: function () {

            var self = this;

            this.stop();
            AnimationController.getInstance().events.bind(AnimationController.EVENT_FRAME + '.TimelineController', function () {
                self.onFrame();
            });

        },

        stop: function () {

            AnimationController.getInstance().events.unbind(AnimationController.EVENT_FRAME + '.TimelineController');

        },

        getCurrentTime: function () {

            return this.localTime;

        }

    },

    _private: {

        playing: false,
        localTimeOffset: 0,
        localTime: 0,
        timeValid: false,
        nextValidTime: undefined,

        onPlay: function () {
            this.timeValid = false;
            this.playing = true;
        },

        onPause: function () {
            this.timeValid = false;
            this.playing = false;
            AudioController.getInstance().pause();
        },

        onResync: function (globalTime, localTime) {
            AudioController.getInstance().pause();
            this.localTimeOffset = localTime - globalTime;
            this.timeValid = false;
            this.nextValidTime = globalTime;
        },

        onFrame: function () {

            if (this.timeValid && this.playing) {
                this.localTime = clocksync.time() + this.localTimeOffset;
            } else if (this.playing && this.nextValidTime && clocksync.time() >= this.nextValidTime) {
                this.timeValid = true;
                this.localTime = clocksync.time() + this.localTimeOffset;
                AudioController.getInstance().resume();
                AudioController.getInstance().resync();
            }

        }

    }

});
