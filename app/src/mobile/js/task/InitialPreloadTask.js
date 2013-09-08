/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 6/19/13
 * Time: 3:49 PM
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
