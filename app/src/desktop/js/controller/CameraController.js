/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/4/13
 * Time: 5:18 PM
 */

var CameraController = Class._extend(Class.SINGLETON, {

    _static: {

        EVENT_ALLOW: 'CameraController_EVENT_ALLOW',
        EVENT_DENY: 'CameraController_EVENT_DENY',
        EVENT_VIDEO_READY: 'CameraController_EVENT_VIDEO_READY',

        SCREEN_WIDTH_FOR_HD_WEBCAM: 2000,
        WEBGL_PERFORMANCE_FOR_HD_WEBCAM_MAC: 0.6,
        WEBGL_PERFORMANCE_FOR_HD_WEBCAM_OTHERS: 0.4
    },

    _public: {


        width: 0,
        height: 0,

        construct: function () {

            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            this.initVideo();

        },

        getStream: function () {

            return this.stream;

        },

        getVideo: function () {

            return this.video;

        },

        getRatio: function() {

            if (this.video && this.video.videoWidth && this.video.videoHeight) {
                return this.video.videoWidth / this.video.videoHeight
            } else {
                return 16/9
            }

        },

        getNewVideo: function () {

            var video = document.createElement('video');
            video.src = window.URL.createObjectURL(this.stream);
            return video;

        },

        init: function () {

            var self = this;

            if (this.initialised) {
                return;
            }

            this.initialised = true;

            if (navigator.getUserMedia) {
                //
                // Take a guess and select between HD and SD
                // Update this code in the future when there's better MediaConstraints
                // for aspectRatio show up in the GetUserMedia spec/implementation
                //
                var parametersHD = {video:{mandatory: {minWidth: 1280, minHeight: 720}}};
                var parameters = {video:true};

                DetectionController.getInstance().detectDisplay();
                DetectionController.getInstance().detectOs();


                //
                // HD webcam -> On Retina Displays
                //
                if (DetectionController.getInstance().isRetina) {
                    
                    parameters = parametersHD;

                //
                // If Performance Test is done
                // Force HD on fast macs and very fast non-macs
                //
                } else if (PerformanceController.getInstance().webglTestDone) {

                    var scoreRequired = DetectionController.getInstance().isMac ? CameraController.WEBGL_PERFORMANCE_FOR_HD_WEBCAM_MAC : CameraController.WEBGL_PERFORMANCE_FOR_HD_WEBCAM_OTHERS;
                    if (PerformanceController.getInstance().webglPerformanceScore <= scoreRequired) parameters = parametersHD;

                }
                // else if (DetectionController.getInstance().isMac && screen.width >= CameraController.SCREEN_WIDTH_FOR_HD_WEBCAM) {

                //     parameters = parametersHD;

                // }

                navigator.getUserMedia(parameters, function (stream) {

                    // if stream should be HD but is not, restart the webcam with the right parameters
                    // this is only available on https

                    //ONLY FOR MAC?
                    if (window.location.protocol === 'https:' && /HD/.test(steam.getVideoTracks()[0].label) &&  parameters !== parametersHD)  {
                        console.log(steam.getVideoTracks()[0].label + ' camera should be started as HD. Restarting the camera with mandatory constraints.');
                        stream.stop();
                        navigator.getUserMedia(parametersHD, function (streamHD) {

                            self.onCameraAllow(streamHD);

                        },
                        function () {
                            self.onCameraDeny();
                        });


                    //start camera experience
                    } else {

                        self.onCameraAllow(stream);

                    }

                },
                function () {
                    self.onCameraDeny();
                });



            }

        },

        isVideoEnabled: function() {
            return this.videoEnabled;
        }

    },

    _private: {

        stream: null,
        video: null,
        videoReady: false,
        videoEnabled: false,

        initVideo: function () {

            this.videoReady = false;
            this.video = document.createElement('video');

        },

        onCameraAllow: function (stream) {

            var self = this;

            this.videoEnabled = true;
            this.stream = stream;
            this.video.src = window.URL.createObjectURL(this.stream);
            this.video.play();

            this.video.addEventListener('loadeddata', function () {
                self.onVideoReady();
            });

            AnalyticsController.getInstance().trackEvent(AnalyticsController.EVENT_CAMERA_ALLOW);
            this.events.trigger(CameraController.EVENT_ALLOW);

        },

        onCameraDeny: function () {

            console.log('Camera Denied')

            AnalyticsController.getInstance().trackEvent(AnalyticsController.EVENT_CAMERA_DENY);
            this.events.trigger(CameraController.EVENT_DENY);
            this.initialised = false;
            this.videoEnabled = false;

        },

        onVideoReady: function () {

            this.videoReady = true;
            this.width = this.video.videoWidth;
            this.height = this.video.videoHeight;
            console.log('Camera res: ', this.width, this.height);
            this.events.trigger(CameraController.EVENT_VIDEO_READY);

        }

    }

});
