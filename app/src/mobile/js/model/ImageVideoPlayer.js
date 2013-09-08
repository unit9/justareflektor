/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/8/13
 * Time: 12:00 PM
 */

var ImageVideoPlayer = Class._extend({

    _static: {

        SCALE_MODE: {

            NO_SCALE: 'noscale',
            FIT: 'fit',
            COVER: 'cover',
            EXACT_FIT: 'exactfit'

        },

        EVENT_PRELOAD_COMPLETE: 'ImageVideoPlayer_EVENT_PRELOAD_COMPLETE',
        EVENT_PLAYBACK_FRAME: 'ImageVideoPlayer_EVENT_PLAYBACK_FRAME',
        EVENT_PLAYBACK_END: 'ImageVideoPlayer_EVENT_PLAYBACK_END',

        OPTIONS: {

            path: '',
            base: 'frame_',
            start: 0,
            end: 100,
            step: 1,
            pad: 6,
            ext: '.jpg',
            frameRate: 24,
            width: 640,
            height: 480,
            scaleMode: 'noscale',
            loop: false

        }

    },

    _public: {

        construct: function (options) {

            this.options = $.extend(ImageVideoPlayer.OPTIONS, options);
            this.interval = Math.round(1000 / this.options.frameRate);
            this.bindEvents();
            this.initCanvas();
            this.frames = [];
            this.preload();

        },

        seekProgress: function (progress) {

            this.currentFrameIndex = progress ? (Math.round(progress * (this.options.end - this.options.start))) : this.options.start;

        },

        play: function () {

            var self = this;

            if (this.playing) {
                return;
            }

            this.playing = true;

            AnimationController.getInstance().events.unbind(AnimationController.EVENT_FRAME + '.ImageVideoPlayer');
            AnimationController.getInstance().events.bind(AnimationController.EVENT_FRAME + '.ImageVideoPlayer', function () {
                self.onFrame();
            });

        },

        pause: function () {

            if (!this.playing) {
                return;
            }

            this.playing = false;
            AnimationController.getInstance().events.unbind(AnimationController.EVENT_FRAME + '.ImageVideoPlayer');

        },

        stop: function () {

            this.pause();
            this.currentFrame = 0;

        }

    },

    _private: {

        options: null,
        canvas: null,
        context: null,
        currentFrameIndex: 0,
        interval: 100,
        frames: [],
        preloaded: false,
        playing: false,
        numImagesToLoad: 0,
        lastFrameTime: -1,

        bindEvents: function () {

            var self = this;

            this.events.bind(ImageVideoPlayer.EVENT_PRELOAD_COMPLETE, function () {
                self.onPreloadComplete();
            });

        },

        initCanvas: function () {

            this.canvas = document.createElement('canvas');
            this.canvas.width = this.options.width;
            this.canvas.height = this.options.height;
            this.context = this.canvas.getContext('2d');

        },

        wrapHandler: function (context, handler) {

            return function () {
                handler.call(context);
            };

        },

        preload: function () {

            var i,
                image;

            this.numImagesToLoad = 0;

            for (i = this.options.start; i <= this.options.end; i += this.options.step) {

                image = this.getFrameImageById(i);
                this.frames.push(image);

                this.numImagesToLoad++;

                image.onload = this.wrapHandler(this, this.onImageLoaded);

            }

        },

        renderFrame: function (index) {

            var x, y, width, height, aspect;

            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

            if (index > this.frames.length - 1) {
                this.events.trigger(ImageVideoPlayer.EVENT_PLAYBACK_FRAME);
                return;
            }

            index = Math.min(Math.max(Math.round(index), 0), this.frames.length - 1);
            aspect = this.frames[index].width / this.frames[index].height;

            if (aspect > this.canvas.width / this.canvas.height) {

                height = this.canvas.height;
                width = height * aspect;

            } else {

                width = this.canvas.width;
                height = width / aspect;

            }

            x = (this.canvas.width - width) * 0.5;
            y = (this.canvas.height - height) * 0.5;

            this.context.drawImage(this.frames[index], x, y, width, height);
            this.events.trigger(ImageVideoPlayer.EVENT_PLAYBACK_FRAME);

        },

        getFrameUrlByIndex: function (index) {

            return this.options.path + '/' + this.options.base + this.pad(this.options.start + index * this.options.step, this.options.pad) + this.options.ext;

        },

        getFrameUrlById: function (id) {

            return this.options.path + '/' + this.options.base + this.pad(id, this.options.pad) + this.options.ext;

        },

        getFrameImageByIndex: function (index) {

            var image = new Image();
            image.src = this.getFrameUrlByIndex(index);
            return image;

        },

        getFrameImageById: function (index) {

            var image = new Image();
            image.src = this.getFrameUrlById(index);
            return image;

        },

        pad: function (number, padding) {

//            return new Array(Math.max(padding + 1 - String(number).length, 0)).join('0') + number;    // jslint doesn't like it, although I do...
            var s = '00000000000' + number;
            return s.substring(s.length - padding, s.length);

        },

        onImageLoaded: function () {

            if (--this.numImagesToLoad === 0) {

                this.events.trigger(ImageVideoPlayer.EVENT_PRELOAD_COMPLETE);

            }

        },

        onPreloadComplete: function () {

            this.preloaded = true;

            if (this.playing) {

                this.render();

            }

        },

        onFrame: function () {

            if (this.playing) {

                if (this.currentFrameIndex < this.frames.length) {

                    if (new Date().getTime() - this.lastFrameTime >= this.interval) {

                        this.renderFrame(this.currentFrameIndex++);
                        this.lastFrameTime = new Date().getTime();

                    }

                } else {

                    this.pause();
                    this.events.trigger(ImageVideoPlayer.EVENT_PLAYBACK_END);

                }

            }

        }

    }

});
