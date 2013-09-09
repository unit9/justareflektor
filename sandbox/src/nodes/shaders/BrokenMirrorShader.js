THREE.BrokenMirrorShader = {

  uniforms: {

    // Textures
    tWebcam: { type:'t', value: null },
    tDiffuse: { type:'t', value: null },
    tMask: { type:'t', value: null },
    tEdges: { type:'t', value: null },

    // Giro motion
    center:{ type:'v2', value: new THREE.Vector2(0.5,0.5) },

    // Offset
    offset: { type: 'v2', value: new THREE.Vector2(1 / 640, 1 / 480) },
    maxOffset: { type: 'v2', value: new THREE.Vector2(- 100 / 640, - 100 / 480) },
    rotation: { type: 'v2', value: new THREE.Vector2(0, 0) },
    rotationPerspective: { type: 'f',value: 0.0 },
    parallax: { type: 'f', value: 0.8 },

    // Other settings
    maxScale: { type:'f', value: -0.15 },
    chromaticAberration: { type:'f', value: 1.0 },
    edgesDiffraction: { type:'f', value: 0.8 },
    flipX: { type: 'i', value: false },
    flipY: { type: 'i', value: false }

  },

  vertexShader: [

    'varying mediump vec2 vUv;',
    'varying mediump vec2 webcamUvBase;',

    'uniform mediump vec2 rotation;',
    'uniform mediump float rotationPerspective;',
    'varying highp vec3 vReflect;',
    'varying highp vec2 vReflectUv;',

    'const float refractionRatio = 1.0;',
    'uniform mediump float parallax;',

    '#define ratio 0.525',

    'void main() {',

      'highp vec2 cameraUv;',
      'vUv = vec2(uv.x, (0.5 - uv.y) * ratio + 0.5);',

      'vec4 vVertex = vec4(position, 1.0) * modelViewMatrix;',

      'vec3 L = normalize(cameraPosition - vVertex.xyz);',
      'vec3 R = normalize(reflect(-L,normal * normalMatrix));',
      'webcamUvBase = R.xy + 0.5;',
      // 'webcamUvBase = R.xy / R.z + 0.5;',

      'gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );',

      'webcamUvBase = mix(uv, webcamUvBase, parallax);',
      'webcamUvBase = vec2(mix((webcamUvBase.x - 0.5) + 0.5, webcamUvBase.x, webcamUvBase.y), webcamUvBase.y);',

    '}'

  ].join('\n'),

  fragmentShader: [

    'varying mediump vec2 vUv;',
    'varying mediump vec2 webcamUvBase;',
    'varying highp vec2 vReflectUv;',

    'uniform sampler2D tWebcam;',
    'uniform sampler2D tDiffuse;',
    'uniform sampler2D tMask;',
    'uniform sampler2D tEdges;',

    'uniform mediump vec2 center;',
    'uniform mediump vec2 offset;',
    'uniform mediump vec2 maxOffset;',

    'uniform mediump float maxScale;',
    'uniform mediump float chromaticAberration;',
    'uniform mediump float edgesDiffraction;',

    'uniform bool flipX;',
    'uniform bool flipY;',

    'void main() {',

      'vec4 diffuseColor = texture2D(tDiffuse,vUv);',
      'vec4 maskColor = texture2D(tMask,vUv);',
      'vec4 edges = texture2D(tEdges,vUv);',

      'if (maskColor.a <= 0.01) {',

        '// Discard',
        'gl_FragColor = diffuseColor;',

      '} else {',

        '// Draw input buffer',
        'vec2 webcamUv = (webcamUvBase - 0.5) * (1.0 + maskColor.r * maxScale) + 0.5 + maxOffset * maskColor.gb;',

        'if (flipX) {',
          'webcamUv.x = 1.0 - webcamUv.x;',
        '}',
        'if (flipY) {',
          'webcamUv.y = 1.0 - webcamUv.y;',
        '}',

        'gl_FragColor = diffuseColor +',
        'vec4(vec3(',
          'texture2D(tWebcam, webcamUv + chromaticAberration * offset * 1.0).r,',
          'texture2D(tWebcam, webcamUv + chromaticAberration * offset * 1.5).g,',
          'texture2D(tWebcam, webcamUv + chromaticAberration * offset * 2.0).b) * maskColor.a,',
        '1.0);',
      '}',

      'if (edges.r > 0.0) gl_FragColor += edgesDiffraction * edges.r * texture2D(tWebcam,vUv);',

    '}'

  ].join('\n')

};
