THREE.BlendShader = {

	uniforms: {

		"texture1": { type: "t", value: null },
		"texture2": { type: "t", value: null },
		"blend":  { type: "f", value: 1.0 }

	},

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join("\n"),

	fragmentShader: [

		"uniform float blend;",

		"uniform sampler2D texture1;",
		"uniform sampler2D texture2;",

		"varying vec2 vUv;",

		"void main() {",

			"vec4 texel1 = texture2D( texture1, vUv );",
			"vec4 texel2 = texture2D( texture2, vUv );",
			"gl_FragColor = mix( texel1, texel2, 0.5 );",

		"}"

	].join("\n")

};
