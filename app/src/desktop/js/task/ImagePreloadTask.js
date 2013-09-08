/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 5/12/13
 * Time: 11:46 PM
 */

var ImagePreloadTask = Task._extend(Class.ABSTRACT, {

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

            var $div = $('<div/>').css('background-image', 'url(\'' + this.url + '\')');
            $('.preload').append($div);

            var image = new Image();

            image.onload = function () {

                // remove PerformanceController.getInstance().addBandwithData(self.url, window.performance.now() - self.startTime);
                self.onComplete();

            };

            // remove this.startTime = window.performance.now();
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
