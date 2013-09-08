/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/3/13
 * Time: 3:31 PM
 */

var DisconnectedView = View._extend({

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        show: function () {

            if (!View.prototype.show.call(this)) {
                return;
            }

            $.cookie('code', '');
            AnalyticsController.getInstance().trackPageView('DisconnectedView');

        }

    }
});
