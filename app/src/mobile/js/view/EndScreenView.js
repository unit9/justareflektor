/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/17/13
 * Time: 2:38 PM
 */

var EndScreenView = View._extend({

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        show: function () {

            if (!View.prototype.show.call(this)) {
                return;
            }

            $.cookie('code', '');
            AnalyticsController.getInstance().trackPageView('EndScreenView');

        }

    },

    _protected: {

        $buttonRestart: null,

        init: function () {

            this.$buttonRestart = this.$container.find('button.restart');

            this.$buttonGoogle = this.$container.find('.icon-google');
            this.$buttonTwitter = this.$container.find('.icon-twitter');
            this.$buttonFacebook = this.$container.find('.icon-facebook');

        },

        bindEvents: function () {

            var self = this;

            this.$buttonRestart.bind('click', function () {
                self.onRestartClick();
            });

            this.$buttonGoogle.bind('click', function () {
                self.onButtonGoogleClick();
                return false;
            });

            this.$buttonTwitter.bind('click', function () {
                self.onButtonTwitterClick();
                return false;
            });

            this.$buttonFacebook.bind('click', function () {
                self.onButtonFacebookClick();
                return false;
            });

        },

        onRestartClick: function () {

            RemoteController.getInstance().restart();
            this.hide();
            ViewController.getInstance().getView('ControllerView').show();
            ViewController.getInstance().getView('ControllerView').setMaxExperienceTimeTimeout();

        },

        onButtonGoogleClick: function () {

            SharingController.getInstance().shareLinkOnGoogle();

        },

        onButtonTwitterClick: function () {

            SharingController.getInstance().shareOnTwitter();

        },

        onButtonFacebookClick: function () {

            SharingController.getInstance().shareLinkOnFacebook();

        }

    }

});
