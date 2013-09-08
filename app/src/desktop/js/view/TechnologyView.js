/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 7/16/13
 * Time: 11:45 PM
 */

var TechnologyView = View._extend({

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        init: function () {

            this.$buttonClose = this.$container.find('button.close');

        },

        bindEvents: function () {

            var self = this;

            this.$buttonClose.bind('click', function () {
                self.onButtonCloseClick();
            })

        }

    },

    _private: {

        $buttonClose: null,

        onButtonCloseClick: function () {

            View.forceTransition = true;
            RoutingController.getInstance().back();

        }

    }

});
