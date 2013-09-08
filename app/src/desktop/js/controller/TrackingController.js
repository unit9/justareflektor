/**
 *
 * TrackingController v2
 * Interfaces with the external tracking module.
 *
 */
var TrackingController = Class._extend(Class.SINGLETON, {

    _static: {

        EVENT_READY: 'TrackingController_EVENT_READY',
        EVENT_UPDATE: 'TrackingController_EVENT_UPDATE',
        PATH_TO_TRACKING_WORKER: '/src/desktop/js/worker/', //'/js/worker/',
        PATH_TO_SHADERS: '/shaders/tracking/',
        TRACKING_SIZE: 256,
        ORIENTATION_RESET_MAX_MOTION_SPEED: 0.075

    },

    _public: {

        tracking: null,
        initialised: false,
        mainVideo: null,
        renderer: null,
        ready: false,
        debugView: null,


        construct: function () {

        },

        init: function () {

            if (this.initialised) {
                return;
            }
            this.initialised = true;

            var self = this;

            this.renderer = new THREE.WebGLRenderer({antialias: false});
            this.renderer.setClearColor(0x000000, 0);
            this.renderer.setSize(TrackingController.TRACKING_SIZE, TrackingController.TRACKING_SIZE);
            this.renderer.autoClear = false;

            this.mainVideo = CameraController.getInstance().getVideo();


            this.tracking = new Tracking();
            this.tracking.start({

                renderer: this.renderer, //use self renderer

                //debug mode
                useWebWorkers: true,
                workerPath: TrackingController.PATH_TO_TRACKING_WORKER,
                useAnimationFrame: true,

                //use own video
                video: this.mainVideo, //use main video
                loadVideo: false,

                //load own shaders
                shaders: undefined,
                loadExternalShaders: true, //load own shaders automatically
                shaderPath: TrackingController.PATH_TO_SHADERS,

                //debug mode
                options: {"static":false}, //dat.gui
                debugView: this.debugView, //new window.TrackingDebugView(),

                //callbacks
                onresetorientation: function (e) {
                    self.onOrientationReset(e);
                },
                onluminosity: function (luminosity, holeSize) {
                    self.onLuminosity(luminosity, holeSize);
                },
                onready: function (e) {
                    self.onReady(e)
                },
                onerror: function (e) {
                    self.onError(e);
                },
                onupdate: function (e) {
                    self.onUpdate(e);
                }
            });


            //AnimationController.getInstance().events.bind(AnimationController.EVENT_FRAME, function () {
            //    self.onFrame();
            //});
        },

        start: function () {

            if (this.running || InputController.getInstance().mode === InputController.INPUT_TYPE_MOUSE) {
                return;
            }

            this.running = true;
            if (this.tracking) {
                this.tracking.resume();
            }

        },

        stop: function () {

            if (!this.running) {
                return;
            }

            this.running = false;
            if (this.tracking) {
                this.tracking.stop();
            }

        },

        getFrameInfo: function () {

            return this.tracking.getPosition().clone();

        },

        getPersistence: function () {

            return this.tracking.persistence;

        },


        isTouchingSide: function () {

            return this.tracking.isTouchingSide;

        },

        isFrontal: function () {

            return this.tracking.isFrontal();

        },

        isVisible: function () {

            return this.tracking.foundHole;

        },

        isReady: function () {
            return this.ready;
        },

        setFrontalTolerance: function (x, y, z) {

            this.tracking.frontalTolerance.x = x;
            this.tracking.frontalTolerance.y = y;
            this.tracking.frontalTolerance.z = z;

        },

        getLife: function() {
            return this.tracking.phoneLife;
        },

        addDebugView: function (dbv) {
            this.debugView = dbv;
            if (this.tracking)
                this.tracking.addDebugView(dbv);
        },

        showDebugContours: function (showContours) {
            if (!this.tracking) return;
            this.tracking.showDebugContours(showContours);
        },

        setUpdateRate: function (fps) {
            if (!this.tracking) return;
            this.tracking.VIDEO_UPDATE_RATE = (1000 / fps);
        },

        toString: function () {

            return '[Tracking]';

        }
    },

    _private: {

        onFrame: function () {
            console.log(this.running);
            if (!this.running) return;
            this.tracking.run();

        },

        onOrientationReset: function (time) {

            OrientationController.getInstance().resetOrientation(time || clocksync.time());

        },

        onLuminosity: function (luminosity, holeSize) {
            RemoteController.getInstance().setLuminosity(luminosity, holeSize);
        },

        onReady: function (e) {
            if (!this.ready) {
                this.ready = true;
                this.events.trigger(TrackingController.EVENT_READY);
            }
        },

        onUpdate: function (e) {
            if (!this.ready) {
                this.ready = true;
                this.events.trigger(TrackingController.EVENT_READY);
            }
            this.events.trigger(TrackingController.EVENT_UPDATE);
        },

        onError: function (e) {
            console.log(this + ' Error: ', e.toString());
        }

    }

});
