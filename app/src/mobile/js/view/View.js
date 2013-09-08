/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 5/28/13
 * Time: 3:03 PM
 */

var View = Class._extend(Class.ABSTRACT, {

    _static: {

        EVENT_READY:        'View_EVENT_READY',
        TEMPLATES_PATH:     'm/template/view/',
        TRANSITION_TIME:     2000,

        helpers: [],

        registerHelper: function (helper, preRender) {

            View.helpers.push({f: helper, pre: preRender === true});

        }

    },

    _public: {

        construct: function (id, containerSelector, model) {

            var self = this;

            this.$container = containerSelector ? $(containerSelector) : null;
            if (containerSelector) {
                this.endTransitionHide();
            }

            this.id = id;
            this.model = model;
            this.hideTimeoutId = -1;
            this.showTransitionId = -1;
            this.hideTransitionId = -1;

            if (this.model) {

                this.model.events.on(Model.EVENT_CHANGE, function (e) {

                    self.onModelChange(e.data);

                });

            }

            if (this.id) {

                this.loadTemplate();

                $(window).bind('resize orientationchange webkitfullscreenchange mozfullscreenchange fullscreenchange', function () {

                    self.onResize.apply(self, arguments);

                });

                $(window).bind('touchmove', function () {

                    self.onTouchMove.apply(self, arguments);

                });

            }

        },

        init: function () {
            return;
        },

        bindEvents: function () {
            return;
        },

        show: function () {

            var originalArguments = arguments,
                self = this;

            clearTimeout(this.hideTimeoutId);

            if (!this.template) {

                clearTimeout(this.showTimeoutId);
                this.showTimeoutId = setTimeout(function () {

                    self.show.apply(self, originalArguments);

                }, 5);

                return false;

            }

            if (this.shown) {

                return true;

            }

            this.shown = true;
            this.transitionShow();
            return true;

        },

        hide: function () {

            var self = this;

            /*
             Delay the hiding by 1ms so we can cancel this action
             whenever there is a subsequent call to show()
             */

            clearTimeout(this.showTimeoutId);
            clearTimeout(this.hideTimeoutId);
            this.hideTimeoutId = setTimeout(function () {

                if (!self.shown) {

                    return false;

                }

                self.shown = false;

                self.transitionHide();

            }, 1);

            return true;

        },

        transitionShow: function () {

            clearTimeout(this.showTimeoutId);
            clearTimeout(this.hideTimeoutId);

            this.$page.css('opacity', 0);
            this.$container.show();
            TweenLite.to(this.$page, View.TRANSITION_TIME * 0.001, {css: {opacity: 1}, ease: Power2.easeIn, delay: 0.05});
//            this.$container.removeClass('hidden');
//            this.$container.removeClass('hiding');
//            this.$container.addClass('showing');

//            this.showTimeoutId = setTimeout(this.endTransitionShow.bind(this), View.TRANSITION_TIME);

            this.endTransitionShow();

        },

        endTransitionShow: function () {

            this.$container.removeClass('hidden');
            this.$container.removeClass('hiding');
            this.$container.removeClass('showing');
            this.$container.addClass('shown');
        },

        transitionHide: function () {

            clearTimeout(this.showTimeoutId);
            clearTimeout(this.hideTimeoutId);

//            this.$container.removeClass('hidden');
//            this.$container.removeClass('showing');
//            this.$container.removeClass('shown');
//            this.$container.addClass('hiding');
//            this.hideTimeoutId = setTimeout(this.endTransitionHide.bind(this), View.TRANSITION_TIME);

            this.endTransitionHide();
        },

        endTransitionHide: function () {

            this.$container.removeClass('hiding');
            this.$container.removeClass('shown');
            this.$container.addClass('hidden');
//            this.$container.hide();
        },

        destroy: function () {

            this.$container.remove();

        }

    },

    _protected: {

        id: null,
        $container: null,
        shown: false,
        template: null,
        model: null,
        showTimeoutId: -1,
        hideTimeoutId: -1,

        loadTemplate: function () {

            var self = this;

            if (Handlebars && Handlebars.templates && Handlebars.templates[this.id]) {

                this.onTemplateLoadComplete();

            } else {

                $.getScript(View.TEMPLATES_PATH + this.id + '.js', function () {

                    self.onTemplateLoadComplete();

                });

            }

        },

        renderTemplate: function () {

            this.$container.html(this.template(this.model));
            this.$page = this.$container ? this.$container.find('.page') : $({});

        },

        runHelpers: function (preRender) {

            var i;

            for (i = 0; i < View.helpers.length; ++i) {

                if (typeof View.helpers[i].f === 'function' && View.helpers[i].pre === preRender) {

                    View.helpers[i].f.call(this);

                }

            }

        },

        onTemplateLoadComplete: function () {

            this.template = Handlebars.templates[this.id];
            this.renderTemplateCore();

        },

        onPreRender: function () {

            return;

        },

        onPostRender: function () {

            return;

        },

        onModelChange: function (changeset) {

            return changeset;

        },

        onResize: function (e) {

            return e;

        },

        onTouchMove: function (e) {

            e.preventDefault();

        }

    },

    _private: {

        renderTemplateCore: function () {

            this.runHelpers(true);  // pre-render helpers
            this.renderTemplate();
            this.init();
            this.runHelpers(false); // post-render helpers
            this.bindEvents();
            this.onPostRender();

        }

    }

});
