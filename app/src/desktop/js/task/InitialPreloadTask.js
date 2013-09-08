/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 5/12/13
 * Time: 11:49 PM
 */

var InitialPreloadTask = Task._extend({

    _static: {

    },

    _public: {

        construct: function () {

            var subtasks = [
                new LocalisationInitTask()
            ];
            Task.call(this, subtasks, 0);

        }

    },

    _private: {

    }

});
