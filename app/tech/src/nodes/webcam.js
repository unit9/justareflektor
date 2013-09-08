(function() {

  var video = document.createElement('video');

  // http://www.html5rocks.com/en/tutorials/getusermedia/intro/
  var has = !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia);

  var Webcam = Sandbox.Nodes.Webcam = function() {

    Sandbox.Node.call(this);

    this.destroy();

    this.outputs.texture = this.buffer = window.texture = new THREE.Texture(video);
    this.outputs.texture.__parentNode = this;
    this.outputs.texture.minFilter = THREE.LinearFilter;
    this.outputs.texture.magFilter = THREE.LinearFilter;
    this.outputs.texture.format = THREE.RGBFormat;
    this.outputs.texture.generateMipmaps = false;

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    this.destructables.push(this.texture);

    this._requested = false;

  };

  _.extend(Webcam, {

    requested: false,

    Request: function() {

      if (!has) {
        return;
      }

      // http://www.html5rocks.com/en/tutorials/getusermedia/intro/
      window.URL = window.URL || window.webkitURL;
      navigator.getUserMedia  = navigator.getUserMedia
        || navigator.webkitGetUserMedia || navigator.mozGetUserMedia
        || navigator.msGetUserMedia;

      navigator.getUserMedia({ video: true }, function(stream) {

        // Camera name
        var name = stream.getVideoTracks()[0].label;

        video.src = window.URL.createObjectURL(stream);
        video.play();

        _.delay(function() {
          Webcam.requested = true;
        }, 1000); // Buh?

      });

    }

  });

  _.extend(Webcam.prototype, Sandbox.Node.prototype, {

    name: 'Webcam',

    resize: function(width, height) {

      this.width = width;
      this.height = height;

      return this;

    },

    update: function() {

      if (!this._requested && !Webcam.requested) {
        Webcam.Request();
        this._requested = true;
      }

      if (Webcam.requested) {

        var a1 = video.videoWidth / video.videoHeight;
        var a2 = this.width / this.height;
        var r = a1 / a2;

        if (this.outputs.texture.repeat.y !== r) {
          this.outputs.texture.repeat.set(1, a1 / a2);
        }
        this.outputs.texture.needsUpdate = true;

      }

      return this.trigger('update');

    }

  });

})();