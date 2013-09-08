THREE.VideoFeedback = {

	uniforms: {

		"previousBuffer":{type:"t",value: null },
		"maskBuffer":{type:"t",value: null },
		"videoBuffer":{type:"t",value: null }

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

		"uniform sampler2D previousBuffer;",
		"uniform sampler2D maskBuffer;",
		"uniform sampler2D videoBuffer;",

		"void main() {",

		"    vec3 previousColor = texture2D(previousBuffer, vUv).rgb;",
		"    vec3 videoColor = texture2D(videoBuffer, vUv).rgb;",
		"    vec3 maskColor = texture2D(maskBuffer, vUv).rgb;",

		"    gl_FragColor = vec4( mix(previousColor,videoColor, pow(maskColor.r,3.8)), 1.0);",

		"}"

	].join("\n")

};
