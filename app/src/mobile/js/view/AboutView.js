/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/16/13
 * Time: 2:35 PM
 */

var AboutView = View._extend({

    _static: {
        // path to the folder of images for 'About' page
        IMAGES_FOLDER: '/m/img/about/'
    },

    _public: {

        $logo: null,
        $close: null,
        $linkCine: null,
        player: null,
        player2: null,
        imageUrls: {
            'about-view-image': 'justareflektor_arcadefire.jpg', // class : name-of-image
            'about-view-image-1': 'justareflektor_arcadefire_1.jpg',
            'about-view-image-2': 'justareflektor_arcadefire_2.jpg',
            'about-view-image-3': 'justareflektor_arcadefire_3.jpg',
            'about-view-image-4': 'justareflektor_arcadefire_4.jpg',
            'about-view-image-5': 'justareflektor_arcadefire_5.jpg'
        },

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        init: function () {
            this.$close = this.$container.find('.icon-close');
            this.$logo = this.$container.find('.logo-about');
            this.$linkCine = this.$container.find('a[href="http://www.cineinstitute.com"]');
        },

        bindEvents: function () {

            var self = this;

            this.$logo.unbind('click').bind('click', function () {
                self.hide();
            });

            this.$close.unbind('click').bind('click', function () {
                self.hide();
            });

            this.$linkCine.unbind('click').bind('click', function (e) {
                self.onLinkCineClick(e);
            });

        },

        show: function () {

            var img;

            if (!View.prototype.show.call(this)) {
                return;
            }

            for (img in this.imageUrls) {
                // load  pictures / just once
                console.log('adding image', img, AboutView.IMAGES_FOLDER + this.imageUrls[img]);
                if (!this.$container.find('.' + img).attr("src")) {
                    this.$container.find('.' + img).attr("src", AboutView.IMAGES_FOLDER + this.imageUrls[img]);
                }
            }

            // if youtube video is not loaded yet, create it
            if (!this.$container.find('#ytPlayer_about').is("iframe")) {
                var tag = document.createElement('script');
                tag.src = "https://www.youtube.com/player_api";
                var firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

                // Replace the 'ytplayer' element with an <iframe> and
                // YouTube player after the API code downloads.
                var self = this;
                window.onYouTubePlayerAPIReady = function () {
                    self.player = new YT.Player('ytPlayer_about', {
                        height: '240',
                        width: '100%',
                        videoId: '_3D8hYIfpqg',
                        playerVars: {
                            showinfo: 0,
                            modestbranding: 1,
                            wmode: "opaque"
                        }
                    });
                    self.player2 = new YT.Player('ytPlayer_about2', {
                        height: '240',
                        width: '100%',
                        videoId: 'KW63DY8dvww',
                        playerVars: {
                            showinfo: 0,
                            modestbranding: 1,
                            wmode: "opaque"
                        }
                    });
                };
            }

            $('.main').css({overflow: 'visible'});

            $(window).unbind('touchmove');
            //$(window).bind('touchmove', function () {
            //    console.log('window touch');
            //})
            //AnalyticsController.getInstance().trackPageView('ConnectionTimeoutView');

        },

        hide: function () {
            $(window).bind('touchmove', function (e) {
                e.preventDefault();
            })
            $('.main').css({overflow: 'hidden'});
            if (this.player && this.player.stopVideo) {
                this.player.stopVideo();
            }

            View.prototype.hide.call(this);
            window.setupScroll();

        },

        /**
         * Fix missing target="_blank" in the copy
         * @param e
         */
        onLinkCineClick: function (e) {
            e.preventDefault();
            window.open('http://www.cineinstitute.com', '_blank');
        }
    }

});
