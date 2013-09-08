/**
 *
 *
 * @author Édouard Lanctôt < edouardlb@gmail.com >
 * Simple timeline loader
 *
 *
*/

(function(document,window) {


	//
	// 
	//
	function Timeline() {
		
		if (window.PerformanceDebugProfiler) window.PerformanceDebugProfiler.getInstance().init();

		/**
		 *
		 * State and variables 
		 *
		 *
		*/
		this.sequenceName = null;
		this.timelineInfo = null;
		this.timelineSequences = {};
		this.assetsInfo = null;
		this.stats = null;
		this.gui = null;
		this.guiOptions = {};
		this.guiRange = {};
		this.transitions = [];
		this.guiConnectionCode = '';
		this.connection = '';
		this.generalFolder = null;
		this.positView = null;

		//media elements
		this.audio = null;
		this.video = null;
		this.videoList = [];
		this.currentVideo = 0;
		this.audioStart = 0;
		this.audioEnd = -1;
		this.videoStart = 0;
		this.videoEnd = -1;
		this.videoTexture = null;
		this.renderer = null;
		this.codeReady = false;

		//quality and video reloading
		this.currentPart = 'all';
		this.allParts = null,
		this.currentVideoQuality = '1280'; // (/192.168.0.10/gi.test(window.location)) ? '640' : '1280';
		this.currentRenderQuality = '1280';
		this.nextVideo = null;

		//phone state
		this.phoneConnected = false;
		this.trackingReady = false;

		//loading
		this.videoReady = false;
		this.audioReady = false;
		this.assetsReady = false;
		this.started = false;

		//the rendering
		this.currentRendererNoise = 'none';
		this.rendererNoiseList = [
			'none',
			'noise_batch1_couleur',
			'noise_batch2_nb',
			'noise_batch3_couleur',
			'noise_batch4_couleur',
			'noise_batch5_couleur_toy_cam',
			'noise_batch6_couleur',
			'noise_batch7_couleur',

			'noise_ps_gray_0',
			'noise_ps_gray_1',
			'noise_ps_gray_2',
			'noise_ps_gray_3',
			'glitch_0',
			'glitch_1'

		];
		this.currentRendererBlending = 0;
		this.rendererBlending = [
			'none',
			'overlay',
			'screen',
			'multiply',
			'add',
			'sub',
			'divide',
			'exp',
			'MultiplyAdd',
			'AddSub'
		];
		this.textureMaterial = null;
		this.textureNoise = [null,null,null];
		this.textureGui = null;

		this.renderingQualities = TimelineController.RENDERING_QUALITIES.join(',').split(','); //convert to string for dat.gui
		this.QUALITY_TRACKING_RATES = TimelineController.QUALITY_TRACKING_RATES;
		this.QUALITY_FPS_THRESHOLDS = TimelineController.QUALITY_FPS_THRESHOLDS;

		/**
		 *
		 * Load up the assets and timeline json info files
		 *
		*/
		this.start = function(sequenceName) {
			var self = this;
			self.sequenceName = sequenceName;

			//load the files
			$.ajax({
			  dataType: "json",
			  url: 'timeline.json',
			  error:function(e) {
			  	alert('Parse error for timeline.json');
			  	JSON.parse(e.responseText);
			  },
			  success: function(timelineData) {
			  	self.timelineInfo = timelineData;


			  	$.ajax({
				  dataType: "json",
				  url: 'timelineMouseDiff.json',
				  success: function(timelineMergeData) {
				  	window.TimelineMerge(self.timelineInfo.timeline,timelineMergeData.timeline);


				  	$.ajax({
					  dataType: "json",
					  url: 'resources.json',
					  success: function(assetsData) {
					  	self.assetsInfo = assetsData;
					  	self.setupTimeline();
					  },
					  error: function(e) {
					  	alert('Parse error for resources.json');
				  		JSON.parse(e.responseText);
					  }
					});

				  },
				  error: function(e) {
				  	alert('Parse error for timelineMouseDiff.json');
			  		JSON.parse(e.responseText);
				  }
				});
			  }
			});

		}


		/**
		 *
		 * Setup
		 * Create sequence
		 * Begin loading
		 * Begin camera, tracking and server connection
		 * Setup dat.gui
		 *
		 *
		*/
		this.setupTimeline = function() {
			console.log(this.sequenceName);


			//get sequences info
			for (var i=0; i<this.timelineInfo.timeline.length; i++) {
				this.timelineSequences[this.timelineInfo.timeline[i].id] = this.timelineInfo.timeline[i];
			}

			//basic sequence-found-check
			if (!this.sequenceName || !window[this.timelineSequences[this.sequenceName].class]) {
				console.error('Sequence Not Found: '+this.sequenceName);
				//return;
			}
			document.title = this.sequenceName;


			

			//start camera
			CameraController.getInstance().events.bind(CameraController.EVENT_VIDEO_READY, function () {
                InputController.getInstance().setMode(InputController.INPUT_TYPE_TRACKING);
            });
		
			CameraController.getInstance().init();
            

			//start tracking
			this.setupWebsocketConnection();
			TrackingController.getInstance().init();
            TrackingController.getInstance().start();
            OrientationController.getInstance().start();

			//start server connection
			//this.connectToServer();

			

			//stats objects and add to dom
			this.stats = new Stats();
			this.stats.domElement.style.position = 'absolute';
			this.stats.domElement.style.top = '20px';
			this.stats.domElement.style.left = '20px';
			$('body').append(this.stats.domElement);

			//create the gui and add it
			this.gui = new dat.GUI();

			//begin preloading the sequence task
			this.preloadSequence();
		}


		/**
		 *
		 * Websocket Connection
		 *
		 *
		*/
		this.setupWebsocketConnection = function() {
			var self = this;

			DetectionController.getInstance().detectPlatform();

			RemoteController.getInstance().events.bind(RemoteController.EVENT_PEER_READY, function (event, data) {
                console.log('Peer ready: ',data);
                RemoteController.getInstance().start();
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_MESH_FULL, function (event, data) {
                console.log('Mesh Full',data);
                RemoteController.getInstance().start();
            });


            RemoteController.getInstance().events.bind(RemoteController.EVENT_PEER_ENTER, function (event, data) {
                //self.onPeerEnter(data);
                console.log('Peer enter: ',data);
                self.phoneConnected = true;
                RemoteController.getInstance().start();
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_PEER_LEAVE, function (event, data) {
                //self.onPeerEnter(data);
                self.phoneConnected = false;
                console.log('Restarting: ',data);
                RemoteController.getInstance().host();
            });


            RemoteController.getInstance().events.on(RemoteController.EVENT_CONNECTION_CODE_READY,function(e, data) {
				var mesh = RemoteController.getInstance().mesh;
				self.connection = mesh.options.name;
				console.log('CODE READY',mesh.options.name);
			});

            //var connectionCode = window.location.pathname.match(/c\/(.+)/)[1];
            RemoteController.getInstance().start();
            RemoteController.getInstance().host();

		}


		/**
		 *
		 *
		 * Preloading:
		 * Common assets,
		 * Sequence assets, 
		 * Video
		 * Audio 
		 *
		*/
		this.preloadSequence = function() {
			console.log('preloadSequence');
			var self = this;

			//
			// load the audio
			//
			this.audio = document.createElement('Audio');
			this.audio.preload = 'auto';
			//this.audio.autoplay = 'false';
			this.audioReady = false;
			this.audio.addEventListener('canplaythrough',function(e) {
				console.log('Audio Ready');
				self.audioReady = true;
				self.sequenceLoadProgress(e);
			},false);
			this.audio.addEventListener('error',function(e) {
				self.audioReady = false;
				self.sequenceLoadError(e);
			},false);
			this.audio.src = Resource.get('/media/audio/audio2_sd.mp3'); // 'audio/audio_sd.mp3'; //Resource.get('/media/audio/audio_sd.mp3');
			this.audio.volume = 0.1;
			console.log('loading audio');


			//
			// load the video
			//
			var resourceList = this.assetsInfo[this.sequenceName];
			for (var url in resourceList) {
				if (resourceList[url].type === 'video') {
					this.videoStart = parseFloat(resourceList[url].loopStart);
					this.videoEnd = parseFloat(resourceList[url].loopEnd);

					this.video = document.createElement('video');
					this.video.preload = 'auto';
					this.video.autoplay = 'false';
					this.video.setAttribute('crossOrigin','anonymous');
					this.videoReady = false;
					this.video.addEventListener('canplaythrough',function(e) {
						console.log('Video Ready');
						self.videoReady = true;
						self.sequenceLoadProgress(e);
					},false);
					this.video.addEventListener('error',function(e) {
						self.videoReady = false;
						e = 'Video Error : '+e.target.src;
						self.sequenceLoadError(e);
					},false);
					
					this.video.addEventListener('timeupdate',function(e) {
						//self.stats.update();
					},false);

					//this.video.loop = false;
					//his.video.setAttribute('loop',false);

					var videoUrl = url.replace(/\{size\}+/g,this.currentVideoQuality).replace(/\{extension\}+/g,'webm');
					this.video.sourceUrl = url;
					this.video.src = Resource.get(videoUrl);
					this.videoList.push(this.video);
				}
			}
			if (!this.video) this.videoReady = true;

			if (this.videoList.length>1) {
				console.log(this.videoList);
				this.video = this.videoList[0];
				for (var i=1; i<this.videoList.length; i++) {
					//this.videoList[i].pause();
				}

				for (var i=0; i<this.videoList.length; i++) {
					(function(self,vid) {
						console.log('adding event',vid);
						vid.addEventListener('ended',function(e) {
							self.videoListNext();
						},false);
						
					})(this,this.videoList[i]);
				}
			}
			
			//
			// load the shaders and images
			//
			var task = new ExperiencePreloadTask(this.assetsInfo,['common','renderer',this.sequenceName],false);
            task.events.on(Task.EVENT_PROGRESS, function (e, data) { });
            task.events.on(Task.EVENT_DONE, function () {
            	console.log('Assets Ready');
            	self.assetsReady = true;
            	self.sequenceLoadProgress();
            });
            task.execute();
		}

		this.sequenceLoadProgress = function(e) {
			if (this.audioReady && this.videoReady && this.assetsReady) this.sequenceLoadComplete();
		}

		this.sequenceLoadError = function(e) {
			console.error(e);
		}



		/**
		 *
		 * Sequence setup
		 *
		*/
		this.sequenceLoadComplete = function(e) {
			if (this.started) return;
			this.started = true;
			console.log('Load Complete!');
			var self = this;

			//create renderer and add to dom
			RendererController.getInstance().init();
			RendererController.getInstance().add($('#sequencesMain'));


			//add the gui options
			var timelineSequences = this.timelineSequences;
			if (timelineSequences[this.sequenceName].settings) {
				for (var valuev in timelineSequences[this.sequenceName].settings) {
					this.guiOptions[valuev] = timelineSequences[this.sequenceName].settings[valuev];
				}
			}
			if (timelineSequences[this.sequenceName].settingsRange) {
				for (var rangev in timelineSequences[this.sequenceName].settingsRange) {
					this.guiRange[rangev] = timelineSequences[this.sequenceName].settingsRange[rangev];
				}
			}
			this.transitions = this.timelineSequences[this.sequenceName].transitions;
			

			//add to gui
			for (var option in this.guiOptions) {
				if (this.guiRange[option] !== null) {
					if (this.guiRange[option]!==undefined && this.guiRange[option].min!==undefined && this.guiRange[option].max!==undefined) this.gui.add(this.guiOptions, option, this.guiRange[option].min,this.guiRange[option].max).listen();
					else if (this.guiRange[option]!==undefined) this.gui.add(this.guiOptions, option, this.guiRange[option]).listen();
					else this.gui.add(this.guiOptions, option).listen();
				}
			}
			$(this.gui.domElement).toggleClass('main');


			//gui general options
			this.generalFolder = this.gui.addFolder('general');
			this.generalFolder.open();

			if (this.timelineSequences[this.sequenceName].parts) {
				var parts = [];
				//for (var i=0; i<this.timelineSequences[this.sequenceName].parts.length; i++) {
				for (var p in this.timelineSequences[this.sequenceName].parts) {
					parts.push(p);
				}
				this.allParts = this.timelineSequences[this.sequenceName].parts;
				this.currentPart = this.guiOptions['part'] = 'all'; //this.allParts['zombiesFlarePart'] ? 'zombiesFlarePart' : 'all';
				this.generalFolder.add(this.guiOptions,'part',parts).listen();
			}


			this.guiConnectionCode = this.generalFolder.add(this,'connection').listen();

			this.guiOptions['auto'] = true;
			this.generalFolder.add(this.guiOptions,'auto').listen();

			this.guiOptions['autoQuality'] = false;
			this.generalFolder.add(this.guiOptions,'autoQuality').listen();

			this.guiOptions['videoQuality'] = this.currentVideoQuality;
			this.generalFolder.add(this.guiOptions,'videoQuality',['480','640','960','1280', '1920']).listen();

			this.guiOptions['renderQuality'] = this.currentRenderQuality;
			this.generalFolder.add(this.guiOptions,'renderQuality',this.renderingQualities).listen();

			this.guiOptions['phone'] = 'tracking:false//socket: false';
			this.generalFolder.add(this.guiOptions,'phone').listen();

			this.guiOptions['showTracking'] = false;
			this.generalFolder.add(this.guiOptions,'showTracking').listen();

			this.guiOptions.resetOrientation = function() {
				OrientationController.getInstance().resetOrientation();
			};
			this.generalFolder.add(this.guiOptions,'resetOrientation');

			if (this.guiOptions['showTracking']) {
				this.showTracking();
			}

			this.guiOptions.currentFrame = 0;
			this.generalFolder.add(this.guiOptions,'currentFrame').listen();
			//TrackingController.getInstance().init();
			//TrackingController.getInstance().start();
			//this.positView.init();



			//gui renderer options
			var rendererFolder = this.gui.addFolder('renderer');
			rendererFolder.close();
			this.guiOptions.rendererNoise = this.currentRendererNoise;
			rendererFolder.add(this.guiOptions, 'rendererNoise', this.rendererNoiseList).listen();

			this.guiOptions.rendererBlending = this.rendererBlending[RendererController.getInstance().blendingMode];
			rendererFolder.add(this.guiOptions, 'rendererBlending', this.rendererBlending).listen();

			this.guiOptions.noiseAlpha = RendererController.getInstance().noiseAlpha;
			rendererFolder.add(this.guiOptions, 'noiseAlpha', 0.0,1.0).listen();

			this.guiOptions.nearExposure = RendererController.getInstance().nearExposure;
			rendererFolder.add(this.guiOptions, 'nearExposure', 0.0,2.0).listen();

			this.guiOptions.flickerNear = RendererController.getInstance().flickerNear;
			rendererFolder.add(this.guiOptions, 'flickerNear', 0.0,0.3).listen();

			this.guiOptions.flickerFar = RendererController.getInstance().flickerFar;
			rendererFolder.add(this.guiOptions, 'flickerFar', 0.0,0.3).listen();


			//this.guiOptions['auto'] = false;
			if (this.transitions && this.transitions.length>0) {
				this.guiOptions.transition = "none";
				this.generalFolder.add(this.guiOptions,'transition').listen();
			}

			//create and start the video / audio / texture
			this.audioStart = parseFloat(this.timelineSequences[this.sequenceName].start / 23.97);
			this.audioEnd = parseFloat(this.timelineSequences[this.sequenceName].end / 23.97);
			this.audio.play();
			this.audio.currentTime = this.audioStart;
			if (this.video) {
				for (var i=0; i<this.videoList.length; i++) {
					this.videoList[i].pause();
				}
				this.video.play();
				this.video.currentTime = this.videoStart;

				this.videoTexture = new VideoTexture(this.video,1280,672,Player.VIDEO_FRAMERATE);

				//loop
				this.video.addEventListener('ended', function(){
				    self.video.currentTime = self.videoStart;
				    self.audio.currentTime = self.audioStart;
				}, false);
			}
			


			//create the sequence
			var className = this.timelineSequences[this.sequenceName].class;
			if (!window[className]) console.error('Sequence '+className+' does not exist');
			this.sequence = new (window[className])(this.sequenceName, $(document.body), this.video, this.audio, this.videoTexture);

			this.sequence.active = true;
			this.sequence.init();
			this.sequence.changeVideoQuality(parseInt(this.currentVideoQuality,10),Math.floor(parseInt(this.currentVideoQuality,10)*1008/1920));
			this.sequence.changeRenderQuality(parseInt(this.currentRenderQuality,10),Math.floor(parseInt(this.currentRenderQuality,10)*1008/1920));
			this.sequence.begin();
			this.sequence.startTime = this.audioStart;
			this.sequence.endTime = this.audioEnd;
			this.audio.currentTime = this.audioStart;
			this.sequence.defaultOptions = this.cloneSettings(timelineSequences[this.sequenceName].settings);
            this.sequence.currentOptions = this.cloneSettings(timelineSequences[this.sequenceName].settings);
			window.audio = this.audio;


			//renderer material
			this.textureGui = AssetsController.getInstance().getFile('media/images/interface/sides.png');
			this.textureGui.format = THREE.RGBAFormat;
			this.textureGui.minFilter = THREE.LinearMipMapLinearFilter;
			this.textureGui.generateMipmaps = true;
			this.textureGui.needsUpdate = true;

			this.textureMaterial = new THREE.ShaderMaterial({
                vertexShader: AssetsController.getInstance().getFile('shaders/renderer/textureNoiseSides.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/renderer/textureNoiseSides.frag'),
                uniforms: {
                    'tDiffuse': {type: 't', value: null},
                    'tNoise': {type: 't', value: null},
                    'tFlare':{type:'t', value: this.textureGui},
                    'randomOffset': {type:'v2', value:new THREE.Vector2()},
                    'blending':{type: 'i', value: 0},
                    'noiseAlpha':{type: 'f', value: 0.0},
                    'sidesSize': {type: 'v2', value: new THREE.Vector2( 0.025 * 0.525, 0.025)},
                    'sideFlarePosition': {type:'v2', value: new THREE.Vector2(0.25,0.25)},
                    'sideFlareSize': {type:'f', value: 1.0}

                },
                attributes: {},
                side: THREE.DoubleSide
            });
            for (var i=0; i<3; i++)  {
            	this.textureNoise[i] = new THREE.Texture(
                	null,
	                new THREE.UVMapping(),
	                THREE.RepeatWrapping, THREE.RepeatWrapping,
	                THREE.NearestFilter,
	                THREE.NearestFilter,
	                THREE.RGBAFormat,
	                THREE.UnsignedByteType,
	                1);
            	this.textureNoise[i].generateMipmaps = false;
            	this.textureNoise[i].needsUpdate = true;

            	//reload
            	(function(img,tex) {
            		img.setAttribute('crossorigin','anonymous');
            		img.onload = function() {
            			tex.needsUpdate = true;
            	
            			tex.image = img;
            		}
            	})(new Image(),this.textureNoise[i]);
            }


            //
            // performance
            //
			PerformanceController.getInstance().initialize();
            PerformanceController.getInstance().startMonitoringPerformance(PerformanceController.THRESHOLD_UNLIMITED);
            PerformanceController.getInstance().detectHighLowFramerate(false);
            PerformanceController.getInstance().events.on(PerformanceController.EVENT_PERFORMANCE_LOW,function(e) {
            	if (!self.guiOptions.autoQuality) return;
            	console.log('Downgrade');

            	var cr = 0;
            	var qualities = self.renderingQualities;
            	for (var i=0; i<qualities.length; i++) {
            		if (self.guiOptions['renderQuality'] === qualities[i]) cr  = i;
            	}
            	if (cr > 0) {
            		cr -= 1;
            		self.guiOptions['renderQuality'] = qualities[cr];
            	}
            	//PerformanceController.getInstance().resetMonitoringPeformance();
            });
            PerformanceController.getInstance().events.on(PerformanceController.EVENT_PERFORMANCE_HIGH,function(e) {
            	if (!self.guiOptions.autoQuality) return;
            	console.log('Upgrade');

            	var cr = 0;
            	var qualities = self.renderingQualities;
            	for (var i=0; i<qualities.length; i++) {
            		if (self.guiOptions['renderQuality'] === qualities[i]) cr  = i;
            	}
            	if (cr < qualities.length-1) {
            		cr += 1;
            		self.guiOptions['renderQuality'] = qualities[cr];
            	}
            	//PerformanceController.getInstance().resetMonitoringPeformance();
            });


			//run
			(function() {
				self.updateFrame = function() {
					window.requestAnimationFrame(self.updateFrame);
					self.update();
				}
			})();
			self.updateFrame();
		}


		this.videoListNext = function() {
			this.video.pause();
			this.currentVideo++;
			this.video.currentTime = 0;
			if (this.currentVideo>=this.videoList.length) this.currentVideo = 0;
			this.video = this.videoList[this.currentVideo];
			this.videoTexture.videoElement = this.video;
			this.videoTexture.texture.image = this.video;
			this.video.currentTime = 0.0;
			this.video.play();
			console.log('Next Video : ',this.video);
		}



		/**
		 *
		 *
		 * Main Update loop
		 *
		 *
		*/
		this.update = function() {
			//this.updateFrame();

			//code
			var mesh = RemoteController.getInstance().mesh;
			if (!this.codeReady && mesh && mesh.id && mesh.id.length>=4) {
				this.codeReady = true;
				self.connection = mesh.id;
				if (window.LocalAutoConnectSocket !== undefined) {
	                LocalAutoConnectSocket.getInstance().connect();
	                LocalAutoConnectSocket.getInstance().publishURL(mesh.options.ws,mesh.options.name, window.location.hostname);
	            }
			}

			//gui state
			this.stats.update();
			this.guiOptions['phone'] = 'tracking:'+TrackingController.getInstance().isReady()+'//socket:'+this.phoneConnected;

			//show / hide tracking
			if (this.guiOptions.showTracking && (!this.positView || !this.positView.isShown)) this.showTracking();
			else if (!this.guiOptions.showTracking && this.positView && this.positView.isShown) this.hideTracking();


			//reload video
			if (this.currentVideoQuality !== this.guiOptions.videoQuality) {
				this.currentVideoQuality = this.guiOptions.videoQuality;
				this.videoTexture.resizeTexture(this.video,parseInt(this.currentVideoQuality,10),Math.floor(parseInt(this.currentVideoQuality,10)*1008/1920));
				this.sequence.changeVideoQuality(this.videoTexture.width,this.videoTexture.height);
				for (var i=0; i<this.videoList.length; i++) {
					this.videoList[i].src = Resource.get(this.videoList[i].sourceUrl.replace(/\{size\}+/g,this.currentVideoQuality).replace(/\{extension\}+/g,'webm'));
					if (i==this.currentVideo) this.videoList[i].play();
				}
			}

			//change quaity video
			if (this.currentRenderQuality !== this.guiOptions.renderQuality) {
				this.currentRenderQuality = this.guiOptions.renderQuality;
				this.sequence.changeRenderQuality(parseInt(this.currentRenderQuality,10),Math.floor(parseInt(this.currentRenderQuality,10)*1008/1920))
				//TrackingController.getInstance().tracking.VIDEO_UPDATE_RATE = ( 1000 / 24 ) +  Math.pow(1 - this.currentRenderQuality/1920,2) * 100;
				//console.log(TrackingController.getInstance().tracking.VIDEO_UPDATE_RATE);
				TrackingController.getInstance().setUpdateRate(this.QUALITY_TRACKING_RATES[this.currentRenderQuality.toString()]);
				var newThreshold = TimelineController.QUALITY_FPS_THRESHOLDS[this.currentRenderQuality.toString()];
	            PerformanceController.FRAMERATE_LOW_THRESHOLD = newThreshold.low;
	            PerformanceController.FRAMERATE_HIGH_THRESHOLD = newThreshold.high;
				console.log('Setting tracking rate : ',this.QUALITY_TRACKING_RATES[this.currentRenderQuality.toString()]);
			}

			//loop video
			//loop audio
			if (
				(this.audioEnd > 0 && this.audio.currentTime > this.audioEnd || (this.video && (this.video.ended || this.video.currentTime===0 && !this.video.seeking)))
				// || 
				//(this.videoEnd > 0 && this.video.currentTime > this.videoEnd)
			) {
				this.audio.currentTime = this.audioStart;
				this.audio.play();
				if (this.video && this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
					this.video.currentTime = 0;
					this.video.play();
				}
			}

			//force a frame
			// this.video.pause();
			// this.video.currentTime = (InputController.getInstance().getMouseRaw().y * 0.5 + 0.5) * this.video.duration;
			// this.video.playbackRate = 0.05;
			// this.guiOptions.zombieFlare = 0.0;

			//get current relative frame
			var currentFrame = 0;
			if (this.videoList.length > 1) {
				for (var i=0; i<this.currentVideo; i++) {
					currentFrame += Math.round( this.videoList[i].duration * Player.VIDEO_FRAMERATE); //
				}
			}
			if (this.videoTexture) {
				currentFrame += this.videoTexture.currentFrame;
			}
			this.guiOptions.currentFrame = currentFrame;
			

			//
			// Loop video part
			
			if (this.allParts && this.video && this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
				if (this.currentPart !== this.guiOptions["part"]) {
					this.currentPart = this.guiOptions["part"];
				}
				if (currentFrame < parseInt(this.allParts[this.currentPart].start) || currentFrame > parseInt(this.allParts[this.currentPart].end)) {
					this.video.currentTime = parseInt(this.allParts[this.currentPart].start) / Player.VIDEO_FRAMERATE;
				}
			}

			//update noise
			if (this.currentRendererNoise !== this.guiOptions.rendererNoise) {
				this.currentRendererNoise = this.guiOptions.rendererNoise;


				if (this.currentRendererNoise === 'none') {
					RendererController.getInstance().setDefaultMaterial();
				} else {
					for (var i=0; i<3; i++) {
						this.textureNoise[i].image.src = Resource.get('media/images/noise/'+this.currentRendererNoise+'/noise_couleur'+i+'.jpg');
					}
					RendererController.getInstance().setNoiseTextures(this.textureNoise);
					//RendererController.getInstance().setMaterial(this.textureMaterial, this.textureNoise);
				}
			}


			//update blending
			for (var i=0; i<this.rendererBlending.length; i++) {
				if (this.rendererBlending[i] === this.guiOptions.rendererBlending) this.currentRendererBlending = i;
			}
			RendererController.getInstance().setMaterialUniform('blending',this.currentRendererBlending);
			//RendererController.getInstance().setMaterialUniform('noiseAlpha',this.guiOptions.noiseAlpha);
			RendererController.getInstance().noiseAlpha = this.guiOptions.noiseAlpha;
			RendererController.getInstance().nearExposure = this.guiOptions.nearExposure;
			RendererController.getInstance().flickerNear = this.guiOptions.flickerNear;
			RendererController.getInstance().flickerFar = this.guiOptions.flickerFar;

			//setMaterialUniform('exposure',this.guiOptions.zExposure);

			//update settings & transitions
			if (this.guiOptions.auto && this.transitions && this.transitions.length>0) {
                var v,
                	i,
                	isActive,
                	activeProgress,
                	start,
                	end,
                	transition,

                	interaction = this.sequence;
                	currentTime = this.video.currentTime,
	                currentTimeAbsolute = currentTime,
	                currentTimeRelative = currentTimeAbsolute - interaction.startTime,
	                currentFrameAbsolute = currentFrame + Math.floor(interaction.startTime * Player.VIDEO_FRAMERATE),
	                currentFrameRelative = currentFrame;



                //transition
                for (i = 0; i < this.transitions.length; i++) {

                    transition = this.transitions[i];

                    //check if transition should be active
                    isActive = false;
                    activeProgress = 0.0;
                    switch (transition.time) {
	                    case 'absoluteTime':
	                        isActive = (currentTimeAbsolute >= transition.start && currentTimeAbsolute <= transition.end);
	                        activeProgress = (currentTimeAbsolute - transition.start) / (transition.end - transition.start);
	                        break;

	                    case 'relativeTime':
	                        isActive = (currentTimeRelative >= transition.start && currentTimeRelative <= transition.end);
	                        activeProgress = (currentTimeRelative - transition.start) / (transition.end - transition.start);
	                        break;

	                    case 'absoluteFrame':
	                        isActive = (currentFrameAbsolute >= transition.start && currentFrameAbsolute <= transition.end);
	                        activeProgress = (currentFrameAbsolute - transition.start) / (transition.end - transition.start);
	                        break;

	                    case 'relativeFrame':
	                        isActive = (currentFrameRelative >= transition.start && currentFrameRelative <= transition.end);
	                        activeProgress = (currentFrameRelative - transition.start) / (transition.end - transition.start);
	                        break;
                    }

                    if (isActive) {

                    	if (this.guiOptions.transition) this.guiOptions.transition = transition.name;

                    	switch (transition.type) {
                    		case 'cut':

                    			for (v in transition.values) {

		                        	if (transition.values[v] !== undefined) {

		                                this.guiOptions[v] = (transition.values[v] === 'default') ? interaction.defaultOptions[v] : transition.values[v];
		                                //if (!transition.active) console.log(transition.name, activeProgress, this.guiOptions[v]);
		                                transition.active = false;

		                            }
		                        }
                    			break;

                    		default:
                    			for (v in transition.valuesStart) {

		                        	if (transition.valuesStart[v] !== undefined) {

		                                start = (transition.valuesStart[v] === 'default') ? interaction.defaultOptions[v] : transition.valuesStart[v];
		                                end = (transition.valuesEnd[v] === 'default') ? interaction.defaultOptions[v] : transition.valuesEnd[v];

		                                this.guiOptions[v] = start + (end - start) * activeProgress;
		                                //console.log(transition.name, start, end, activeProgress, this.guiOptions[v]);
		                                transition.active = true;

		                            }
		                        }
                    			break;
                    	}

                    //reset inactive transitions values
                    } else if (transition.active) {
                        transition.active = false;
                        for (v in transition.valuesEnd) {
                            if (transition.valuesEnd[v] !== undefined && transition.valuesEnd[v]==='default') {
                                this.guiOptions[v] = interaction.defaultOptions[v];
                            }
                        }
                    }
                }

                //this.guiOptions.transition = currentFrameRelative.toString(); //transition.name
            }
			

			//update all
			var currentTime = this.audio.currentTime+this.audioStart;
			InputController.getInstance().update(TrackingController.getInstance().isReady(), TrackingController.getInstance().getFrameInfo(), OrientationController.getInstance().getFrameInfo());
            if (this.video) this.videoTexture.update();
        	this.sequence.onFrame(this.guiOptions, currentFrame, currentTime - this.sequence.startTime, (currentTime - this.sequence.startTime) / (this.sequence.endTime - this.sequence.startTime), TrackingController.getInstance().getFrameInfo(), OrientationController.getInstance().getFrameInfo(),true);
            if (this.video) this.videoTexture.endFrame();

            //turn it back
            if (OrientationController.getInstance().timesReset > 0 && (Math.abs(OrientationController.getInstance().worldQuaternion.x) > 110 / 180 || Math.abs(OrientationController.getInstance().worldQuaternion.y) > 110 / 180)) {

                RemoteController.getInstance().showTurnItBack();

            } else {
                RemoteController.getInstance().hideTurnItBack();

            }
		}




		//
		// Show / Hide Tracking debug
		//
		this.showTracking = function() {
			if (!this.positView) {
				this.positView = new PositView();
				TrackingController.getInstance().addDebugView(this.positView);
			}
			this.positView.show();
					$("body").append(this.positView.renderer.domElement);
		}

		this.hideTracking = function() {
			this.positView.hide();
			$(this.positView.renderer.domElement).remove();
		}



		//
		// Utilities
		//
		this.cloneSettings =  function (settings) {
		    var nv = {},
		        o;

		    for (o in settings) {

		        if (settings[o] !== undefined) {

		            nv[o] = settings[o];

		        }

		    }

		    nv.auto = true;
		    return nv;
		}


	}





	/*
	 *
	 * Start the sequence
	 *
	*/
	document.addEventListener('DOMContentLoaded', function () {
		var queryParameters = window.location.search.substr(1).split('&');
		var params = {};
		for (var i=0; i<queryParameters.length; i++) {
			var pair = queryParameters[i].split('=');
			params[pair[0]] = pair[1];
		}
        window.timeline = new Timeline();
        window.timeline.start(params['sequence'] || params['s']);
    });

})(document,window)