THREE.Composite3Shader = {

	uniforms: {

		"texture1": { type: "t", value: null },
		"texture2": { type: "t", value: null },
		"opacity1": { type: "f", value: 1.0 },
		"opacity2": { type: "f", value: 1.0 },
		"mode": { type: "i", value: 0 }

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
		"uniform int mode;",
		"uniform float opacity1;",
		"uniform float opacity2;",

		"varying vec2 vUv;",

		"void main() {",

			"vec4 texel1 = texture2D( texture1, vUv ) * opacity1;",
			"vec4 texel2 = texture2D( texture2, vUv ) * opacity2;",

			"if (mode == 0) {",
				"gl_FragColor = min(texel1 + texel2, 1.0);",
			"} else if (mode == 1) {",
				"gl_FragColor = max(texel1 - texel2, 0.0);",
			"} else if (mode == 2) {",
				"gl_FragColor = texel1 * texel2;",
			"}",

		"}"

	].join("\n")

};
