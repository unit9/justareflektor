/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/1/13
 * Time: 5:27 PM
 */

var RemoteController = Class._extend(Class.SINGLETON, {

    _static: {

        EVENT_CONNECTION_CODE_READY: 'RemoteController_EVENT_CONNECTION_URL_READY',
        EVENT_PEER_EXIST: 'RemoteController_EVENT_PEER_EXIST',
        EVENT_PEER_ENTER: 'RemoteController_EVENT_PEER_ENTER',
        EVENT_PEER_LEAVE: 'RemoteController_EVENT_PEER_LEAVE',
        EVENT_PEER_READY: 'RemoteController_EVENT_PEER_READY',
        EVENT_MESH_EMPTY: 'RemoteController_EVENT_MESH_EMPTY',
        EVENT_MESH_FULL: 'RemoteController_EVENT_MESH_FULL',
        EVENT_MESH_CLOSE: 'RemoteController_EVENT_MESH_CLOSE',
        EVENT_PEER_INVALID_PLATFORM: 'RemoteController_EVENT_PEER_INVALID_PLATFORM',
        EVENT_EXPERIENCE_START: 'RemoteController_EVENT_EXPERIENCE_START',
        EVENT_EXPERIENCE_END: 'RemoteController_EVENT_EXPERIENCE_END',
        EVENT_EXPERIENCE_RESTART: 'RemoteController_EVENT_EXPERIENCE_RESTART',
        EVENT_AXELLE_START: 'RemoteController_EVENT_AXELLE_START',
        EVENT_AXELLE_PAUSE: 'RemoteController_EVENT_AXELLE_PAUSE',
        EVENT_AXELLE_HIDE: 'RemoteController_EVENT_AXELLE_HIDE',
        EVENT_TURNITBACK_START: 'RemoteController_EVENT_TURNITBACK_START',
        EVENT_TURNITBACK_STOP: 'RemoteController_EVENT_TURNITBACK_STOP',
        EVENT_LUMINOSITY_CHANGE: 'RemoteController_EVENT_LUMINOSITY_CHANGE',
        EVENT_PLAY: 'RemoteController_EVENT_PLAY',
        EVENT_PAUSE: 'RemoteController_EVENT_PAUSE',
        EVENT_RESYNC: 'RemoteController_EVENT_RESYNC',
        EVENT_VOLUME_CHANGE: 'RemoteController_EVENT_VOLUME_CHANGE',

        INFO_PLATFROM_CHOME_IOS: 'RemoteController_EVENT_INFO_PLATFROM_CHOME_IOS',


        MODE_JOIN: 'join',
        MODE_HOST: 'host'

    },

    _public: {

        resynced: false,

        host: function () {

            if (this.mesh) {
                this.dispose();
            }

            this.mode = RemoteController.MODE_HOST;
            this.mesh = new window.Mesh(null, {api: Config.getInstance().meshApiUrl, autoConnect: false, useWebRTC: false});
            this.bindEvents();
            this.mesh.connect();

        },

        waitForConnectionCode: function () {
            if (window.LocalAutoConnectSocket !== undefined && LocalAutoConnectSocket.getInstance().enabled) {
                console.log('Automatic Local Connection.');
                $.cookie('code','');
                var urlReceived = false;
                LocalAutoConnectSocket.getInstance().connect();
                LocalAutoConnectSocket.getInstance().events.on(LocalAutoConnectSocket.EVENT_URL_RECEIVED, function (e, data) {
                    if (urlReceived) return;
                    urlReceived = true;
                    console.log('URL Received');
                    ViewController.getInstance().getView('LandingPageView').forceConnection(data.code);
                    ViewController.getInstance().getView('ControllerView').show();
                    ViewController.getInstance().getView('ExperienceEmptyView').hide();
                    ViewController.getInstance().getView('ExperienceEmptyView').$container.hide();
                });
                LocalAutoConnectSocket.getInstance().askForURL();
            }
        },

        join: function (meshId) {

            if (this.mesh) {
                this.dispose();
            }

            this.mode = RemoteController.MODE_JOIN;
            this.mesh = new window.Mesh(meshId, {api: Config.getInstance().meshApiUrl, autoConnect: false, useWebRTC: false});
            this.bindEvents();
            this.mesh.connect();

        },

        tryReconnect: function (code, successHandler, failureHandler) {

            var self = this,
                timeoutId = -1,
                unbind = function () {
                    clearTimeout(timeoutId);
                    self.events.unbind(RemoteController.EVENT_PEER_ENTER + '.Reconnect');
                    self.events.unbind(RemoteController.EVENT_MESH_FULL + '.Reconnect');
                    self.events.unbind(RemoteController.EVENT_MESH_EMPTY + '.Reconnect');
                };

            console.log('-- trying to reconnect');

            this.events.bind(RemoteController.EVENT_PEER_ENTER + '.Reconnect', function () {
                unbind();
                console.log('-- reconnect success');
                if (typeof successHandler === 'function') {
                    successHandler();
                }
            });

            this.events.bind(RemoteController.EVENT_MESH_FULL + '.Reconnect', function () {
                unbind();
                console.log('-- reconnect mesh full');
                if (typeof failureHandler === 'function') {
                    failureHandler();
                }
            });

            this.events.bind(RemoteController.EVENT_MESH_EMPTY + '.Reconnect', function () {
                unbind();
                console.log('-- reconnect mesh empty');
                if (typeof failureHandler === 'function') {
                    failureHandler();
                }
            });

            timeoutId = setTimeout(function () {
                unbind();
                console.log('-- reconnect timeout');
                if (typeof failureHandler === 'function') {
                    failureHandler();
                }
            }, JoinView.TIMEOUT);

            this.join(code);

        },

        reportLoadingProgress: function (progress) {

            if (this.mesh) {

                this.mesh.trigger('progress', progress);

            }

        },

        ready: function (waitForReady) {

            var self = this;

            if (!this.readyToStart && waitForReady) {

                setTimeout(function () {
                    self.ready(waitForReady);
                }, 20);

            } else {

                this.mesh.trigger('ready');

            }

        },

        sendOrientation: function (x, y, z, w, ax, ay, az) {

            if (this.mesh) {

                this.mesh.trigger('orientation', x.toFixed(3), y.toFixed(3), z.toFixed(3), w.toFixed(3), ax.toFixed(2), ay.toFixed(2), az.toFixed(2), clocksync.time());

            }

        },

        restart: function () {

            if (this.mesh) {

                this.mesh.trigger('restart');

            }

        },

        sendSleepPauseInfo: function (pageVisibility) {

            if (this.mesh) {
                this.mesh.trigger('hidden', { pageVisibility: pageVisibility });
            }

        },

        sendTouchInfo: function (state) {

            if (this.mesh) {
                this.mesh.trigger('touch', {state: state, time: clocksync.time()});
            }

        }

    },

    _private: {

        mesh: null,
        peerNode: null,
        readyToStart: false,

        bindEvents: function () {

            var self = this;

            this.mesh.self.bind('connect', function () {
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
                this.mesh.trigger('platfrom_info');
                self.onPeerEnter(node);
            });

            this.mesh.self.bind('leave', function (node) {
                self.onPeerLeave(node);
            });

            this.mesh.bind('bind', function (type) {
                self.onPeerBind(type);
            });

        },

        bindPeerEvents: function (node) {

            var self = this;

            node.bind('start', function () {
                self.onPeerStart();
            });

            node.bind('end', function () {
                self.onPeerEnd();
            });

            node.bind('restart', function () {
                self.onPeerRestart();
            });

            node.bind('play', function () {
                self.onPeerPlay();
            });

            node.bind('pause', function () {
                self.onPeerPause();
            });

            node.bind('resync', function (globalTime, localTime) {
                self.onPeerResync(globalTime, localTime);
            });

            node.bind('axelle_start', function (progress) {
                self.onPeerAxelleStart(progress);
            });

            node.bind('axelle_pause', function (progress) {
                self.onPeerAxellePause(progress);
            });

            node.bind('axelle_hide', function () {
                self.onPeerAxelleHide();
            });

            node.bind('turnitback_start', function () {
                self.onTurnItBackStart();
            });

            node.bind('turnitback_stop', function () {
                self.onTurnItBackStop();
            });

            node.bind('setluminosity', function (data) {
                self.onLuminosity(data);
            });

            node.bind('volume', function (volume) {
                self.onPeerVolumeChange(volume);
            });

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

            this.readyToStart = false;

        },

        onMeshConnect: function () {

            this.events.trigger(RemoteController.EVENT_CONNECTION_CODE_READY, [this.mesh.options.name]);

        },

        onMeshClose: function () {

            this.events.trigger(RemoteController.EVENT_MESH_CLOSE);

            console.log('Mesh Close');
            if (window.LocalAutoConnectSocket !== undefined && window.LocalAutoConnectSocket.getInstance().connected) {
                //window.location.href = '#';
                console.log('Reloading Autoconnection.');
                window.location.href = Config.getInstance().originalUrl;
            }
        },

        onPeerExist: function () {

            var i;

            if (this.mode === RemoteController.MODE_JOIN && arguments.length < 1) {

                return this.events.trigger(RemoteController.EVENT_MESH_EMPTY);

            }

            for (i = 0; i < arguments.length; ++i) {

                this.onPeerEnter(arguments[i]);

            }

        },

        onPeerEnter: function (node) {

            var self = this;

            if (this.peerNode) {

                this.events.trigger(RemoteController.EVENT_MESH_FULL, [node]);

            } else {

                node.bind('platform', function (platform) {

                    self.onPeerPlatform(node, platform);

                });

            }

        },

        onPeerLeave: function (node) {

            if (this.peerNode && this.peerNode.id === node.id) {

                this.dispose();
                this.events.trigger(RemoteController.EVENT_PEER_LEAVE);

            }

            console.log('Peer Leave');
            if (window.LocalAutoConnectSocket !== undefined && window.LocalAutoConnectSocket.getInstance().connected) {
                //window.location.href = '#';
                console.log('Reloading Autoconnection.');
                window.location.href = Config.getInstance().originalUrl;
            }

        },

        onPeerBind: function (type) {

            switch (type) {

                case 'platform':
                    this.mesh.trigger('platform', this.peerNode ? RemoteController.EVENT_MESH_FULL : DetectionController.getInstance().platform, DetectionController.getInstance().isChrome && DetectionController.getInstance().isIos ? RemoteController.INFO_PLATFROM_CHOME_IOS : null);
                    break;

                case 'ready':
                    this.readyToStart = true;
                    this.events.trigger(RemoteController.EVENT_PEER_READY);
                    break;

            }

        },

        onPeerPlatform: function (node, platform) {

            if (this.peerNode) {
                return;
            }

            /*
             desktop should accept connections from tablet and mobile only,
             mobile and tablet should accept connections from desktop only
             */
            if ((DetectionController.getInstance().platform === DetectionController.PLATFORM_DESKTOP && (platform === DetectionController.PLATFORM_TABLET || platform === DetectionController.PLATFORM_MOBILE)) || (DetectionController.getInstance().platform !== DetectionController.PLATFORM_DESKTOP && platform === DetectionController.PLATFORM_DESKTOP)) {

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

        onPeerStart: function () {

            this.events.trigger(RemoteController.EVENT_EXPERIENCE_START);

        },

        onPeerEnd: function () {

            this.events.trigger(RemoteController.EVENT_EXPERIENCE_END);

        },

        onPeerRestart: function () {

            this.events.trigger(RemoteController.EVENT_EXPERIENCE_RESTART);

        },

        onPeerPlay: function () {

            this.events.trigger(RemoteController.EVENT_PLAY);

        },

        onPeerPause: function () {

            this.events.trigger(RemoteController.EVENT_PAUSE);

        },

        onPeerResync: function (globalTime, localTime) {

            this.events.trigger(RemoteController.EVENT_RESYNC, [globalTime, localTime]);

        },

        onPeerAxelleStart: function (progress) {

            this.events.trigger(RemoteController.EVENT_AXELLE_START, [progress]);

        },

        onPeerAxellePause: function (progress) {

            this.events.trigger(RemoteController.EVENT_AXELLE_PAUSE, [progress]);

        },

        onPeerAxelleHide: function () {

            this.events.trigger(RemoteController.EVENT_AXELLE_HIDE);

        },

        onTurnItBackStart: function () {

            this.events.trigger(RemoteController.EVENT_TURNITBACK_START);

        },

        onTurnItBackStop: function () {

            this.events.trigger(RemoteController.EVENT_TURNITBACK_STOP);

        },

        onLuminosity: function (data) {

            this.events.trigger(RemoteController.EVENT_LUMINOSITY_CHANGE, [data]);

        },

        onPeerVolumeChange: function (volume) {

            this.events.trigger(RemoteController.EVENT_VOLUME_CHANGE, [volume]);

        }

    }

});
