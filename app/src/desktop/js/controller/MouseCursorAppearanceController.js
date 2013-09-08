var MouseCursorAppearanceController = Class._extend(Class.SINGLETON, {

    _static: {

        CURSOR_VISIBLE: true,
        TIMEOUT: 3000,

        EVENT_MOUSE_ACTIVE: 'MouseCursorApperanceController_EVENT_MOUSE_ACTIVE',
        EVENT_MOUSE_INACTIVE: 'MouseCursorApperanceController_EVENT_MOUSE_INACTIVE',

        MODE_INTERACTIVE: 'interactive',
        MODE_NON_INTERACTIVE: 'noninteractive'

    },

    _public: {

        mode: null,
        mouseActivityTimeout: -1,
        initialized: false,
        dom: $("body"),
        lastPoint: { x: 0, y: 0 },
        cursorShown: false,

        construct: function () {

            this.mode = MouseCursorAppearanceController.MODE_INTERACTIVE;

        },

        startTrackMouseActivity: function () {

            var self = this;

            if (this.mouseActivityTimeout >= 0) {
                clearTimeout(this.mouseActivityTimeout);
            }

            this.mouseActivityTimeout = setTimeout(this.hideMouseCursor.bind(this), MouseCursorAppearanceController.TIMEOUT);

            if (!this.initialized) {
                this.dom.mousemove(function (e) {
                    self.followMouseCursor(e.clientX, e.clientY);
                });
                this.initialized = true;
            }
        },

        stopTrackMouseActivity: function () {

            this.dom.unbind('mousemove');
            clearTimeout(this.mouseActivityTimeout);
            this.setCursor('default');
            this.initialized = false;

        },

        followMouseCursor: function (x, y) {

            if (x === this.lastPoint.x && y === this.lastPoint.y) {
                return;
            }

            this.lastPoint.x = x;
            this.lastPoint.y = y;

            if (!this.showMouseCursor() && this.mode === MouseCursorAppearanceController.MODE_NON_INTERACTIVE) {
                this.hideMouseCursor();
            }

        },

        setMode: function (mode) {

            this.mode = mode;

        },

        hideMouseCursor: function () {

            this.setCursor('none');
            this.cursorShown = false;
            MouseCursorAppearanceController.CURSOR_VISIBLE = false;
            this.events.trigger(MouseCursorAppearanceController.EVENT_MOUSE_INACTIVE);
        },

        showMouseCursor: function () {

            if (this.mode === MouseCursorAppearanceController.MODE_INTERACTIVE || this.lastPoint.y > window.innerHeight - 90 || ViewController.getInstance().getView("HelpView").shown) {
                this.setCursor((this.lastPoint.y > window.innerHeight - 90 || InputController.getInstance().mode === InputController.INPUT_TYPE_TRACKING || ViewController.getInstance().getView("HelpView").shown) ? 'default' : 'none');
                this.cursorShown = true;
                MouseCursorAppearanceController.CURSOR_VISIBLE = true;
                this.startTrackMouseActivity();
                this.events.trigger(MouseCursorAppearanceController.EVENT_MOUSE_ACTIVE);
                return true;
            }
            return false;
        },

        toogleMouseCursor: function () {
            MouseCursorAppearanceController.CURSOR_VISIBLE = !MouseCursorApperanceController.CURSOR_VISIBLE;
            this.setCursor(MouseCursorAppearanceController.CURSOR_VISIBLE ? 'default' : 'none');
        },

        setCursor: function (type) {
            this.dom.css({cursor: type});
        }

    }

});
