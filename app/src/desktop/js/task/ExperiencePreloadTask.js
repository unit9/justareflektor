/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/5/13
 * Time: 3:55 PM
 */

var ExperiencePreloadTask = Task._extend({

    _public: {

        construct: function (resources, sequenceList, loadVideo) {

            var self = this,
                subtasks = [];

            for (var i = 0; i < sequenceList.length; i++) {
                subtasks.push(new SequencePreloadTask(resources[sequenceList[i]], sequenceList[i]));
            }

            if (loadVideo) {
                subtasks.push(new MediaPreloadTask());
            }

            Task.call(this, subtasks, 1);

        }

    },

    _protected: {

        run: function () {


        },

        notifyProgress: function (p) {

            var totalp = 0.0;
            for (var i = 0; i < this.subtasks.length; i++) {
                if (this.subtasks[i].subtasks === 0 || this.subtasks[i].done || this.subtasks[i].progress >= 1) {
                    totalp += 1.0;
                } else {
                    totalp += this.subtasks[i].progress;
                }

            }
            this.progress = totalp / this.subtasks.length;
            this.events.trigger(Task.EVENT_PROGRESS, [
                {progress: this.progress, weight: this.weight}
            ]);

            if (this.progress >= 1) { // && this.videoReady
                this.done = true;
                this.unbindEvents();
                this.events.trigger(Task.EVENT_DONE, [
                    {progress: this.progress, weight: this.weight}
                ]);
            }
        },

        onDone: function () {

            this.notifyDone();

        }

    }

});
