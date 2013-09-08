THREE.RefractionShader = {

  uniforms: {

    "normalBuffer": { type: "t", value: null },
    "videoBuffer": { type: "t", value: null }

  },

  vertexShader: [

    "varying vec2 vUv;",

    "void main() {",

      "vUv = uv;",
      "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

    "}"

  ].join("\n"),

  fragmentShader: [

     "uniform sampler2D normalBuffer;",
     "uniform sampler2D videoBuffer;",
     "varying highp vec2 vUv;",

     "void main() {",
       "vec3 normal = texture2D(normalBuffer,vUv).rgb * vec3(2.0) - vec3(1.0);",
       "if ( normal == vec3(-1.0) ) normal = vec3(0.0);",

       "vec2 vUv2 = vUv * vec2(0.95);",

       "vec2 rUvR = vUv2 + ( ( normal.xy ) * vec2(0.31) );",
       "vec2 rUvG = vUv2 + ( ( normal.xy ) * vec2(0.32) );",
       "vec2 rUvB = vUv2 + ( ( normal.xy ) * vec2(0.33) );",

       "vec3 video = texture2D(videoBuffer,rUvR).rgb;",
       "video.g = texture2D(videoBuffer,rUvG).g;",
       "video.b = texture2D(videoBuffer,rUvB).b;",

       "gl_FragColor = vec4(video, 1.0);",

    "}"

  ].join("\n")

};
