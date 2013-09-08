/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 5/29/13
 * Time: 4:44 PM
 */

var EndScreenView = View._extend({

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        show: function () {

            var self = this;

            if (!View.prototype.show.call(this)) {
                return;
            }

            AnalyticsController.getInstance().trackPageView('EndScreenView');

        }

    },

    _protected: {

        $buttonRestart: null,
        $buttonCredits: null,
        $buttonShareGoogle: null,
        $buttonShareFacebook: null,
        $buttonShareTwitter: null,

        init: function () {

            this.$buttonRestart = this.$container.find('button.restart');
            this.$buttonCredits = this.$container.find('button.credits');
            this.$buttonShareGoogle = this.$container.find('button.share.google');
            this.$buttonShareTwitter = this.$container.find('button.share.twitter');
            this.$buttonShareFacebook = this.$container.find('button.share.facebook');

        },

        bindEvents: function () {

            var self = this;

            this.$buttonRestart.bind('click', function () {
                self.onRestartClick();
            });

            this.$buttonCredits.bind('click', function () {
                self.onCreditsClick();
            });

            this.$buttonShareGoogle.bind('click', function () {
                self.onButtonGoogleClick();
            });

            this.$buttonShareTwitter.bind('click', function () {
                self.onButtonTwitterClick();
            });

            this.$buttonShareFacebook.bind('click', function () {
                self.onButtonFacebookClick();
            });


        },

        onRestartClick: function () {

            this.hide();

            if (RemoteController.getInstance().peerNode || InputController.getInstance().mode === InputController.INPUT_TYPE_MOUSE) {

                RemoteController.getInstance().restart();
                RoutingController.getInstance().route('/experience');
                TimelineController.getInstance().setRestartFlag();

            } else {

                window.location.href = '/';

            }

        },

        onCreditsClick: function () {

            RemoteController.getInstance().restart();

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
