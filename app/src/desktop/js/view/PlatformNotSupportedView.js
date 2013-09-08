/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/18/13
 * Time: 6:00 PM
 */

var PlatformNotSupportedView = View._extend({

    _static: {

        COPY: {
            hasCanvas: 'PlatformNotSupportedView.browser',
            hasWebSockets: 'PlatformNotSupportedView.browser',
            hasWebGL: 'PlatformNotSupportedView.hardware',
            hasMinimumBandwidth: 'PlatformNotSupportedView.network'
        }

    },

    _public: {

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);

        },

        show: function (supportInfo) {

            if (!View.prototype.show.call(this, supportInfo)) {
                return;
            }

            this.$message.html($.t(PlatformNotSupportedView.COPY[supportInfo.reason[0].property]));

            console.log('-------- SUPPORT INFO ---------');
            console.log(JSON.stringify(supportInfo));
            console.log('----- END OF SUPPORT INFO -----');
            AnalyticsController.getInstance().trackPageView('PlatformNotSupportedView');

        }

    },

    _private: {

        $message: null,

        init: function () {

            this.$message = this.$container.find('.message bdo');

        }

    }

});
