/**
 * @author Édouard Lanctôt < edouardlb@gmail.com >
 *
 */
var TexturePreloadTask = Task._extend(Class.ABSTRACT, {

    _static: {

    },

    _public: {

        result: null,

        construct: function (batch, url, dataType, weight) {

            Task.call(this, [], weight);
            this.url = url;

        },

        getResult: function(){
            return this.result
        }

    },

    _protected: {

        url: null,

        run: function () {

            var self = this;

            var image = new Image();
            image.setAttribute('crossOrigin','anonymous');

            image.onload = function () {

                // remove PerformanceController.getInstance().addBandwithData(self.url, window.performance.now() - self.startTime);
                var texture = new THREE.Texture(
                    image,
                    new THREE.UVMapping(),
                    THREE.ClampToEdgeWrapping,
                    THREE.ClampToEdgeWrapping,
                    THREE.LinearFilter,
                    THREE.LinearFilter,
                    THREE.RGBAFormat,
                    THREE.UnsignedByteType,
                    1
                );
                texture.generateMipmaps = false;
                texture.needsUpdate = true;

                self.result = texture;
                AssetsController.getInstance().addFile(self.url,self.result);
                self.onComplete();
            };
            image.onerror = function(e) {
                console.error(e.target.src,e); 
            };

            // remove this.startTime = window.performance.now();
            image.crossOrigin = 'anonymous';
            image.src = Resource.get(this.url);

        }

    },

    _private: {

        onComplete: function () {

            this.notifyDone();

        }

    }

});
