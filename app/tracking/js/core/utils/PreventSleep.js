/**
 * @author Fabio Azevedo fabio.azevedo@unit9.com
 *
 */

(function (window, document) {

    'use strict';

    var self, PreventSleep = candlelightcore.Library({

        active: false,

        isActive: function (active) {

            self.active = active;

            if (!DeviceUtils.isAndroid()) {

                self.preventIosSleep();

            }
        },

        preventIosSleep: function () {

            setInterval(function () {

                window.location.href = '/helper/endlessrequest';

                setTimeout(function () {
                    window.location.href = "#";
                }, 500);

            }, 5000);
        },

        preventAndroidSleep: function () {

            // Video
            var video = document.createElement("video");
            
            video.setAttribute("src", "video/vinc.webm");
            video.setAttribute("id", "video");
            video.setAttribute("style", "display: none;");

            document.body.appendChild(video);

            video.addEventListener("ended", self.onVideoEnded);

            video.play();

        },

        onVideoEnded: function(e) {

            var video = document.getElementById("video");
            video.currentTime = 0.1;
            video.play();

        }

    });

    self = candlelightcore.preventsleep = candlelightcore.registerLibrary('preventsleep', new PreventSleep());

}(window, document));
