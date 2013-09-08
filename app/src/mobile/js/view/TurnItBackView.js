/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 7/16/13
 * Time: 12:37 AM
 */

var TurnItBackView = View._extend({

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        show: function () {

            var self = this;

            clearTimeout(this.showTimeoutId);
            clearTimeout(this.hideTimeoutId);
            this.shown = true;

            this.showTimeoutId = setTimeout(function () {

                AnalyticsController.getInstance().trackPageView('TurnItBackView');

                if (DetectionController.getInstance().isTablet) {
                    self.$container.find('.turn-it-back').css({
                        left: 50,
                        right: 50,
                        top: 50,
                        bottom: 50
                    });
                }

                self.transitionShow();

                clearTimeout(self.hideTimeoutId);
                self.hideTimeoutId = setTimeout(function () {
                    self.transitionHide();
                }, 3000);

            }, 1000);

        },

        hide: function () {

            clearTimeout(this.showTimeoutId);
            clearTimeout(this.hideTimeoutId);
            View.prototype.hide.call(this);

        }

    },

    _private: {

        showTimeoutId: -1,
        hideTimeoutId: -1,

        transitionShow: function () {

            this.$page.css('opacity', 0);
            this.$container.show();
            TweenLite.to(this.$page, 0, {delay: 0, css: {opacity: 1}});
            this.endTransitionShow();

        },

        bindEvents: function () {

            var self = this;

            RemoteController.getInstance().events.bind(RemoteController.EVENT_TURNITBACK_START, function () {
                self.onTurnItBackStart();
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_TURNITBACK_STOP, function () {
                self.onTurnItBackStop();
            });

        },

        onTurnItBackStart: function () {

            this.show();

        },

        onTurnItBackStop: function () {

            this.hide();

        }

    }
});
