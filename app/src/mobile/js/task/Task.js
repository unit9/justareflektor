/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 6/19/13
 * Time: 3:58 PM
 */

var Task = Class._extend(Class.ABSTRACT, {

    _static: {

        EVENT_PROGRESS: 'Task_EVENT_PROGRESS',
        EVENT_DONE: 'Task_EVENT_DONE'

    },

    _public: {

        construct: function (subtasks, ownWeight) {

            this.ownWeight = ownWeight || 0;
            this.subtasks = subtasks || [];
            this.events = $({});

            this.recalculateWeight();

        },

        execute: function () {

            var i;

            this.bindEvents();

            for (i = 0; i < this.subtasks.length; i++) {

                this.subtasks[i].execute();

            }

            this.run();

        }

    },

    _protected: {

        ownWeight: 0,   // this task sprcific weight
        ownProgress: 0, // this task specific progress
        subtasks: [],

        weight: 0,      // global weight
        progress: 0,    // global progress
        done: false,    // global done

        wrapHandler: function (context, handler) {

            return function (e, data) {

                handler.call(context, e, data);

            };

        },

        bindEvents: function () {

            var i;

            for (i = 0; i < this.subtasks.length; i++) {

                this.subtasks[i].events.on(Task.EVENT_PROGRESS, this.wrapHandler(this, this.onSubtaskProgress));
                this.subtasks[i].events.on(Task.EVENT_COMPLETE, this.wrapHandler(this, this.onSubtaskDone));

            }

        },

        unbindEvents: function () {

            return false;
//            var i;

//            for (i = 0; i < this.subtasks.length; i++) {

//                this.subtasks[i].events.off(Task.EVENT_PROGRESS);
//                this.subtasks[i].events.off(Task.EVENT_COMPLETE);

//            }

        },

        recalculateWeight: function () {

            var i;

            this.weight = this.ownWeight;

            for (i = 0; i < this.subtasks.length; i++) {

                this.weight += this.subtasks[i].weight;

            }

        },

        recalculateProgress: function () {

            var weightDone = this.ownProgress * this.ownWeight,
                i;

            for (i = 0; i < this.subtasks.length; i++) {

                weightDone += this.subtasks[i].progress * this.subtasks[i].weight;

            }

            this.progress = this.weight === 0 ? (this.ownWeight === 0 ? 1 : (weightDone / this.ownWeight)) : (weightDone / this.weight);

        },

        run: function () {

            // individual task implementation goes here
            return false;

        },

        notifyProgress: function (progress) {

            this.ownProgress = progress;
            this.recalculateProgress();
            this.events.trigger(Task.EVENT_PROGRESS, [
                {progress: this.progress, weight: this.weight}
            ]);

            if (this.progress === 1) {

                this.done = true;
                this.unbindEvents();
                this.events.trigger(Task.EVENT_DONE, [
                    {progress: this.progress, weight: this.weight}
                ]);

            }

        },

        notifyDone: function () {

            this.notifyProgress(1);

        },

        onSubtaskProgress: function () {

            this.notifyProgress(this.progress);

        },

        onSubtaskDone: function () {

            this.notifyProgress(this.progress);

        }

    },

    _private: {

    }

});
