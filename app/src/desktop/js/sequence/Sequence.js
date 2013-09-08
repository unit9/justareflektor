/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 7/13/13
 * Time: 11:40 PM
 */

var Sequence = Class._extend(Class.ABSTRACT, {

    _public: {

        id: null,
        settings: null,
        startTime: 0,
        endTime: 60.0,
        defaultOptions: {},
        currentOptions: {},
        transitions: [],
        averageRenderTime: 0,  
        buff: new Uint8Array(4),
        isPaused: false,

        /**
         * Override is essential for inheritance reasons.
         * Rather do not specify own implementation, everything goes into init()
         * @param id
         * @param $container
         */
        construct: function (id, $container, video, audio, videoTexture) {

            var self = this;
            this.id = id;
            this.video = video;
            this.audio = audio;
            this.videoTexture = videoTexture;

            if (id) this.init();

            // Register scene in controller for corresponding sequence -

        },



        /**
         * One-time initialisation
         */
        init: function () {

            this.wasInitialised = true;

        },

        /**
         * Every time interaction begins.
         */
        begin: function () {
 
        },

        /**
         * Every time interaction ends.
         */
        end: function () {


        },

        /**
         * Called when experience gets paused.
         */
        pause: function () {
            this.isPaused = true;
        },

        /**
         * Called when experience resumes.
         */
        resume: function () {
            this.isPaused = false;
        },

        /**
         * Called when experience starts seeking.
         */
        seekStart: function () {

        },

        /**
         * Called when experience is seeked.
         * @param progress
         */
        seek: function (progress) {

        },

        /**
         * Each frame of interaction.
         * @param time
         * @param progress
         * @param position
         * @param orientation
         */
        onFrame: function (options, currentFrame, time, progress, position, orientation) {

            var dt, currentTime = performance.now();

            if (this.lastFrameTime !== -1) {

                dt = currentTime - this.lastFrameTime;
                this.delta = Math.max( Math.min(dt / (1000/60),3.0), 0.333);

                this.update(options, currentFrame, this.delta, time, progress, position, orientation);


                
                //var time = performance.now();
                this.render();

                // var gl = RendererController.getInstance().getRenderer().getContext();
                // gl.flush();
                // gl.finish();
                // this.averageRenderTime = this.averageRenderTime * 0.9 + 0.1 * (performance.now()-time);                
                // console.log(this.averageRenderTime);

            }

            this.lastFrameTime = currentTime;

        },


        /**
         *
         * Change the quality of the video
         *
        */
        changeVideoQuality: function(nw,nh) {},
        changeRenderQuality: function(nw,nh) {}

    },

    _protected: {

        //sequence basics
        id: null,
        audio: null,
        video: null,
        videoTexture: null,
        active: false,
        lastFrameTime: -1,
        delta:1.0,
        wasInitialised:false,
        renderWidth: 1280,
        renderHeight: 672,

        //json settings
        settingsTimeline: null,
        currentSettings: null,
        nextSettings: null,
        currentSettingsStart: -1,


        /**
         *
         * Renders three.js scene in this sequence's Render Target
         *
         */
        update: function (delta, currentFrame, time, progress, position, orientation) {


        },

        /**
         *
         * Renders three.js scene in this sequence's Render Target
         *
         */
        render: function () {


        }
    }

});
