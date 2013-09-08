/**
 * @author Paweł Klimkowski pawel.klimkowski@unit9.com / pawel@sqrtx.pl
 * @copyright UNIT9 Ltd.
 */

var Viewport = Class._extend(Class.SINGLETON, {

    _static: {

        MOUSE_X: 0,
        MOUSE_Y: 0,
        WIDTH: 0,
        HEIGHT: 0

    },

    _public: {

        initialize: function () {
            return;
        },

        construct: function () {
            //Viewport.getInstance().updateBox();
            return;
        },

        update: function () {
            document.onmousemove = this.updateCursor;
            window.onresize = this.updateBox;
        }
    },

    _private: {

        updateCursor: function (e) {
            Viewport.MOUSE_Y = e.clientY;
            Viewport.MOUSE_X = e.clientX;
        },

        updateBox: function () {
            Viewport.WIDTH = $(window).width();
            Viewport.HEIGHT = $(window).height();
        }


    }
});
