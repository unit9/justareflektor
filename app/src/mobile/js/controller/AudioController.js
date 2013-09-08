/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 8/18/13
 * Time: 3:50 PM
 */

var AudioController = Class._extend(Class.SINGLETON, {

    _static: {

        EVENT_LOADED: 'AudioController_EVENT_LOADED',
        PLAYLIST_PATH: '/m/data/final.json',
        OFFSET: 0,
        USE_GAIN: true,

        urlParser: function (url) {
            return Resource.get(url.replace('Sounds_assets/', 'media/audio/mobile/'));
        }

    },

    _public: {

        construct: function () {

            var AudioContext = window.AudioContext || window.webkitAudioContext,
                self = this;

            if (AudioContext) {
                this.context = new AudioContext();
                this.bufferLoader = new BufferLoader(this.context);
                this.scheduler = new Scheduler(this.context);

                if (this.context.createGain && AudioController.USE_GAIN) {
                    this.gainNode = this.context.createGain();
                    this.gainNode.connect(this.context.destination);
                }
            }

            RemoteController.getInstance().events.bind(RemoteController.EVENT_VOLUME_CHANGE, function (event, volume) {
                self.onVolumeChange(volume);
            });

        },

        load: function () {

            var files,
                self = this;

            if (this.loaded) {
                return;
            }

            if (!this.context) {
                // platform not supported
                return this.events.trigger(AudioController.EVENT_LOADED);
            }

            $.get(AudioController.PLAYLIST_PATH, function (playlist) {

	            if(typeof playlist == "string")
	                playlist = $.parseJSON(playlist);

                self.playlist = playlist.mobile;

                files = self.playlist.map(function(item) {
                    return item.src;
                });

                self.bufferLoader.load(files.map(AudioController.urlParser), function () {
                    self.onBuffersLoaded();
                });

            });

            this.loaded = true;

        },

        play: function (event) {

            var self = this;

            if (this.playing) {
                return;
            }

            if (event && event.originalEvent instanceof TouchEvent) {

                $(document).unbind('touchstart.AudioController');
                this.startPlaying();

            } else if (!this.touchEventAdded) {

                $(document).bind('touchstart.AudioController', function (event) {
                    self.play(event);
                });
                this.touchEventAdded = true;

            }

        },

        resume: function () {

            this.scheduler.resume();

        },

        pause: function () {

            this.scheduler.pause();

        },

        stop: function () {

            if (!this.playing) {
                return;
            }

            this.playing = false;
            this.scheduler.stop();

        },

        resync: function () {

            this.scheduler.resync();

        }

    },

    _private: {

        context: null,
        loaded: false,
        bufferLoader: null,
        gainNode: null,
        scheduler: null,
        playlist: null,
        touchEventAdded: false,
        playing: false,

        startPlaying: function () {

            if (this.context) {
                this.playing = true;
                this.playSilent();
                this.scheduler.start();
            }

        },

        playSilent: function () {

            var self = this;

            if (!this.context) {
                return;
            }

            if (this.gainNode) {
                this.gainNode.gain.value = 0;
            }

            var noise = this.context.createOscillator();
            noise.type = 0; // sine
            noise.frequency.value = 1;
            noise.connect(this.gainNode || this.context.destination);
            noise.noteOn(0);
            noise.noteOff(0.001);

            setTimeout(function () {
                if (self.gainNode) {
                    self.gainNode.gain.value = 1;
                }
            }, 200);

        },

        onBuffersLoaded: function () {

            var self = this;

            this.playlist.forEach(function (clip, i) {
                self.scheduler.add(clip.when, self.bufferLoader.bufferList[i], clip.loop, clip.src, clip.duration);
            });

            this.events.trigger(AudioController.EVENT_LOADED);

        },

        onVolumeChange: function (volume) {

            console.log('-- volume', volume);
            // Volume is either switched on or off, otherwise it's controlled by the phone's hardware.
            if (this.gainNode) {
                this.gainNode.gain.value = volume === 0 ? 0 : 1;
            } else {
                this.scheduler.setMuted(volume === 0);
            }

        }

    }

});
