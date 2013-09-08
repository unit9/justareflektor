/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 5/29/13
 * Time: 4:05 PM
 */

var LandingPageView = View._extend({

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        show: function () {

            if (!View.prototype.show.call(this)) {
                return;
            }

            if (TimelineController.getInstance().initialised) {
                window.location.href = '/';
                return;
            }

            this.onResize();

            InputController.getInstance().setMode(InputController.INPUT_TYPE_TRACKING);
            AnalyticsController.getInstance().trackPageView('LandingPageView');

            PerformanceController.getInstance().beginWebglPerformanceTest();
        }

    },

    _private: {

        $buttonDownloadChrome: null,
        buttonEnter: null,
        logo: null,
        content: null,
        percXHead: 550 / 1300,

        init: function () {

            this.$buttonDownloadChrome = this.$container.find('.error-browser a');
            this.buttonEnter = this.$container.find('button.enter');
            this.logo = this.$container.find('.hero-logo');
            this.content = this.$container.find('.content');

        },

        bindEvents: function () {

            var self = this;

            this.$buttonDownloadChrome.bind('click', function (event) {
                self.onButtonDownloadChromeClick(event);
            });

            this.buttonEnter.bind('click', function () {
                self.onButtonEnterClick();
            });

            if (DetectionController.getInstance().isChrome) {
                this.logo.bind('click', function () {
                    self.onButtonEnterClick();
                });
            }

        },

        onButtonDownloadChromeClick: function (event) {

            event.preventDefault(); // do not redirect if there's a link in the copy
            AnalyticsController.getInstance().trackEvent(AnalyticsController.EVENT_DOWNLOAD_CHROME);
            window.open('https://www.google.com/chrome/', '_blank');

        },

        onButtonEnterClick: function () {

            if (CameraController.getInstance().videoReady) {

                RoutingController.getInstance().route('/setup');

            } else {

                RoutingController.getInstance().route('/instructions');

            }

        },

        onResize: function () {
            var ww = window.innerWidth,
                wh = window.innerHeight;

            var imgRatio = 1300 / 800;
            var windowRatio = ww / wh;

            var newImgW, newImgH, scale;

            if (imgRatio > windowRatio) {
                newImgW = wh * imgRatio;
            } else {
                newImgW = ww;
            }

            var xHead = newImgW * this.percXHead - (newImgW - ww) / 2;

            var scale = ww <= 1300 ? 1 : Math.min(ww / 1300, 1.6);
            var marginLeft = (xHead - this.content.width()) * 0.1 + 10; //15 is because the logo is not really round
            var marginTop = ( wh - this.content.height() * scale - 8 ) / 2.8 + this.content.height() * (scale - 1) / 2;
            scale = 'scale(' + scale + ')';

            this.content.css({
                right: marginLeft,
                marginLeft: 0,
                //top: marginTop,
                //marginTop: 0,
                transform: scale,
                WebkitTransform: scale,
                MsTransform: scale
            }).find('.enter').css({
                    transform: 'scale(1.001)',
                    WebkitTransform: 'scale(1.001)',
                    MsTransform: 'scale(1.001)'
                });
        }

    }

});
