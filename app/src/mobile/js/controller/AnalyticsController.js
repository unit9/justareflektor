/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 8/5/13
 * Time: 5:12 PM
 */

var AnalyticsController = Class._extend(Class.SINGLETON, {

    _static: {

        EVENT_SYNC_TIMEOUT: {category: 'sync', action: 'timeout', label: 'sync timeout', value: 1},
        EVENT_SYNC_FULL: {category: 'sync', action: 'full', label: 'sync full', value: 1},
        EVENT_SYNC_WRONG_CODE: {category: 'sync', action: 'wrong code', label: 'sync wrong code', value: 1},

        EVENT_SHARE_GOOGLE: {category: 'share', action: 'google', label: 'share google', value: 1},
        EVENT_SHARE_FACEBOOK: {category: 'share', action: 'facebook', label: 'share facebook', value: 1},
        EVENT_SHARE_TWITTER: {category: 'share', action: 'twitter', label: 'share twitter', value: 1}        

    },

    _public: {

        construct: function() {

            this.setupGoogleAnalyticsAPI();

        },

        trackEvent: function ( package ) {

            console.log('[event]', package.category, '|', package.action, '|', package.label, '|', package.value);
            _gaq.push(['_trackEvent', package.category, package.action, package.label, package.value]);

        },

        trackPageView: function (page) {

            console.log('[pageview]', page);
            _gaq.push(['_trackPageview', '_view_/mobile/' + page]);

        }

    },

    _private: {

        setupGoogleAnalyticsAPI: function () {

            window._gaq = window._gaq || [];
            _gaq.push(['_setAccount', Config.getInstance().googleAnalyticsId]);
            _gaq.push(['_trackPageview']);

            (function() {
                var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
                ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
                var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
            })();

        }
    }
});
