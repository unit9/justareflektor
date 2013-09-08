/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 5/30/13
 * Time: 12:47 PM
 */

var SharingController = Class._extend(Class.SINGLETON, {

    _static: {

    },

    _public: {

        construct: function () {

            this.shareLink = window.location.protocol + '//' + window.location.host + '/lng/' + i18n.lng().toLowerCase();

        },

        shareLinkOnFacebook: function (url) {

            url = encodeURIComponent(url || this.shareLink);
            AnalyticsController.getInstance().trackEvent(AnalyticsController.EVENT_SHARE_FACEBOOK);
            this.openPopup('http://www.facebook.com/sharer.php?u={url}'.replace('{url}', url), 600, 300);

        },

        shareOnTwitter: function (text, url) {

            text = encodeURIComponent(text || $.t('Sharing.twitter'));
            url = '';//encodeURIComponent(url || this.shareLink);
            AnalyticsController.getInstance().trackEvent(AnalyticsController.EVENT_SHARE_TWITTER);
            this.openPopup('https://twitter.com/share/?text={text}&url={url}'.replace('{text}', text).replace('{url}', url), 600, 300);

        },

        shareLinkOnGoogle: function (url) {

            url = encodeURIComponent(url || this.shareLink);
            AnalyticsController.getInstance().trackEvent(AnalyticsController.EVENT_SHARE_GOOGLE);
            this.openPopup('https://plus.google.com/share?url={url}'.replace('{url}', url), 640, 480);

        }

    },

    _private: {

        openPopup: function (url, width, height, center, left, top) {

            var options;

            center = center || true;
            left = center ? ((screen.width - width) * 0.5) : left;
            top = center ? ((screen.height - height) * 0.5) : top;

            options = 'toolbar=no,status=no,width={width},height={height},left={left},top={top}'.replace('{width}', width).replace('{height}', height).replace('{left}', left).replace('{top}', top);

            window.open(url, '_blank', options);

        }

    }

});
