/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 7/16/13
 * Time: 12:21 AM
 */

var TurnItBackSequence = Sequence._extend({

    _static: {

        MIN_ROTATION: 110

    },

    _public:  {

        started: false,

        construct: function (id, $container) {

            Sequence.call(this, id, $container);

        },

        begin: function () {

            var self = this;

            if (this.started) return;

            this.started = true;

            AnimationController.getInstance().events.bind(AnimationController.EVENT_FRAME + '.TurnItBackSequence', function () {
                self.onFrame();
            });

        },

        end: function () {

            if (!this.started) return;

            this.started = false;
            
            AnimationController.getInstance().events.unbind(AnimationController.EVENT_FRAME + '.TurnItBackSequence');

        }

    },

    _private: {

        isPromptShown: false,
        resetPreformed: false,
        resetCount: 0,

        onFrame: function () {

            if (!ViewController.getInstance().getView('HelpView').shown && OrientationController.getInstance().timesReset > 0 && (Math.abs(OrientationController.getInstance().worldQuaternion.x) > TurnItBackSequence.MIN_ROTATION / 180 || Math.abs(OrientationController.getInstance().worldQuaternion.y) > TurnItBackSequence.MIN_ROTATION / 180)) {

                RemoteController.getInstance().showTurnItBack();

            } else {

                RemoteController.getInstance().hideTurnItBack();

            }

        }

    }

});
