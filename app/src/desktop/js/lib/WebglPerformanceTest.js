/*
//EXAMPLE USE
document.addEventListener('DOMContentLoaded',function() {
	setTimeout(function() {
		window.WebglPerformanceTest.create(null,function(score) {
			console.log(score);
			if (score >= 0.9) {
				//force a low-res video
			} else if (score >= 3.0) {
				//force a very low-res video
			}
		});
		window.WebglPerformanceTest.run();
	},100);
},true);
*/
/**
 * @author Édouard Lanctôt-Benoit  < edouardlb@gmail.com >
 *
*/



//
// Quick test to get an average score of this computer's Webgl Texture Upload/Rendering performance
//
(function(document,window) {

		//
		// PerformanceTest constants
		//
		var TEST_SIZE = 640,
			TEST_UPLOAD_WIDTH = 640,
			TEST_UPLOAD_HEIGHT = 336,
			NUM_REPEATS = 5,
			NUM_FRAMES = 200,
			NUM_SPLICE = 60,
			STOP_EARLY_THRESHOLD = 20.0,
			NUM_STOP_EARLY = 5,

			onFinishCallback = null,
			currentFrame = 0,
			useSeparateRenderer,
			texture,
			scene,
			camera,
			renderer,
			renderTarget,
			c,
			stopEarlyScore = 0,
			startTime = 0,
			lastFrameTime = 0,

			ranges = [
				{
					"size":"1920 (Very Fast)",
					"speed": 0.5
				},
				{
					"size":"1280 (Fast)",
					"speed": 0.7
				},
				{
					"size":"1080 (Decent)",
					"speed": 0.9
				},
				{
					"size":"840 (Slow)",
					"speed": 1.15
				},
				{
					"size":"640 (Very Slow)",
					"speed": 9999.0
				}],
			allTimes = [];


		var WebglPerformanceTest = window.WebglPerformanceTest = {

			//
			// Setup the performance test
			//
			create : function(_renderer,_onFinishCallback) {
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

				onFinishCallback = _onFinishCallback;

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
					THREE.LinearFilter, THREE.LinearFilter,
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
				startTime = performance.now();
			},

			//
			// AnimationFrame loop - do the performance test NUM_FRAMES times
			//
			run : function(_renderer) {
				//animationframe
				if (currentFrame > NUM_FRAMES || stopEarlyScore >= NUM_STOP_EARLY) {
					WebglPerformanceTest.onFinished();
					return;
				}
				window.requestAnimationFrame(WebglPerformanceTest.run);



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
					renderer.render(scene,camera,renderTarget,true);
				}
				renderer.getContext().flush();
				gl.readPixels(0, 0, 0, 1, gl.RGBA, gl.UNSIGNED_BYTE, buff);
				renderer.getContext().finish();

				var perf = window.performance.now() - t;
				allTimes.push(perf);
				if (perf > STOP_EARLY_THRESHOLD) stopEarlyScore++; else stopEarlyScore = 0;
				currentFrame++;


				//fps
				//if (debugtt<2)console.log("PERF:",perf," > fps:",performance.now()-lastFrameTime);
				lastFrameTime = performance.now();


			},

			//
			// Compile the average time by ignoring the top and bottom values
			//
			onFinished : function() {
				allTimes.sort();

				var speed;
				console.log('finished: '+allTimes.length);
				var t = 0.0;
				var durationScore;
				if (stopEarlyScore < NUM_STOP_EARLY) {
					for (var i=NUM_SPLICE; i<NUM_FRAMES-NUM_SPLICE; i++) {
						t += allTimes[i];
					}
					speed = t/(NUM_FRAMES-NUM_SPLICE*2);
					console.log('Webgl Performance Score: '+speed);
					durationScore = speed * (Math.max(performance.now()-startTime,3500) / 3500);

					var recommendedSize;
					for (var i=ranges.length-1; i>=0; i--) {
						if (speed <= ranges[i].speed) {
							recommendedSize = ranges[i].size;
						}
					}
				} else {
					for (var i=1; i<allTimes.length-1; i++) {
						t += allTimes[i];
					}
					speed = t/(allTimes.length-2);
					durationScore = speed;
				}
				console.log(speed);



				if (!onFinishCallback) document.write('Webgl Performance Score: '+(t/(NUM_FRAMES-NUM_SPLICE*2)).toPrecision(4)+
					'<br/>Recommended Size: '+recommendedSize);
				else 
					onFinishCallback(speed,(performance.now()-startTime) / 1000,durationScore);

				//cleanup
				texture.dispose();
				renderTarget.dispose();

			},

			debug: function() {
				WebglPerformanceTest.create(null,
					function(score,duration,durationScore){
						console.log(score+' in '+duration+" final score:"+durationScore);
					}
				);
				WebglPerformanceTest.run();
			}
		}
})(document,window);