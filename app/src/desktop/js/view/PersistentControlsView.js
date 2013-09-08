/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 5/29/13
 * Time: 4:19 PM
 */

var PersistentControlsView = View._extend({

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        isQualityMenuOpen: function () {

            return this.$qualityMenu.hasClass('open');

        },

        slideIn: function () {

            this.canSlideOut = true;

            if (this.isSlidIn) {
                return;
            }

            clearTimeout(this.slideOutTimeoutId);
            this.isSlidIn = true;
            this.$container.addClass('in');
            this.$container.removeClass('out');

        },

        slideOut: function (opts) {

            var self = this,
                doSlideOut = function () {
                    self.isSlidIn = false;
                    self.$container.addClass('out');
                    self.$container.removeClass('in');
                };

            if ((!this.isSlidIn || !this.canSlideOut) && (!opts || !opts.force)) {
                return;
            }

            if (opts && opts.delay) {
                clearTimeout(this.slideOutTimeoutId);
                this.slideOutTimeoutId = setTimeout(function () {
                    doSlideOut();
                }, opts.delay);
            } else {
                doSlideOut();
            }

        },

        showQuality: function () {
            return; // we're having it always displayed
//            this.$quality.show();
        },

        hideQuality: function () {
            return; // we're having it always displayed
//            this.$quality.hide();
        },

        updateVolumeBar: function (volumePercentage) {

            if (volumePercentage) {
                var volume = volumePercentage;
            } else {
                var volume = VolumeController.VOLUME / 100;
            }

            var barsToHighlight = volume * 10;
            var bars = this.$volumeBar.find(".bar");
            var discreetVolume = 0;

            bars.each(function (i, o) {
                if (i + 1 <= barsToHighlight) {
                    $(o).removeClass("down");
                    discreetVolume += 1;
                } else {
                    $(o).addClass("down");
                }
            });

            if (discreetVolume === 0) {
                Player.getInstance().setVolume(0);
            }

            console.log('dv: ', discreetVolume, 'v: ', Player.getInstance().video.volume);

        },

        showVolume: function () {

            this.$volumeVar.css('display', 'block');
            TweenLite.to(this.$volumeBar, {css: {opacity: 1, duration: 1}});

        },

        hideVolume: function () {

            var self = this;

            TweenLite.to(this.$volumeBar, {css: {opacity: 0, duration: 1}, onComplete: function () {
                self.$volumeVar.css('display', 'none');
            }});

        }

    },

    _private: {

        $quality: null,
        $buttonQuality: null,
        $qualityMenu: null,
        $qualityItems: null,
        $buttonHelp: null,
        $buttonFullScreen: null,
        $volumeBar: null,
        $root: null,

        fullScreenTarget: null,
        resumeTimelineAfterHelpCloses: false,

        volumeBarStartPosition: 0,
        volumeChanging: false,

        isSlidIn: true,
        canSlideOut: false,
        slideOutTimeoutId: -1,
        slideInDelayId: -1,


        init: function () {

            this.$quality = this.$container.find('.quality');
            this.$buttonQuality = this.$container.find('.quality button');
            this.$qualityMenu = this.$container.find('.quality .menu');
            this.$qualityItems = this.$container.find('.quality .menu .item');
            this.$buttonHelp = this.$container.find('button.help');
            this.$buttonFullScreen = this.$container.find('button.fullscreen');
            this.$volumeBar = this.$container.find('div.volume-control-bar');
            this.$root = $("div.main");

            this.fullScreenTarget = $('.fullscreen-target')[0];

            this.hideQuality();

        },

        bindEvents: function () {

            var self = this;

            this.$buttonQuality.bind('click', function () {
                self.onButtonQualityClick();
            });

            this.$qualityItems.bind('click', function () {
                self.onQualityItemClick($(this));
            });

            this.$buttonHelp.bind('click', function () {
                self.onButtonHelpClick();
            });

            this.$buttonFullScreen.bind('click', function () {
                self.onButtonFullscreenClick();
            });

            FullScreenController.getInstance().events.bind(FullScreenController.EVENT_FULLSCREEN_ON, function () {
                self.onFullScreenOn();
            });

            FullScreenController.getInstance().events.bind(FullScreenController.EVENT_FULLSCREEN_OFF, function () {
                self.onFullScreenOff();
            });

            VolumeController.getInstance().events.bind(VolumeController.EVENT_VOLUME_CHANGE, function () {
                self.updateVolumeBar();
            });

            VolumeController.getInstance().events.bind(VolumeController.EVENT_VOLUME_CHANGE_REQUEST, function (e, data) {
                VolumeController.getInstance().setVolume(Math.ceil(data.volume * 100), true);
            });

            Player.getInstance().events.bind(Player.EVENT_QUALITY_CHANGE, function () {
                self.onQualityChange();
            });

            $(".PersistentControlsView").bind('onselectstart', function (e) {
                e.preventDefault();
                return;
            });

            this.$volumeBar.bind('mousedown', function (e) {
                ViewController.getInstance().uiBarActive = true;
                e.preventDefault();
                self.onStartVolumeChange(e);
            });

            this.$root.bind('mouseup', function (e) {
                ViewController.getInstance().uiBarActive = false;
                self.onFinishVolumeChange();
            });

            this.$root.bind('mousemove', function (e) {
                e.preventDefault();
                self.onVolumeChanging(e);
            });

        },

        onButtonQualityClick: function () {

            this.$qualityMenu.toggleClass('open');

        },

        onQualityItemClick: function ($item) {

            var width = $item.data('width');
            console.log('selecting width: ', width);
            Player.getInstance().setQuality(parseInt(width));
            this.$qualityMenu.removeClass('open');

        },

        onButtonHelpClick: function () {

            if (ViewController.getInstance().getView('HelpView').shown) {

                if (this.resumeTimelineAfterHelpCloses) {

                    TimelineController.getInstance().resume();

                }

                ViewController.getInstance().getView('HelpView').hide();

            } else {

                this.resumeTimelineAfterHelpCloses = TimelineController.getInstance().running;
                TimelineController.getInstance().pause();
                ViewController.getInstance().getView('HelpView').show();

            }

        },

        onButtonFullscreenClick: function () {

            FullScreenController.getInstance().toggle(this.fullScreenTarget);

        },

        onFullScreenOn: function () {

            this.$buttonFullScreen.addClass('on');

        },

        onFullScreenOff: function () {

            this.$buttonFullScreen.removeClass('on');

        },

        onStartVolumeChange: function (e) {
            this.volumeChanging = true;
            this.onVolumeChanging(e);
        },

        onFinishVolumeChange: function () {
            this.volumeChanging = false;
        },

        onVolumeChanging: function (e) {
            if (!this.volumeChanging) return;
            var percentage = Math.min(Math.max((e.pageX - this.$volumeBar.offset().left) / 50, 0), 1);
            this.updateVolumeBar(percentage);
            Player.getInstance().setVolume(percentage);
        },

        onQualityChange: function () {

            var $item;

            this.$qualityItems.removeClass('selected');
            $item = this.$qualityItems.filter('[data-width=' + Player.getInstance().quality + ']');

            if ($item.length === 0) {
                $(this.$qualityItems[this.$qualityItems.length - 1]).addClass('selected');
            } else {
                $item.addClass('selected');
            }

        }

    }

});
