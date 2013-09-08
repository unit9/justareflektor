/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 5/31/13
 * Time: 6:00 PM
 */

/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/1/13
 * Time: 5:27 PM
 */



var RemoteController = Class._extend(Class.SINGLETON, {

    _static: {

        RESYNC_TIME: 1000,
        ACTIVITY_TIMEOUT: 5000,
        MAX_SECONDS_INACTIVE: 6,

        EVENT_CONNECTION_CODE_READY: 'RemoteController_EVENT_CONNECTION_URL_READY',
        EVENT_PEER_EXIST: 'RemoteController_EVENT_PEER_EXIST',
        EVENT_PEER_ENTER: 'RemoteController_EVENT_PEER_ENTER',
        EVENT_PEER_LEAVE: 'RemoteController_EVENT_PEER_LEAVE',
        EVENT_PEER_LOADING_PROGRESS: 'RemoteController_EVENT_PEER_LOADING_PROGRESS',
        EVENT_PEER_READY: 'RemoteController_EVENT_PEER_READY',
        EVENT_MESH_FULL: 'RemoteController_EVENT_MESH_FULL',
        EVENT_MESH_CLOSE: 'RemoteController_EVENT_CLOSE',
        EVENT_PEER_INVALID_PLATFORM: 'RemoteController_EVENT_PEER_INVALID_PLATFORM',
        EVENT_PEER_ORIENTATION: 'RemoteController_EVENT_PEER_ORIENTATION',
        EVENT_EXPERIENCE_RESTART: 'RemoteController_EVENT_EXPERIENCE_RESTART',
        INFO_PLATFROM_CHOME_IOS: 'RemoteController_EVENT_INFO_PLATFROM_CHOME_IOS',
        EVENT_DEVICE_INACTIVE: 'RemoteController_EVENT_DEVICE_INACTIVE',
        EVENT_DEVICE_ACTIVE: 'RemoteController_EVENT_DEVICE_ACTIVE',
        EVENT_TOUCH: 'RemoteController_EVENT_TOUCH'

    },

    _public: {

        sleepMonitorEnabled: false,

        isConnected: function () {

            return this.peerNode !== null;

        },

        getConnectionCode: function () {

            return this.mesh ? this.mesh.id : -1;

        },

        host: function () {

            if (this.mesh) {
                this.dispose();
            }

            this.mesh = new window.Mesh(null, {api: Config.getInstance().meshApiUrl, autoConnect: false, useWebRTC: false});
            this.bindEvents();
            this.mesh.connect();

        },

        join: function (meshId) {

            if (this.mesh) {
                this.dispose();
            }

            this.mesh = new window.Mesh(meshId, {api: Config.getInstance().meshApiUrl, autoConnect: false, useWebRTC: false});
            this.bindEvents();
            this.mesh.connect();

        },

        start: function () {

            if (this.mesh) {
                this.mesh.trigger('start');
            } else {
                console.warn('Mesh undefined', this.mesh);
            }

        },

        play: function () {

            if (this.mesh) {
                this.mesh.trigger('play');
            }

        },

        pause: function () {

            if (this.mesh) {
                this.mesh.trigger('pause');
            }

        },

        end: function () {

            if (this.mesh) {
                this.mesh.trigger('end');
            }

        },

        restart: function () {

            if (this.mesh) {
                this.mesh.trigger('restart');
            }

        },

        resyncExperienceTime: function (experienceTime) {

            if (this.mesh) {
                this.mesh.trigger('resync', clocksync.time() + RemoteController.RESYNC_TIME, experienceTime);
            }

        },

        dispose: function () {

            if (this.peerNode) {

                this.peerNode.unbind();
                this.peerNode = null;

            }

            if (this.mesh) {

                this.mesh.unbind();
                this.mesh.disconnect();
                this.mesh = null;

            }

        },

        showAxelle: function (progress) {
            if (this.mesh) {
                this.mesh.trigger('axelle_start', progress);
            }
        },

        pauseAxelle: function (progress) {
            if (this.mesh) {
                this.mesh.trigger('axelle_pause', progress);
            }
        },

        hideAxelle: function (progress) {
            if (this.mesh) {
                this.mesh.trigger('axelle_hide', progress);
            }
        },

        showTurnItBack: function () {

            if (!this.isPromptShown) {

                this.isPromptShown = true;
                this.mesh.trigger('turnitback_start');

            }

        },

        hideTurnItBack: function () {

            if (this.isPromptShown) {

                this.isPromptShown = false;
                this.mesh.trigger('turnitback_stop');

            }

        },

        setLuminosity: function (luminosity, holeSize) {
            if (this.mesh) {
                this.mesh.trigger('setluminosity', [luminosity, holeSize]);
            }
        },

        setVolume: function (volume) {
            if (this.mesh) {
                this.mesh.trigger('volume', volume);
            }
        }

    },

    _private: {

        mesh: null,
        peerNode: null,
        isPromptShown: false,
        activityTimeoutId: -1,
        isActive: false,
        numMessages: 0,
        lastMpsTime: -1,
        mps: 0.001,
        numMeasurementsZeroMps: 0,

        bindEvents: function () {

            var self = this;

            this.mesh.self.bind('connect', function (e) {
                self.onMeshConnect();
                self.onPeerExist.apply(self, arguments);
            });

            this.mesh.self.bind('error', function () {
                self.onMeshClose();
            });

            this.mesh.self.bind('close', function () {
                self.onMeshClose();
            });

            this.mesh.self.bind('enter', function (node) {
                self.onPeerEnter(node);
            });

            this.mesh.self.bind('leave', function (node) {
                self.onPeerLeave(node);
            });

            this.mesh.bind('bind', function (type) {
                self.onPeerBind(type);
            });

            AnimationController.getInstance().events.bind(AnimationController.EVENT_FRAME, function () {
                self.onFrame();
            });

            Debug.add(this, 'mps', 'Mobile');

        },

        bindPeerEvents: function (node) {

            var self = this;

            node.bind('progress', function () {
                self.onPeerProgress.apply(self, arguments);
            });

            node.bind('ready', function () {
                self.onPeerReady();
            });

            node.bind('orientation', function () {
                self.onOrientation.apply(self, arguments);
            });

            node.bind('restart', function () {
                self.onPeerRestart.apply(self, arguments);
            });

            node.bind('touch', function () {
                self.onPeerTouch.apply(self, arguments);
            });

        },

        onPlatformInfo: function () {

            DetectionController.getInstance().setIsChromeOnIOSonMobile();
            this.events.trigger(RemoteController.INFO_PLATFROM_CHOME_IOS, [this.mesh.options.name]);

        },

        onMeshConnect: function () {

            DetectionController.getInstance().isChromeOnIOSonMobile = false;

            this.events.trigger(RemoteController.EVENT_CONNECTION_CODE_READY, [this.mesh.options.name]);
            if (window.LocalAutoConnectSocket !== undefined) {
                LocalAutoConnectSocket.getInstance().connect();
                LocalAutoConnectSocket.getInstance().publishURL(this.mesh.options.ws, this.mesh.options.name, window.location.hostname);
            }

        },

        onMeshClose: function () {

            this.events.trigger(RemoteController.EVENT_MESH_CLOSE);

        },

        onPeerExist: function () {

            var i;

            for (i = 0; i < arguments.length; ++i) {

                this.onPeerEnter(arguments[i]);

            }

        },

        onPeerEnter: function (node) {

            var self = this;

            if (this.peerNode) {

                this.events.trigger(RemoteController.EVENT_MESH_FULL, [node]);

            } else {

                node.bind('platform', function (platform, browser) {

                    self.onPeerPlatform(node, platform, browser);

                });

            }

        },

        onPeerLeave: function (node) {

            if (this.peerNode && this.peerNode.id === node.id) {

                this.peerNode = null;
                this.events.trigger(RemoteController.EVENT_PEER_LEAVE);

            }

        },

        onPeerBind: function (type) {

            switch (type) {

                case 'platform':
                    this.mesh.trigger('platform', this.peerNode ? RemoteController.EVENT_MESH_FULL : DetectionController.PLATFORM_DESKTOP);
                    break;

            }

        },

        onPeerPlatform: function (node, platform, browser) {

            this.onMessage();

            if (browser == RemoteController.INFO_PLATFROM_CHOME_IOS) {
                this.onPlatformInfo();
            }


            if (this.peerNode) {
                return;
            }

            /*
             desktop should accept connections from tablet and mobile only,
             mobile and tablet should accept connections from desktop only
             */
            if (platform === DetectionController.PLATFORM_TABLET || platform === DetectionController.PLATFORM_MOBILE) {

                this.peerNode = node;
                this.bindPeerEvents(node);
                this.events.trigger(RemoteController.EVENT_PEER_ENTER, [node]);

            } else if (platform === RemoteController.EVENT_MESH_FULL) {

                this.events.trigger(RemoteController.EVENT_MESH_FULL, [node]);

            } else {

                this.events.trigger(RemoteController.EVENT_PEER_INVALID_PLATFORM, [node]);

            }

            node.unbind('platform');

        },

        onPeerProgress: function (progress) {

            this.onMessage();
            this.events.trigger(RemoteController.EVENT_PEER_LOADING_PROGRESS, [progress]);

        },

        onPeerReady: function () {

            this.onMessage();
            this.events.trigger(RemoteController.EVENT_PEER_READY);

        },

        onOrientation: function (x, y, z, w, ax, ay, az, timestamp) {

            this.onMessage();

            this.events.trigger(RemoteController.EVENT_PEER_ORIENTATION, [
                {worldQuaternion: {x: x, y: y, z: z, w: w}, worldAcceleration: {x: ax, y: ay, z: az}, timestamp: timestamp}
            ]);

        },

        onMessage: function () {

            this.numMessages ++;

        },

        onFrame: function () {

            var currentTime;

            if (this.sleepMonitorEnabled) {

                currentTime = new Date().getTime();

                if (this.lastMpsTime === -1) {
                    this.lastMpsTime = currentTime;
                    this.numMessages = 0;
                    return;
                }

                if (currentTime - this.lastMpsTime >= 1000) {

                    this.mps = (this.numMessages * 1000 / (currentTime - this.lastMpsTime)).toFixed(2);
                    this.numMessages = 0;
                    this.lastMpsTime = currentTime;

                    if (Number(this.mps) === 0) {

                        if (++this.numMeasurementsZeroMps >= RemoteController.MAX_SECONDS_INACTIVE) {

                            this.onDeviceInactive();

                        }

                    } else {

                        this.numMeasurementsZeroMps = 0;
                        this.onDeviceActive();

                    }

                }

            }

        },

        onDeviceActive: function () {

            if (!this.isActive) {
                this.isActive = true;
                this.events.trigger(RemoteController.EVENT_DEVICE_ACTIVE);
            }

        },

        onDeviceInactive: function () {

            console.log('-- inactive');
            if (this.isActive) {
                this.isActive = false;
                this.events.trigger(RemoteController.EVENT_DEVICE_INACTIVE);
            }

        },

        onPeerRestart: function () {

            this.events.trigger(RemoteController.EVENT_EXPERIENCE_RESTART);

        },

        onPeerTouch: function (info) {

            this.events.trigger(RemoteController.EVENT_TOUCH, [info.state, info.time]);

        }

    }

});
