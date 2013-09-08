/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 5/28/13
 * Time: 3:46 PM
 */

var PreloadController = Class._extend(Class.SINGLETON, {

    _static: {

        EVENT_INITIAL_PROGRESS: 'PreloadController_EVENT_INITIAL_PROGRESS',
        EVENT_INITIAL_COMPLETE: 'PreloadController_EVENT_INITIAL_COMPLETE',
        EVENT_MAIN_PROGRESS: 'PreloadController_EVENT_MAIN_PROGRESS',
        EVENT_MAIN_COMPLETE: 'PreloadController_EVENT_MAIN_COMPLETE',
        EVENT_ASSETS_DATA_PROGRESS: 'PreloadController_EVENT_ASSETS_DATA_PROGRESS',
        EVENT_ASSETS_DATA_COMPLETE: 'PreloadController_EVENT_ASSETS_DATA_COMPLETE',
        EVENT_EXPERIENCE_PROGRESS: 'PreloadController_EVENT_EXPERIENCE_PROGRESS',
        EVENT_EXPERIENCE_COMPLETE: 'PreloadController_EVENT_EXPERIENCE_COMPLETE',
        EVENT_TIMELINE_DATA_COMPLETE: 'PreloadController_EVENT_TIMELINE_DATA_COMPLETE',
        EVENT_TIMELINE_DATA_PROGRESS: 'PreloadController_EVENT_TIMELINE_DATA_PROGRESS'

    },

    _public: {

        experienceLoadStarted: false,
        resourcesInfo: null,
        timelineInfo: null,
        videoElement: null,


        preloadInitial: function () {

            var self = this,
                task = new InitialPreloadTask();

            task.events.on(Task.EVENT_PROGRESS, function (e, data) {

                self.events.trigger(PreloadController.EVENT_INITIAL_PROGRESS, [data.progress]);
                return e;

            });

            task.events.on(Task.EVENT_DONE, function () {

                self.events.trigger(PreloadController.EVENT_INITIAL_COMPLETE);

            });

            task.execute();

        },

        preloadMain: function () {

            var self = this,
                task = new MainPreloadTask();

            task.events.on(Task.EVENT_PROGRESS, function (e, data) {

                self.events.trigger(PreloadController.EVENT_MAIN_PROGRESS, [data.progress]);
                return e;

            });

            task.events.on(Task.EVENT_DONE, function () {

                self.events.trigger(PreloadController.EVENT_MAIN_COMPLETE);

            });

            task.execute();

        },

        preloadExperience: function () {

            var self = this,
                task,
                allSequencesToLoad,
                rs;

            //only load everything once
            if (this.experienceLoadStarted) {
                this.events.trigger(PreloadController.EVENT_EXPERIENCE_COMPLETE);
                return;
            }
            this.experienceLoadStarted = true;


            allSequencesToLoad = ['common', 'renderer'];
            for (rs in this.resourcesInfo) {
                if (this.resourcesInfo[rs] !== undefined) {
                    var ignore = false;
                    for (var i=0; i<this.timelineInfo.timeline.length; i++) {
                        if (this.timelineInfo.timeline[i].id === rs && this.timelineInfo.timeline[i].ignore) ignore = true;
                    }
                    if (!ignore) allSequencesToLoad.push(rs);
                }
            }

            task = new ExperiencePreloadTask(this.resourcesInfo, allSequencesToLoad, true);
            task.events.on(Task.EVENT_PROGRESS, function (e, data) {
                self.events.trigger(PreloadController.EVENT_EXPERIENCE_PROGRESS, [data.progress]);
                return e;
            });
            task.events.on(Task.EVENT_DONE, function () {
                self.events.trigger(PreloadController.EVENT_EXPERIENCE_COMPLETE);
            });
            task.execute();

        },

        preloadTimelineData: function () {

            var self = this,
                task = new LoadTimelineInformation();

            task.events.on(Task.EVENT_PROGRESS, function (e, data) {

                self.events.trigger(PreloadController.EVENT_TIMELINE_DATA_PROGRESS, [data.progress]);
                return e;

            });

            task.events.on(Task.EVENT_DONE, function () {

                self.events.trigger(PreloadController.EVENT_TIMELINE_DATA_COMPLETE);

            });

            task.execute();

        },

        preloadResources: function () {

            // preloads prototype resources given a JSON description with URLs, file sizes etc.

            var self = this,
                task = new LoadAssetsInformation();

            task.events.on(Task.EVENT_PROGRESS, function (e, data) {

                self.events.trigger(PreloadController.EVENT_ASSETS_DATA_PROGRESS, [data.progress]);
                return e;

            });

            task.events.on(Task.EVENT_DONE, function () {

                self.events.trigger(PreloadController.EVENT_ASSETS_DATA_COMPLETE);

            });

            task.execute();

        }

    }

});
