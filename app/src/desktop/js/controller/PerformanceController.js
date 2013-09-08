/**
 * @author Paweł Klimkowski pawel.klimkowski@unit9.com / pawel@sqrtx.pl
 * @copyright UNIT9 Ltd.
 */

var PerformanceController = Class._extend(Class.SINGLETON, {

    _static: {

        TARGET_FRAMES: 60,

        HIGH: "HIGH",
        MEDIUM: "MEDIUM",
        LOW: "LOW",

        // Bandwith estamite and HIGH [...] LOW states -

        BANDWITH: function () {
            return PerformanceController.getInstance().getBandwitch();
        },
        BANDWITH_STATE: function () {
            return PerformanceController.getInstance().getBandwitchState();
        },

        // Performance behaviour -

        EVENT_PERFORMANCE_BREAKDOWN: "PerformanceController_Breakdown",
        EVENT_PERFORMANCE_DOWNGRADE: "PerformanceController_Downgrading",
        EVENT_PERFORMANCE_UPGRADE: "PerformanceController_Upgrading",
        EVENT_BANDWIDTH_READY: "PerformanceController_EVENT_BANDWIDTH_READY:",
        INTERNAL_EVENT_BANDWIDTH_TEST_FINISHED: "PerformanceController_INTERNAL_EVENT_BANDWIDTH_TEST_FINISHED",
        EVENT_LOW_FPS: "PerformanceController_EVENT_LOW_FPS",

        EVENT_PERFORMANCE_LOW: "PerformanceController_Slow",
        EVENT_PERFORMANCE_HIGH: "PerformanceController_Fast",

        THRESHOLD_UNLIMITED: "PerformanceController_THRESHOLD_UNLIMITED",
        THRESHOLD_LIMITED: "PerformanceController_THRESHOLD_LIMITED",

        WEBGL_SCORE_FORCE_LOWRES: 0.75,

        FRAMERATE_LOW_THRESHOLD: 29,
        FRAMERATE_HIGH_THRESHOLD: 59,

        // ----------------------

        getFPS: function () {
            return this.__fps;
        },

        setFPS: function (value) {
            this.__fps = value;
        },

        __fps: 0,
        __kbps: 0

    },

    _public: {

        enabled: false,
        webglTestStarted: false,
        webglPerformanceScore: 0.0,
        webglTestDone: false,

        initialize: function () {

            // Setting up helpers, detecting features, polyfils -

            window.performance = window.performance || {};

            window.performance.now = (function () {
                return window.performance.now ||
                    window.performance.mozNow ||
                    window.performance.msNow ||
                    window.performance.oNow ||
                    window.performance.webkitNow ||
                    function () {
                        return new Date().getTime();
                    };
            }());

            window.requestAnimFrame = (function () {
                return window.requestAnimationFrame ||
                    window.webkitRequestAnimationFrame ||
                    window.mozRequestAnimationFrame ||
                    function (callback) {
                        window.setTimeout(callback, 1000 / PerformanceController.TARGET_FRAMES);
                    };
            }());

            window.cancelRequestAnimFrame = (function () {
                return window.cancelAnimationFrame ||
                    window.webkitCancelRequestAnimationFrame ||
                    window.mozCancelRequestAnimationFrame ||
                    window.oCancelRequestAnimationFrame ||
                    window.msCancelRequestAnimationFrame ||
                    clearTimeout;
            }());

            if (window.location.href.indexOf("debug") > -1) {
                this.FLAG_VERBOSE_DEBUG = true;
                this.addDebugBars();
            }

            this.perfromanceSMA.targetSamples = PerformanceController.TARGET_FRAMES * 4; // FPS samples thresold
            this.bandwidthSMA.targetSamples = PerformanceController.TARGET_FRAMES;

        },

        setQuality: function (quality) {

            this.quality = quality;

        },

        getQuality: function () {

            return this.quality;

        },

        /**
         * Estimates maximum video quality (size and resolution) suitable for the current machine specs.
         */
        determineOptimalVideoQuality: function () {

            return {
                size: this.getBandwidth() / 20 * 7.5 * 60, // maximum video file size can be as much as the network can download during the full video duration (approx 7.5 minutes)
                resolution: {width: screen.width, height: screen.height} // / 12 to estimate effective transfer. By definition should be / 8 (1 byte = 8 bits), but effectively it will be around / 12 with all the network jitter.
            }

        },

        startMonitoringPerformance: function (thresholdMode) {

            if (thresholdMode == null) {
                console.log("You need to specify threshold mode.");
                return;
            }

            this.thresholdMode = thresholdMode;

            this.perfromanceSMA.list = [];
            this.perfromanceSMA.index = 0;
            this.perfromanceSMA.total = 0;

            this.performanceMonitoringLastSMA = -1;
            this.performanceTickLoopID = window.requestAnimationFrame(this.performanceTick.bind(this));
            this.FLAG_MONITORING_PERFORMANCE = true;

        },

        resetMonitoringPeformance: function() {
            this.perfromanceSMA.list = [];
            this.perfromanceSMA.index = 0;
            this.perfromanceSMA.total = 0;
        },

        stopMonitoringPerformance: function () {

            this.FLAG_MONITORING_PERFORMANCE = false;
            this.performanceTickLoopID = -1;
            window.cancelRequestAnimFrame(this.performanceTickLoopID);

        },

        setPerformanceThresholds: function (data) {

            if (this.thresholdMode == PerformanceController.THRESHOLD_UNLIMITED) {

                this.performanceModesThresholds.step = data.step;
                this.performanceModesThresholds.rangeMin = data.min;
                this.performanceModesThresholds.rangeMax = data.max;

            } else if (this.thresholdMode == PerformanceController.THRESHOLD_LIMITED) {

                this.performanceModesThresholds.modes = data;

            }

            return true;
        },

        setCurrentPerformanceMode: function (thresholdMode) {

            this.thresholdMode = thresholdMode;
            return thresholdMode;
        },

        setBandwidthThresholds: function (data) {

            this.bandwidthModesThresholds = data;

        },

        getPerformanceThreshold: function () {
            if (this.thresholdMode == PerformanceController.THRESHOLD_UNLIMITED) {

                return this.performanceMonitoringLastSMA;

            } else if (this.thresholdMode == PerformanceController.THRESHOLD_LIMITED) {

                return this.performanceLastBroadcastedMode;

            }
        },

        getBandwidth: function () {

            return Number((this.performanceBandwithLastMBpS * 8).toFixed(3));

        },

        getBandwidthThreshold: function () {

            var mbps = this.getBandwidth();

            for (var i = 0; i <= this.bandwidthModesThresholds.length - 1; i++) {
                var currentMode = this.bandwidthModesThresholds[i];
                if (mbps >= currentMode.min && mbps <= currentMode.max) {
                    return currentMode.name;
                    break;
                }
            }

            return null;
        },



        beginWebglPerformanceTest: function() {
            if (this.webglTestStarted) return;
            this.webglTestStarted = true;

            var self = this;
            window.setTimeout(function() {
                WebglPerformanceTest.create(null,self.endWebglPerformanceTest);
                WebglPerformanceTest.run();
            },500);
        },

        endWebglPerformanceTest: function(score,time,durationScore) {
            this.webglPerformanceScore = score;
            this.webglTestDone = true;
            Debug.add({webglScore:score},'webglScore','Performance');
            Debug.add({forceLowRes:(score>PerformanceController.WEBGL_SCORE_FORCE_LOWRES)},'forceLowRes','Performance');
            Debug.openFolder('Performance');
            AnalyticsController.getInstance().trackEvent(AnalyticsController.EVENT_PERFORMANCE_WEBGLSCORE, {value: score.toFixed(4)});
            console.log('WebGL Performance Score: '+score);
            Player.getInstance().startPreloadingVideo(score > PerformanceController.WEBGL_SCORE_FORCE_LOWRES);
        }


    },

    _private: {

        FLAG_MONITORING_PERFORMANCE: false,
        FLAG_VERBOSE_DEBUG: false,
        SAMPLE_STEP_SIZE: 128,
        TEST_SAMPLE_SIZE_MULTIPLY: 8,

        thresholdMode: "",
        quality: null,

        performanceModesThresholds: {

            // Default thresholds in FPS -

            step: 15,
            rangeMin: 24,
            rangeMax: 40,

            // Default modes descriptions -

            modes: [
                { name: "LOW", min: 0, max: 20 },
                { name: "MEDIUM", min: 20, max: 40 },
                { name: "HIGH", min: 40, max: Infinity }
            ]

        },

        bandwidthModesThresholds: [

            { name: "LOW", min: 0, max: 6 },
            { name: "MEDIUM", min: 6, max: 15 },
            { name: "HIGH", min: 15, max: Infinity }

        ],

        // Data flow -

        perfromanceSMA: { targetSamples: 0, index: 0, total: 0, list: [] },
        bandwidthSMA: { targetSamples: 0, index: 0, total: 0, list: [] },

        // Helpers -

        performanceTickLoopID: -1,
        performanceMonitoringLastTime: 0,
        performanceMonitoringLastSMA: -1,
        performanceBandwithLastMBpS: 0,
        performanceLastBroadcasted: 0,
        bandwidthTests: 8,
        bandwidthDetecting: false,
        performanceStepCounter: 0,
        performanceLastBroadcastedMode: "",
        performanceLastBroadcastedModeId: 0,

        bandwidthTestStartTime: -1,
        bandwidthTestRunning: false,


        processPerformanceData: function (data) {

            var self = this,
                speed = PerformanceController.BANDWITH();

            if (this.FLAG_VERBOSE_DEBUG) {
                $("#performance-debug").html("PerformanceController.FPS: " + data.sma +
                    "<br>@lastFrameTime: " + data.lastFrameTime +
                    "<br>@precision: " + (data.precision ? "microseconds" : "miliseconds") +
                    "<br>@speedMBpS: " + (speed > 0 ? (speed + " (" + (speed * 8).toPrecision(3) + "Mbits)") : "calculating..."));
            }

            if (this.performanceMonitoringLastSMA !== -1) {
                if (this.thresholdMode == PerformanceController.THRESHOLD_UNLIMITED) {
                    if (this.performanceStepCounter++ == this.performanceModesThresholds.step) {
                        this.performanceStepCounter = 0;
                        if (data.sma <= this.performanceModesThresholds.rangeMin) {
                            self.events.trigger(PerformanceController.EVENT_PERFORMANCE_DOWNGRADE, [data.sma]);
                        }
                        if (data.sma >= this.performanceModesThresholds.rangeMax) {
                            self.events.trigger(PerformanceController.EVENT_PERFORMANCE_UPGRADE, [data.sma]);
                        }
                    }
                } else if (this.thresholdMode == PerformanceController.THRESHOLD_LIMITED) {

                    var foundMode = "";

                    for (var i = 0; i <= this.performanceModesThresholds.modes.length - 1; i++) {
                        var currentMode = this.performanceModesThresholds.modes[i];
                        if (data.sma > currentMode.min && data.sma < currentMode.max) {
                            foundMode = currentMode;
                            break;
                        }
                    }

                    if (foundMode != "" && this.performanceLastBroadcastedMode != foundMode.name) {

                        if (this.performanceLastBroadcastedModeId < i) {
                            self.events.trigger(PerformanceController.EVENT_PERFORMANCE_UPGRADE, [foundMode.name]);
                        } else {
                            self.events.trigger(PerformanceController.EVENT_PERFORMANCE_DOWNGRADE, [foundMode.name]);
                        }

                        this.performanceLastBroadcastedModeId = i;
                        this.performanceLastBroadcastedMode = foundMode.name;

                    }

                }

            }

            PerformanceController.setFPS(parseFloat(data.sma));
            this.performanceMonitoringLastSMA = data.sma;

        },

        performanceTick: function (timestamp) {
            if (this.FLAG_MONITORING_PERFORMANCE) {
                this.performanceTickLoopID = window.requestAnimationFrame(this.performanceTick.bind(this));
            }

            var tick,
                highPrecision = timestamp < 1e12,
                currentSMA = this.perfromanceSMA.list[this.perfromanceSMA.index],
                currentBandwidthSMA = this.bandwidthSMA.list[this.bandwidthSMA.index];

            tick = window.performance.now() - this.performanceMonitoringLastTime;
            this.performanceMonitoringLastTime = window.performance.now();

            this.perfromanceSMA.total -= isNaN(currentSMA) ? 0 : currentSMA;
            this.perfromanceSMA.total += tick;
            this.perfromanceSMA.list[this.perfromanceSMA.index] = tick;
            if (++this.perfromanceSMA.index === this.perfromanceSMA.targetSamples) {
                this.perfromanceSMA.index = 0;
            }

            this.bandwidthSMA.total -= isNaN(currentBandwidthSMA) ? 0 : currentBandwidthSMA;
            this.bandwidthSMA.total += this.performanceBandwithLastMBpS;
            this.bandwidthSMA.list[this.bandwidthSMA.index] = this.performanceBandwithLastMBpS;
            if (++this.bandwidthSMA.index === this.bandwidthSMA.targetSamples) {
                this.bandwidthSMA.index = 0;
            }

            this.processPerformanceData({sma: (1000 / (this.perfromanceSMA.total / this.perfromanceSMA.targetSamples)).toPrecision(4), lastFrameTime: tick, precision: highPrecision});
        },

        detectBandwidth: function () {
            if (this.bandwidthDetecting) return;
            this.bandwidthDetecting = true;
            this.bandwidthTests = 5;
            this.beginDetectingBandwidth();
            this.events.on(PerformanceController.INTERNAL_EVENT_BANDWIDTH_TEST_FINISHED, this.beginDetectingBandwidth.bind(this));
        },

        detectLowFPS: function(targetFPS) {
            var startTime = null; // when the fps was lower than targetFPS for the first time
            var seconds = 20;

            var self = this;

            function _checkFPS(timestamp) {
                if (TimelineController.getInstance().running) {
                    var fps = PerformanceController.getFPS();

                    if (fps > targetFPS) {
                        startTime = null;
                    } else {
                        if (startTime === null) {
                            startTime = timestamp;
                        } else {

                            if ((timestamp - startTime) / 1000 >= seconds) {
                                PerformanceController.getInstance().events.trigger(PerformanceController.EVENT_LOW_FPS);

                                return;
                            }
                        }
                    }
                }

                window.requestAnimationFrame(_checkFPS);
            }

            window.requestAnimationFrame(_checkFPS);
        },

        beginDetectingBandwidth: function () {

            if (this.bandwidthTests == 1) {
                this.bandwidthDetecting = false;
                this.events.unbind(PerformanceController.INTERNAL_EVENT_BANDWIDTH_TEST_FINISHED);
                this.events.trigger(PerformanceController.EVENT_BANDWIDTH_READY, [true]);
                return;
            }

            this.bandwidthTests--;
            this.preformBandwithTest(this.bandwidthTests);

        },

        preformBandwithTest: function (sampleSizeMultipy) {

            if (this.bandwidthTestRunning) return;

            this.bandwidthTestRunning = true;

            if (sampleSizeMultipy)
                this.TEST_SAMPLE_SIZE_MULTIPLY = sampleSizeMultipy;

            var self = this,
                sampleTarget = this.SAMPLE_STEP_SIZE * this.TEST_SAMPLE_SIZE_MULTIPLY,
                xhr = new XMLHttpRequest();

            try {
                xhr.responseType = 'text';
            } catch (e) {
                console.log('skipping responseType on XHR');
            }

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        self.bandwidthTestRunning = false;
                        self.updateBandwith(self.bandwidthTestStartTime);
                    } else {
                        self.bandwidthTestRunning = false;
                        PerformanceController.getInstance().preformBandwithTest(this.TEST_SAMPLE_SIZE_MULTIPLY);
                    }
                } else if (xhr.readyState === 2) {
                    self.bandwidthTestStartTime = window.performance.now();
                }
            }

            xhr.onerror = function () {
                self.bandwidthTestRunning = false;
                PerformanceController.getInstance().preformBandwithTest(this.TEST_SAMPLE_SIZE_MULTIPLY);
            };

            xhr.open("GET", Resource.get('sampledata/' + sampleTarget + ".json?t=" + (new Date().getTime() )), true);
            
            // use overrideMimeType only if it's supported by browser (in IE/all versions not supported)
            if(XMLHttpRequest.prototype.hasOwnProperty('overrideMimeType'))
              xhr.overrideMimeType("text/plain; charset=x-user-defined");
            
            xhr.send(null);

        },

        updateBandwith: function (startTime) {
            var sampleTarget = this.SAMPLE_STEP_SIZE * this.TEST_SAMPLE_SIZE_MULTIPLY;
            this.performanceBandwithLastMBpS = ( (sampleTarget) / ((window.performance.now() - startTime)));
            this.events.trigger(PerformanceController.INTERNAL_EVENT_BANDWIDTH_TEST_FINISHED, [true]);
        },

        getBandwitch: function () {
            return this.bandwidthSMA.total / this.bandwidthSMA.targetSamples;
        },

        addDebugBars: function () {
            $("body").append("<div id='performance-debug' style='font-family: monospace;position:fixed;top:0;left:0;background-color:white;'></div>");
        },



        //
        //
        // Much more simple framerate check
        //
        //
        detectHighLowFramerate: function(waitForTimeline) {

            var startTime = null; // when the fps was lower than targetFPS for the first time
            var isLow = false;

            var self = this;

            //some local constants
            var seconds = 3;


            function _checkFPS(timestamp) {

                var fps = PerformanceController.getFPS();
                var targetFPS_LOW = PerformanceController.FRAMERATE_LOW_THRESHOLD;
                var targetFPS_HIGH = PerformanceController.FRAMERATE_HIGH_THRESHOLD;

                if ((TimelineController.getInstance().running || !waitForTimeline) && fps>0.0) {


                    //if (startTime) console.log(fps,isLow ? 'isLow' : 'isHigh',(timestamp - startTime) / 1000);

                    //if normal fps, don't do anything
                    if (fps < targetFPS_HIGH && fps > targetFPS_LOW) {

                        startTime = null;
                        isLow = false;

                    //otherwise start calculating
                    } else {

                        if (startTime === null || isLow !== (fps <= targetFPS_LOW)) {

                            startTime = timestamp;
                            isLow = (fps <= targetFPS_LOW);

                        } else {

                            if ((timestamp - startTime) / 1000 >= seconds) {

                                startTime = null;
                                if (isLow) PerformanceController.getInstance().events.trigger(PerformanceController.EVENT_PERFORMANCE_LOW);
                                else PerformanceController.getInstance().events.trigger(PerformanceController.EVENT_PERFORMANCE_HIGH);
                                isLow = true;

                                //return;
                            }
                        }
                    }
                }

                window.requestAnimationFrame(_checkFPS);
            }

            console.log('start fps detection', startTime === null);
            window.requestAnimationFrame(_checkFPS);
        }
    }
});
