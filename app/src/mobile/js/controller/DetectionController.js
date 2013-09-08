/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 6/19/13
 * Time: 5:28 PM
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
            hasGyroscope: true,
            isOldIOS: false,
	        isSupportedBrowser: true

        }

    },

    _public: {

        isDebug: false,
        platform: null,
        display: null,
        os: null,
        osVersion: null,
        browser: null,
        browserVersion: null,

        isMobile: false,
        isTablet: false,
        isDesktop: false,
        isTouch: false,

        isRetina: false,

        isIos: false,
        isOldIOS: false,
        isAndroid: false,
        isMac: false,
        isWindows: false,
        isLinux: false,

        isSafari: false,
        isChrome: false,
        isFirefox: false,
        isInternetExplorer: false,

	    isSupportedBrowser: false,

        hasCanvas: false,
        hasWebSockets: false,
        hasGyroscope: false,

        detectAll: function () {

            this.detectPlatform();
            this.detectOs();
            this.detectBrowser();
            this.detectDisplay();
            this.detectCanvas();
            this.detectWebSockets();
            this.detectGyroscope();

            this.addStyles();

        },

        getSupportInfo: function () {

            var field,
                supportInfo = {supported: true, reason: []},
                valueBool,
                value;

            for (field in DetectionController.REQUIREMENTS) {

                if (DetectionController.REQUIREMENTS[field] !== undefined) {

                    valueBool = DetectionController.REQUIREMENTS[field];
                    value = [];
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

        detectPlatform: function () {

            this.isDebug = window.location.search.indexOf('debug') !== -1;
            this.isMobile = $('.detection .mobile').css('display') === 'block';
            this.isTablet = $('.detection .tablet').css('display') === 'block' || navigator.userAgent.toLowerCase().indexOf('android') !== -1;
            this.isDesktop = !this.isMobile && !this.isTablet;
            this.isTouch = window.ontouchstart !== undefined;

            this.platform = this.isMobile ? DetectionController.PLATFORM_MOBILE : (this.isTablet ? DetectionController.PLATFORM_TABLET : DetectionController.PLATFORM_DESKTOP);

        },

        detectOs: function () {

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

            this.isIos = navigator.userAgent.match(/(iPad|iPhone|iPod)/g) !== null;
            if (this.isIos) {
                this.os = DetectionController.OS_IOS;
                var version = navigator.userAgent.match(/OS ([\d_]+)/);
                if (version && version[1]) {
                    this.osVersion = version[1];
                }
            }

            this.isAndroid = navigator.userAgent.toLowerCase().indexOf("android") !== -1;
            if (this.isAndroid) {
                this.os = DetectionController.OS_ANDROID;
            }

            if (this.isIos && this.osVersion[0] <= 5) {
                this.isOldIOS = true;
            }

        },

        detectBrowser: function () {

	        this.isSupportedBrowser = true;

	        this.isFirefox = navigator.userAgent.indexOf('Firefox') !== -1;

            if (this.isFirefox) {
                this.browser = DetectionController.BROWSER_FIREFOX;
	            this.isSupportedBrowser = false;
            }

            this.isChrome = navigator.userAgent.indexOf('Chrome') !== -1 || navigator.userAgent.indexOf('CriOS') !== -1;
            if (this.isChrome) {
                this.browser = DetectionController.BROWSER_CHROME;
            }

            this.isSafari = !this.isChrome && navigator.userAgent.indexOf('Safari') !== -1;
            if (this.isSafari) {
                this.browser = DetectionController.BROWSER_SAFARI;
            }

            this.isInternetExplorer = navigator.userAgent.indexOf('MSIE') !== -1;
            if (this.isInternetExplorer) {
                this.browser = DetectionController.BROWSER_INTERNET_EXPLORER;
                this.browserVersion = parseInt(navigator.userAgent.match(/MSIE \d+\.\d+/g)[0].match(/\d+/)[0], 10);
            }

        },

        detectLanguage: function () {

            this.language = window.i18n.lng().toLowerCase();
            $('html').addClass('lng-' + this.language);

        },

        detectDisplay: function () {

            this.isRetina = $('.detection .display-retina').css('display') === 'block';
            this.display = this.isRetina ? DetectionController.DISPLAY_RETINA : DetectionController.DISPLAY_NORMAL;

        },

        detectCanvas: function () {

            this.hasCanvas = window.FlashCanvas === undefined;

        },

        detectWebSockets: function () {

            this.hasWebSockets = window.WebSocket !== undefined;

        },

        detectGyroscope: function () {

            this.hasGyroscope = window.DeviceOrientationEvent !== undefined;

        },

        addStyles: function () {

            var $html = $('html');
            $html.addClass('browser-' + this.browser);
            $html.addClass('browser-version-' + this.browserVersion);
            $html.addClass('os-' + this.os);
            $html.addClass(this.isTouch ? 'touch' : 'mouse');
            $html.addClass(this.isDebug ? 'debug': '');

        }
    },

    _private: {
        getIOSVersion: function() {
          if (/iP(hone|od|ad)/.test(navigator.platform)) {
            var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);

            return [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)];
          }
        }
    }

});
