/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/2/13
 * Time: 12:46 PM
 */

var SyncSuccessView = View._extend({

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        show: function () {

            var self = this;

            if (!View.prototype.show.call(this)) {
                return;
            }

            this.nextTimeoutId = setTimeout(function () {
                self.onTimeout();
            }, 4000);

            AnalyticsController.getInstance().trackPageView('SyncSuccessView');
            
        },

        hide: function () {

            View.prototype.hide.call(this);
            clearTimeout(this.nextTimeoutId);

        }

    },

    _private: {

        nextTimeoutId: -1,

        onTimeout: function () {

            this.hide();
            ViewController.getInstance().getView('ExperienceLoadingView').show();
            ViewController.getInstance().getView('ControllerView').show();

        }

    }

});
