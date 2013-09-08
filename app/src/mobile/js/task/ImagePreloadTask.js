/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 7/22/13
 * Time: 12:52 AM
 */

var ImagePreloadTask = Task._extend(Class.ABSTRACT, {

    _static: {

        ROOT: '/m/'

    },

    _public: {

        construct: function (url) {

            Task.call(this, [], 1);
            this.url = ImagePreloadTask.ROOT + url;

        }

    },

    _protected: {

        url: null,

        run: function () {

            var self = this,
                $div = $('<div/>').css('background-image', 'url(\'' + this.url + '\')'),
                image = new Image();

            $('.preload').append($div);

            image.onload = function () {

                self.onComplete();

            };

            image.src = this.url;// + "?t=" + new Date().getTime();

        }

    },

    _private: {

        url: null,

        onComplete: function () {

            this.notifyDone();

        }

    }

});
