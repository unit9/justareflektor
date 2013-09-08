/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 6/19/13
 * Time: 3:49 PM
 */

var MainPreloadTask = Task._extend({

    _public: {

        construct: function () {

            var subtasks = [

                // assets
                new AssetPreloadTask('main', 'background.jpg'),
                new ImagePreloadTask('img/main/turn-it-back.jpg'),
                new SpriteMapPreloadTask('main'),
                new ClockSyncTask(),
                new AudioPreloadTask()

            ];

            Task.call(this, subtasks, 0);

        }

    }

});
