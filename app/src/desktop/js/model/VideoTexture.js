/**
 *
 * @author Édouard Lanctôt < edouardlb@gmail.com >
 * 
 *
*/
var VideoTexture = Class._extend({

    _public: {

        paused: false,
        texture: null,
        videoElement: null,
        renderer: null,
        width: 1280,
        height: 672,
        lastUpdateTime: 0,
        wasUpdatedThisframe: false,
        currentFrame: 0,
        frameUpdateRate: (1000 / 30),
        lastCurrentTime: 0,
        lastSrc: '',

       /*
        *
        * The shared global video texture
        *
        */
        construct: function(videoElement, width, height, framerate) {
            this.videoElement = videoElement;

            var texture = new THREE.Texture(
                videoElement,
                new THREE.UVMapping(),
                THREE.ClampToEdgeWrapping,
                THREE.ClampToEdgeWrapping,
                THREE.LinearFilter,
                THREE.LinearFilter,
                THREE.RGBFormat,
                THREE.UnsignedByteType,
                1
            );
            texture.premultiplyAlpha = false;
            texture.generateMipmaps = false;

            
            texture.needsUpdate = false;
            this.currentFrame = 0;
            this.wasUpdatedThisframe = true;

            texture.width = this.width = width;
            texture.height = this.height = height;
            this.texture = texture;
            this.renderer = RendererController.getInstance().getRenderer();
            this.lastUpdateTime = performance.now();

            //framerate
            this.frameUpdateRate = 1000 / 28; //23.975; //(Player.VIDEO_FRAMERATE + 3); //(framerate || (Player.VIDEO_FRAMERATE + 1)); 
        },
        
        /**
         *
         * Update the video texture (framerate || Player.VIDEO_FRAMERATE) times per second
         *
        */
        update: function() {

            var ready = false;

            while (performance.now() - this.lastUpdateTime >= this.frameUpdateRate) {
                this.lastUpdateTime += this.frameUpdateRate;
                ready = true;
            }

            if (this.videoElement && ( this.lastSrc !== this.videoElement.src || Math.abs(this.videoElement.currentTime-this.lastCurrentTime) * Player.VIDEO_FRAMERATE * 1.25 >= 1 )) ready = true;
            

            //update
            if (ready && !this.paused && this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
                this.updateTexture();

            } else {
                this.texture.needsUpdate = false;
                this.wasUpdatedThisframe = false;
            }

            if (this.paused) {
                this.currentFrame = Math.floor( this.videoElement.currentTime * Player.VIDEO_FRAMERATE );
            }
        },

        updateTexture: function() {
            this.texture.needsUpdate = true;
            this.lastCurrentTime = this.videoElement.currentTime;
            this.renderer.setTexture(this.texture, 0);
            this.currentFrame = Math.floor( this.lastCurrentTime * Player.VIDEO_FRAMERATE );
            this.texture.needsUpdate = false;
            this.wasUpdatedThisframe = true;
            this.lastSrc = this.videoElement.src;
        },

        endFrame: function() {
            this.wasUpdatedThisframe = false;
        },


        pauseBrokenMirror: function() {
            this.paused = true;
        },

        resumeBrokenMirror: function() {
            this.paused = false;
            this.updateTexture();
            this.lastUpdateTime = performance.now();
        },


        /**
         *
         * Resize the texture to a higher or lower quality setting
         *
        */
        resize: function(nw,nh) {
            this.width = nw;
            this.height = nh;
        },

        resizeTexture: function(nv,nw,nh) {
            var t = this.texture;
            this.texture = t.clone();
            t.dispose();

            this.texture.image = nv;
            this.texture.width = nw;
            this.texture.height = nh;
            this.texture.needsUpdate = true;

            this.width = nw;
            this.height = nh;
        }
    }
});
