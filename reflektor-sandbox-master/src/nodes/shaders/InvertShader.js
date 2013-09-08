THREE.InvertShader = {

  uniforms: {

    'texture': { type: 't', value: null },
    'amount': { type: 'f', value: 1.0 }

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
    'uniform float amount;',

    'void main() {',

      'vec4 c = texture2D(texture, vUv);',
      'vec4 i = vec4(1.0 - c.r, 1.0 - c.g, 1.0 - c.b, c.a);',

      'gl_FragColor = (i * amount) + c * (1.0 - amount);',

    '}'

  ].join('\n')

};
