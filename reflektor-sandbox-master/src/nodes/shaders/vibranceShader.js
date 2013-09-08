THREE.Vibrance = {

	uniforms: {

		"maskBuffer":{type:"t",value: null },
		"videoBuffer":{type:"t",value: null },
		"effectAlpha":{type:"f",value: 0.5 },
		"timep":{type:"f",value: null }

	},

	vertexShader: [

		"varying mediump vec2 vUv;",

		"void main() {",
		"     vUv = vec2(uv.x,uv.y);",
		"     gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );",
		"}"

	].join("\n"),

	fragmentShader: [

		"varying mediump vec2 vUv;",

		"uniform float timep;",
		"uniform float effectAlpha;",
		"uniform sampler2D maskBuffer;",
		"uniform sampler2D videoBuffer;",

		"lowp float rand( vec2 co ){",
		"    return fract( sin( dot( co.xy ,vec2( 12.9898,78.233 ) ) ) * 43758.5453 );",
		"}",

		"const mediump vec3  kRGBToYPrime = vec3 (0.299, 0.587, 0.114);",

		"void main() {",

		"    lowp float noise = rand(vUv*timep*10.0);",
		"    mediump float vibrance = 1.0-texture2D(maskBuffer,vUv).r;",
		"    vibrance*=vibrance*noise;",
		"    vec4 color = texture2D(videoBuffer,vUv);",
		"    lowp float YPrime  = dot (color.rgb, kRGBToYPrime);",
		"    lowp float average = YPrime; //(color.r + color.g + color.b) / 3.0;",
		"    lowp float mx = max(color.r, max(color.g, color.b));",
		"    lowp float amt = (mx - average) * (-vibrance * 100.0 * effectAlpha);",
		"    color.rgb = mix(color.rgb, vec3(mx), amt);",
		"    gl_FragColor = color;",

		"}"

	].join("\n")

};