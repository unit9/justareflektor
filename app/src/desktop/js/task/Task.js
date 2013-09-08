/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 5/12/13
 * Time: 11:15 PM
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

        execute : function () {

            this.bindEvents();

            for(var i = 0; i < this.subtasks.length; i ++) {

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

        bindEvents : function () {

            var self = this;

            for(var i = 0; i < this.subtasks.length; i ++) {

                this.subtasks[i].events.on(Task.EVENT_PROGRESS, function (e, data) {

                    self.onSubtaskProgress(e, data);

                });

                this.subtasks[i].events.on(Task.EVENT_COMPLETE, function (e, data) {

                    self.onSubtaskDone(e, data);

                });

            }

        },

        unbindEvents : function () {

            for(var i = 0; i < this.subtasks.length; i ++) {

//                this.subtasks[i].events.off(Task.EVENT_PROGRESS);
//                this.subtasks[i].events.off(Task.EVENT_COMPLETE);

            }

        },

        recalculateWeight : function () {

            this.weight = this.ownWeight;

            for(var i = 0; i < this.subtasks.length; i ++) {

                this.weight += this.subtasks[i].weight;

            }

        },

        recalculateProgress : function() {

            var weightDone = this.ownProgress * this.ownWeight;

            for(var i = 0; i < this.subtasks.length; i ++) {

                weightDone += this.subtasks[i].progress * this.subtasks[i].weight;

            }

            this.progress = this.weight === 0 ? (this.ownWeight === 0 ? 1 : (weightDone / this.ownWeight)) : (weightDone / this.weight);

        },

        run : function() {

            // individual task implementation goes here

        },

        notifyProgress : function(progress) {
            this.ownProgress = progress;
            this.recalculateProgress();
            this.events.trigger(Task.EVENT_PROGRESS, [{progress: this.progress, weight: this.weight}]);

            if(this.progress === 1) {

                this.done = true;
                this.unbindEvents();
                this.events.trigger(Task.EVENT_DONE, [{progress: this.progress, weight: this.weight}]);

            }

        },

        notifyDone : function() {

            this.notifyProgress(1);

        },

        onSubtaskProgress : function() {

            this.notifyProgress(this.progress);

        },

        onSubtaskDone : function() {

            this.notifyProgress(this.progress);

        }

    },

    _private: {

    }

});
