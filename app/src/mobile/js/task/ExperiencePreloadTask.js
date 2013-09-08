/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 7/6/13
 * Time: 10:35 PM
 */

var ExperiencePreloadTask = Task._extend({

    _public: {

        construct: function () {

            var subtasks = [

                // Axelle Overlays
                new ImagePreloadTask(AxelleVideoView.FRAME_PATH.replace('/m/', '') + '/' + 'phone_txt_break_free.png'),
                new ImagePreloadTask(AxelleVideoView.FRAME_PATH.replace('/m/', '') + '/' + 'phone_txt_just.png'),
                new ImagePreloadTask(AxelleVideoView.FRAME_PATH.replace('/m/', '') + '/' + 'phone_broken_v2_1.png')

            ],
                i;

            // Axelle Video
            for (i = AxelleVideoView.FRAME_START; i < AxelleVideoView.FRAME_END + 1; i += AxelleVideoView.FRAME_STEP) {
                subtasks.push(new ImagePreloadTask(AxelleVideoView.FRAME_PATH.replace('/m/', '') + '/' + AxelleVideoView.FRAME_BASE + this.pad(i, AxelleVideoView.PADDING) + AxelleVideoView.FRAME_EXTENSION));
            }

            Task.call(this, subtasks, 0);

        }

    },

    _protected: {

        pad: function (number, length) {

            var s = '000000000000' + number;
            return s.substring(Math.max(s.length - length, 0), s.length);

        }

    }

});
