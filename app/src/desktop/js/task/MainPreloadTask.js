/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 5/28/13
 * Time: 4:31 PM
 */

var MainPreloadTask = Task._extend({

    _public: {

        construct: function () {

            var subtasks = [

                // assets
                new ClockSyncTask(),
                new AssetPreloadTask('main', 'background-homepage.jpg'),
                new SpriteMapPreloadTask('main'),
                new TexturePreloadTask('WebcamControlView', 'media/images/mask_encre_scene0/mask_encre0.jpg'),
                new TexturePreloadTask('WebcamControlView', 'media/images/mask_encre_scene0/mask_encre1.jpg'),
                new TexturePreloadTask('WebcamControlView', 'media/images/mask_encre_scene0/mask_encre2.jpg'),
                new TexturePreloadTask('WebcamControlView', 'media/images/mask_encre_scene0/mask_encre3.jpg'),
                new TexturePreloadTask('WebcamControlView', 'media/images/mask_encre_scene0/mask_encre4.jpg'),
                new TexturePreloadTask('WebcamControlView', 'media/images/mask_encre_scene0/mask_encre5.jpg'),
                new TexturePreloadTask('WebcamControlView', 'media/images/mask_encre_scene0/mask_encre6.jpg'),
                new TexturePreloadTask('WebcamControlView', 'media/images/mask_encre_scene0/mask_encre7.jpg'),
                new TexturePreloadTask('WebcamControlView', 'media/images/mask_encre_scene0/mask_encre8.jpg'),
                new TexturePreloadTask('WebcamControlView', 'media/images/mask_encre_scene0/mask_encre9.jpg'),
                new TexturePreloadTask('WebcamControlView', 'media/images/mask_encre_scene0/mask_encre10.jpg')
            ];

            Task.call(this, subtasks, 0);

        }

    }

});
