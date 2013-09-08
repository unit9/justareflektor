/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/8/13
 * Time: 11:15 AM
 */

var Resource = Class._extend({

    _static: {

        CLOUD_STORAGE_URL: '//arcade-fire.commondatastorage.googleapis.com/',
        local: /localhost/.test(window.location.host) || /127.0.0.1/.test(window.location.host),

        get: function (path, local) {

            var localRef = ( Resource.local || local );

            if (localRef) {

                return "../"+path;

            } else {

                return Resource.CLOUD_STORAGE_URL + path.replace(/^\//, '');

            }

        }

    }

});
