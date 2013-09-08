/**
 * Date: 9/14/13
 * Time: 13:32
 */

var PerformanceWarningView = View._extend({
    _public: {
        construct: function (id, containerSelector) {
            View.call(this, id, containerSelector);
        },

        show: function () {
            if (!View.prototype.show.call(this)) {
                return;
            }

            AnalyticsController.getInstance().trackPageView('PerformanceWarningView');

            this.wasRunning = TimelineController.getInstance().running;

            if (this.wasRunning) {
                TimelineController.getInstance().pause();
            }

        },

        hide: function () {
            View.prototype.hide.call(this);

            if (this.wasRunning) {
                TimelineController.getInstance().resume();
            }
        }
    },

    _private: {
        wasRunning: false,

        init: function () {
            this.$button = this.$container.find('button');
        },

        bindEvents: function () {
            this.$button.on('click', $.proxy(function() {
                this.hide();
            }, this));
        }
    }

});
