/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 7/8/13
 * Time: 5:07 PM
 */

var TextureUpdateController = Class._extend(Class.SINGLETON, {

    _public: {

        //
        //
        // Add / Remove videos to process
        //
        //
        addTexture: function (tex, framerate, renderer, callback) {

            if (!renderer) {
                throw new Error('Need to set renderer in TextureUpdateManager');
            }
            framerate = (framerate === undefined) ? 24 : framerate;
            framerate = 1000 / framerate;
            this.allTextures.push({
                texture: tex,
                framerate: framerate,
                updateDelay: (1000 / framerate),
                lastUpdate: 0,
                updateCallback: callback,
                renderer: renderer,
                desync: false
            });

        },

        removeTexture: function (texToRemove) {

            this.allTextures.forEach(function (tex, index) {
                if (tex.texture === texToRemove) {
                    this.allTextures.splice(index, 1);
                }
            });

        },


        //
        //
        // Update all textures at a 24fps rate
        // Uses the renderer.setTexture function directly rather than waiting for the next render
        //
        //
        updateTextures: function () {

            var nt,
                tex,
                updated = false,
                i;

            for (i = 0; i < this.allTextures.length; i++) {
                nt = this.allTextures[i];
                if (Date.now() - nt.lastUpdate >= nt.updateDelay && !nt.desync) {
                    nt.lastUpdate = true;
                    tex = nt.texture;
                    if (nt.updateCallback) {
                        nt.updateCallback.call();
                    }
                    if (typeof tex.preUpdateCallback === 'function') {
//                        tex.preUpdateCallback.call(tex);
                        tex.preUpdateCallback();
                    }
                    tex.needsUpdate = true;
                    nt.renderer.setTexture(tex, 0);
                    tex.wasUpdated = true;
                    tex.currentFrame = tex.image.currentTime / nt.framerate;
                    nt.texture.wasUpdated = true;
                    updated = true;
                }
                nt.desync = false;
            }

            //If multiple textures: try to desynchronize the texture updates
            //once in a while so as to use our extra framerate to the fullest
            //And alternate between tracking updates and video updates
            //If we go under 24fps this will never happen.
            if (!updated && this.allTextures.length > 1 && this.lastDesync <= 0) {
                this.lastDesync = 100;
                this.allTextures[(Math.floor(Math.random() * this.allTextures.length))].desync = true;
                console.log('Desyncing Textures');
            } else if (!updated) {
                this.lastDesync--;
            }
            return updated;

        },


        forceUpdateTexture: function () {
            return;
        }

    },

    _private: {

        allTextures: [],
        lastDesync: 0,
        lastTextureUpdate: 0

    }

});
