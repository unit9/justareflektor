/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 8/18/13
 * Time: 3:59 PM
 */

var BufferLoader = Class._extend({

    _public: {

        construct: function (context) {

            this.context = context;
            this.bufferList = [];
            this.loadCount = 0;

        },

        load: function (urls, callback) {

            var numLoaded = 0,
                i,
                self = this,

                onBufferLoaded = function (buffer, index) {

                    console.log('buffer loaded:', urls[index]);
                    self.bufferList[index] = buffer;

                    if (++numLoaded === urls.length) {

                        if (typeof callback === 'function') {
                            callback(self.bufferList);
                        }

                    }

                };

            for (i = 0; i < urls.length; ++i) {
                this.loadBuffer(urls[i], this.createLoadHandler(i, onBufferLoaded));
            }

        }

    },

    _private: {

        context: null,
        bufferList: [],
        loadCount: 0,

        loadBuffer: function (url, callback) {

            var request = new XMLHttpRequest(),
                self = this;

            request.open('GET', url, true);
            request.responseType = 'arraybuffer';

            request.onload = function () {
                self.context.decodeAudioData(request.response, function (buffer) {
                        if (!buffer) {
                            console.error('error decoding file data: ' + url);
                            return;
                        }
                        if (typeof callback === 'function') {
                            callback(buffer);
                        }
                    }
                );
            };

            request.onerror = function () {
                console.error('BufferLoader: XHR error');
            }

            request.send();

        },

        createLoadHandler: function (index, callback) {

            return function (buffer) {
                callback(buffer, index);
            }

        }

    }

});