/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 6/19/13
 * Time: 3:59 PM
 */

var LandingPageView = View._extend({

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        init: function () {

            this.fullScreenTarget = $('.main')[0];

            this.$connectionCode = this.$container.find('input.connection-code');
	        this.$formConnectionCode = this.$container.find('[name="form-connection-code"]');
            this.$buttonConnect = this.$container.find('button.connect');
            this.$noCode = this.$container.find('.no-code');

            this.$noCode.html(this.$noCode.html().replace('{{url}}', '<span>' + Config.getInstance().desktopConnectionUrl + '</span>').replace('http://', '').replace('https://', ''));

            this.$buttonGoogle = this.$container.find('.icon-google');
            this.$buttonTwitter = this.$container.find('.icon-twitter');
            this.$buttonFacebook = this.$container.find('.icon-facebook');


        },

        bindEvents: function () {

            var self = this;

            this.$buttonConnect.off('click').bind('click', function () {
                self.onButtonConnectClick();
            });

	        this.$formConnectionCode.submit(function() {
		        self.onButtonConnectClick();
		        return false;
	        });

            this.$connectionCode.off('blur').bind('blur', function () {
                self.onConnectionCodeBlur();
            });

            this.$connectionCode.off('keyup').bind('keyup', function (event) {
                self.onConnectionCodeChange(event);
            });

            this.$connectionCode.off('keydown').bind('keydown', function (event) {
                return self.onConnectionCodeKeyDown(event);
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

            this.$container.find('.about').bind('click', function () {
                RoutingController.getInstance().routeAbout();
            });

            this.$container.find('.terms').bind('click', function () {
                RoutingController.getInstance().routeTerms();
            });

            $(window).bind('touchstart.LandingPageView', function () {
                self.onTouch();
            });


        },

        show: function (nextView) {

            if (!View.prototype.show.call(this, nextView)) {
                return;
            }

            this.$connectionCode.val('');
            this.onConnectionCodeChange();

            RemoteController.getInstance().waitForConnectionCode();
            MobileController.getInstance().preventUndoShake();

            AnalyticsController.getInstance().trackPageView('LandingPageView');

        },

        //quick debugging code
        forceConnection: function(code) {

            console.log('Automatic Connection: ',code);
            this.$connectionCode.val(code);
            this.onButtonConnectClick();

        }

    },

    _private: {

        fullScreenTarget: null,
        $buttonGoogle: null,
        $buttonTwitter: null,
        $buttonFacebook: null,
        $connectionCode: null,
        $buttonConnect: null,
        $noCode: null,
        connectionClickInProgress: false,

        onButtonConnectClick: function () {

            if ($.trim(this.$connectionCode.val()).length !== 5) {
                return;
            }

            this.connectionClickInProgress = true;
            document.activeElement.blur();
            this.$connectionCode.blur();
            this.hide();
            //$(window).trigger('resize');
            ViewController.getInstance().getView('JoinView').show(this.$connectionCode.val().toLowerCase());

        },

        onConnectionCodeBlur: function () {

            if (!this.connectionClickInProgress && DetectionController.getInstance().isSafari) {
                window.setTimeout(function () { $(window).trigger('resize'); }, 0);
                this.connectionClickInProgress = false;
            }

        },

        onConnectionCodeKeyDown: function (event) {

            if (DetectionController.getInstance().isAndroid) {
                return true;
            }

            if (this.$connectionCode.val().length === 5) {
                //on 5 chars just allow backspace
                return event.which === 8;
            }
        },

        onConnectionCodeChange: function (event) {

            if (DetectionController.getInstance().isAndroid) {
                var code = this.$connectionCode.val();

                if (code.length > 5) {
                    this.$connectionCode.val(code.slice(0, 5));
                }
            }

            if (event && event.keyCode === 13) {
                // enter
                this.onButtonConnectClick();
                event.preventDefault();
                event.stopPropagation();
                return false;
            }

            if (this.$connectionCode.val().length === 5) {

                this.$buttonConnect.addClass('active');

            } else {

                this.$buttonConnect.removeClass('active');

            }

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

        onTouch: function () {

            if (DetectionController.getInstance().isAndroid) {
                FullScreenController.getInstance().request(this.fullScreenTarget);
            }

        }

    }

});
