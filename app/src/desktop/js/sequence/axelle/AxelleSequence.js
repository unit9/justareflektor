/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/16/13
 * Time: 11:06 AM
 */
var AxelleSequence = Sequence._extend({

    _static: {

        MIN_ROTATION: 100

    },

    _public:  {

        construct: function (id, $container) {

            Sequence.call(this, id, $container);

        },

        pause: function () {

            console.log('-- AxelleSequence pause');
            RemoteController.getInstance().pauseAxelle(this.lastProgress);

        },

        resume: function () {

            console.log('-- AxelleSequence resume');
            this.showAxelle = true;

        },

        begin: function () {

            this.showAxelle = true;

            console.log('-- AxelleSequence begin');
            if (typeof this.defaultOptions.animationEnd === 'string') {

                this.defaultOptions.animationEnd = TimelineController.getInstance().parseTime(this.defaultOptions.animationEnd);

            }

            RendererController.getInstance().disablePhoneInteraction();
        },

        end: function () {

            console.log('-- AxelleSequence end');
            RemoteController.getInstance().hideAxelle();
            RendererController.getInstance().enablePhoneInteraction();

        },

        seekStart: function () {

            this.pause();

        },

        seek: function () {

            console.log('-- AxelleSequence seek');
            this.showAxelle = true;

        },

        update: function (options, currentFrame, delta, time, progress, position, orientation) {

            // recalculate the progress because the sequence as a whole lasts until the end of experience, but the animation does not.
            // we need progress of the animation, not of the whole sequence.
            progress = time  / (this.defaultOptions.animationEnd - this.startTime);

            if (this.showAxelle) {

                console.log('-- AxelleSequence show Axelle remote', progress);
                this.lastProgress = progress;
                RemoteController.getInstance().showAxelle(progress);
                this.showAxelle = false;

            }

        }

    },

    _private: {

        showAxelle: false,
        isPromptShown: false,
        lastProgress: 0

    }

});
