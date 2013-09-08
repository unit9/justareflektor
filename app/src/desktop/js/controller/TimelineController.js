/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 7/8/13
 * Time: 12:51 AM
 */

var TimelineController = Class._extend(Class.SINGLETON, {

    _static: {

        TIMELINE_RAW_DATA: {},
        TIMELINE_RAW_MOUSE_DATA: {},
        TIME_TRACKING_ACTIVE_UNTIL: 246,
        KEEP_INTERACTIONS_RUNNING_WHEN_PAUSED: true,

        EVENT_START: 'TimelineController_EVENT_START',
        EVENT_PAUSE: 'TimelineController_EVENT_PAUSE',
        EVENT_RESUME: 'TimelineController_EVENT_RESUME',
        EVENT_END: 'TimelineController_EVENT_END',
        EVENT_SEEK: 'TimelineController_EVENT_SEEK',

        DISABLE_SEEK_INTERACTION: 'TimelineController_DISABLE_SEEK_INTERACTION',
        ENABLE_SEEK_INTERACTION: 'TimelineController_ENABLE_SEEK_INTERACTION',

        ACTION_ADD_CAPTION: 'TimelineController_ACTION_ADD_CAPTION',

        DIRECT_FLAG: false,
        RESTARTING_FLAG: false,

        RENDERING_QUALITIES: [256,512,640,800,960,1120,1280,1440,1600,1760,1920], //downgrade rendering quality for slower computers, and upgrade it for faster ones
        QUALITY_TRACKING_RATES: { //downgrade tracking framerate for slower computers
            "1920": 27,
            "1760": 26,
            "1600": 25,
            "1440": 24,
            "1280": 24,
            "1120": 24,
            "960": 22,
            "800": 20,
            "640": 20,
            "512": 18,
            "256": 12
        },
        QUALITY_FPS_THRESHOLDS: { //downgrade tracking framerate for slower computers
            "1920": {low: 57, high: 59},
            "1760": {low: 57, high: 59},
            "1600": {low: 57, high: 59},
            "1440": {low: 57, high: 59},
            "1280": {low: 29, high: 59},
            "1120": {low: 28, high: 50},
            "960": {low: 24, high: 50},
            "800": {low: 24, high: 45},
            "640": {low: 18, high: 45},
            "512": {low: 3, high: 35}, //almost impossible to reach 256x256 but it could happen..
            "256": {low: 2, high: 16} //try to return to 512 asap
        }
    },

    _public: {

        initialised: false,
        video: null,
        audio: null,
        player: null,
        videoTexture: null,
        seekTarget: 0.0,
        seeked: false,

        activeSequences: [],
        sequences: [],

        renderSize: 1280,
        trackingRate: 24,

        construct: function () {

            this.player = Player.getInstance();

        },

        init: function () {

            if (this.initialised) {
                return;
            }

            this.$interactions = ViewController.getInstance().getView('ExperienceView').$container.find('.interactions');

            RendererController.getInstance().init();
            RendererController.getInstance().add(this.$interactions);
            InputController.getInstance().setContainer($(window));//ViewController.getInstance().getView('ExperienceView').$container);

            //
            this.player = Player.getInstance();
            this.video = this.player.video;
            this.audio = this.player.audio;
            this.videoTexture = new VideoTexture(this.video, this.video.videoWidth, this.video.videoHeight, Player.VIDEO_FRAMERATE); //this.player.videoWidth, this.player.videoHeight
            console.log('Creating Video Texture', this.video,this.video.videoWidth,this.video.videoHeight);

            Debug.add(this, 'renderSize', 'Performance');
            Debug.add(this, 'trackingRate', 'Performance');

            //merge MOUSE timeline data if necessary
            //~~TODO - preprocess the merge as two different json files
            //window.TimelineMerge(TimelineController.TIMELINE_RAW_DATA.timeline,TimelineController.TIMELINE_RAW_MOUSE_DATA.timeline)

            //build interactions
            this.initSequences(TimelineController.TIMELINE_RAW_DATA);
            //this.renderSize = this.videoTexture.width;
            this.setRenderingQuality(this.videoTexture.width);


            this.bindEvents();


            //play
            this.initialised = true;
            this.running = true;
            this.events.trigger(TimelineController.EVENT_START);
            Viewport.getInstance().updateBox();
            this.player.play();


            var self = this;

            // restarting
            RemoteController.getInstance().events.bind(RemoteController.EVENT_EXPERIENCE_RESTART + '.TimelineController', function (event, data) {
                self.restartExperience();
            });

            //debug
            if (TimelineController.DIRECT_FLAG) {

                CameraController.getInstance().events.bind(CameraController.EVENT_VIDEO_READY + '.TimelineController', function () {
                    InputController.getInstance().setMode(InputController.INPUT_TYPE_TRACKING);
                });

                CameraController.getInstance().init();

                RemoteController.getInstance().events.on(RemoteController.EVENT_CONNECTION_CODE_READY + '.TimelineController', function (event, data) {
                    self.displayConnectionCode(data);
                });

                RemoteController.getInstance().events.on(RemoteController.EVENT_PEER_ENTER + '.TimelineController', function () {
                    self.removeConnectionCodeBox();
                });

                RemoteController.getInstance().events.on(RemoteController.EVENT_PEER_READY + '.TimelineController', function () {
                    RemoteController.getInstance().start();
                });

                RemoteController.getInstance().events.bind(RemoteController.EVENT_PEER_LEAVE + '.TimelineController', function (event, data) {
                    //self.onPeerEnter(data);
                    console.log('Restarting: ', data);
                    RemoteController.getInstance().host();
                });

                if (this.getQueryVariable("t")) {
                    this.seekTarget = parseFloat(this.getQueryVariable("t"));
                    this.resume();
                    this.player.seek(this.seekTarget);
                }

                if (this.getQueryVariable("i")) {
                    var id = this.getQueryVariable("i");
                    for (var i = 0; i <= TimelineController.TIMELINE_RAW_DATA.timeline.length - 1; i++) {
                        if (TimelineController.TIMELINE_RAW_DATA.timeline[i].id == id) {
                            this.seekTarget = TimelineController.TIMELINE_RAW_DATA.timeline[i].start;
                            break;
                        }
                    }
                    this.resume();
                    this.player.seek(this.seekTarget);
                }

                RemoteController.getInstance().host();
            }

        },

        start: function () {

            var self = this;

            //make sure experience is fully preloaded
            if (this.initialised) {
                Player.getInstance().play();
            } else {
                PreloadController.getInstance().events.on(PreloadController.EVENT_EXPERIENCE_COMPLETE + '.TimelineController', function () {
                    self.init();
                });

                PreloadController.getInstance().preloadExperience();
            }

            this.running = true;


            //
            // quality downgrading/upgrading
            //
            PerformanceController.getInstance().events.bind(PerformanceController.EVENT_PERFORMANCE_LOW + '.TimelineController', function () {
                
                if (!self.running) return;

                var cr = 0;
                var qualities = TimelineController.RENDERING_QUALITIES;
                for (var i=0; i<qualities.length; i++) {
                    if (self.renderSize === qualities[i]) cr  = i;
                }
                if (cr > 0) {
                    --cr;
                    self.setRenderingQuality(TimelineController.RENDERING_QUALITIES[cr]);
                }

            });
            PerformanceController.getInstance().events.bind(PerformanceController.EVENT_PERFORMANCE_HIGH + '.TimelineController', function () {

                if (!self.running) return;

                var cr = 0;
                for (var i=0; i<TimelineController.RENDERING_QUALITIES.length; i++) {
                    if (self.renderSize === TimelineController.RENDERING_QUALITIES[i]) cr  = i;
                }
                if (cr < TimelineController.RENDERING_QUALITIES.length-1) {
                    ++cr;
                    self.setRenderingQuality(TimelineController.RENDERING_QUALITIES[cr])
                }

            });

        },

        getQueryVariable: function (variable) {
            var query = window.location.search.substring(1);
            var vars = query.split("&");
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                if (pair[0] == variable) {
                    return pair[1];
                }
            }
            return false;
        },

        removeConnectionCodeBox: function () {

            $("#code-debug").remove();

        },

        setRestartFlag: function () {

            TimelineController.RESTARTING_FLAG = true;
            this.restartExperience();

        },

        displayConnectionCode: function (code) {

            $("#code-debug").remove();
            $("body").append("<div id='code-debug'></div>");
            $("#code-debug").html(code);

        },

        pause: function () {

            if (!this.running) {
                return;
            }

            this.running = false;

            this.activeSequences.forEach(function (interaction) {
                interaction.pause();
            });

            this.player.pause();
            this.events.trigger(TimelineController.EVENT_PAUSE);

        },

        restartExperience: function () {

            this.seekTarget = 0;
            this.player.seek(0);
            this.player.play();
            this.events.trigger(TimelineController.EVENT_START);
            this.running = true;

            TimelineController.RESTARTING_FLAG = false;

        },

        resume: function () {

            if (this.running) {
                return;
            }

            this.running = true;

            this.activeSequences.forEach(function (interaction) {
                interaction.resume();
            });

            this.player.play();
            this.events.trigger(TimelineController.EVENT_RESUME);

        },


        stop: function () {

            this.player.seek(0);
            this.pause();

            this.endFinishedInteractions(true);

            PerformanceController.getInstance().events.unbind(PerformanceController.EVENT_PERFORMANCE_LOW + '.TimelineController');
            PerformanceController.getInstance().events.unbind(PerformanceController.EVENT_PERFORMANCE_HIGH + '.TimelineController');


        },

        toggle: function () {

            if (this.running) {

                this.pause();

            } else {

                this.resume();

            }

        },

        canShowDisconnectionError: function () {

            return InputController.getInstance().mode === InputController.INPUT_TYPE_TRACKING && Player.getInstance().getCurrentTime() < 280 && !ViewController.getInstance().getView('EndScreenView').shown;

        }

    },

    _private: {

        running: false,
        currentTime: 0,


        initSequences: function (data) {

            var instance,
                i;

            for (i = 0; i < data.timeline.length; i++) {

                if (!data.timeline[i].ignore) {

                    //create instance
                    instance = new (window[data.timeline[i]['class']])(data.timeline[i].id, this.$interactions, this.video, this.audio, this.videoTexture);
                    instance.audio = this.audio;
                    instance.video = this.video;
                    instance.videoTexture = this.videoTexture;
                    instance.startTime = this.parseTime(data.timeline[i].start);
                    instance.endTime = this.parseTime(data.timeline[i].end);
                    //instance.changeVideoQuality(this.player.videoWidth, this.player.videoHeight);

                    //settings and transitions
                    instance.defaultOptions = this.cloneSettings(data.timeline[i].settings);
                    instance.currentOptions = this.cloneSettings(data.timeline[i].settings);
                    instance.transitions = data.timeline[i].transitions;

                    //initialise
                    instance.init();
                    instance.changeVideoQuality(this.videoTexture.width, this.videoTexture.height);

                    this.sequences.push(instance);

                }

            }

        },


        bindEvents: function () {

            var self = this;

            this.player.events.bind(Player.EVENT_ENDED + '.TimelineController', function () {
                self.onEnd();
            });

            AnimationController.getInstance().events.bind(AnimationController.EVENT_FRAME + '.TimelineController', function () {
                self.onFrame();
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_PEER_ENTER + '.TimelineController', function () {
                self.onPeerEnter();
            });

            self.events.bind(TimelineController.EVENT_SEEK + '.TimelineController', function () {

                TimelineController.getInstance().events.trigger(TimelineController.DISABLE_SEEK_INTERACTION, [true]);
                self.resume();
                self.player.seek(self.seekTarget * self.player.getDuration());

            });

            Player.getInstance().events.bind(Player.EVENT_SEEK_START + '.TimelineController', function () {
                self.onSeekStart();
            });

            Player.getInstance().events.bind(Player.EVENT_SEEKED + '.TimelineController', function () {
                self.onSeeked();
            });

        },

        startNewInteractions: function () {

            var i,
                currentTime = this.player.getCurrentTimeVideo();

            for (i = 0; i < this.sequences.length; ++i) {

                if (currentTime >= this.sequences[i].startTime && currentTime <= this.sequences[i].endTime) {

                    this.sequences[i].active = true;
                    console.log('-- begin', this.sequences[i].id);
                    this.sequences[i].begin();
                    this.activeSequences.push(this.sequences[i]);
                    this.sequences.splice(i, 1);
                    --i;

                }

            }

        },

        endFinishedInteractions: function (force) {

            var i,
                currentTime = this.player.getCurrentTimeVideo();

            for (i = 0; i < this.activeSequences.length; ++i) {

                if (currentTime < this.activeSequences[i].startTime || currentTime > this.activeSequences[i].endTime || force) {

                    this.activeSequences[i].active = false;
                    var sequence = this.activeSequences[i];
                    console.log('End:',this.activeSequences[i])

                    //reset transitions
                    if (this.activeSequences[i].transitions) {
                        for (j = 0; j < this.activeSequences[i].transitions.length; j++) {
                            this.activeSequences[i].transitions[j].active = false;
                            this.activeSequences[i].transitions[j].hasPlayed = false;
                        }
                    }

                    //reset options to default
                    if (sequence.defaultOptions) {
                        for (var valueName in sequence.defaultOptions) {
                            sequence.currentOptions[valueName] = sequence.defaultOptions[valueName]; 
                        }
                    }


                    console.log('-- end', this.activeSequences[i].id);
                    this.activeSequences[i].end();
                    this.sequences.push(this.activeSequences[i]);
                    this.activeSequences.splice(i, 1);
                    --i;

                }

            }

        },




        updateActiveInteractions: function (running,forceReset) {

            var self = this,
                currentTime = this.player.getCurrentTimeVideo(),
                currentTimeAbsolute = currentTime,
                currentTimeRelative = 0,
                currentFrameAbsolute = this.videoTexture.currentFrame,
                currentFrameRelative = 0,
                transition = null,
                i,
                isActive,
                activeProgress,
                start,
                end;

            this.activeSequences.forEach(function (interaction) {

                var v;

                currentTimeRelative = currentTimeAbsolute - interaction.startTime;
                currentFrameRelative = currentFrameAbsolute - Math.floor(interaction.startTime * Player.VIDEO_FRAMERATE);



                //
                // reset to default on seeking 
                //
                if (interaction.defaultOptions) {
                    for (var valueName in interaction.currentOptions[v]) {
                        interaction.currentOptions[v] = interaction.defaultOptions[v]; 
                    }
                }


                //transition
                if (interaction.transitions) {
                    for (i = 0; i < interaction.transitions.length; i++) {

                        transition = interaction.transitions[i];

                        //check if transition should be active
                        isActive = false;
                        activeProgress = 0.0;
                        switch (transition.time) {
                            case 'absoluteTime':
                                isActive = (currentTimeAbsolute >= transition.start && currentTimeAbsolute <= transition.end);
                                activeProgress = (currentTimeAbsolute - transition.start) / (transition.end - transition.start);
                                break;

                            case 'relativeTime':
                                isActive = (currentTimeRelative >= transition.start && currentTimeRelative <= transition.end);
                                activeProgress = (currentTimeRelative - transition.start) / (transition.end - transition.start);
                                break;

                            case 'absoluteFrame':
                                isActive = (currentFrameAbsolute >= transition.start && currentFrameAbsolute <= transition.end);
                                activeProgress = (currentFrameAbsolute - transition.start) / (transition.end - transition.start);
                                break;

                            case 'relativeFrame':
                                isActive = (currentFrameRelative >= transition.start && currentFrameRelative <= transition.end);
                                activeProgress = (currentFrameRelative - transition.start) / (transition.end - transition.start);
                                break;
                        }
                        if (forceReset) console.log('Transition'+transition.name+' > < '+activeProgress);


                        if (isActive) {

                            switch (transition.type) {
                                case 'cut':
                                    //console.log(transition.name);

                                    for (v in transition.values) {

                                        if (transition.values[v] !== undefined) {
                                            interaction.currentOptions[v] = (transition.values[v] === 'default') ? interaction.defaultOptions[v] : transition.values[v];
                                            transition.active = false;
                                        }
                                    }
                                    break;

                                default:
                                    for (v in transition.valuesStart) {

                                        if (transition.valuesStart[v] !== undefined) {

                                            start = (transition.valuesStart[v] === 'default') ? interaction.defaultOptions[v] : transition.valuesStart[v];
                                            end = (transition.valuesEnd[v] === 'default') ? interaction.defaultOptions[v] : transition.valuesEnd[v];

                                            interaction.currentOptions[v] = start + (end - start) * activeProgress;
                                            //console.log(transition.name, start, end, activeProgress, interaction.currentOptions[v]);
                                            transition.active = true;

                                        }
                                    }
                            }

                            //reset inactive transitions values
                        } else if ((!forceReset && transition.active) || (activeProgress >= 1.0 && !transition.hasPlayed) || (forceReset && activeProgress>=1.0)) {

                            if (forceReset) console.log('Forcing Transition End Values:',transition.name,activeProgress);
                            transition.active = false;
                            transition.hasPlayed = true;
                            var valuesEnd = transition.valuesEnd || transition.values || {};
                            for (v in valuesEnd) {
                                if (valuesEnd[v] !== undefined) {//} && transition.valuesEnd[v] === 'default') {
                                    console.log('       '+v,'->',(valuesEnd[v] === 'default') ? interaction.defaultOptions[v] : valuesEnd[v]);
                                    interaction.currentOptions[v] = (valuesEnd[v] === 'default') ? interaction.defaultOptions[v] : valuesEnd[v];
                                }
                            }

                        } else {

                            transition.active = false;

                        }
                    }
                }

                //update sequence
                interaction.onFrame(interaction.currentOptions, self.videoTexture.currentFrame - Math.floor(interaction.startTime * 23.987), currentTime - interaction.startTime, (currentTime - interaction.startTime) / (interaction.endTime - interaction.startTime), TrackingController.getInstance().getFrameInfo(), OrientationController.getInstance().getFrameInfo(), running);
            });

        },

        parseTime: function (time) {

            var c,
                result;

            if (parseFloat(time) === time) {
                return parseFloat(time, 10) / Player.VIDEO_FRAMERATE;
            }

            c = time.split(':');

            if (c.length === 1) {
                result = parseInt(time, 10);
            } else if (c.length === 2) {
                result = parseInt(c[0], 10) + parseInt(c[1], 10) * 0.001;
            } else {
                result = parseInt(c[0], 10) * 60 + parseInt(c[1], 10) + parseInt(c[2], 10) * 0.001;
            }

            return result;

        },

        cloneSettings: function (settings) {

            var nv = {},
                o;

            for (o in settings) {

                if (settings[o] !== undefined) {

                    nv[o] = settings[o];

                }

            }

            nv.auto = true;
            return nv;

        },

        updateTimeBasedSettings: function () {

            // tracking enabled / disabled
            if (InputController.getInstance().mode === InputController.INPUT_TYPE_TRACKING) {
                //if (this.currentTime > TimelineController.TIME_TRACKING_ACTIVE_UNTIL) {
                //    TrackingController.getInstance().stop();
                //} else {
                    TrackingController.getInstance().start();
                //}
            }

        },

        checkConnection: function () {

            if (!RemoteController.getInstance().peerNode && this.canShowDisconnectionError()) {

                RemoteController.getInstance().events.trigger(RemoteController.EVENT_PEER_LEAVE);

            }

        },

        onFrame: function () {

            if (!this.running && !TimelineController.KEEP_INTERACTIONS_RUNNING_WHEN_PAUSED) {
                return;
            }

            this.currentTime = this.player.getCurrentTimeVideo();

            InputController.getInstance().update(TrackingController.getInstance().isReady(), TrackingController.getInstance().getFrameInfo(), OrientationController.getInstance().getFrameInfo());
            this.videoTexture.update();
            this.endFinishedInteractions();
            this.startNewInteractions();
            if (this.seeked) console.log('Seeked Complete');
            this.updateActiveInteractions(this.running,this.seeked);
            this.seeked = false;
            this.videoTexture.endFrame();
            this.updateTimeBasedSettings();
            //this.videoTexture.wasUpdated = false;

        },

        onSeekStart: function () {

            var i;

            for (i = 0; i < this.activeSequences.length; ++i) {
                this.activeSequences[i].seekStart();
            }

        },

        onSeeked: function () {
            console.log('onseek',this.shown);

            //var i;
            this.seeked = true;
            //if (this.shown) {

                for (var i = 0; i < this.activeSequences.length; ++i) {
                    this.activeSequences[i].seek();
                }

                this.checkConnection();

                this.updateActiveInteractions(this.running, true);

           // }

        },

        onPeerEnter: function () {

            this.onSeeked();

        },

        onEnd: function () {

            this.stop();
            RemoteController.getInstance().end();
            RoutingController.getInstance().route('/end');

        },



        //
        // Rendering Quality Selection
        //
        setRenderingQuality: function(width) {

            var height = Math.floor(width * 0.525);
            this.renderSize = width;

            for (var i=0; i<this.sequences.length; i++) {
                this.sequences[i].changeRenderQuality(width, height);
            }

            this.trackingRate = TimelineController.QUALITY_TRACKING_RATES[width.toString()];
            var newThreshold = TimelineController.QUALITY_FPS_THRESHOLDS[width.toString()];
            if (newThreshold) {
                PerformanceController.FRAMERATE_LOW_THRESHOLD = newThreshold.low;
                PerformanceController.FRAMERATE_HIGH_THRESHOLD = newThreshold.high;
                console.log('>>> Selected a new rendering quality: ',width + 'x' + height, ', and a new tracking framerate: ',TimelineController.QUALITY_TRACKING_RATES[width.toString()],' <<<');
                console.log('Peformance FrameRate Thresholds - low:',PerformanceController.FRAMERATE_LOW_THRESHOLD,PerformanceController.FRAMERATE_HIGH_THRESHOLD);

                TrackingController.getInstance().setUpdateRate( this.trackingRate );
            } else {
                console.warn('No threshold for width', width);
            }
        }

    }

});

