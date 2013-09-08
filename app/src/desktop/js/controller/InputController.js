/**
 *
 * @author Édouard Lanctôt  < edouardlb@gmail.com >
 * Provides a single interface the two different inputs ( mouse VS tracking )
 *
 */
var InputController = Class._extend(Class.SINGLETON, {

    _static: {

        INPUT_TYPE_MOUSE: 'InputController_INPUT_TYPE_MOUSE',
        INPUT_TYPE_TRACKING: 'InputController_INPUT_TYPE_TRACKING',

        TRACKING_X_POW: 0.9,
        TRACKING_Y_POW: 0.55,
        TRACKING_Y_SCALE: 1.3,


        Z_ROTATION_AXIS_VALUE: 1.0,


        GYRO_SMOOTHING: 0.3333,
        DIRECTION_SMOOTHING: 0.3333,
        POSITION_SMOOTHING_NEAR: 0.35,
        POSITION_SMOOTHING_FAR: 1.0,
        PERSISTENCE_SMOOTHING_UP: 0.9,
        PERSISTENCE_SMOOTHING_DOWN: 0.15,
        GYRO_MAX_PERCENTAGE: 0.75,
        GYRO_MIN_PERCENTAGE: 0.1,

    },

    _public: {

        mode: 'InputController_INPUT_TYPE_TRACKING',
        $container: null,

        //mouse handling, with press as Z axis
        mouse: new THREE.Vector3(0.0, 0.0, 0.5),
        mousePressed: false,
        mousePressTime: 0,
        lastMousePress: 0,
        
        lastDirectionTime: 0,
        lastUpdate: 0,
        lastDirection: new THREE.Vector2(0,0),
        currentDirection: new THREE.Vector3(0,0,0.5),
        smoothPosition: new THREE.Vector3(0,0),
        orientationVec: new THREE.Vector2(0,0),
        orientationMagnitude: 0.0,
        orientationMagnitudeDeltaRemaining: 0.0,
        smoothQuaternion: new THREE.Quaternion(),
        smoothDirection: new THREE.Vector3(0,0,0.5),
        currentDirectionX: new THREE.Vector3(1,0,0),
        lastQuaternion: new THREE.Quaternion(),
        lastSmoothQuaternion: new THREE.Quaternion(),
        lastQuaternionTime: 0,
        smoothPersistence: 0.0,

        lastTrackingTime: 0,
        lastPosition: new THREE.Vector2(0,0),
        currentPosition: new THREE.Vector3(0,0,0.5),
        positionVec: new THREE.Vector2(0,0),
        positionMagnitude: 0.0,

        finalPhonePosition: new THREE.Vector3(),
        currentRelativeDirectionSmooth: new THREE.Vector2(0,0),
        currentRelativePositionSmooth: new THREE.Vector2(0,0),




        //
        // default to mouse control
        //
        construct: function () {

            var self = this;
            this.mode = InputController.INPUT_TYPE_MOUSE;
            this.$container = $(window);

            //
            // Mouse handling
            //
            window.addEventListener('mousemove', function (e) {

                self.mouse.x = (e.pageX / self.$container.width()) * 2.0 - 1.0;
                self.mouse.y = (e.pageY / self.$container.height()) * 2.0 - 1.0;
                return e;

            }, false);

            // Chromebook touch handling
            window.addEventListener('touchmove', function (e) {
                if (e && e.touches && e.touches.length !== 0) {
                    self.mouse.x = (e.touches[0].pageX / self.$container.width()) * 2.0 - 1.0;
                    self.mouse.y = (e.touches[0].pageY / self.$container.height()) * 2.0 - 1.0;
                    e.preventDefault();
                    return false;
                }
            }, false);

            window.addEventListener('mousedown', function (e) {

                self.mouse.z = Math.max(self.mouse.z - 0.5, 0.0);
                self.lastMousePress = self.mousePressTime = Date.now();
                self.mousePressed = true;
                return e;

            }, false);


            window.addEventListener('mouseup', function (e) {

                self.mousePressed = false;
                return e;

            }, false);
        },

        setContainer: function (container) {
            this.$container = container;
        },

        setMode: function (mode) {

            this.mode = mode;
            if (mode === InputController.INPUT_TYPE_MOUSE) {
                $('html').removeClass('mode-webcam').addClass('mode-mouse');
                TrackingController.getInstance().stop();
                RemoteController.getInstance().dispose();
            } else {
                $('html').removeClass('mode-mouse').addClass('mode-webcam');
            }

        },

        isMouseVersion: function() {
            return this.mode === InputController.INPUT_TYPE_MOUSE;
        },


        //
        // Update tracking
        //
        update: function (trackingIsReady, position, orientation) {

            var delta = (Date.now() - this.lastUpdate) / (1000 / 30);
            delta = Math.min(Math.max(delta, 0.333), 2.0);
            this.lastUpdate = Date.now();

            //orientation = OrientationController.getInstance().getRawQuaternion();

            //update mouse Z
            if (this.mousePressed) {
                this.mouse.z = Math.max(this.mouse.z * (1.0 - 0.02*delta) - 0.025 * delta, 0.0);
            } else {
                this.mouse.z = Math.min(this.mouse.z * (1.0 + 0.05*delta) + 0.05 * delta, 1.0);
            }
            if (this.mode === InputController.INPUT_TYPE_MOUSE) return;

            //set mode
            // we set the mode manually now (depending if user clicks on mouse" mode" or if they sync with webcam", so let's not override it
//            if (trackingIsReady && this.mode === InputController.INPUT_TYPE_MOUSE) {
//                this.mode = InputController.INPUT_TYPE_TRACKING;
//            }


            //smooth quaternion
            if (!this.lastQuaternion.equals(orientation)) {
                this.lastQuaternion.copy(orientation);
                this.lastSmoothQuaternion.copy(this.smoothQuaternion);
                this.lastQuaternionTime = Date.now();
                this.smoothQuaternion.slerp(orientation,0.2*delta);
            }


            var persistence = TrackingController.getInstance().getPersistence();
            if (persistence < this.smoothPersistence) this.smoothPersistence += (persistence-this.smoothPersistence) * InputController.PERSISTENCE_SMOOTHING_DOWN;
            else this.smoothPersistence += (persistence-this.smoothPersistence) * InputController.PERSISTENCE_SMOOTHING_UP;
            //this.smoothPersistence = (1.0-persistenceDelta) * this.smoothPersistence + TrackingController.getInstance().getPersistence() * (persistenceDelta);
            if (isNaN(this.smoothPersistence)) this.smoothPersistence = 1.0;


            //update orientation smooth
            this.smoothQuaternion.slerp(orientation, delta*InputController.GYRO_SMOOTHING);
            this.currentDirection.set(0, 0, 1).applyQuaternion(this.smoothQuaternion);
            this.currentDirection.y *= -1;
            this.currentDirection.x *= -1;

            this.currentDirectionX.set(1,0,0).applyQuaternion(this.smoothQuaternion);

            //this.currentDirection.x += (1.0-Math.abs(this.currentDirectionX.x)) * ((this.currentDirectionX.x<0.0) ? -1 : 1) * InputController.Z_ROTATION_AXIS_VALUE;
            //this.currentDirection.y += (Math.abs(this.currentDirectionX.y)) * InputController.Z_ROTATION_AXIS_VALUE;
            //console.log((1.0-Math.abs(this.currentDirectionX.x)) * ((this.currentDirectionX.x<0.0) ? -1 : 1),(this.currentDirectionX.y));
            //this.currentDirection.y += this.currentDirectionX.y * InputController.Z_ROTATION_AXIS_VALUE;

            var xAngle = Math.atan2(this.currentDirectionX.y,this.currentDirectionX.x);
            var yAngle = xAngle + Math.PI/2;//Math.atan2(this.currentDirectionX.x,this.currentDirectionX.y);
            this.currentDirection.x += this.currentDirectionX.y * InputController.Z_ROTATION_AXIS_VALUE;
            //this.currentDirection.x += this.currentDirectionX.x;

            //this.currentDirection.x -= this.currentDirectionX.

            this.smoothDirection.lerp(this.currentDirection,delta * InputController.DIRECTION_SMOOTHING);

            //catch errors
            if (isNaN(this.currentDirection.x)) this.currentDirection.set(0,0,0);
            if (isNaN(this.smoothDirection.x)) this.smoothDirection.set(0,0,0);

            var orientationpc = Math.max( (200 - (Date.now() - this.lastDirectionTime)) / 200, 0.0) * 0.5;

            if (this.orientationMagnitude>0) {
                this.currentRelativeDirectionSmooth.sub(this.orientationVec.clone().normalize().multiplyScalar(this.orientationMagnitude*orientationpc));
                if (this.currentRelativeDirectionSmooth.x < -1.0) this.currentRelativeDirectionSmooth.x = -1.0;
                if (this.currentRelativeDirectionSmooth.x > 1.0) this.currentRelativeDirectionSmooth.x = 1.0;
                if (this.currentRelativeDirectionSmooth.y < -1.0) this.currentRelativeDirectionSmooth.y = -1.0;
                if (this.currentRelativeDirectionSmooth.y > 1.0) this.currentRelativeDirectionSmooth.y = 1.0;
            }


            //update tracking smooth
            var positionSmoothing = InputController.POSITION_SMOOTHING_NEAR + Math.pow(Math.min(position.z*2.0,1.0),0.4) * (InputController.POSITION_SMOOTHING_FAR - InputController.POSITION_SMOOTHING_NEAR);

            this.currentPosition.copy(position);
            this.currentPosition.x = this.pow(this.currentPosition.x, InputController.TRACKING_X_POW);
            this.currentPosition.y = this.pow(this.currentPosition.y, InputController.TRACKING_Y_POW) * InputController.TRACKING_Y_SCALE;
            this.currentPosition.z = this.cmap(position.z,0.2,0.8,0.0,1.0);
            if (isNaN(this.smoothPosition.x)) this.smoothPosition.set(0,0,0.5);
            if (isNaN(this.currentPosition.x)) this.currentPosition.set(0,0,0.5);


            this.smoothPosition.lerp(this.currentPosition,Math.min(positionSmoothing*2.0,1.0)); //Math.min(positionSmoothing,1.0)); //(1.0-3.0*InputController.POSITION_SMOOTHING) + InputController.POSITION_SMOOTHING*delta);



            //var trackingRotation = TrackingController.getInstance().getRotation().multiplyScalar(-1);
            //this.smoothDirection.lerp(trackingRotation,this.smoothPersistence*0.1);


            //
            // Update world acceleration crazy motion
            //
            this.crazyMotion = Math.min(this.crazyMotion * (0.7-delta*0.2) + Math.min(Math.max((OrientationController.getInstance().accelerationOverThresholdNumFrames-1)/4.0,0),1.0),1.0);

        },


        //
        // Return a smooth XYZ value for the current position, regardless of input type
        // This uses direction a lot more than position
        //
        getPositionDirectional: function () {
            if (this.mode === InputController.INPUT_TYPE_MOUSE) {
                return this.getMouseRaw();
            }

            if (this.smoothDirection.length() > 0.0) {

                this.finalPhonePosition.copy(this.smoothPosition).lerp(
                    this.smoothDirection.clone(),1.0 -  InputController.GYRO_MIN_PERCENTAGE - (InputController.GYRO_MAX_PERCENTAGE-InputController.GYRO_MIN_PERCENTAGE) *this.smoothPersistence); //.lerp(TrackingController.getInstance().getRotation().multiply(new THREE.Vector3(1,1,0)).multiplyScalar(-1),0.25)
                this.finalPhonePosition.z = this.smoothPosition.z;

            } else {
                this.finalPhonePosition.set(this.smoothPosition.x,this.smoothPosition.y,this.smoothPosition.z);
            }

            return this.finalPhonePosition;
        },

        getPositionRaw: function() {
            if (this.mode === InputController.INPUT_TYPE_MOUSE)
                return this.getMouseRaw();
            return this.currentPosition;
        },

        getPositionSmooth: function() {
            return this.smoothPosition.clone();
        },

        getDirectionSmooth: function() {
            return this.smoothDirection.clone();
        },

        getQuaternionSmooth: function() {
            return this.smoothQuaternion.clone();
        },

        getRotationX: function() {
            return new THREE.Vector3(1.0,0.0,0.0).applyQuaternion(InputController.getInstance().getQuaternionSmooth()).y;
        },

        getMouseRaw: function () {
            return this.mouse;
        },

        isUsingMouse: function() {
            return (this.mode === InputController.INPUT_TYPE_MOUSE);
        }
    },


    _private: {
        map: function (value, istart, istop, ostart, ostop) {
            return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
        },
        cmap: function (value, istart, istop, ostart, ostop) {
            return Math.max(Math.min(ostart + (ostop - ostart) * ((value - istart) / (istop - istart)), ostop),ostart);
        },
        pow: function(a,b) {

            return ( a < 0 ? -1 : 1 ) * Math.pow(Math.abs(a),b);
        }
    }
});
