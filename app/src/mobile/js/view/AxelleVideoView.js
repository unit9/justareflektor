/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/8/13
 * Time: 11:47 AM
 */

var AxelleVideoView = View._extend({

    _static: {

        START_TIME: 4 * 60 + 7, // 4:07
        END_TIME: 4 * 60 + 42,  // 4:42
        NOISE_FADE_START: 80,//160,
        NOISE_FADE_END: 200,//279
        FRAME_PATH: '/m/img/axelle',
        FRAME_BASE: 'AXELLE_GLITCH_phone_',
        FRAME_START: 0,
        FRAME_END: 279,
        FRAME_STEP: 1,
        PADDING: 6,
        FRAME_EXTENSION: '.jpg',
        FRAME_RATE: 11,
        FRAME_WIDTH: 320,
        FRAME_HEIGHT: 480

    },

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        show: function (progress) {

            if (!View.prototype.show.call(this, progress)) {
                return;
            }

            this.paused = false;

        },

        pause: function () {

            if (this.paused) {
                return;
            }

            this.paused = true;

        },

        hide: function () {

            View.prototype.hide.call(this);
            this.pause();

        }

    },

    _private: {

        $video: null,
        $canvas: null,
        paused: false,
        player: null,
        overlayImages: [],
        currentOverlayIndex: 0,
        canvas: null,
        context: null,
        clear: false,
        redrawRate: 0,
        lastRedrawTime: -1,
        lastFrameIndex: -1,

        initAsync: function () {

            this.$video = this.$container.find('.video');
            this.canvas = document.createElement('canvas');
            this.context = this.canvas.getContext('2d');

            // NOTE: we no longer use the player playback. Instead, we manually set its frames based on synced local clock.
            this.player = new ImageVideoPlayer({

                path: AxelleVideoView.FRAME_PATH,
                base: AxelleVideoView.FRAME_BASE,
                start: AxelleVideoView.FRAME_START,
                end: AxelleVideoView.FRAME_END,
                step: AxelleVideoView.FRAME_STEP,
                pad: AxelleVideoView.PADDING,
                ext: AxelleVideoView.FRAME_EXTENSION,
                frameRate: AxelleVideoView.FRAME_RATE,
                width: AxelleVideoView.FRAME_WIDTH,
                height: AxelleVideoView.FRAME_HEIGHT

            });

            this.redrawRate = 1000 / this.player.options.frameRate;

            this.$canvas = $(this.player.canvas);
            this.$video.append(this.$canvas);
//            this.player.context.globalCompositeOperation = 'lighter';

            this.loadOverlayImages();
            this.bindEventsAsync();

        },

        bindEventsAsync: function () {

            var self = this;

            AnimationController.getInstance().events.unbind(AnimationController.EVENT_FRAME + '.AxelleVideoView');
            AnimationController.getInstance().events.bind(AnimationController.EVENT_FRAME + '.AxelleVideoView', function () {
                self.onFrame();
            });

        },

        loadOverlayImages: function () {

            var self = this,
                imagesToLoad = 6,
                image;

            function onImageLoadComplete() {

                self.overlayImages.push(image);
                if (--imagesToLoad === 0) {
                    self.onResize();
                    if (self.shown) {
                        self.player.play();
                    }
                } else {
                    loadNextOverlayImage();
                }

            }

            function loadNextOverlayImage() {

                image = new Image();
                image.onload = onImageLoadComplete;
                image.src = '/m/img/axelle/NOISE_0000' + self.overlayImages.length + '.jpg';

            }

            loadNextOverlayImage();

        },

        onFrame: function () {

            if (!this.shown) {
                return;
            }

            // Calculate current frame of Axelle based on synchronised clock.
            this.player.currentFrameIndex = Math.round(Math.max(0, (TimelineController.getInstance().getCurrentTime() * 0.001 - AxelleVideoView.START_TIME) / (AxelleVideoView.END_TIME - AxelleVideoView.START_TIME) * AxelleVideoView.FRAME_END));

            if (this.player && this.player.currentFrameIndex !== this.lastFrameIndex && this.player.currentFrameIndex <= this.player.options.end) {

                this.player.context.clearRect(0, 0, this.player.canvas.width, this.player.canvas.height);
                this.lastFrameIndex = this.player.currentFrameIndex;
                this.player.context.globalAlpha = 1;
                this.player.renderFrame(this.player.currentFrameIndex);
                this.player.context.globalAlpha = Math.min(Math.max((this.player.currentFrameIndex - AxelleVideoView.NOISE_FADE_START) / (AxelleVideoView.NOISE_FADE_END - AxelleVideoView.NOISE_FADE_START), 0), 1);
                this.player.context.drawImage(this.overlayImages[this.currentOverlayIndex], 0, 0, this.player.canvas.width, this.player.canvas.height);
                this.player.context.globalAlpha = 1;
                this.currentOverlayIndex = (this.currentOverlayIndex + 1) % this.overlayImages.length;

                this.lastRedrawTime = -1;

            } else if (!this.player || this.player.currentFrameIndex >= this.player.options.end) {

                if (new Date().getTime() - this.lastRedrawTime >= this.redrawRate) {

                    this.player.context.clearRect(0, 0, this.player.canvas.width, this.player.canvas.height);
                    this.player.context.globalAlpha = 1;
                    this.player.context.drawImage(this.overlayImages[this.currentOverlayIndex], 0, 0, this.player.canvas.width, this.player.canvas.height);
                    this.currentOverlayIndex = (this.currentOverlayIndex + 1) % this.overlayImages.length;
                    this.lastRedrawTime = new Date().getTime();

                }

            }

            if (this.player.currentFrameIndex >= AxelleVideoView.NOISE_FADE_END) {
                this.$container.addClass('end');
            } else {
                this.$container.removeClass('end');
            }

            if (ViewController.getInstance().getView('TurnItBackView').shown || this.player.currentFrameIndex >= this.player.options.end) {
                this.$container.addClass('back');
            } else {
                this.$container.removeClass('back');
            }

        },

        onResize: function () {

            var bodyWidth = $(document).width(),
                bodyHeight = $(document).height(),
                aspect;

            if (!this.player) {
                return;
            }

            aspect = this.player.options.width / this.player.options.height;

            if (bodyWidth / bodyHeight > aspect) {

                this.$canvas.width(bodyWidth);
                this.$canvas.height(Math.ceil(bodyWidth / aspect));

            } else {

                this.$canvas.height(bodyHeight);
                this.$canvas.width(Math.ceil(bodyHeight * aspect));

            }

            this.player.canvas.width = bodyWidth;
            this.player.canvas.height = bodyHeight;
            this.$canvas.css('margin-left', (bodyWidth - this.$canvas.width()) * 0.5);
            this.$canvas.css('margin-top', (bodyHeight - this.$canvas.height()) * 0.5);

            // re-render the last frame as resize clears canvas
            this.onFrame();

        }

    }

});
