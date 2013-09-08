/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 5/31/13
 * Time: 1:13 PM
 */

var ConfigCommon = Class._extend({

    _public: {

        localisationResGetPath: '/api/client/localisation/get?lng=__lng__&ns=__ns__&format=unit9',
        meshApiUrl: '/api/mesh',
        originalUrl: window.location.protocol + '//' + window.location.host + '/m/',
        desktopConnectionUrl: window.location.protocol + '//' + window.location.host,
        sleepPreventionHackHelperUrl: '/api/client/endlessrequest/'

    }

});
