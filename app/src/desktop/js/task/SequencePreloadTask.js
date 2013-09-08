/**
 *
 * @author Édouard Lanctôt  < edouardlb@gmail.com >
 *
 */
var SequencePreloadTask = Task._extend({

    _public: {

        sequenceName: 'sequence',

        construct: function (resourceList, currentSequence) {

            var subtasks = [];
            this.sequenceName = currentSequence;

            for (var url in resourceList) {
                var info = resourceList[url];
                switch (info.type) {
                    case 'texture':
                        subtasks.push(new TexturePreloadTask(currentSequence, url, 'text', info.filesize));
                        break;

                    case 'shader':
                        subtasks.push(new XHRPreloadTask(currentSequence, url, 'text', info.filesize));
                        break;

                    case 'json':
                        subtasks.push(new XHRPreloadTask(currentSequence, url, 'json', info.filesize));
                        break;

                    case 'binary':
                        //not implemented yet
                        break;

                    case 'video':
                        //ignore
                        break;
                }
            }

            if (this.subtasks.length == 0) {
                this.progress = 1.0;
            } else {
                this.progress = 0.0;
            }

            this.loading = 'Sequence: ' + this.sequenceName;
            this.datController = Debug.add(this, 'loading', 'ExperienceLoading');

            Task.call(this, subtasks, 1);
        },

        toString: function () {
            return '[ SequencePreloadTask ' + this.sequenceName + ' ]';
        }

    },

    _protected: {

        datController: null,

        run: function () {
            if (this.subtasks.length == 0) {
                this.notifyProgress(1);
            }
        },

        notifyProgress: function (p) {

            var totalp = 0.0;
            for (var i = 0; i < this.subtasks.length; i++) {
                totalp += this.subtasks[i].progress;//console.log(this.subtasks);
            }
            this.progress = this.subtasks.length === 0 ? 1 : (totalp / this.subtasks.length);
            if (totalp >= this.subtasks.length) { // && this.videoReady
                if (!this.done) {
                    this.onDone();
                }
            }
            this.events.trigger(Task.EVENT_PROGRESS, [
                {progress: this.progress, weight: this.weight}
            ]);

            if (this.sequenceName === 'finale') {
                console.log(p, totalp, this.progress, this.subtasks.length);
            }
        },

        onDone: function () {

            this.progress = 1.0;
            this.done = true;
            this.unbindEvents();
            this.events.trigger(Task.EVENT_DONE, [{progress: this.progress, weight: this.weight}]);
            Debug.remove(this.datController, 'ExperienceLoading');

        }

    }

});
