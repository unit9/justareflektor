/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 8/18/13
 * Time: 4:35 PM
 */

var AudioPreloadTask = Task._extend({

    _public: {

        construct: function () {

            var subtasks = [];
            Task.call(this, subtasks, 1);

        }

    },

    _protected: {

        run: function () {

            var self = this;

            AudioController.getInstance().events.bind(AudioController.EVENT_LOADED, function () {
                AudioController.getInstance().play();
                self.notifyDone();
            });

            AudioController.getInstance().load();

        }

    }

});
