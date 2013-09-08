/**
 * @author Paweł Klimkowski pawel.klimkowski@unit9.com / pawel@sqrtx.pl
 * @copyright 2013 UNIT9 Ltd.
 */

var LoadTimelineInformation = Task._extend(Class.ABSTRACT, {

    _static: {

    },

    _public: {

        construct: function (url) {

            Task.call(this, [], 1);
            this.url = url;

        }

    },

    _protected: {

        url: null,

        run: function () {

            var self = this;
            var errormsg = "Error loading timeline.json. LoadTimelineInformation task failed.";

            var acquireData = $.get("timeline.json",function (r) {

                // connected

            }).success(function (r) {


                }).error(function (r) {

                    console.log(r,errormsg);

                }).complete(function (r) {
                    var timelineInfo = JSON.parse(r.responseText);
                    for (var i=0; i<timelineInfo.timeline.length; i++) {
                        if (timelineInfo.timeline[i].ignore) {
                            console.log('Ignore Timeline Sequence:',timelineInfo.timeline[i].id);
                            timelineInfo.timeline.splice(i,1);
                            i--;
                        }
                    }
                    TimelineController.TIMELINE_RAW_DATA = timelineInfo;
                    PreloadController.getInstance().timelineInfo = timelineInfo;
                    self.onComplete();


                    // //UNUSED different timeline version for mouse
                    // $.get("timelineMouseDiff.json",function (r) {

                    //     // connected

                    // }).success(function (r2) {
                    // }).error(function (r2) {

                    //     console.log(r2,errormsg);

                    // }).complete(function (r2) {
                    //     TimelineController.TIMELINE_RAW_MOUSE_DATA = JSON.parse(r2.responseText);
                    //     self.onComplete();
                    // });
            });
        }

    },

    _private: {

        url: null,

        onComplete: function () {

            this.notifyDone();

        }

    }

});
