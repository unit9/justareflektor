/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 5/29/13
 * Time: 4:46 PM
 */

var DetectionController = Class._extend(Class.SINGLETON, {

    _static: {

        PLATFORM_MOBILE: 'mobile',
        PLATFORM_TABLET: 'tablet',
        PLATFORM_DESKTOP: 'desktop',
        OS_MAC: 'Mac',
        OS_WINDOWS: 'Windows',
        OS_LINUX: 'Linux',
        OS_IOS: 'iOS',
        OS_ANDROID: 'Android',
        BROWSER_CHROME: 'Chrome',
        BROWSER_SAFARI: 'Safari',
        BROWSER_FIREFOX: 'Firefox',
        BROWSER_INTERNET_EXPLORER: 'InternetExplorer',
        DISPLAY_NORMAL: '1x',
        DISPLAY_RETINA: '2x',

        REQUIREMENTS: {

            hasCanvas: true,
            hasWebSockets: true,
            hasWebGL: true,
            hasMinimumBandwidth: true

        }
    },

    _public: {

        isChromeOnIOSonMobile: false,

        platform: null,
        display: null,
        os: null,
        browser: null,
        browserVersion: null,

        isNotSupported: false,

        isMobile: false,
        isTablet: false,
        isDesktop: false,
        isTouch: false,

        isRetina: false,

        isIos: false,
        isAndroid: false,
        isMac: false,
        isWindows: false,
        isLinux: false,

        isSafari: false,
        isChrome: false,
        isFirefox: false,
        isInternetExplorer: false,

        language: 'en',

        hasCanvas: false,
        hasWebSockets: false,
        hasWebGL: false,
        hasMinimumBandwidth: true,

        setIsChromeOnIOSonMobile: function () {

            this.isChromeOnIOSonMobile = true;
            $('html').addClass('sleep-touch');

        },

        detectAll: function () {

            this.detectPlatform();
            this.detectOs();
            this.detectBrowser();
            this.detectDisplay();
            this.detectCanvas();
            this.detectWebSockets();
            this.detectWebGL();

            this.addStyles();

        },

        detectPlatform: function () {

            this.isMobile = $('.detection .mobile').css('display') === 'block';
            this.isTablet = $('.detection .tablet').css('display') === 'block';
            this.isDesktop = !this.isMobile && !this.isTablet;
            this.isTouch = window.ontouchstart !== undefined;

            this.platform = this.isMobile ? DetectionController.PLATFORM_MOBILE : (this.isTablet ? DetectionController.PLATFORM_TABLET : DetectionController.PLATFORM_DESKTOP);

        },

        detectOs: function () {

            this.isIos = navigator.userAgent.match(/(iPad|iPhone|iPod)/g) !== null;
            if (this.isIos) {
                this.os = DetectionController.OS_IOS;
            }

            this.isAndroid = navigator.userAgent.toLowerCase().indexOf("android") !== -1;
            if (this.isAndroid) {
                this.os = DetectionController.OS_ANDROID;
            }

            this.isMac = navigator.platform.toLowerCase().indexOf('mac') !== -1;
            if (this.isMac) {
                this.os = DetectionController.OS_MAC;
            }

            this.isWindows = navigator.platform.toLowerCase().indexOf('win') !== -1;
            if (this.isWindows) {
                this.os = DetectionController.OS_WINDOWS;
            }

            this.isLinux = navigator.platform.toLowerCase().indexOf('linux') !== -1;
            if (this.isLinux) {
                this.os = DetectionController.OS_LINUX;
            }

        },

        getSupportInfo: function () {

            var field,
                supportInfo = {supported: true, reason: []},
                valueBool;
                var value = new Array();

            for (field in DetectionController.REQUIREMENTS) {

                if (DetectionController.REQUIREMENTS[field] !== undefined) {

                    valueBool = DetectionController.REQUIREMENTS[field];
                    value.push(DetectionController.REQUIREMENTS[field]);

                    if (valueBool !== undefined && value.__proto__ === [].__proto__) {

                        if (value.indexOf(this[field]) === -1) {

                            supportInfo.supported = false;
                            supportInfo.reason.push({property: field, value: this[field]});

                        }

                    } else {

                        if (this[field] !== valueBool) {

                            supportInfo.supported = false;
                            supportInfo.reason.push({property: field, value: this[field]});

                        }

                    }

                }

            }

            return supportInfo;
        },

        detectBrowser: function () {

            this.isChrome = navigator.userAgent.indexOf('Chrome') !== -1;
            if (this.isChrome) {
                this.browser = DetectionController.BROWSER_CHROME;
            }

            this.isSafari = !this.isChrome && navigator.userAgent.indexOf('Safari') !== -1;
            if (this.isSafari) {
                this.browser = DetectionController.BROWSER_SAFARI;
            }

            this.isFirefox = navigator.userAgent.indexOf('Firefox') !== -1;
            if (this.isFirefox) {
                this.browser = DetectionController.BROWSER_FIREFOX;
            }

            this.isInternetExplorer = navigator.userAgent.indexOf('MSIE') !== -1;
            if (this.isInternetExplorer) {
                this.browser = DetectionController.BROWSER_INTERNET_EXPLORER;
                this.browserVersion = parseInt(navigator.userAgent.match(/MSIE \d+\.\d+/g)[0].match(/\d+/)[0], 10);
            }

        },

        detectDisplay: function () {

            this.isRetina = $('.detection .display-retina').css('display') === 'block';
            this.display = this.isRetina ? DetectionController.DISPLAY_RETINA : DetectionController.DISPLAY_NORMAL;

        },

        detectLanguage: function () {

            this.language = window.i18n.lng().toLowerCase();
            $('html').addClass('lng-' + this.language);

        },

        detectCanvas: function () {

            this.hasCanvas = window.FlashCanvas === undefined;

        },

        detectWebSockets: function () {

            this.hasWebSockets = window.WebSocket !== undefined;

        },

        detectWebGL: function() {
            function webgl_detect(return_context) {
                if (!!window.WebGLRenderingContext) {
                    var canvas = document.createElement("canvas"),
                         names = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"],
                       context = false;

                    for(var i=0;i<4;i++) {
                        try {
                            context = canvas.getContext(names[i]);
                            if (context && typeof context.getParameter == "function") {
                                // WebGL is enabled
                                if (return_context) {
                                    // return WebGL object if the function's argument is present
                                    return {name:names[i], gl:context};
                                }
                                // else, return just true
                                return true;
                            }
                        } catch(e) {}
                    }

                    // WebGL is supported, but disabled
                    return false;
                }

                // WebGL not supported
                return false;
            }

            this.hasWebGL = webgl_detect();
        },

        detectBandwidth: function () {

            console.log('bandwidth:', PerformanceController.getInstance().getBandwidth(), 'Mbps');
            this.hasMinimumBandwidth = true;    // 4 Mbps minimum

        },

        addStyles: function () {

            var $html = $('html');
            $html.addClass('browser-' + this.browser);
            $html.addClass('browser-version-' + this.browserVersion);
            $html.addClass('os-' + this.os);
            $html.addClass(this.isTouch ? 'touch' : 'mouse');

        }
    },

    _private: {

    }

});
