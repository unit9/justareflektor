// https://npmjs.org/package/node-minify

var path = require('path');
var compressor = require('node-minify');

var files = [
  path.resolve(__dirname, "../third-party/url.js"),
  path.resolve(__dirname, "../third-party/jquery.js"),
  path.resolve(__dirname, "../third-party/two.js"),
  path.resolve(__dirname, "../third-party/noise.js"),
  path.resolve(__dirname, "../third-party/perlin.js"),
  path.resolve(__dirname, "../third-party/big-screen.js"),
  path.resolve(__dirname, "../third-party/three.js"),
  path.resolve(__dirname, "../third-party/OBJLoader.js"),
  path.resolve(__dirname, "../third-party/three.xhrloader.js"),
  path.resolve(__dirname, "../src/sandbox.js"),
  path.resolve(__dirname, "../src/viewport.js"),
  path.resolve(__dirname, "../src/graph.js"),
  path.resolve(__dirname, "../src/inspector.js"),
  path.resolve(__dirname, "../src/node.js"),
  path.resolve(__dirname, "../src/nodes/preview.js"),
  path.resolve(__dirname, "../src/nodes/shaders/Composite3Shader.js"),
  path.resolve(__dirname, "../src/nodes/shaders/AddBlendShader.js"),
  path.resolve(__dirname, "../src/nodes/shaders/BlendShader.js"),
  path.resolve(__dirname, "../src/nodes/shaders/ConvolutionShader.js"),
  path.resolve(__dirname, "../src/nodes/shaders/CopyShader.js"),
  path.resolve(__dirname, "../src/nodes/shaders/GodRaysShader.js"),
  path.resolve(__dirname, "../src/nodes/shaders/RefractionShader.js"),
  path.resolve(__dirname, "../src/nodes/shaders/drawingBlurShader.js"),
  path.resolve(__dirname, "../src/nodes/shaders/bumpToNormalShader.js"),
  path.resolve(__dirname, "../src/nodes/shaders/videoFeedbackShader.js"),
  path.resolve(__dirname, "../src/nodes/shaders/vibranceShader.js"),
  path.resolve(__dirname, "../src/nodes/shaders/OffsetBlurShader.js"),
  path.resolve(__dirname, "../src/nodes/shaders/NoiseShader.js"),
  path.resolve(__dirname, "../src/nodes/shaders/InvertShader.js"),
  path.resolve(__dirname, "../src/nodes/drawingBlur.js"),
  path.resolve(__dirname, "../src/nodes/suminagashi.js"),
  path.resolve(__dirname, "../src/nodes/webcam.js"),
  path.resolve(__dirname, "../src/nodes/planes.js"),
  path.resolve(__dirname, "../src/nodes/godRays.js"),
  path.resolve(__dirname, "../src/nodes/bloom.js"),
  path.resolve(__dirname, "../src/nodes/blur.js"),
  path.resolve(__dirname, "../src/nodes/invert.js"),
  path.resolve(__dirname, "../src/nodes/noise.js"),
  path.resolve(__dirname, "../src/nodes/bumpToNormal.js"),
  path.resolve(__dirname, "../src/nodes/refraction.js"),
  path.resolve(__dirname, "../src/nodes/videoFeedback.js"),
  path.resolve(__dirname, "../src/nodes/vibrance.js"),
  path.resolve(__dirname, "../src/nodes/composite3.js")
];

// Concatenated
new compressor.minify({
  type: 'no-compress',
  fileIn: files,
  fileOut: path.resolve(__dirname, '../build/sandbox.js'),
  callback: function(e) {
    if (!e) {
      console.log('concatenation complete');
    } else {
      console.log('unable to concatenate', e);
    }
  }
});

// Minified
new compressor.minify({
  type: 'gcc',
  fileIn: files,
  fileOut: path.resolve(__dirname, '../build/sandbox.min.js'),
  callback: function(e){
    if (!e) {
      console.log('minified complete');
    } else {
      console.log('unable to minify', e);
    }
  }
});
