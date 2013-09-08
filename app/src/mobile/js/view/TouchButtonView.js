/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/2/13
 * Time: 2:50 PM
 */

var TouchButtonView = View._extend({

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        show: function () {

            if (this.shown || !View.prototype.show.call(this)) {
                return;
            }


        },

        hide: function () {

            View.prototype.hide.call(this);

        }

    }

});
