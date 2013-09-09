/**
 * @author huwb / http://huwbowles.com/
 * God-rays (crepuscular rays)
 * References:
 * Sousa2008 - Crysis Next Gen Effects, GDC2008, http://www.crytek.com/sites/default/files/GDC08_SousaT_CrysisEffects.ppt
 */

THREE.GodRaysShader = {

  defines: {

    "TAPS_PER_PASS": "6.0"

  },

  uniforms: {

    "texture": { type: "t", value: null },
    "fStepSize": { type: "f", value: 6 },
    "center": { type: "v2", value: new THREE.Vector2(0, 0) },
    "rayLength": { type: "f", value: 1.0 },
    "intensity": { type: "f", value: 1.0 },
    "aspect": { type: "f", value: 1.33 }
  
  },

  vertexShader: [

    "varying highp vec2 vUv;",

    "void main() {",

      "vUv = uv;",
      "gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );",

    "}"

  ].join("\n"),

  fragmentShader: [

    "varying vec2 vUv;",

    "uniform sampler2D texture;",

    "uniform vec2 center;",
    "uniform float fStepSize;",
    "uniform float rayLength;",
    "uniform float intensity;",
    "uniform float aspect;",

    "void main() {",

      "vec2 delta = (center - vUv);",
      "float dist = length( delta * vec2(aspect,1.0) );",
      "vec2 stepv = (fStepSize * delta / dist) * rayLength;",

      "vec2 uv = vUv.xy;",
      "vec3 col = vec3(0.0);",

      "for ( float i = 0.0; i < TAPS_PER_PASS; i += 1.0 ) {",

        "col += ( dot(center-uv,center-vUv.xy) > 0.0 ? ( texture2D( texture, uv ).rgb ) : vec3(0.0));",

        // "if ( dot(center-uv,center-vUv.xy) <= 0.0 ) {",
        // "}",

        "uv += stepv;",

      "}",

      "gl_FragColor = vec4( col / TAPS_PER_PASS * intensity, 1.0 );",

    "}"


  ].join("\n")

};
