var MouseModeButtonController = Class._extend(Class.SINGLETON, {

    _static: {

        /* ... */

    },

    _public: {

        registerFieldCopy: function ( domElement ) {

            $(domElement).click(this.buttonOnClick);

        },

        buttonOnClick: function (e) {

        }
    }

});
