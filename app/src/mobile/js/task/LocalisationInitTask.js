/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 6/19/13
 * Time: 4:06 PM
 */

var LocalisationInitTask = Task._extend({

    _public: {

        construct: function () {

            var subtasks = [];
            Task.call(this, subtasks, 1);

        }

    },

    _protected: {

        run: function () {

            var self = this;

            LocalisationController.getInstance().events.on(LocalisationController.EVENT_READY, function () {

                self.notifyDone();

            });

            LocalisationController.getInstance().init();

        }

    }

});
