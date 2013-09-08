/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/1/13
 * Time: 4:01 PM
 */

var RoutingControllerBase = Class._extend(Class.ABSTRACT, {

    _public: {

        historyStates: [],
        history: [],
        fullScreenStates: [],

        construct: function (routes, baseUrl) {

            this.supportsHistory = !!window.history;
            this.routes = routes;
            this.baseUrl = baseUrl || '';
            this.timesRouted = 0;

        },

        init: function () {

            var self = this;

            setInterval(function () {

                self.checkHashChange();

            }, 200);

            FullScreenController.getInstance().events.bind(FullScreenController.EVENT_FULLSCREEN_OFF, function () {

                self.onFullScreenOff();

            });

        },

        back: function () {

            this.historyStates.pop();
            var backUrl = this.historyStates.pop();
            console.log('////// back', backUrl);
            this.route(backUrl || '/', {trigger: true});

        },

        route: function (url, options) {

            var trigger = url,
                back = url,
                urlComponents,
                handlers,
                routeDefault = true,
                i;

            url = url || window.location.pathname + window.location.search + window.location.hash;
            urlComponents = this.parseUrl(url);

            if (url.indexOf('__') !== 0) {

                this.history.push(url);

            }

            if (!this.initialRouted) {

                this.routeInitial();
                this.initialRouted = true;

            }

            handlers = this.getRouteHandlers(urlComponents);
            for (i = 0; i < handlers.length; ++i) {

                if (handlers[i].preventDefault) {
                    routeDefault = false;
                }

                if (handlers[i].trigger) {
                    trigger = handlers[i].trigger;
                }

                if (handlers[i].back) {
                    back = handlers[i].back;
                }

            }

            if (routeDefault) {

                this.routeDefault();

            }

            for (i = 0; i < handlers.length; ++i) {

                if (this.history.length < 3 && handlers[i].firstRoute) {

                    this[handlers[i].firstRoute](urlComponents);

                }

                if (handlers.length === 1 || !handlers[i].exclusive) {

                    this[handlers[i].handler](urlComponents);

                }

            }

            if (this.supportsHistory) {
                this.historyStates.push(back);
            }

            if (options && options.trigger) {

                this.trigger(trigger);

            }

            this.lastHash = window.location.hash;
            this.timesRouted ++;

        },

        routeInitial: function () {

            var self = this;

            window.onpopstate = function () {
                if (self.timesRouted > 2) {
                    self.back();
                }
            };
            return;

        },

        routeDefault: function () {

            return;

        }

    },

    _private: {

        baseUrl:            null,
        routes:             null,
        initialRouted:      false,
        supportsHistory:    false,
        lastHash:           null,
        lastState:          null,
        timesRouted:        0,

        parseUrl: function (url) {

            var hashIndex = url.indexOf('#'),
                questionMarkIndex,
                hash,
                search,
                base;

            if (!this.supportsHistory && hashIndex !== -1) {

                url = url.substring(hashIndex + 1, url.length);
                hashIndex = url.indexOf('#');

            }

            questionMarkIndex = url.indexOf('?');
            hash = hashIndex === -1 ? '' : url.substring(hashIndex + 1, url.length);
            search = this.parseSearch(questionMarkIndex === -1 ? '' : (hashIndex === -1 ? url.substring(questionMarkIndex + 1, url.length) : url.substring(questionMarkIndex + 1, hashIndex)));
            base = questionMarkIndex === -1 ? (hashIndex === -1 ? url : url.substring(0, hashIndex)) : url.substring(0, questionMarkIndex);

            return {base: base, hash: hash, search: search};

        },

        getRouteHandlers: function (route) {

            var handlers = [],
                i,
                config,
                match;

            for (i = 0; i < this.routes.length; ++i) {

                config = this.routes[i];
                match = route.base.match(new RegExp(config.base));

                if (match) {

                    handlers.push(config);

                }

            }

            return handlers;

        },

        parseSearch: function (search) {

            var result = {},
                pairs = search.split('&'),
                pair,
                i;

            for (i = 0; i < pairs.length; ++i) {

                pair = pairs[i].split('=');
                result[pair[0]] = pair[1];

            }

            return result;

        },

        trigger: function (url) {

            if (FullScreenController.getInstance().isFullScreen()) {

                this.fullScreenStates.push(url);

            } else {

                if (this.supportsHistory) {

                    window.history.pushState(null, null, this.baseUrl + url);

                } else {

                    window.location.hash = '#' + url;

                }

            }

        },

        checkHashChange: function () {

            if (window.location.hash !== this.lastHash) {

                this.lastHash = window.location.hash;
                this.onHashChange();

            }


        },

        onHashChange: function () {

            this.route();

        },

        onFullScreenOff: function () {

            var i;

            for (i = 0; i < this.fullScreenStates.length; ++i) {

                this.trigger(this.fullScreenStates[i]);

            }

            this.fullScreenStates = [];

        }

    }

});
