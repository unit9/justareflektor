/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 6/19/13
 * Time: 3:07 PM
 */

(function (window, document) {

    function main() {

        AppController.getInstance().start();

    }

    function onDomReady(callback) {

        if (document.addEventListener) {

            document.addEventListener('DOMContentLoaded', callback, false);

        } else if (/KHTML|WebKit|iCab/i.test(navigator.userAgent)) {

            var DOMLoadTimer = setInterval(function () {

                if (/loaded|complete/i.test(document.readyState)) {

                    clearInterval(DOMLoadTimer);
                    callback();

                }

            }, 10);

        } else {

            window.onload = callback;

        }

    }

    onDomReady(function () {
        main();
    });

}(window, document));
