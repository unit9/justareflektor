/**
 *
 * Background Tracking
 * 
 *
 *
 * @author Édouard Lanctôt
 * @Creation Date 
 *
 *
*/
window.candlelightcore = window.candlelightcore || {};
(function(window,document,undefined){

	var Tracking = window.candlelightcore.tracking = window.Tracking = this;

	//constants
	this.PATH_TO_TRACKING_WORKER = '/js/core/tracking/';
    this.SHADERS_PATH = '/js/shaders/';
    this.normalizedPosition = new THREE.Vector3(0,0,1);
    this.position = new THREE.Vector3(0,0,1);
    this.rotation = new THREE.Vector3(0,0,0);
    this.phoneLife = 0;
    this.phoneDeath = 0;
    this.DEBUG_MODE = false;
    this.USE_WEBWORKER_FOR_OPENCV = true; //!this.DEBUG_MODE,
    this.USE_ANIMATION_FRAMES =  true; //!this.DEBUG_MODE;
    this.options = null;

	var GLOBAL_VERSION_CACHE = Math.random(),
        TRACKING_SIZE = 256,
		PHONE_RANGE = new THREE.Vector3(256,256,1000),

		//loading the shaders
		videoIsReady = false,
		shadersToLoad = [
			'vertex.vert',
			'simpleExposure.frag',
			'frameDiff.frag',
			'hueLumaSaturationThreshold.frag',
			'SobelLarge.vert',
			'SobelLarge.frag',
			'SobelRemove.frag'
		],
		numShadersLoaded = 0,
		shadersTextByName = {},
		readyCallback,


		//rendering elements
		self = this,
		mainVideo,
		mainVideoCanvas,
		mainVideoTexture,
		videoUpdatedThisFrame = false,
		renderer,
		seperateRenderer = false,
		shaderMaterial = {},
		renderPasses = {},
		currentVideoFrame = 0,
		debuggerReady = false,
		frameDiffPong,

		//smoothing
		lastFrameTime = 0,
		projectionCamera = new THREE.PerspectiveCamera(45, 1.0, 1, 1000),
		projector =  new THREE.Projector(),

		//worker and blobs
		CVWorker,
		buff;



	//public variables
	this.READY = false;
	this.ENABLED = true;
	this.toString = function() {
		return "[Tracking]";
	}


	//---------
	//
	// Start tracking
	// Load shaders
	//
	//---------
	this.setup = function(_renderer,_readyCallback) {
		readyCallback = _readyCallback;

		//unique renderer
		renderer = _renderer;
		if (!renderer) {
			console.log(self.toString()+' Using Separate WebglRenderer for tracking.');
			seperateRenderer = true;
			renderer = new THREE.WebGLRenderer({antialias: false});
			renderer.setClearColorHex(0x000000, 0);
	        renderer.setSize(TRACKING_SIZE, TRACKING_SIZE);
	        renderer.autoClear = false;
    	}

    	//
		//start webcam
		//
		mainVideo = candlelightcore.camera.get(
		function(stream) { //video loaded
			mainVideo.addEventListener('loadeddata', function(e) {
				videoIsReady = true;
				self.loadProgress();
			}, true);
           	mainVideo.src = window.URL.createObjectURL(stream);
            mainVideo.play();
		},
		function(e) { //video error
			console.warn("No Video");
			self.ENABLED = false;
		});


		//
		//load all shaders
		//
		for (var i=0; i<shadersToLoad.length; i++) {
			(function(shaderPath) {
				shadersTextByName[shaderPath] = {value:null};

				var xhr = new XMLHttpRequest();
		        xhr.onreadystatechange = function() {
		            if ( xhr.readyState === 4 ) {
		                if ( xhr.status === 200 ) {
		                    loaded = true;
		                    numShadersLoaded++;
		                	shadersTextByName[shaderPath].value = xhr.responseText;
		                    self.loadProgress();
		                } else {
		                    console.error('XHR Loading Error: ',shaderPath,xhr);
		                }
		            }
		        }

		        xhr.responseType = 'text';
		        xhr.open("GET", self.SHADERS_PATH + shaderPath, true);
		        xhr.overrideMimeType("text/plain; charset=x-user-defined");
		        xhr.send(null);

			})(shadersToLoad[i]);
		}

	}



	//---------
	//
	// GetUserMedia done and ready
	// Shaders done and ready
	//
	//---------
	this.loadProgress = function() {
		if (videoIsReady && numShadersLoaded==shadersToLoad.length) startTracking();
	}


	//---------
	//
	// Setup tracking internally
	//
	//---------
	function startTracking() {
		console.log(self.toString()+' Starting Tracking');

		var cshader,
			offn = 1/TRACKING_SIZE;


		//
		//
		// Tracking Worker Setup
		//
		//
		CVWorker = (!self.USE_WEBWORKER_FOR_OPENCV)?window.TrackingWorker : new Worker(self.PATH_TO_TRACKING_WORKER+'TrackingWorker.js');
		CVWorker.postMessage = CVWorker.webkitPostMessage || CVWorker.postMessage;
		CVWorker.addEventListener('message',receiveTrackingDataFromOpenCV,false);

		//
		// MainVideo
		// Texture upload to the gpu is a major bottleneck so
		// We're using a small canvas to upload as less texture to the gpu as possible
		// This might be a bad optimisation cpu-wise in some browsers, we should test this a bit more.
		//
		mainVideo.play();
		mainVideoCanvas = document.createElement('canvas');
		mainVideoCanvas.width = TRACKING_SIZE;
		mainVideoCanvas.height = TRACKING_SIZE;
		mainVideoCanvas.c = mainVideoCanvas.getContext('2d');
		mainVideoCanvas.c.drawImage(mainVideo,0,0,TRACKING_SIZE,TRACKING_SIZE);

		//Texture
		mainVideoTexture = mainVideoTexture || new THREE.Texture(
			mainVideoCanvas,
			new THREE.UVMapping(),
			THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping,
			THREE.LinearMipmapLinearFilter,
			THREE.LinearFilter,
			THREE.RGBFormat,
			THREE.UnsignedByteType,
			1);
		mainVideoTexture.generateMipmaps = true;
		mainVideoTexture.needsUpdate = true;
		TextureUpdateManager.addTexture(mainVideoTexture,24,renderer,updateMainVideoMatrix);


		//
		// Exposure (make the whites be white and the blacks be black)
		//
		cshader = 'simpleExposure'
		shaderMaterial[cshader] = new THREE.ShaderMaterial( {
			vertexShader:   shadersTextByName['vertex.vert'].value,
			fragmentShader: shadersTextByName['simpleExposure.frag'].value,
			attributes:{},
			uniforms: {
				'texture':{type:'t',value:mainVideoTexture},
				'exposure':{type:'f',value:1.0},
				'offset':{type:'f',value:0.00},
			},
			//equation/parameters to allow for RGBA encoding
			depthTest:false,
			transparent:false,
			blending:THREE.CustomBlending,
			blendEquation:THREE.AddEquation,
			blendSrc:THREE.OneFactor,
			blendDst:THREE.ZeroFactor,
			side:THREE.DoubleSide
		});

		//create the FBO
		renderPasses['simpleExposure'] = new FramebufferWrapper(TRACKING_SIZE,TRACKING_SIZE,{
			minFilter:THREE.LinearMipmapLinearFilter,
			magFilter:THREE.LinearFilter,
			format:THREE.RGBAFormat,
			type:THREE.UnsignedByteType,
			renderMaterial:shaderMaterial[cshader],
			depthBuffer:false,
			stencilBuffer:false,
			premultiplyAlpha:false,
			generateMipmaps:true,
			renderer:renderer
		});



		//
		// Peform a large (5x5) sobel edge detection 
		//
		cshader = 'edges'
		shaderMaterial[cshader] = new THREE.ShaderMaterial( {
			vertexShader:   shadersTextByName['SobelLarge.vert'].value,
			fragmentShader: shadersTextByName['SobelLarge.frag'].value,
			attributes:{},
			uniforms: {
				'texture':{type:'t',value:renderPasses['simpleExposure'].texture},
				'offset':{type:'v2',value:new THREE.Vector2(0.75/TRACKING_SIZE,0.75/TRACKING_SIZE)},
				'hardEdgeThreshold':{type:'f',value:8.5}
			},
			//equation/parameters to allow for RGBA encoding
			depthTest:false,
			transparent:false,
			blending:THREE.CustomBlending,
			blendEquation:THREE.AddEquation,
			blendSrc:THREE.OneFactor,
			blendDst:THREE.ZeroFactor,
			side:THREE.DoubleSide
		});

		//create the FBO
		renderPasses[cshader] = new FramebufferWrapper(TRACKING_SIZE,TRACKING_SIZE,{
			minFilter:THREE.LinearFilter,
			magFilter:THREE.LinearFilter,
			format:THREE.RGBAFormat,
			type:THREE.UnsignedByteType,
			renderMaterial:shaderMaterial[cshader],
			depthBuffer:false,
			stencilBuffer:false,
			premultiplyAlpha:false,
			generateMipmaps:false,
			renderer:renderer
		});
		renderPasses[cshader].renderPlane.scale.y = -1;


		//
		// Peform a hue / saturation / luma threshold 
		//
		cshader = 'hueLuma'
		shaderMaterial[cshader] = new THREE.ShaderMaterial( {
			vertexShader:   shadersTextByName['vertex.vert'].value,
			fragmentShader: shadersTextByName['hueLumaSaturationThreshold.frag'].value,
			attributes:{},
			uniforms: {
				'texture':{type:'t',value:renderPasses['simpleExposure'].texture},
				'tEdges':{type:'t',value:renderPasses['edges'].texture},
				'targetHue':{type:'f',value:0.0},
				'hueRange':{type:'f',value:0.2},
				'minLuminosity':{type:'f',value:0.2},
				'minChroma':{type:'f',value:0.12}				
			},
			//equation/parameters to allow for RGBA encoding
			depthTest:false,
			transparent:false,
			blending:THREE.CustomBlending,
			blendEquation:THREE.AddEquation,
			blendSrc:THREE.OneFactor,
			blendDst:THREE.ZeroFactor,
			side:THREE.DoubleSide
		});

		//create the FBO
		renderPasses[cshader] = new FramebufferWrapper(TRACKING_SIZE,TRACKING_SIZE,{
			minFilter:THREE.LinearMipmapLinearFilter,
			magFilter:THREE.LinearFilter,
			format:THREE.RGBAFormat,
			type:THREE.UnsignedByteType,
			renderMaterial:shaderMaterial[cshader],
			depthBuffer:false,
			stencilBuffer:false,
			premultiplyAlpha:false,
			generateMipmaps:true,
			renderer:renderer
		});


		//
		// Peform a large (5x5) blur and threshold/group the pixels
		//
		renderPasses['lastFrame'] = new FramebufferWrapper(TRACKING_SIZE,TRACKING_SIZE,{
			minFilter:THREE.LinearFilter,
			magFilter:THREE.LinearFilter,
			format:THREE.RGBAFormat,
			type:THREE.UnsignedByteType,
			renderMaterial:new THREE.MeshBasicMaterial({map:renderPasses['hueLuma'].texture,side:THREE.DoubleSide}),
			depthBuffer:false,
			stencilBuffer:false,
			premultiplyAlpha:false,
			generateMipmaps:false,
			renderer:renderer
		});
		renderPasses['lastFrame'].renderPlane.scale.y = -1;

		cshader = 'frameDiff'
		shaderMaterial[cshader] = new THREE.ShaderMaterial( {
			vertexShader:   shadersTextByName['vertex.vert'].value,
			fragmentShader: shadersTextByName['frameDiff.frag'].value,
			attributes:{},
			uniforms: {
				'tCurrent':{type:'t',value:renderPasses['hueLuma'].texture},
				'tLast':{type:'t',value:renderPasses['lastFrame'].texture},
				'tAccum':{type:'t',value:null},
				'accumDelta':{type:'f',value:0.4},
				'minDiff':{type:'f',value:100/256}
			},
			//equation/parameters to allow for RGBA encoding
			depthTest:false,
			transparent:false,
			blending:THREE.CustomBlending,
			blendEquation:THREE.AddEquation,
			blendSrc:THREE.OneFactor,
			blendDst:THREE.ZeroFactor,
			side:THREE.DoubleSide
		});

		//create the FBO
		renderPasses[cshader] = new FramebufferWrapper(TRACKING_SIZE,TRACKING_SIZE,{
			minFilter:THREE.LinearFilter,
			magFilter:THREE.LinearFilter,
			format:THREE.RGBAFormat,
			type:THREE.UnsignedByteType,
			renderMaterial:shaderMaterial[cshader],
			depthBuffer:false,
			stencilBuffer:false,
			premultiplyAlpha:false,
			generateMipmaps:false,
			renderer:renderer
		});
		renderPasses['frameDiffPong'] = new FramebufferWrapper(TRACKING_SIZE,TRACKING_SIZE,{
			minFilter:THREE.LinearFilter,
			magFilter:THREE.LinearFilter,
			format:THREE.RGBAFormat,
			type:THREE.UnsignedByteType,
			renderMaterial:shaderMaterial[cshader],
			depthBuffer:false,
			stencilBuffer:false,
			premultiplyAlpha:false,
			generateMipmaps:false,
			renderer:renderer
		});
		frameDiffPong = false;
		//renderPasses[cshader].renderPlane.scale.y = -1;



		//
		// Peform a large (5x5) blur and threshold/group the pixels
		//
		cshader = 'edges2'
		shaderMaterial[cshader] = new THREE.ShaderMaterial( {
			vertexShader:   shadersTextByName['SobelLarge.vert'].value,
			fragmentShader: shadersTextByName['SobelRemove.frag'].value,
			attributes:{},
			uniforms: {
				'texture':{type:'t',value:renderPasses['hueLuma'].texture},
				'textureGreen':{type:'t',value:renderPasses['frameDiff'].texture},
				'offset':{type:'v2',value:new THREE.Vector2(0.5/TRACKING_SIZE,0.5/TRACKING_SIZE)},
				'threshold':{type:'f',value:0.75}
			},
			//equation/parameters to allow for RGBA encoding
			depthTest:false,
			transparent:false,
			blending:THREE.CustomBlending,
			blendEquation:THREE.AddEquation,
			blendSrc:THREE.OneFactor,
			blendDst:THREE.ZeroFactor,
			side:THREE.DoubleSide
		});

		//create the FBO
		renderPasses[cshader] = new FramebufferWrapper(TRACKING_SIZE,TRACKING_SIZE,{
			minFilter:THREE.LinearFilter,
			magFilter:THREE.LinearFilter,
			format:THREE.RGBAFormat,
			type:THREE.UnsignedByteType,
			renderMaterial:shaderMaterial[cshader],
			depthBuffer:false,
			stencilBuffer:false,
			premultiplyAlpha:false,
			generateMipmaps:false,
			renderer:renderer
		});
		renderPasses[cshader].renderPlane.scale.y = -1;



		//ready
		self.READY = true;
		if (self.DEBUG_MODE) self.setupDebugMode();
		if (readyCallback) readyCallback(self);
		if (self.USE_ANIMATION_FRAMES) self.renderTracking();
	}


	//
	//
	// Update the main video canvas and perform luminance analysis once in a while
	//
	//
	function updateMainVideoMatrix() {
		mainVideoCanvas.c.drawImage(mainVideo,0,0,TRACKING_SIZE,TRACKING_SIZE);

		currentVideoFrame++;
		if (currentVideoFrame%24==0) {

			var vData = mainVideoCanvas.c.getImageData(0,0,TRACKING_SIZE,TRACKING_SIZE),
			data = vData.data,
			dataSize = TRACKING_SIZE*TRACKING_SIZE*4,
			tempLum = 0,
			maxLum = 0,
			minLum = 765; //255*3

			currentPixels = data;

			for (var i=0; i<dataSize; i+=4) { //sampler 1/4 of the pixels
				tempLum = data[i] + data[i+1] + data[i+2];
				maxLum = Math.max(tempLum,maxLum);
				minLum = Math.min(tempLum,minLum);
			}
			minLum *= 1/765;
			maxLum *= 1/765;

			shaderMaterial['simpleExposure'].uniforms.offset.value = -minLum; //,'offset',-minLum );
			shaderMaterial['simpleExposure'].uniforms.exposure.value = 1.0/(maxLum - minLum); //updateUniform(shaderMaterial['shaders/simpleExposure.glsl'],'exposure',1.0/(maxLum - minLum));
			
		}

		mainVideoTexture.needsUpdate = true;
		videoUpdatedThisFrame = true;
	}


	//---------
	//
	// Setup Debugging 
	//
	//---------
	this.addDebugOptions = function(_options,range) {
		self.options = _options;

		self.options.edgesOffset = 0.5;
        self.options.blurOffset = 1.0;
        self.options.hardEdges = 10.0;
        self.options.blurThreshold = 0.2;
        self.options.minLuminosity = 0.15;
        self.options.minChroma = 0.15;
        self.options.hueRange = 0.5;

		range.edgesOffset = {min:0.0,max:3.0};
        range.blurOffset = {min:0.0,max:3.0};
        range.hardEdges = {min:0.0,max:20.0};
        range.blurThreshold = {min:0.0,max:1.0};
        range.minLuminosity = {min:0.0,max:1.0};
        range.minChroma = {min:0.0,max:1.0};
        range.hueRange = {min:0.0,max:1.0};
	};

	this.setupDebugMode = function() {
		if (!self.READY) return;
		window.trackingDebug.setup(renderer);
		window.trackingDebug.addTexture(mainVideoTexture,0,0);
		window.trackingDebug.addTexture(renderPasses['simpleExposure'].texture,1,0);
		window.trackingDebug.addTexture(renderPasses['edges'].texture,2,0);
		window.trackingDebug.addTexture(renderPasses['hueLuma'].texture,3,0);
		window.trackingDebug.addTexture(renderPasses['edges2'].texture,4,0);

		window.trackingDebug.addRenderTexture('pose',0,1);
		window.trackingDebug.addCanvasTexture('contours',1,1);
		window.trackingDebug.addTexture(renderPasses['frameDiff'].texture,2,1);
		
		//set dat.gui options
		if (self.DEBUG_MODE && self.options)  {
			self.options.minChroma = shaderMaterial['hueLuma'].uniforms.minChroma.value;
			self.options.minLuminosity = shaderMaterial['hueLuma'].uniforms.minLuminosity.value;
			self.options.hueRange = shaderMaterial['hueLuma'].uniforms.hueRange.value;
			self.options.hardEdges = shaderMaterial['edges'].uniforms.hardEdgeThreshold.value;
			self.options.blurThreshold = shaderMaterial['edges2'].uniforms.threshold.value;

			self.options.edgesOffset = shaderMaterial['edges'].uniforms.offset.value.x*TRACKING_SIZE;
			self.options.blurOffset = shaderMaterial['edges2'].uniforms.offset.value.x*TRACKING_SIZE;

		}
		debuggerReady = true;
	}


	//---------
	//
	// Show/Hide debug mode
	//
	//---------
	this.showDebugMode = function(domContainer) {
		self.DEBUG_MODE = true;
		if (!debuggerReady) {self.setupDebugMode(); debuggerReady = true;}
		console.log('adding');
		renderer.setSize(window.innerWidth,window.innerHeight);
		if (domContainer) domContainer.appendChild(renderer.domElement);
	}
	this.hideDebugMode = function(domContainer) {
		self.DEBUG_MODE = false;
		if (domContainer) domContainer.removeChild(renderer.domElement);
		console.log('removing');
		renderer.setSize(TRACKING_SIZE,TRACKING_SIZE);
	}


	//---------
	//
	// Render Tracking
	//
	//---------
	this.renderTracking = function() {
		if (!self.READY) return;
		if (self.USE_ANIMATION_FRAMES) window.requestAnimationFrame(self.renderTracking);
		window.TextureUpdateManager.updateTextures();

		if (videoUpdatedThisFrame) {
			//update dat.gui uniforms
			if (self.DEBUG_MODE && self.options)  {
				shaderMaterial['hueLuma'].uniforms.minChroma.value = self.options.minChroma;
				shaderMaterial['hueLuma'].uniforms.minLuminosity.value = self.options.minLuminosity;
				shaderMaterial['hueLuma'].uniforms.hueRange.value = self.options.hueRange;
				shaderMaterial['edges'].uniforms.hardEdgeThreshold.value = self.options.hardEdges;
				shaderMaterial['edges2'].uniforms.threshold.value = self.options.blurThreshold;

				shaderMaterial['edges'].uniforms.offset.value.set(self.options.edgesOffset/TRACKING_SIZE,self.options.edgesOffset/TRACKING_SIZE);
				shaderMaterial['edges2'].uniforms.offset.value.set(self.options.blurOffset/TRACKING_SIZE,self.options.blurOffset/TRACKING_SIZE);
			}

			//compute tracking shaders
			renderer.setClearColorHex(0x000000, 0);
			renderer.clear();
			renderPasses['simpleExposure'].render();
			renderPasses['edges'].render();
			renderPasses['hueLuma'].render();


			//ping pong framediff
			/*frameDiffPong = !frameDiffPong;
			if (frameDiffPong) {
				shaderMaterial['frameDiff'].uniforms.tAccum.value = renderPasses['frameDiff'].texture;
				renderPasses['frameDiffPong'].render();
				shaderMaterial['edges2'].uniforms.textureGreen.value = renderPasses['frameDiffPong'].texture;
			} else {
				shaderMaterial['frameDiff'].uniforms.tAccum.value = renderPasses['frameDiffPong'].texture;
				renderPasses['frameDiff'].render();
				shaderMaterial['edges2'].uniforms.textureGreen.value = renderPasses['frameDiff'].texture;
			}*/
			renderPasses['edges2'].render();

			

			//read pixels from gpu
			var bufferSize = TRACKING_SIZE*TRACKING_SIZE*4;
			if (!buff || !buff.byteLength) buff = new Uint8Array(bufferSize);
			var gl = renderer.getContext();
			gl.readPixels(0, 0, TRACKING_SIZE,TRACKING_SIZE, gl.RGBA, gl.UNSIGNED_BYTE, buff);

			
			CVWorker.postMessage(buff,[buff.buffer]);
			//renderPasses['lastFrame'].render();

		}

		if (self.DEBUG_MODE && debuggerReady) {
			window.trackingDebug.renderPhone('pose');
			window.trackingDebug.render();
		}
	}


	//---------
	//
	// Receive Tracking Data From Worker
	//
	//---------
	function receiveTrackingDataFromOpenCV(message) {
		var data = message.data;

		//smoothing
		var delta = (Date.now()-lastFrameTime) / (1000/24);
		delta = Math.min(Math.max(delta,0.5),1.5);
		lastFrameTime = Date.now();

		//analyse and smooth tracking data
		if (data.pose) {

			if (data.foundHole) {
				//set position and rotation directly (snap it)
				self.position.set(
					data.pose.bestTranslation[0],
					data.pose.bestTranslation[1],
					data.pose.bestTranslation[2]);

				//set rotation
				self.rotation.set(
					 -Math.asin(-data.pose.bestRotation[1][2]),
					 -Math.atan2(data.pose.bestRotation[0][2], data.pose.bestRotation[2][2]),
					 -Math.atan2(data.pose.bestRotation[1][0], data.pose.bestRotation[1][1]) - Math.PI/2
				);

			} else {
				//smooth position and rotation
				self.position.x += (data.pose.bestTranslation[0] - self.position.x) * (delta*0.5);
				self.position.y += (data.pose.bestTranslation[1] - self.position.y) * (delta*0.5);
				self.position.z += (data.pose.bestTranslation[2] - self.position.z) * (delta*0.35);

				//set rotation
				/*self.rotation.lerp(new THREE.Vector3(
					 -Math.asin(-data.pose.bestRotation[1][2]),
					 -Math.atan2(data.pose.bestRotation[0][2], data.pose.bestRotation[2][2]),
					 -Math.atan2(data.pose.bestRotation[1][0], data.pose.bestRotation[1][1]) - Math.PI/2),
				delta*0.4);*/
			}

		//if no good square was found, smooth out the estimated position a lot
		} else if (data.useEstimate && data.estimatedPose) {

			//smooth position and rotation
			self.position.x += (data.estimatedPose.bestTranslation[0] - self.position.x) * (delta*0.4);
			self.position.y += (data.estimatedPose.bestTranslation[1] - self.position.y) * (delta*0.4);
			self.position.z += (data.estimatedPose.bestTranslation[2] - self.position.z) * (delta*0.25);


		}

		self.normalizedPosition.copy(self.position);
		projector.projectVector(self.normalizedPosition,projectionCamera);
		self.normalizedPosition.x *= -1;
		self.normalizedPosition.y *= -1;
		self.normalizedPosition.z = Math.max(Math.min(Math.abs(self.position.z+150)/1000,1.0),0.0);

		//quick fix...
		if (isNaN(self.normalizedPosition.x) || isNaN(self.normalizedPosition.y)) self.normalizedPosition.set(0,0,0.5);

		//normalize and set life
		//self.normalizedPosition.copy(self.position).divide(PHONE_RANGE);
		self.phoneLife = data.life;
		self.phoneDeath = data.lastLife;

		//update debug display
		if (self.DEBUG_MODE && debuggerReady) {
			if (data.contours) window.trackingDebug.updateCanvasWithBlobs('contours',mainVideo,data.contours);
			if (data.candidates) window.trackingDebug.updateCanvasWithCandidates('contours',null,data.candidates);
			window.trackingDebug.updatePhoneSmooth('pose',self.position,self.rotation,data.foundHole,data.useEstimate);

			// console.log(data.motionX,data.motionY);
			//if (data.pose && data.valid) window.trackingDebug.updatePhoneTranslationRotation('pose',data.pose.bestTranslation,data.pose.bestRotation);
			if (data.useEstimate) window.trackingDebug.updateCanvasWithEstimate('contours',null,data.estimatedX,data.estimatedY);
			if (data.motionX && data.motionY) window.trackingDebug.updateCanvasWithMotion('contours',null,data.motionX,data.motionY);
			//if (data.estimatedPose)  window.trackingDebug.updatePhoneTranslationRotationEstimate('pose',data.estimatedPose.bestTranslation,data.estimatedPose.bestRotation);
		}
	}

})(window,document)