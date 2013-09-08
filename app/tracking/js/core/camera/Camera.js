/**
 * @author Fabio Azevedo fabio.azevedo@unit9.com
 *
 */

(function (window, document) {

    'use strict';

    var self, Camera = candlelightcore.Library({

        mainVideo: null,
        mainVideoCanvas: null,
        W: 640,
        H: 480,

        // -----------------------------------------------------------
        // Ask for permissions and return the DOM element
        // -----------------------------------------------------------

        get: function (onSuccess, onDenied) {
            // canvas
            self.mainVideoCanvas = document.createElement("canvas");
            self.mainVideoCanvas.width = self.W;
            self.mainVideoCanvas.height = self.H;

            // video source
            self.mainVideo = document.createElement('video');
            self.mainVideo.width = 640;
            self.mainVideo.height = 480;

            // ask for permissions
            navigator.getUserMedia ? navigator.getUserMedia({'audio': false, 'video': true}, onSuccess, onDenied) : (navigator.webkitGetUserMedia ? navigator.webkitGetUserMedia({'audio': false, 'video': true}, onSuccess, onDenied) : alert('getUserMedia not supported'));

            return self.mainVideo;
        },

        getCanvas: function (width, height) {

            width = width || 640;
            height = height || 480;

            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(self.mainVideo, 0, 0, canvas.width, canvas.height);

            return canvas;

        },

        // -----------------------------------------------------------
        // Get the current frame base64 data from the video feed
        // -----------------------------------------------------------

        getData: function (width, height) {

            return this.getCanvas(width, height).toDataURL('image/jpeg');

        },

        // -----------------------------------------------------------
        // Load the base64 data to an Image
        // -----------------------------------------------------------

        getImageFromString: function (data, onLoaded) {
            var image = new Image();
            image.src = data;

            image.onload = function () {
                if (typeof onLoaded === 'function') {
                    onLoaded(image);
                }
            };
        }

    });

    self = candlelightcore.camera = candlelightcore.registerLibrary('camera', new Camera());

}(window, document));
