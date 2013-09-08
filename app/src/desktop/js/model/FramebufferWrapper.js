/**
 *
 * @author Édouard Lanctôt < edouardlb@gmail.com >
 *
 */
var FramebufferWrapper = Class._extend({

    _static: {
   
        //
        // Static utility for cloning and scaling a framebuffer while keeping its current texture state
        //
        cloneTextureScene: new THREE.Scene(),
        cloneTextureCamera:new THREE.OrthographicCamera(-1,1,1,-1,-1000,1000),
        cloneTexturePlane: new THREE.Mesh(
            new THREE.PlaneGeometry( 2, 2, 2, 2 ),
            new THREE.MeshBasicMaterial( {map:null,
                depthTest:false,
                transparent:true,
                blending:THREE.CustomBlending,
                blendEquation:THREE.AddEquation,
                blendSrc:THREE.OneFactor,
                blendDst:THREE.ZeroFactor,
                side:THREE.DoubleSide} )),
        cloneTexture: function(renderer,source,target) {
            FramebufferWrapper.cloneTexturePlane.material.map = source;
            if (!FramebufferWrapper.cloneTexturePlane.parent) FramebufferWrapper.cloneTextureScene.add(FramebufferWrapper.cloneTexturePlane);
            renderer.render( FramebufferWrapper.cloneTextureScene, FramebufferWrapper.cloneTextureCamera, target, true);
        }

    },

    _public: {

        construct: function (w, h, options) {

            this.width = w;
            this.height = h;
            this.renderer = options.renderer || window.renderer;
            this.forceClear = true; //options.forceClear || true;
            this.disposed = false;

            this.texture = options.texture || new THREE.WebGLRenderTarget(w,h);
            this.texture.antialias = true;
            this.texture.minFilter = options.minFilter !== undefined ? options.minFilter : THREE.LinearFilter;
            this.texture.magFilter = options.magFilter !== undefined ? options.magFilter : THREE.LinearFilter;
            this.texture.format = options.format !== undefined ? options.format : THREE.RGBAFormat;
            this.texture.type = options.type !== undefined ? options.type : THREE.UnsignedByteType;
            this.texture.depthBuffer = options.depthBuffer !== undefined ? options.depthBuffer : false
            this.texture.stencilBuffer = options.stencilBuffer !== undefined ? options.stencilBuffer : false;
            this.texture.generateMipmaps = options.generateMipmaps !== undefined ? options.generateMipmaps : false;
            this.texture.flipY = false;
            //this.texture.premultiplyAlpha = options.premultiplyAlpha || false;


            //create the scene and other three.js stuff
            this.scene = options.scene || new THREE.Scene();
            this.defaultMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 1.0, depthTest: false, map:this.texture});
            this.defaultPlane = new THREE.Mesh(new THREE.PlaneGeometry(2,2,1,1),this.defaultMaterial);


            //create the camera
            if (options.camera) this.camera = options.camera;
            else if (!options.usePerspectiveCamera || options.useOrthographicCamera) this.camera = new THREE.OrthographicCamera(-1,1,-1,1,-1000,1000);
            else  this.camera = new THREE.PerspectiveCamera(45,w/h,1,20000);
            if (!this.camera.parent) this.scene.add(this.camera);


            //add a plane / texture / material to this scene for rendering
            this.renderPlane = options.renderPlane;
            if (options.renderMaterial!==undefined) {
                this.renderPlane = new THREE.Mesh(new THREE.PlaneGeometry(2,2,2,2),options.renderMaterial);
                //this.renderPlane.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );
            }
            this.scene.add(this.renderPlane);


            //update the color
            this.tempColor = new THREE.Color(this.renderer.getClearColor().getHex());
            this.tempAlpha = this.renderer.getClearAlpha();
            var colorHex = options.backgroundColor !== undefined ? options.backgroundColor : this.renderer.getClearColor().getHex();
            this.backgroundColor = new THREE.Color(colorHex);
            this.backgroundAlpha = options.backgroundAlpha || 0.0;

        },


        render: function() {

            this.renderer.setClearColor(this.backgroundColor ,this.backgroundAlpha);
            this.renderer.render( this.scene, this.camera, this.texture, this.forceClear );
            this.renderer.setClearColor(this.tempColor ,this.tempAlpha);

        },

        //Add Shader Material Once Loaded
        addMaterial: function(shaderMaterial) {

            this.renderMaterial = shaderMaterial;
            this.renderPlane = new THREE.Mesh(new THREE.PlaneGeometry(1,1,1,1),shaderMaterial);
            this.renderPlane.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );
            this.scene.add(this.renderPlane);

        },

        //update the render material
        setRenderMaterial: function(shaderMaterial) {

            this.renderMaterial = shaderMaterial;
            this.renderPlane.material = shaderMaterial;

        },

        resize: function(nw,nh,resizeCamera) {

            this.width = nw;
            this.height = nh;
            this.texture.width = nw;
            this.texture.height = nh;

            if (this.camera && resizeCamera) {
                if (this.camera.constructor === THREE.PerspectiveCamera) {
                    this.camera.aspect = nw/nh;
                }
            }

        },

        resizeTexture: function(nw,nh) {

            this.width = nw;
            this.height = nh;

            this.texture.width = nw;
            this.texture.height = nh;


            //Clone texture with new width to force a full resize
            var t = this.texture;
            this.texture = t.clone();
            t.dispose();
            //this.allocated = false;
            //this.alloc();
        },


        resizeTextureAndCopy: function(nw,nh) {

            this.width = nw;
            this.height = nh;

            this.texture.width = nw;
            this.texture.height = nh;


            //Clone texture with new width to force a full resize
            var t = this.texture;
            this.texture = t.clone();
            if (!this.disposed) FramebufferWrapper.cloneTexture(this.renderer, t, this.texture);
            t.dispose();
            //this.allocated = false;
            //this.alloc();
        },


        alloc: function() {

            if (!this.disposed) return;
            console.log('Allocating!');
            // var t = this.texture;
            // this.texture = t.clone();
            // t.dispose();
            this.renderer.clearTarget(this.texture,true,this.texture.depthBuffer,this.texture.stencilBuffer);
            this.disposed = false;

        },

        dispose: function() {

            if (this.disposed) return;
            console.log('Disposing!');
            var t = this.texture;
            this.texture = t.clone();
            t.dispose();
            this.disposed = true;
            
        }

    }

});