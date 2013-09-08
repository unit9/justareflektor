//-------------------
//
// Author: Édouard Lanctôt-Benoit
// Version: 1.2
// Last Update: October 5th 2012
// Description: A FBO Wrapper Class for Three.js
//
// OPTIONS Parameters:
//  Texture parameters (minFilter,magFilter,format)
//  Render Buffer Parameters  (depthBuffer,stencilBuffer)
//	usePerspectiveCamera -> create a perspective camera
//  camera -> user a specific camera
//  backgroundColor -> color for background
//  backgroundAlpha -> (0.0 or nothing for transparent)
//  renderPlane -> plane to render directly
//  renderMaterial -> material to render directly (usually for multi-render passes)
//  forceClear -> clear the this.renderer when rendering
//  premultiplyAlpha -> premultiply texture property
//  
//-------------------
(function (window,document) {
	function FramebufferWrapper(w,h,options) {

		options = options || {};
		this.width = w;
		this.height = h;


		//create the fbo
		this.renderer = options.renderer || window.renderer;
		this.forceClear = true; //options.forceClear || true;
		this.texture = new THREE.WebGLRenderTarget(w,h, {
			antialias:true,
			minFilter: options.minFilter !== undefined ? options.minFilter : THREE.LinearFilter,
			magFilter: options.magFilter !== undefined ? options.magFilter : THREE.LinearFilter,
			format: options.format !== undefined ? options.format : THREE.RGBAFormat,
			type: options.type !== undefined ? options.type : THREE.UnsignedByteType,
			depthBuffer: options.depthBuffer !== undefined ? options.depthBuffer : false,
			stencilBuffer: options.stencilBuffer !== undefined ? options.stencilBuffer : false
		});
		this.texture.flipY = false;
		//this.texture.premultiplyAlpha = options.premultiplyAlpha || false;
		if (options.generateMipmaps!==undefined) this.texture.generateMipmaps = options.generateMipmaps;


		//create the scene and other three.js stuff
		this.scene = options.scene || new THREE.Scene();
		this.defaultMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 1.0, depthTest: false, map:this.texture});
		this.defaultPlane = new THREE.Mesh(new THREE.PlaneGeometry(2,2,2,2),this.defaultMaterial);


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

		
		//render the FBO
		this.render = function() {
			this.renderer.setClearColor(this.backgroundColor ,this.backgroundAlpha);
			this.renderer.render( this.scene, this.camera, this.texture, this.forceClear );
			this.renderer.setClearColor(this.tempColor ,this.tempAlpha);
		};

		//Add Shader Material Once Loaded
		this.addMaterial = function(shaderMaterial) {
			this.renderMaterial = shaderMaterial;
			this.renderPlane = new THREE.Mesh(new THREE.PlaneGeometry(1,1,1,1),shaderMaterial);
			this.renderPlane.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );
			this.scene.add(this.renderPlane);
		};

		//update the render material
		this.setRenderMaterial = function(shaderMaterial) {
			this.renderMaterial = shaderMaterial;
			this.renderPlane.material = shaderMaterial;
		}

		//resize the fbo
		this.resize = function(nw,nh,resizeCamera) {
			this.width = nw;
			this.height = nh;
			this.texture.width = nw;
			this.texture.height = nh;

			if (this.camera && resizeCamera) {
				if (this.camera.constructor === THREE.PerspectiveCamera) {
					this.camera.aspect = nw/nh;
				}
			}
		}
	};

window.FramebufferWrapper = FramebufferWrapper;

})(window,document);