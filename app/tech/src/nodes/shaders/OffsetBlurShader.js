THREE.OffsetBlurShader = {

  uniforms: {

    'tDiffuse': { type: 't', value: null },
    'offset': { type: 'v2', value: new THREE.Vector2(0.0125, 0.0125) }

  },

  vertexShader: [

    'varying vec2 vUv;',
    'varying vec2 uvLeft;',
    'varying vec2 uvRight;',
    'varying vec2 uvTop;',
    'varying vec2 uvBottom;',

    'varying vec2 uvTopLeft;',
    'varying vec2 uvTopRight;',
    'varying vec2 uvBottomLeft;',
    'varying vec2 uvBottomRight;',

    'uniform vec2 offset;',

    'void main() {',

      'vUv = vec2(uv.x, uv.y);',

      'uvLeft = vUv + vec2(-offset.x, 0.0);',
      'uvRight = vUv + vec2(offset.x, 0.0);',
      'uvTop = vUv + vec2(0.0, -offset.y);',
      'uvBottom = vUv + vec2(0.0, offset.y);',

      'uvTopLeft = vUv + vec2(-offset.x, -offset.y);',
      'uvTopRight = vUv + vec2(offset.x, -offset.y);',
      'uvBottomLeft = vUv + vec2(-offset.x, offset.y);',
      'uvBottomRight = vUv + vec2(offset.x, offset.y);',

      'gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );',

    '}'

  ].join('\n'),

  fragmentShader: [

    'varying vec2 vUv;',

    'varying vec2 uvLeft;',
    'varying vec2 uvRight;',
    'varying vec2 uvTop;',
    'varying vec2 uvBottom;',

    'varying vec2 uvTopLeft;',
    'varying vec2 uvTopRight;',
    'varying vec2 uvBottomLeft;',
    'varying vec2 uvBottomRight;',

    'uniform vec2 offset;',
    'uniform sampler2D tDiffuse;',

    'void main() {',

      'gl_FragColor = (',
        'texture2D(tDiffuse, vUv) * 4.0 +',

        '(texture2D(tDiffuse, uvLeft) +',
        'texture2D(tDiffuse, uvRight) +',
        'texture2D(tDiffuse, uvTop) +',
        'texture2D(tDiffuse, uvBottom)) * 2.0 +',

        'texture2D(tDiffuse, uvTopLeft) +',
        'texture2D(tDiffuse, uvTopRight) +',
        'texture2D(tDiffuse, uvBottomRight) +',
        'texture2D(tDiffuse, uvBottomLeft)',
      ') * 0.0625;',

      'gl_FragColor.a = 1.0;',

    '}'

  ].join('\n')

};
