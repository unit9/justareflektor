/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 5/28/13
 * Time: 3:24 PM
 */

var ViewController = Class._extend(Class.SINGLETON, {

    _static: {

    },

    _public: {

        init: function (layout) {

            var viewId, ViewClass, selector;

            for (selector in layout) {

                if (layout[selector] !== undefined) {

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
