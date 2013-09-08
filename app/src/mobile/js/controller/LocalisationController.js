/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 6/19/13
 * Time: 4:06 PM
 */

var LocalisationController = Class._extend(Class.SINGLETON, {

    _static: {

        EVENT_READY: 'LocalisationController_EVENT_READY'

    },

    _public: {

        init: function () {

            var self = this,
                qs;

            window.Handlebars.registerHelper('t', function (i18n_key) {

                return new window.Handlebars.SafeString(window.i18n.t(i18n_key));

            });

            qs = this.getQueryStringLanguage();

            if (qs) {

                // query string language override was provided, check if the language is supported
                this.isLanguageSupported(qs, function (supported) {

                    if (supported) {

                        self.initI18Next(qs);

                    } else {

                        // the language is not supported, check if it is a complex locale (e.g. "en-gb")
                        if (qs.indexOf('-') === -1) {

                            // it is a simple locale, we do not have a fallback, so ignore the query string override
                            qs = null;
                            self.initI18Next(qs);

                        } else {

                            // the language is complex so try basic one (e.g. for "en-gb" try "en")
                            qs = qs.substring(0, qs.indexOf('-'));

                            self.isLanguageSupported(qs, function (supported) {

                                if (!supported) {

                                    // the language is not supported so ignore the query override
                                    qs = null;

                                }

                                self.initI18Next(qs);

                            });

                        }

                    }

                });

            } else {

                this.initI18Next(qs);

            }

        },

        initI18Next: function (qs) {

            var self = this;

            window.i18n.init({

                fallbackLng: 'en-us',
                detectLngQS: 'lng', // e.g. /?lng=en-gb
                cookieName: 'lng',
                ns: 'mobile',
                lng: qs || window.LANGUAGE, /*(this.getCookieLanguage() ? this.getCookieLanguage() : window.LANGUAGE)*/ // set by GAE Django renderer based on request headers
                resGetPath: Config.getInstance().localisationResGetPath

            }, function () {

                DetectionController.getInstance().detectLanguage();
                self.events.trigger(LocalisationController.EVENT_READY);

            });

        },

        getQueryStringLanguage: function () {

            var match = window.location.search.match('lng=([a-zA-Z]+(-)?[a-zA-Z]+)');
            return match && match.length > 1 ? match[1] : null;

        },

        getCookieLanguage: function () {

            var match = document.cookie.match('lng=([a-zA-Z]+(-)?[a-zA-Z]+)');
            return match && match.length > 1 ? match[1] : null;

        },

        isLanguageSupported: function (language, callback) {

            if (typeof callback !== 'function') {
                return;
            }

            $.get(Config.getInstance().localisationResGetPath.replace('__lng__', language).replace('__ns__', 'mobile')).done(function () {
                callback(true);
            }).error(function () {
                callback(false);
            });

        }

    }

});
