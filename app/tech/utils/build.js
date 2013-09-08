// https://npmjs.org/package/node-minify

var path = require('path');
var compressor = require('node-minify');

var files = require(path.resolve(__dirname, '../data/files.json'));

// Concatenated
new compressor.minify({
  type: 'no-compress',
  fileIn: files,
  fileOut: path.resolve(__dirname, '../js/build.js'),
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
  fileOut: path.resolve(__dirname, '../js/build.min.js'),
  callback: function(e){
    if (!e) {
      console.log('minified complete');
    } else {
      console.log('unable to minify', e);
    }
  }
});
