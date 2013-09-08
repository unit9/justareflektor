/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/1/13
 * Time: 4:09 PM
 */

var RoutingControllerBase = Class._extend(Class.ABSTRACT, {

    _public: {

        historyStates: [],
        history: [],

        construct: function (routes, baseUrl) {

            this.supportsHistory = !!window.history;
            this.routes = routes;
            this.baseUrl = baseUrl;

        },

        init: function () {

            var self = this;

            setInterval(function () {

                self.checkHashChange();

            }, 200);

        },

        back: function () {

            this.historyStates.pop();
            var backUrl = this.historyStates.pop();
            this.routeDefault();
            this.route(backUrl || '/');

        },

        route: function (url, options) {

            var trigger = !!url,
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

                if (!this.routeInitial()) {

                    return false;

                }

                this.initialRouted = true;

            }

            handlers = this.getRouteHandlers(urlComponents);
            for (i = 0; i < handlers.length; ++i) {

                if (handlers[i].preventDefault) {

                    routeDefault = false;

                }

                if (handlers[i].trigger === false) {

                    trigger = false;

                }

            }

            if (routeDefault) {

                this.routeDefault();

            }

            for (i = 0; i < handlers.length; ++i) {

                if (this.history.length < 2 && handlers[i].firstRoute) {

                    this[handlers[i].firstRoute](urlComponents);

                }

                if (handlers.length === 1 || !handlers[i].exclusive) {

                    this[handlers[i].handler](urlComponents);

                }

            }

            if (options && options.trigger && trigger) {

                this.trigger(url);

            }

            this.lastHash = window.location.hash;

        },

        routeInitial: function () {

//            window.onpopstate = this.back.bind(this);
            return;

        },

        routeDefault: function () {

            return;

        }

    },

    _private: {

        routes:             null,
        baseUrl:            '',
        initialRouted:      false,
        supportsHistory:    false,
        lastHash:           null,
        lastState:          null,

        parseUrl: function (url) {

            var hashIndex, hash, search, base, questionMarkIndex;

            /* ignore base URL */
            if (url.indexOf(this.baseUrl) === 0) {

                url = url.replace(this.baseUrl, '/');

            }

            /* remove double slash in the beginning */
            if (url.indexOf('//') === 0) {

                url = url.substring(1, url.length);

            }

            /* ignore trailing slash */
            if (url.lastIndexOf('/') === url.length - 1 && url.length !== 1) {

                url = url.substring(0, url.length - 1);

            }

            hashIndex = url.indexOf('#');

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

            if (this.supportsHistory) {

                window.history.pushState(null, null, this.baseUrl + url);
                this.historyStates.push(url);

            } else {

                window.location.hash = '#' + url;

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

        }

    }

});
