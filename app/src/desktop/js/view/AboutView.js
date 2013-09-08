/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 7/5/13
 * Time: 9:12 PM
 */

var AboutView = View._extend({

    _public: {

        player: null,
        player2: null,

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        init: function () {

            this.$buttonLogo = this.$container.find('.logo button');
            this.$buttonClose = this.$container.find('button.close');
            this.$linkCine = this.$container.find('a[href="http://www.cineinstitute.com"]');

            var tag = document.createElement('script');
            tag.src = "//www.youtube.com/player_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            // Replace the 'ytplayer' element with an <iframe> and
            // YouTube player after the API code downloads.
            var self = this;
            window.onYouTubePlayerAPIReady = function () {
                self.player = new YT.Player('ytPlayer_about', {
                    height: '240',
                    width: '320',
                    videoId: '_3D8hYIfpqg',
                    playerVars: {
                        allowScriptAccess: 'always',
                        wmode: 'opaque'
                    }
                });

                self.player2 = new YT.Player('ytPlayer_about2', {
                    height: '240',
                    width: '320',
                    videoId: 'KW63DY8dvww',
                    playerVars: {
                        allowScriptAccess: 'always',
                        wmode: 'opaque'
                    }
                });
            };

        },

        bindEvents: function () {

            var self = this;

            this.$buttonLogo.unbind('click').bind('click', function () {
                self.onButtonCloseClick();
            });

            this.$buttonClose.unbind('click').bind('click', function () {
                self.onButtonCloseClick();
            });

            this.$linkCine.unbind('click').bind('click', function (e) {
                self.onLinkCineClick(e);
            });

        },

        show: function () {

            if (!View.prototype.show.call(this)) {
                return;
            }
            
            /* resize columns into 'px', because of the responsiveness of youtube player and min-width for credits */
            $('.AboutView').find('.column.left').css('width',$('.AboutView').find('.column.left').parent().width() - $('.AboutView').find('.column.right').outerWidth(true)+'px');
            $(window).resize(function() {
              $('.AboutView').find('.column.left').css('width',$('.AboutView').find('.column.left').parent().width() - $('.AboutView').find('.column.right').outerWidth(true)+'px');
            });

            AnalyticsController.getInstance().trackPageView('AboutView');

        },

        hide: function () {

            View.prototype.hide.call(this);

            if (this.player && this.player.stopVideo) {
                this.player.stopVideo();
            }

        }

    },

    _private: {

        $buttonLogo: null,
        $buttonClose: null,
        $linkCine: null,

        onButtonCloseClick: function () {

            this.hide();
            // force transition of the page that's underneath;
            View.forceTransition = true;
            if (ViewController.getInstance().getView('LandingPageView').shown) {
                RoutingController.getInstance().route('/', {trigger: true});
            } else if (ViewController.getInstance().getView('EndScreenView').shown) {
                ViewController.getInstance().getView('EndScreenView').show();
            }

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
