(function(document,window) {
	
	
		//
		// Private performanceTest variables
		//
		var TEST_SIZE = 256,
			TEST_UPLOAD_WIDTH = 2048,
			TEST_UPLOAD_HEIGHT = 1075,
			NUM_REPEATS = 1,
			NUM_FRAMES = 200,
			NUM_SPLICE = 60,

			currentFrame = 0,
			useSeparateRenderer,
			texture,
			scene,
			camera,
			renderer,
			renderTarget,
			c,
			ranges = [
				{
					"size":"1920 (Very Fast)",
					"speed": 0.25
				},
				{
					"size":"1280 (Fast)",
					"speed": 0.35
				},
				{
					"size":"1080 (Decent)",
					"speed": 0.45
				},
				{
					"size":"840 (Slow)",
					"speed": 0.55
				},
				{
					"size":"640 (Very Slow)",
					"speed": 9999.0
				}],
			allTimes = [];


		var PerformanceTest = window.PerformanceTest = {

			//
			// Setup the performance test
			//
			create : function(_renderer) {
				//the three.js scene and renderer 
				scene = new THREE.Scene();
				camera = new THREE.OrthographicCamera(-0.5,0.5,-0.5,0.5,-100,100);
				useSeparateRenderer = !_renderer;
				if (useSeparateRenderer) {
					renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
					renderer.setClearColor(0x000000, 1);
					renderer.setSize(TEST_SIZE, TEST_SIZE);
				} else {
					renderer = _renderer;
				}

				//the canvas to fill the texture
				var canvas = document.createElement('canvas');
				canvas.width = TEST_UPLOAD_WIDTH;
				canvas.height = TEST_UPLOAD_HEIGHT;
				c = canvas.getContext('2d');
				c.fillStyle = 'black';
				c.fillRect(0,0,TEST_UPLOAD_WIDTH,TEST_UPLOAD_HEIGHT);

				//the three.js texture
				texture = new THREE.Texture(canvas,
					new THREE.UVMapping(),
					THREE.ClampToEdgeWrapping,
					THREE.ClampToEdgeWrapping,
					THREE.NearestFilter, THREE.NearestFilter,
					THREE.RGBAFormat, THREE.UnsignedByteType, 1);
				texture.needsUpdate = true;
				texture.generateMipmaps = false;
				texture.premultiplyAlpha = false;

				//the three.js render target
				renderTarget = new THREE.WebGLRenderTarget(TEST_UPLOAD_WIDTH,TEST_UPLOAD_HEIGHT, {
					antialias:true,
					minFilter: THREE.LinearFilter,
					magFilter: THREE.LinearFilter,
					format: THREE.RGBAFormat,
					type: THREE.UnsignedByteType,
					depthBuffer: false,
					stencilBuffer: false
				});

				//the plane and rendering shader
				var p = new THREE.Mesh(
					new THREE.PlaneGeometry(1,1,1,1),
					new THREE.ShaderMaterial({
						vertexShader: [
							"varying mediump vec2 vUv;",
							"void main() {",
							"	vUv = vec2(uv.x,uv.y);",
							"	gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );",
							"}"
						].join('\n'),
						fragmentShader: [
							"varying mediump vec2 vUv;",
							"uniform sampler2D tDiffuse;",
							"void main() {",
							"vec4 col = texture2D(tDiffuse,vUv);",
							"if (dot(col,vec4(0.75))>0.8) { col= vec4(0.75); }", //test conditions and dotvector
							"gl_FragColor = sqrt(abs(sin(texture2D(tDiffuse,vUv*0.5))))*vec4(1.1) + col + vec4(dot(col,vec4(0.5)));", //test vector addition, multiplication and some common math functions
							"}"
						].join('\n'),
						attributes:{},
						uniforms: {
							'tDiffuse':{type:'t',value:texture}
						},
						side:THREE.DoubleSide
					})
				);
				scene.add(p);

				//first render
				renderer.render(scene,camera,renderTarget,true);
				renderer.getContext().flush();
			},

			//
			// AnimationFrame loop - do the performance test NUM_FRAMES times
			//
			run : function(_renderer) {
				//animationframe
				if (currentFrame > NUM_FRAMES) {
					PerformanceTest.onFinished();
					return;
				}
				window.requestAnimationFrame(PerformanceTest.run);


				var totalTime = 0,
					t,
					buff = new Uint8Array(4),
					gl = renderer.getContext();


				c.fillStyle = '#'+Math.random();
				c.fillRect(0,0,TEST_UPLOAD_WIDTH,TEST_UPLOAD_HEIGHT);
	            gl.readPixels(0, 0, 0, 1, gl.RGBA, gl.UNSIGNED_BYTE, buff);
	            gl.finish();
				t = window.performance.now();
				
				for (var i=0; i<NUM_REPEATS; i++) {
					texture.needsUpdate = true;
					renderer.setTexture(texture, i);
					renderer.render(scene,camera,renderTarget,false);
				}
				renderer.getContext().flush();
				gl.readPixels(0, 0, 0, 1, gl.RGBA, gl.UNSIGNED_BYTE, buff);
				gl.finish();
				allTimes.push(window.performance.now() - t);
				currentFrame++;
			},

			//
			// Compile the average time by ignoring the top and bottom values
			//
			onFinished : function() {
				allTimes.sort();
				var t = 0.0;
				for (var i=NUM_SPLICE; i<NUM_FRAMES-NUM_SPLICE; i++) {
					t += allTimes[i];
				}
				var speed = t/(NUM_FRAMES-NUM_SPLICE*2);
				console.log('Webgl Performance Score: '+speed);

				var recommendedSize;
				for (var i=ranges.length-1; i>=0; i--) {
					if (speed <= ranges[i].speed) {
						recommendedSize = ranges[i].size;
					}
				}


				document.write('Webgl Performance Score: '+(t/(NUM_FRAMES-NUM_SPLICE*2)).toPrecision(4)+
					'<br/>Recommended Size: '+recommendedSize);
				//cleanup
				texture.dispose();
				renderTarget.dispose();

			}
		}
})(document,window);


document.addEventListener('DOMContentLoaded',function() {
	setTimeout(function() {
		window.PerformanceTest.create(null);
		window.PerformanceTest.run();
	},100);
},true);