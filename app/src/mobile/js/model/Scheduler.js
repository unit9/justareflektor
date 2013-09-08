/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 8/18/13
 * Time: 4:54 PM
 */

var Scheduler = Class._extend({

    _public: {

        construct: function (context) {

            this.context = context;
            this.sounds = [];
            this.scheduleAheadTime = 5;
            this.offset = 0;

        },

        add: function (when, buffer, loop, src, duration) {

            this.sounds.push([when, buffer, loop, src, duration]);
            this.sounds.sort(function(a, b) {
                return a[0] - b[0];
            });

        },

        start: function () {

            this.paused = false;
            return;

        },

        stop: function () {

            this.paused = true;
            return;

        },

        pause: function () {

            this.paused = true;
            this.clear();

        },

        resume: function () {

            this.paused = false;

        },

        resync: function () {

            this.reschedule();

        },

        setMuted: function (muted) {

            this.muted = muted;

            if (muted) {
                this.clear();
            } else {
                this.reschedule();
            }

        }

    },

    _private: {

        paused: true,
        muted: false,
        context: null,
        sounds: [],
        sources: [],
        scheduleAheadTime: 0,
        localTimeOffset: 0,

        clear: function () {

            var i;

            for (i = 0; i < this.sources.length; ++i) {
                try {
                    this.sources[i].disconnect();
                } catch (e) {
                }
                try {
                    this.sources[i].stop(0);
                } catch (e) {
                }
            }

            this.sources = [];

        },

        reschedule: function () {

            var source,
                when,
                offset,
                duration = 99999,   // we don't know the duration
                i;

            this.clear();

            if (this.paused || this.muted) {
                return;
            }

//            console.log('/// RESCHEDULE', this.context.currentTime, TimelineController.getInstance().getCurrentTime(), this.sounds[1][0]);

            for (i = 0; i < this.sounds.length; ++i) {

                when = this.sounds[i][0] - (TimelineController.getInstance().getCurrentTime() * 0.001) + this.context.currentTime + AudioController.OFFSET;
                duration = this.sounds[i][4];
//                console.log(this.sounds[i]);
                offset = when < this.context.currentTime ? (this.context.currentTime - when) : 0;

                if (offset < duration) {

//                    console.log('playing', this.sounds[i][3], 'at', this.sounds[i][0], '( in', (when - this.context.currentTime).toFixed(2), ')');
                    source = this.context.createBufferSource();
                    source.buffer = this.sounds[i][1];
                    source.loop = this.sounds[i][2] || false;
                    if (AudioController.getInstance().gainNode) {
                        source.connect(AudioController.getInstance().gainNode);
                    } else {
                        source.connect(this.context.destination);
                    }
                    this.sources.push(source);

                    if (source.start) {
                        source.start(when, offset, duration);
//                        console.log('start', when, offset);
                    } else if (source.noteOn) {
                        if (offset === 0 || (offset < 1 && this.sounds[i][0] === 1)) {  // exception for 1st sound
//                            console.log('note');
                            source.noteOn(when);
                        }
                    }

                } else {

//                    console.log('skipping', this.sounds[i][3], when);

                }

            }

        }

    }

});
