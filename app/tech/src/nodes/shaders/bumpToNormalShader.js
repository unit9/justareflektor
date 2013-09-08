THREE.BumpToNormal = {

  uniforms: {

    "bumpBuffer":{type:"t",value: null },
    "resolution": { type: "v2", value: new THREE.Vector2() },
    "intensity": { type: "f", value: 1 }

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

    "uniform sampler2D bumpBuffer;",
    "uniform vec2 resolution;",
    "uniform float intensity;",

    "void main() {",

    "float top    = texture2D(bumpBuffer, vec2(vUv.x, vUv.y - 1./resolution.y)).x;",
    "float bottom  = texture2D(bumpBuffer, vec2(vUv.x, vUv.y + 1./resolution.y)).x;",

    "float left  = texture2D(bumpBuffer, vec2(vUv.x - 1./resolution.x, vUv.y)).x;",
    "float right = texture2D(bumpBuffer, vec2(vUv.x + 1./resolution.x, vUv.y)).x;",

    "float dx = (right - left) * intensity;",
    "float dy = (bottom - top) * intensity;",
    "float dz = max(sqrt(intensity - dx*dx - dy*dy), 0.0);  ",
    "vec3 normal = normalize(vec3(dx,dy,dz))/2.0+0.5;",

    "    gl_FragColor = vec4( normal , 1.0);",

    "}"

  ].join("\n")

};
