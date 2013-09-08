/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 5/29/13
 * Time: 4:19 PM
 */

var FooterLinksView = View._extend({

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        show: function () {

            if (!View.prototype.show.call(this)) {
                return;
            }

            this.$selectLanguage.find('option').filter(function() {
                return $(this).val() === i18n.lng().toLowerCase() || (i18n.lng().toLowerCase() === 'en' && $(this).val() === 'en-us');
            }).prop('selected', true);

        }

    },

    _private: {

        $buttonGoogle: null,
        $buttonTwitter: null,
        $buttonFacebook: null,
        $selectLanguage: null,
        $buttonFullScreen: null,
        fullScreenTarget: null,

        init: function () {

            this.$buttonGoogle = this.$container.find('button.share.google');
            this.$buttonTwitter = this.$container.find('button.share.twitter');
            this.$buttonFacebook = this.$container.find('button.share.facebook');
            this.$selectLanguage = this.$container.find('select.language');
            this.$buttonFullScreen = this.$container.find('button.fullscreen');
            this.fullScreenTarget = $('.fullscreen-target')[0];

        },

        bindEvents: function () {

            var self = this;

            this.$buttonGoogle.bind('click', function () {

                self.onButtonGoogleClick();

            });

            this.$buttonTwitter.bind('click', function () {

                self.onButtonTwitterClick();

            });

            this.$buttonFacebook.bind('click', function () {

                self.onButtonFacebookClick();

            });

            this.$selectLanguage.bind('change', function () {
                self.onLanguageChange();
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

        },

        onButtonGoogleClick: function () {

            SharingController.getInstance().shareLinkOnGoogle();

        },

        onButtonTwitterClick: function () {

            SharingController.getInstance().shareOnTwitter();

        },

        onButtonFacebookClick: function () {

            SharingController.getInstance().shareLinkOnFacebook();

        },

        onLanguageChange: function () {

            window.location.href = window.location.protocol + '//' + window.location.host + '/?lng=' + this.$selectLanguage.val();

        },

        onButtonFullscreenClick: function () {

            FullScreenController.getInstance().toggle(this.fullScreenTarget);

        },

        onFullScreenOn: function () {

            this.$buttonFullScreen.addClass('on');

        },

        onFullScreenOff: function () {

            this.$buttonFullScreen.removeClass('on');

        }        

    }

});
