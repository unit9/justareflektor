(function() {

  var callbacks = [], videos;//, reveal;

  var VideoTexture = Sandbox.Nodes.VideoTexture = function() {

    var _this = this;

    Sandbox.Node.call(this);

    this.destroy();

    this.outputs.texture = this.buffer = window.texture = new THREE.Texture();
    this.outputs.texture.__parentNode = this;
    this.outputs.texture.minFilter = THREE.LinearFilter;
    this.outputs.texture.magFilter = THREE.LinearFilter;
    this.outputs.texture.format = THREE.RGBFormat;
    this.outputs.texture.generateMipmaps = false;

    var update = _.bind(function() {
      var src = this.getParam('source');
      this.outputs.texture.image = this.video = VideoTexture.getVideoBySrc(src);
    }, this);

    this.params = {
      source: {
        options: VideoTexture.Files,
        onUpdate: _.bind(function() {
          if (!this.sandbox) {
            return;
          }
          var file = VideoTexture.getAssetBySrc(this.getParam('source'));
          file.ready(this.sandbox, update);
        }, this)
      }
    };

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    this.destructables.push(this.texture);

  };

  _.extend(VideoTexture, {

    // isReady: false,

    // ready: function(func) {
    //   if (VideoTexture.isReady) {
    //     func();
    //   } else {
    //     callbacks.push(func);
    //   }
    // },

    getVideoBySrc: function(src) {

      var files = VideoTexture.Files;
      for (var i = 0, l = files.length; i < l; i++) {
        var file = files[i];
        if (file.value === src) {
          return file.video;
        }
      }

      return null;

    },

    getAssetBySrc: function(src) {

      var files = VideoTexture.Files;
      for (var i = 0, l = files.length; i < l; i++) {
        var file = files[i];
        if (file.value === src) {
          return file;
        }
      }

    },

    Files: [
      new Sandbox.Asset({
        name: 'Light',
        value: resource.get('/media/video/640/reflektor_1.webm')
      }),
      new Sandbox.Asset({
        name: 'Sea',
        value: resource.get('/media/video/640/reflektor_3.webm')
      }),
      new Sandbox.Asset({
        name: 'Portrait',
        value: resource.get('/media/video/640/reflektor_4.webm')
      }),
      new Sandbox.Asset({
        name: 'Multiplication',
        value: resource.get('/media/video/640/reflektor_5.webm')
      }),
      new Sandbox.Asset({
        name: 'Zombies',
        value: resource.get('/media/video/640/reflektor_7-11.webm')
      })
    ]

  });

  // reveal = _.after(VideoTexture.Files.length, function() {

  //   VideoTexture.isReady = true;
  //   _.each(callbacks, function(callback) {
  //     callback();
  //   });

  //   callbacks.length = 0;

  // });

  _.each(VideoTexture.Files, function(file) {

    var video = document.createElement('video');
    video.setAttribute('autoplay', '');
    video.setAttribute('autoload', '');
    video.setAttribute('loop', '');
    if (resource.local) {
      video.setAttribute('crossorigin', '');
    }

    video.addEventListener('canplaythrough', function() {
      file.available();
    });

    var source = document.createElement('source');
    source.setAttribute('src', file.value);
    video.appendChild(source);

    var container = document.querySelector('.scripts');
    if (_.isElement(container)) {
      container.appendChild(video);
    }

    file.video = video;

  });

  _.extend(VideoTexture.prototype, Sandbox.Node.prototype, {

    name: 'Video Clip',

    attach: function() {

      Sandbox.Node.prototype.attach.apply(this, arguments);

      // Choose defaults
      if (!this.params.source.value) {
        this.params.source.value = this.params.source.options[0].value;
      }

      this.params.source.onUpdate();

      return this;

    },

    update: function() {

      if (this.video && isPlaying(this.video)) {
        this.outputs.texture.needsUpdate = true;
      }

      return this.trigger('update');

    }

  });

  function isPlaying(clip) {
    return clip.readyState === 4 && !clip.paused;
  }

})();