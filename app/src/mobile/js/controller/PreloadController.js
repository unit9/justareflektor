/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 6/19/13
 * Time: 3:44 PM
 */

var PreloadController = Class._extend(Class.SINGLETON, {

    _static: {

        EVENT_INITIAL_PROGRESS: 'PreloadController_EVENT_INITIAL_PROGRESS',
        EVENT_INITIAL_COMPLETE: 'PreloadController_EVENT_INITIAL_COMPLETE',
        EVENT_MAIN_PROGRESS: 'PreloadController_EVENT_MAIN_PROGRESS',
        EVENT_MAIN_COMPLETE: 'PreloadController_EVENT_MAIN_COMPLETE',
        EVENT_EXPERIENCE_PROGRESS: 'PreloadController_EVENT_EXPERIENCE_PROGRESS',
        EVENT_EXPERIENCE_COMPLETE: 'PreloadController_EVENT_EXPERIENCE_COMPLETE'

    },

    _public: {

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
                task = new ExperiencePreloadTask();

            task.events.on(Task.EVENT_PROGRESS, function (e, data) {

                self.events.trigger(PreloadController.EVENT_EXPERIENCE_PROGRESS, [data.progress]);
                return e;

            });

            task.events.on(Task.EVENT_DONE, function () {

                self.events.trigger(PreloadController.EVENT_EXPERIENCE_COMPLETE);

            });

            task.execute();

        }

    }

});
