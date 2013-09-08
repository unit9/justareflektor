/**
 * @author Fabio Azevedo fabio.azevedo@unit9.com
 *
 */

(function (window, document) {

    'use strict';
    
    // Features
    var FEATURE_WEBSOCKET       = "websockets";
    var FEATURE_AUDIO           = "audio";
    var FEATURE_WEBWORKERS      = "webworkers";
    var FEATURE_WEBCAM          = "getusermedia";


    // Platforms
    var PLATFORM_IOS            = "iPhone/iPod";
    var PLATFORM_ANDROID        = "Linux";

    // Browsers
    var BROWSER_ANY             = "";
    var BROWSER_CHROME          = "Chrome";
    var BROWSER_SAFARI          = "Safari";

    var self, Detection = candlelightcore.Library({

        device: null,
        failed: [],
        debug: true,

        requirements: {

            phone: {
                
                os: [

                    {name: PLATFORM_ANDROID, version: '4.0.0', versionMax: '999.0.0'},
                    {name: PLATFORM_IOS, versionMin: '6.1.0', versionMax: '999.0.0'}

                ],

                browser: [
                    BROWSER_ANY
                ],

                features: [
                    FEATURE_WEBSOCKET,
                    FEATURE_AUDIO
                ]
            },

            desktop: {

                browser: [
                    BROWSER_CHROME
                ],

                features: [
                    FEATURE_WEBSOCKET,
                    FEATURE_AUDIO,
                    FEATURE_WEBWORKERS,
                    FEATURE_WEBCAM
                ]

            }
        },

        isEnvironmentSupported: function () {

            // Add modernizr getusermedia check
            Modernizr.addTest('getusermedia', !!('getUserMedia' in navigator));

            // Check if it's a mobile or not
            self.device = DeviceUtils.isMobile() ? "phone" : "desktop";

            // Return support
            var isBrowser = self.isBrowser();
            var hasFeatures =  self.hasFeatures();
            var hasMinimunOs = self.hasMinimunOs();
            var support = (isBrowser && hasFeatures  && hasMinimunOs);
            
            console.log("[Is Environment Supported] [" + support + "]");

            return support;
        },

        isBrowser: function() {

            var availability = [];
            
            if(self.requirements[self.device].browser)
            {
                if(self.debug) console.log("[Minimum requirements]", "[Browser]");

                for(var i=0; i < self.requirements[self.device].browser.length; i++)
                {
                    if(self.requirements[self.device].browser[i] == BROWSER_ANY)
                        availability.push(true);
                    else
                        availability.push(DeviceUtils.isBrowser(self.requirements[self.device].browser[i]));

                    if(self.debug) console.log(" ", "[Browser]", "[" + self.requirements[self.device].browser[i] + "]", availability[availability.length-1]);
                }
            }

            return availability.indexOf(true) > -1 || availability.length == 0;
        },

        hasFeatures: function() {

            var availability = [];

            if(self.requirements[self.device].features)
            {
                if(self.debug) console.log("[Minimum requirements]", "[Features]");

                for(var i=0; i < self.requirements[self.device].features.length; i++)
                {

                    if(self.requirements[self.device].features[i] == "audio")
                        availability.push((Modernizr[self.requirements[self.device].features[i]].mp3 != "") || (Modernizr[self.requirements[self.device].features[i]].ogg != ""));
                    else
                        availability.push(Modernizr[self.requirements[self.device].features[i]]);
                    
                    if(self.debug) console.log(" " + " " + "[Features]" + " " + "[" + self.requirements[self.device].features[i] + "]" + " " + availability[availability.length-1]);
                }
            }

            return !(availability.indexOf(false) > -1) || availability.length == 0;
        },

        hasMinimunOs: function() {
            
            var availability = [];

            if(self.requirements[self.device].os)
            {
                if(self.debug) console.log("[Minimum requirements]", "[OS]");

                for(var i=0; i < self.requirements[self.device].os.length; i++)
                {
                    availability.push(DeviceUtils.isOS(self.requirements[self.device].os[i].name));

                    if(self.debug) console.log(" " + " " + "[OS]" + " " + "[" + self.requirements[self.device].os[i] + "]" + " " + availability[availability.length-1]);
                }
            }

            return availability.indexOf(true) > -1 || availability.length == 0;
        }

    });

    self = candlelightcore.detection = candlelightcore.registerLibrary('detection', new Detection());

}(window, document));
