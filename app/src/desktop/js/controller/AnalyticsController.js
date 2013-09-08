/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 8/5/13
 * Time: 5:12 PM
 */

var AnalyticsController = Class._extend(Class.SINGLETON, {

    _static: {

        EVENT_SYNC_START: {category: 'sync', action: 'start', label: 'sync started', value: 1},
        EVENT_SYNC_SUCCESS: {category: 'sync', action: 'success', label: 'sync success', value: 1},
        EVENT_SYNC_FULL: {category: 'sync', action: 'camera', label: 'sync camera', value: 1},

        EVENT_MODE_CAMERA: {category: 'mode', action: 'phone', label: 'phone mode', value: 1},
        EVENT_MODE_MOUSE: {category: 'mode', action: 'mouse', label: 'mouse mode', value: 1},

        EVENT_CAMERA_ALLOW: {category: 'camera', action: 'allow', label: 'allow camera access', value: 1},
        EVENT_CAMERA_DENY: {category: 'camera', action: 'deny', label: 'deny camera access', value: 1},

        EVENT_SHARE_GOOGLE: {category: 'share', action: 'google', label: 'share google', value: 1},
        EVENT_SHARE_FACEBOOK: {category: 'share', action: 'facebook', label: 'share facebook', value: 1},
        EVENT_SHARE_TWITTER: {category: 'share', action: 'twitter', label: 'share twitter', value: 1},

        EVENT_DOWNLOAD_CHROME: {category: 'download', action: 'chrome', label: 'download chrome', value: 1},

        EVENT_PERFORMANCE_WEBGLSCORE: {category: 'performance', action: 'webglscore', label: 'WebGL performance score', value: 1},

        EVENT_TECH_PRESET: {category: 'tech', action: 'preset', label: 'Preset selected', value: 1},
        EVENT_TECH_MODE: {category: 'tech', action: 'mode', label: 'Changed viewing mode', value: 1},
        EVENT_TECH_PARAM: {category: 'tech', action: 'param', label: 'Changed parameters', value: 1},
        EVENT_TECH_SHARE: {category: 'tech', action: 'share', label: 'Shared custom link', value: 1},
        EVENT_TECH_WEBGL: {category: 'tech', action: 'webgl', label: 'Has webgl', value: 1},
        EVENT_TECH_LANG: {category: 'tech', action: 'language', label: 'Set language', value: 1},
        EVENT_TECH_CODE: {category: 'tech', action: 'code', label: 'Got the code', value: 1}

    },

    _public: {

        construct: function() {

            this.setupGoogleAnalyticsAPI();

        },

        trackEvent: function (event, override) {

            var field;

            if (override) {
                for (field in override) {
                    if (event[field]) {
                        event[field] = override[field];
                    }
                }
            }

            console.log('[event]', event.category, '|', event.action, '|', event.label, '|', event.value);
            _gaq.push(['_trackEvent', event.category, event.action, event.label, event.value]);

        },

        trackPageView: function (page) {

            console.log('[pageview]', page);
            _gaq.push(['_trackPageview', '_view_/desktop/' + page]);

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
