/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/4/13
 * Time: 2:25 PM
 */

var ExperienceEmptyView = View._extend({

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        show: function () {

            if (!View.prototype.show.call(this)) {
                return;
            }

            AnalyticsController.getInstance().trackPageView('ExperienceEmptyView');

        }

    }

});
