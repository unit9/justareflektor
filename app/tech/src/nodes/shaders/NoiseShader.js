THREE.NoiseShader = {

  uniforms: {

    'texture': { type: 't', value: null },
    'amount': { type: 'v2', value: new THREE.Vector2(Math.random(), Math.random()) },
    'fade': { type: 'f', value: 1 }

  },

  vertexShader: [

    'varying mediump vec2 vUv;',

    'void main() {',
      'vUv = vec2(uv.x, uv.y);',
      'gl_Position = projectionMatrix *  modelViewMatrix * vec4(position, 1.0);',
    '}'

  ].join('\n'),

  fragmentShader: [

    'varying mediump vec2 vUv;',

    'uniform sampler2D texture;',
    'uniform highp vec2 amount;',
    'uniform lowp float fade;',

    'float rand(vec2 co) {',
      'return fract(sin(dot(co.xy ,vec2(12.9898, 78.233))) * 43758.5453);',
    '}',

    '#define BlendOverlayf(base, blend)  (base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend)))',

    'void main() {',

      'float noise = 0.5 + 0.5 * rand(amount + vUv);',
      'lowp float linea = dot(texture2D(texture, vUv).rgb, vec3(1.0));',
      'linea *= linea * linea * fade;',

      'vec4 lineValue = linea * linea * vec4(1.0);',
      'lineValue = (lineValue * noise) * 1.5 - 0.5;',

      'gl_FragColor = max(lineValue, 0.0) * fade;',

    '}'

  ].join('\n')

};
