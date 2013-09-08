/**
 * @author Édouard Lanctôt  < edouardlb@gmail.com >
 * @author Maciej Zasada maciej@unit9.com
 */
var MediaPreloadTask = Task._extend({

    _static: {

        VIDEOS: [
            {path: '/media/video/480/reflektor_full_audio.webm', resolution: {width: 480, height: 252}, size: 34},
            {path: '/media/video/640/reflektor_full_audio.webm', resolution: {width: 640, height: 336}, size: 48},
            {path: '/media/video/960/reflektor_full_audio.webm', resolution: {width: 960, height: 505}, size: 80},
            {path: '/media/video/1280/reflektor_full_audio.webm', resolution: {width: 1280, height: 672}, size: 113}
        ],

        VIDEO_LOWRES_VERSION:  1,
        VIDEOS_USE_RESOURCE: false,
        VIDEOS_WITH_AUDIO: true

    },

    _public: {

        construct: function () {

            var self = this,
                subtasks = [],
                player = Player.getInstance();

            Task.call(this, subtasks, 10);

            this.loading = 'video';
            this.datController = Debug.add(this, 'loading', 'ExperienceLoading');

            if (player.ready) {
                this.onDone();
            } else {
                player.events.on(Player.EVENT_LOADING_PROGRESS, function () {
                    self.onProgress();
                });
                player.events.on(Player.EVENT_LOADING_READY, function () {
                    self.onDone();
                });
            }

        }

    },

    _protected: {

        loading: 'video',
        datController: null,

        run: function () {

        },

        onProgress: function (p) {
            this.progress = 0.5;
            this.events.trigger(Task.EVENT_PROGRESS, [
                {progress: this.progress, weight: this.weight}
            ]);
        },

        onDone: function () {
            this.progress = 1.0;
            this.done = true;
            this.events.trigger(Task.EVENT_PROGRESS, [
                {progress: this.progress, weight: this.weight}
            ]);
            this.events.trigger(Task.EVENT_DONE, [
                {progress: this.progress, weight: this.weight}
            ]);

            console.log('dat', this.datController);
            Debug.remove(this.datController, 'ExperienceLoading');
        }

    }

});
