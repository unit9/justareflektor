/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 8/18/13
 * Time: 5:46 PM
 */

var ClockSyncTask = Task._extend({

    _public: {

        construct: function () {

            var subtasks = [];
            Task.call(this, subtasks, 1);

        }

    },

    _protected: {

        run: function () {

            var self = this;

            clocksync.sync(function () {
                console.log('clock synced', clocksync.time());
                self.notifyDone();
            });

        }

    }

});
