/**
 * @author Paweł Klimkowski pawel.klimkowski@unit9.com / pawe@sqrtx.pl
 * @copyright UNIT9 Ltd.
 * Date: 5/29/13
 * Time: 4:22 PM
 */

var WebcamTipView = View._extend({

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        init: function () {

        },

        bindEvents: function () {

            var self = this;

        },

        transitionShow: function () {

            this.$container.fadeIn();

        },

        transitionHide: function () {

            this.$container.fadeOut();

        },

        showJoin: function () {

            this.$sectionJoin.show();

        },

        showHost: function () {

            this.$sectionHost.show();
            RemoteController.getInstance().startDesktop();

        }

    },

    _private: {


    }

});
