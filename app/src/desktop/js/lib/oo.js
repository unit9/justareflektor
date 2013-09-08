/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 4/22/13
 * Time: 11:53 PM
 */

(function () {

    function transcribe (name, from, to) {

        to[name] = from[name];

        if (typeof from[name] === 'function') {

            to[name].__name__ = name;

        }

    }

    var Class = function () {

        this.events = $({});

    };

    Class.prototype._extend = function (type, sub) {

        if (typeof type === 'undefined') {
            return null;
        }

        if (type === this._extend) {
            return type;
        }

        if (typeof sub === 'undefined') {
            sub = type;
            type = Class.PUBLIC;
        }

        var SubClass, field, self = this;

        /* constructor */
        switch(type) {

            case Class.PUBLIC:
                SubClass = sub._public && sub._public.construct ? sub._public.construct : function () {};
                break;

            case Class.ABSTRACT:
                SubClass = function () {
                    if (!Class.prototype.__extending__()) {
                        // TODO: make it work with nested _super
//                        throw new Error('Illegal attempt to directly instantiate abstract class');
                    }

                    if (sub._public.construct) {
                        sub._public.construct.apply(this, arguments);
                    }
                };
                break;

            case Class.SINGLETON:
                SubClass = function () {
                    if (!Class.prototype.__singletonInstantiation__ || !Class.prototype.__singletonInstantiation__()) {
                        throw new Error('Illegal attempt to directly instantiate singleton class. Use getInstance() instead.');
                    }
                    if (sub._public && sub._public.construct) {
                        sub._public.construct.call(this);
                    }
                };
                SubClass.getInstance = function () {
                    if(SubClass.__instance__) {
                        return SubClass.__instance__;
                    } else {
                        Class.prototype.__singletonInstantiation__ = function () { return true };
                        SubClass.__instance__ = new SubClass();
                        Class.prototype.__singletonInstantiation__ = function () { return false };
                        return SubClass.__instance__;
                    }
                }
                break;

        }

        SubClass.__constructor__ = function () { return true };

        /* extend */
        Class.prototype.__extending__ = function () { return true };
        try {
            SubClass.prototype = new this();
        } catch(e) {
            console.log('Error providing inheritance. Class constructor has thrown an error:\n' + e.stack + '\nPlease make sure constructors can always run fine with no parameters specified.');
        }
        Class.prototype.__extending__ = function () { return false };

        /* enable further extension */
        SubClass._extend = SubClass.prototype._extend;

        /* super */
        SubClass.prototype._super = function() {

            var caller = arguments.callee.caller;

            if(caller.__constructor__ && caller.__constructor__()) {

                Class.prototype.__extending__ = function () { return true };
                self.apply(this, arguments);
                Class.prototype.__extending__ = function () { return false };

            } else if(typeof self.prototype[caller.__name__] === 'function') {

                return self.prototype[caller.__name__].apply(this, arguments);

            } else {

                throw new Error('No super method for ' + caller.__name__);

            }

        }

        /* provide event mechanisms */
        SubClass.prototype.events = $({});

        /* transcribe public */
        for (field in sub._public) {
            if (field !== 'construct') {
                transcribe(field, sub._public, SubClass.prototype);
            }
        }

        /* transcribe protected */
        for (field in sub._protected) {
            transcribe(field, sub._protected, SubClass.prototype);
        }

        /* transcribe private */
        for (field in sub._private) {
            transcribe(field, sub._private, SubClass.prototype);
        }

        /* transcribe static */
        for (field in sub._static) {
            transcribe(field, sub._static, SubClass);
        }

        return SubClass;

    };

    Class._extend = Class.prototype._extend;
    Class.PUBLIC = 1;
    Class.ABSTRACT = 2;
    Class.SINGLETON = 3;

    window.Class = Class;

}());
