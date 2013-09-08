(function(document,window) {


	//
	// 
	//
	function TrackingApp() {

		console.log('Tracking Version '+9);

		this.options = {"static":false};
		this.range = {};


		this.stats = new Stats();
		window.stats = this.stats;
		this.stats.domElement.style.position = 'absolute';
		this.stats.domElement.style.top = '10px';
		this.stats.domElement.style.left = '20px';
		$('body').append(this.stats.domElement);

		//create the gui and add it
		this.gui = new dat.GUI();

		this.start = function() {

			//start tracking with all parameters
			var tracking = window.tracking = new Tracking(); //Motion
			tracking.start({
				renderer: null, //use own renderer
				
				//debug mode
				useWebWorkers: false,
				workerPath: 'src/desktop/js/worker/',
				useAnimationFrame: true,
				debugView: new window.TrackingDebugView(), //Motion

				//use own video
				video: undefined,
				loadVideo: true, 

				//load own shaders
				shaders: undefined,
				loadExternalShaders: true,
				//shaderPath: '//arcade-fire.commondatastorage.googleapis.com/shaders/tracking/',
				shaderPath: 'shaders/tracking/',

				//dat.gui
				options: this.options,

				//callbacks
				resetOrientationCallback: null,
				onready: null,
				onluminosity: function(lum,size) {
					RemoteController.getInstance().setLuminosity(lum,size);
				},
				onerror: null
			});
	        this.options.code = '-----';
			this.range.edgesOffset = {min:0.0,max:3.0};
	        this.range.blurOffset = {min:0.0,max:3.0};
	        this.range.hardEdges = {min:0.0,max:20.0};
	        this.range.blurThreshold = {min:0.0,max:1.0};
	        this.range.minLuminosity = {min:0.0,max:1.0};
	        this.range.minChroma = {min:0.0,max:1.0};
	        this.range.hueRange = {min:0.0,max:1.0};
	        this.range.luminosityScore = {min:0.0,max:1.0};
	        //this.range.highLightScore = {min:0.0,max:1.0};

			//create dat.gui
			for (var uniform in this.options) {
				if (this.range[uniform]) this.gui.add(this.options,uniform,this.range[uniform].min,this.range[uniform].max).listen();
				else this.gui.add(this.options,uniform).listen();
			}

			//add renderer and gui
			$(this.gui.domElement).toggleClass('main');
			document.body.appendChild(tracking.renderer.domElement);


			//update stats
			var self = this;
			(function(stats) {
				function updateStats() {
					window.requestAnimationFrame(updateStats);
					stats.update();

				}
				updateStats();
			})(this.stats);

				this.setupWebsocketConnection();
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
                console.log(data);
                RemoteController.getInstance().start();
            });


            RemoteController.getInstance().events.bind(RemoteController.EVENT_PEER_ENTER, function (event, data) {
                //self.onPeerEnter(data);
                console.log('Peer enter: ',data);
                RemoteController.getInstance().start();
            });

            RemoteController.getInstance().events.bind(RemoteController.EVENT_PEER_LEAVE, function (event, data) {
                //self.onPeerEnter(data);
                console.log('Restarting: ',data);
                RemoteController.getInstance().host();
            });


            RemoteController.getInstance().events.on(RemoteController.EVENT_CONNECTION_CODE_READY,function(e, data) {
				var mesh = RemoteController.getInstance().mesh;
				self.connection = mesh.id;
					if (RemoteController.getInstance().mesh) self.options.code = RemoteController.getInstance().mesh.id;
			});

            //var connectionCode = window.location.pathname.match(/c\/(.+)/)[1];
            RemoteController.getInstance().host();

		}
	}



	/*
	 *
	 * Start the sequence
	 *
	*/
	document.addEventListener('DOMContentLoaded', function () {
        window.app = new TrackingApp();
        window.app.start();
    });

})(document,window)