THREE.Add3Shader = {

  uniforms: {

    "texture1": { type: "t", value: null },
    "texture2": { type: "t", value: null },
    "texture3": { type: "t", value: null },

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
    "uniform sampler2D texture3;",

    "varying vec2 vUv;",

    "void main() {",

      "vec4 texel1 = texture2D( texture1, vUv );",
      "vec4 texel2 = texture2D( texture2, vUv );",
      "vec4 texel3 = texture2D( texture3, vUv );",
      "gl_FragColor = texel1 - texel2 - texel3;",

    "}"

  ].join("\n")

};
