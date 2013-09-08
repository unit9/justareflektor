/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/10/13
 * Time: 3:35 PM
 */

var OrientationController = Class._extend(Class.SINGLETON, {

    _static: {

        MAX_NUM_OF_RESETS: 2

    },

    _public: {

        rawQuaternion: {x: 0, y: 0, z: 0, w: 1},
        worldQuaternion: {x: 0, y: 0, z: 0, w: 1},
        worldAcceleration: {x: 0, y: 0, z: 0},
        referenceQuaternion: new THREE.Quaternion(0, 1, 0, 0), //assume that it's inverted by default
        timesReset: 0,
        lastTime: 0,
        lastDirection: 0,
        smoothMotionSpeed: 0,
        rawMotionSpeed: 0,
        messagesGotTmp: 0,
        touchStartTime: 0,
        lastTouchStartTime: 0,
        touchMoveTime: 0,
        lastTouchMoveTime: 0,
        touchEndTime: 0,
        lastTouchEndTime: 0,

        construct: function () {

            Debug.add(this, 'timesReset', 'Mobile');
            Debug.add(this, 'touchStartTime', 'Mobile');
            Debug.add(this, 'touchMoveTime', 'Mobile');
            Debug.add(this, 'touchEndTime', 'Mobile');
            Debug.openFolder('Mobile');

        },

        start: function () {

            var self = this;

            if (this.started) {
                return;
            }

            RemoteController.getInstance().events.bind(RemoteController.EVENT_PEER_ORIENTATION + '.OrientationController', function () {
                self.onOrientationChange.apply(self, arguments);
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_DEVICE_INACTIVE + '.OrientationController', function () {
                self.onDeviceInactive.apply(self, arguments);
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_TOUCH + '.OrientationController', function () {
                self.onTouch.apply(self, arguments);
            });

            AnimationController.getInstance().events.bind(AnimationController.EVENT_FRAME + '.OrientationController', function () {
                self.onFrame();
            });

            this.started = true;

        },

        stop: function () {

            if (!this.started) {
                return;
            }

            RemoteController.getInstance().events.unbind(RemoteController.EVENT_PEER_ORIENTATION + '.OrientationController');
            RemoteController.getInstance().events.unbind(RemoteController.EVENT_DEVICE_INACTIVE + '.OrientationController');

            this.started = false;

        },

        getFrameInfo: function () {

            return this.worldQuaternion;

        },

        getRawQuaternion: function () {

            return this.rawQuaternion;

        },

        /**
         * Calibrates the orientation taking a quaternion at a given timestamp as reference orientation.
         * @param trackingTimestamp
         */
        resetOrientation: function (timestamp) {

            if (!this.resetPending) {
                this.resetTimestamp = timestamp;
                this.resetPending = true;
            }

        },

        resetResetInformation: function () {

            this.timesReset = 0;

        }

    },

    _private: {

        started: false,
        resetPending: false,
        resetQuaternion: null,
        touchUp: false,
        touchUpTimeoutId: -1,

        calibrate: function (referenceQuaternion) {
            console.log('>>> Calibrate <<<');
           if (this.timesReset < OrientationController.MAX_NUM_OF_RESETS) {
                this.referenceQuaternion = new THREE.Quaternion(referenceQuaternion.x, referenceQuaternion.y, referenceQuaternion.z, -referenceQuaternion.w);
           } else {
               console.log('>>> Orientation Reset slerp <<<');
               this.referenceQuaternion.slerp(new THREE.Quaternion(referenceQuaternion.x, referenceQuaternion.y, referenceQuaternion.z, -referenceQuaternion.w), 0.35 );
           }
           this.timesReset++;
           this.resetPending = false;
            //this.referenceQuaternion.slerp(new THREE.Quaternion(this.rawQuaternion.x, this.rawQuaternion.y, this.rawQuaternion.z, -this.rawQuaternion.w), 0.2 - Math.min(this.smoothMotionSpeed,1.0)*0.2);
        },

        onOrientationChange: function (event, data) {

            if (this.resetPending) {
                if (data.timestamp >= this.resetTimestamp) {
                    this.calibrate(this.resetQuaternion || data.worldQuaternion);
                } else {
                    console.log('-- calibrate skip outdated --');
                }
                this.resetQuaternion = data.worldQuaternion;
            }

            var delta = Math.max(Math.min((Date.now() - this.lastTime) / 100, 3.0), 0.25);
            this.lastTime = Date.now();

            this.worldAcceleration.x = data.worldAcceleration.x;
            this.worldAcceleration.y = data.worldAcceleration.y;
            this.worldAcceleration.z = data.worldAcceleration.z;

            this.rawQuaternion.x = data.worldQuaternion.x;
            this.rawQuaternion.y = data.worldQuaternion.y;
            this.rawQuaternion.z = data.worldQuaternion.z;
            this.rawQuaternion.w = data.worldQuaternion.w;

            var quaternion = new THREE.Quaternion(this.referenceQuaternion.x, this.referenceQuaternion.y, this.referenceQuaternion.z, this.referenceQuaternion.w);
            quaternion = quaternion.multiply(this.rawQuaternion);

            this.worldQuaternion.x = quaternion.x;
            this.worldQuaternion.y = quaternion.y;
            this.worldQuaternion.z = quaternion.z;
            this.worldQuaternion.w = quaternion.w;

            //get motion speed
            var direction = new THREE.Vector3(0, 0, 1).applyQuaternion(this.rawQuaternion).z;
            this.rawMotionSpeed = Math.abs(this.lastDirection - direction);
            this.smoothMotionSpeed = Math.abs(this.lastDirection - direction) * (0.25 * delta) + this.smoothMotionSpeed * (1.0 - 0.25 * delta);
            this.lastDirection = direction;

            return event;

        },

        onDeviceInactive: function () {

            console.log('>> Device inactive, losing orientation reset info <<');
            this.timesReset = 0;

        },

        onTouch: function (event, state, time) {

            switch (state) {
                case 'start':
                    this.lastTouchStartTime = time;
                    break;

                case 'move':
                    this.lastTouchMoveTime = time;
                    break;

                case 'end':
                    this.lastTouchEndTime = time;
                    break;

            }

        },

        onFrame: function () {

            var currentTime = clocksync.time();

            this.touchStartTime = ((this.lastTouchStartTime - currentTime) * 0.001).toFixed(2);
            this.touchMoveTime = ((this.lastTouchMoveTime - currentTime) * 0.001).toFixed(2);
            this.touchEndTime = ((this.lastTouchEndTime - currentTime) * 0.001).toFixed(2);

            if (TimelineController.getInstance().currentTime < ExperienceView.BREAK_FREE_START_TIME && ((this.lastTouchStartTime === 0 && this.lastTouchMoveTime === 0) || Math.max(this.lastTouchStartTime, this.lastTouchMoveTime, this.lastTouchEndTime) === this.lastTouchEndTime)) {
                if (!this.touchUp) {
                    this.touchUp = true;
                    clearTimeout(this.touchUpTimeoutId);
                    this.touchUpTimeoutId = setTimeout(function () {
                        $('html').addClass('touch-up');
                    }, 1000);
                }
            } else {
                if (this.touchUp) {
                    clearTimeout(this.touchUpTimeoutId);
                    this.touchUp = false
                    $('html').removeClass('touch-up');
                }
            }

        }

    }

});
