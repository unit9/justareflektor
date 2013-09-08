/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/2/13
 * Time: 5:37 PM
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

            AnalyticsController.getInstance().trackPageView('SyncSuccessView');

            setTimeout(function () {

                self.onTimeout();

            }, 3000);

        }

    },

    _private: {

        onTimeout: function () {

            this.hide();
            ViewController.getInstance().getView('ExperienceLoadingView').show();

        }

    }

});
