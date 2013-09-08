THREE.DrawingBlur = {

	uniforms: {

		"previousBuffer":{type:"t",value: null },
		"center": { type: "v2", value: new THREE.Vector2(0.5,0.5) },
		"ratio": { type: "v2", value: new THREE.Vector2(1.0,1.0) },
		"drawingSize": { type: "f", value: null },
		"intensity": { type: "f", value: null },
		"fade": { type: "f", value: null }

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
		"uniform mediump vec2 center;",
		"uniform mediump float drawingSize;",
		"uniform mediump vec2 ratio;",
		"uniform mediump float fade;",
		"uniform mediump float intensity;",

		"void main() {",

		"    mediump float centerDist = distance((vUv-0.5)*ratio,(center-0.5)*ratio);",

		"    float dist = max(drawingSize-centerDist,0.0) / drawingSize * intensity;",

		"    vec3 previousColor = texture2D(previousBuffer, vUv).rgb - fade;",

		"    gl_FragColor = vec4(previousColor + dist*(1.0-previousColor), 1.0);",

		"    gl_FragColor = clamp(gl_FragColor, 0.0, 1.0);",

		"}"

	].join("\n")

};
