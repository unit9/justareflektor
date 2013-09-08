/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 6/19/13
 * Time: 4:09 PM
 */

var ViewController = Class._extend(Class.SINGLETON, {

    _static: {

    },

    _public: {

        init: function (layout) {

            var viewId, ViewClass, selector;

            for (selector in layout) {

                if (layout.hasOwnProperty(selector)) {

                    viewId = layout[selector].id;

                    if (!this.viewsById[viewId]) {

                        ViewClass = layout[selector].Class;
                        this.viewsById[viewId] = new ViewClass(viewId, selector);

                    }

                }

            }

        },

        getView: function (id) {

            return this.viewsById[id];

        }

    },

    _private: {

        viewsById: {}

    }

});
