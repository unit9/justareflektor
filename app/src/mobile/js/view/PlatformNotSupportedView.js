/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 8/3/13
 * Time: 4:54 PM
 */

var PlatformNotSupportedView = View._extend({
    _static: {
        COPY: {
            isOldIOS: 'PlatformNotSupportedView.deviceIos',
            hasCanvas: 'PlatformNotSupportedView.os',
            hasWebSockets: 'PlatformNotSupportedView.os',
	        isSupportedBrowser: 'LandingPage.errorBrowser',
            hasGyroscope: 'PlatformNotSupportedView.os'
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

            var copyID = PlatformNotSupportedView.COPY[supportInfo.reason[0].property];

            var reason = $.t(copyID);

            this.$message.html(this.$message.html().replace('{reason}', reason));

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
