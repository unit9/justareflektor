(function (window,document,undefined) {
	var TextureUpdateManager = window.TextureUpdateManager || {

		allTextures:[],
		lastDesync:0,
		lastTextureUpdate:0,


		//
		//
		// Add / Remove videos to process
		//
		//
		addTexture: function(tex,framerate,renderer,callback) {
			if (!renderer) throw new Error('Need to set renderer in TextureUpdateManager');
			framerate = (framerate===undefined)? 24 : framerate;
			framerate = 1000/framerate;
			TextureUpdateManager.allTextures.push({
				texture:tex,
				framerate:framerate,
				updateDelay:(1000/framerate),
				lastUpdate:0,
				updateCallback:callback,
				renderer:renderer,
				desync:false
			});
		},

		removeTexture: function(texToRemove) {
			TextureUpdateManager.allTextures.forEach(function(tex,index) {
				if (tex.texture==texToRemove) {
					TextureUpdateManager.allTextures.splice(index,1);
				}
			});
		},


		//
		//
		// Update all textures at a 24fps rate
		// Uses the renderer.setTexture function directly rather than waiting for the next render
		//
		//
		updateTextures: function() {
			var nt,tex,updated=false;
			for (var i=0; i<TextureUpdateManager.allTextures.length; i++) {
				nt = TextureUpdateManager.allTextures[i];
				if (Date.now()-nt.lastUpdate >= nt.updateDelay && !nt.desync) {
					nt.lastUpdate = true;
					tex = nt.texture;
					if (nt.updateCallback) nt.updateCallback.call();
					if (tex.preUpdateCallback) tex.preUpdateCallback.call(tex);
					tex.needsUpdate = true;
					nt.renderer.setTexture(tex,0);
					tex.wasUpdated = true;
					nt.texture.wasUpdated = true;
					updated = true;
				}
				nt.desync = false;
			}

			//If multiple textures: try to desynchronize the texture updates
			//once in a while so as to use our extra framerate to the fullest
			//And alternate between tracking updates and video updates
			//If we go under 24fps this will never happen.
			if (!updated && TextureUpdateManager.allTextures.length>1 && TextureUpdateManager.lastDesync<=0) {
				TextureUpdateManager.lastDesync = 100;
				TextureUpdateManager.allTextures[(Math.floor(Math.random()*TextureUpdateManager.allTextures.length))].desync = true;
				console.log('Desyncing Textures');
			} else if (!updated) {
				TextureUpdateManager.lastDesync--;
			}
			return updated;
		},


		forceUpdateTexture: function(renderer) {
			
		}
	};

	window.TextureUpdateManager = TextureUpdateManager;
})(window,document);