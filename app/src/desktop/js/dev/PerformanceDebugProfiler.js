var PerformanceDebugProfiler = Class._extend(Class.SINGLETON, {

	_static: {

	},

    _public: {

    	profiles: {},

    	forceMouse: function() {

    		InputController.getInstance().setMode(InputController.INPUT_TYPE_MOUSE);
            RoutingController.getInstance().route('/experience-loading');

    	},

    	init: function() {

    		var self = this;

    		//
    		// Intercept the AssetsController.getFile function to add some profiling code
    		//
    		AssetsController.getInstance().getFile = function (name) {
	            if (!this.assetsByName[name]) {
	                throw new Error('Asset was not loaded: ' + name);
	            }
	            this.assetsByName[name].profile_id = name;
	            this.usedFiles[name] = true;
	            return this.assetsByName[name];
	        };



    		//
    		// Intercept the THREE.ShaderMaterial class to add some profiling code
    		//


    		//
    		// Intercept the FramebufferWrapper.render class to add some profiling code
    		//
    		FramebufferWrapper.prototype.render = function() {

    			var t = performance.now();
    			this.renderer.getContext().finish();
	            this.renderer.setClearColor(this.backgroundColor ,this.backgroundAlpha);
	            this.renderer.render( this.scene, this.camera, this.texture, this.forceClear );
	            this.renderer.setClearColor(this.tempColor ,this.tempAlpha);
	            this.renderer.getContext().finish();
	            t = performance.now()-t;

	            if (!this.profile_id) {
	            	if (this.renderPlane && this.renderPlane.material && this.renderPlane.material.fragmentShader && this.renderPlane.material.fragmentShader.profile_id) {
	            		this.profile_id = this.renderPlane.material.fragmentShader.profile_id;
    				} else {
						this.profile_id = Player.getInstance().getCurrentTime().toPrecision(2)+'___'+Math.floor(Math.random()*100);
					}
				}
				self.profiles[this.profile_id] = self.profiles[this.profile_id] || [];
				self.profiles[this.profile_id].push(t);

    		}
    	},


    	begin: function() {

    	},


    	end: function() {

    	},


    	getProfiles: function() {
    		console.log('------------------------------------');
    		console.log('----- GPU Performance Profiles -----');
    		console.log('------------------------------------');
    		for (var name in this.profiles) {
    			var totalTime = 0.0;
    			var count = 0;

    			for (var j=0; j<this.profiles[name].length; j++) {
    				totalTime += this.profiles[name][j];
    				count++;
    			}
    			totalTime /= count;

    			console.log(name +' took on average  -> '+totalTime+'ms <-  and ran '+count+' times.');
    		}
    		console.log('--------------------------------------');
    		console.log('--------------------------------------');
    		console.log('--------------------------------------');
    	}

    }
});