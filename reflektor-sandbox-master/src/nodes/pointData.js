(function() {

  var MAX_WIDTH = 1920, callbacks = [], reveal;
  var MAX_VERTS = 1000;
  var VIDEO_FRAMERATE = 23.987;

  var PointData = Sandbox.Nodes.PointData = function() {

    var _this = this;

    Sandbox.Node.call(this);

    this.currentFrame = 0;
    this.maxFrames = 0;

    this.outputs.data = null;

    var update = _.bind(function() {

      var src = this.getParam('source');
      var data = PointData.getDataBySrc(src);

      this.video = PointData.getVideoBySrc(src);
      this.maxFrames = Math.round(this.video.duration * VIDEO_FRAMERATE);
      this.frameOffset = PointData.getOffsetBySrc(src);

      if (_.isNull(this.outputs.data)) {
        this.outputs.data = _.clone(data);
      } else {
        _.each(this.outputs.data, function(v, k) {
          delete this.outputs.data[k];
        }, this);
        _.each(data, function(v, k) {
          this.outputs.data[k] = v;
        }, this);
      }

      this.outputs.data.parent = this;

    }, this);

    this.params = {
      source: {
        options: PointData.Files,
        onUpdate: update
      }
    };

    var applyDefaults = _.bind(function() {

      this.params.source.value = this.params.source.options[0].value;
      update();

    }, this);

    // PointData.ready(applyDefaults);

    // Create a particle system to view the data.
    this.geometry = new THREE.Geometry();
    this.geometry.vertices = _.map(_.range(MAX_VERTS), function() {
      return new THREE.Vector3();
    });

    this.material = new THREE.ParticleBasicMaterial({ size: 15, color: 0xffff00, sizeAttenuation: false });
    this.mesh = new THREE.ParticleSystem(this.geometry, this.material);

    this.mesh.position.set(-1, -1, 0);
    this.scene.add(this.mesh);

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    this.buffer = this.createBuffer();
    this.destructables.push(this.buffer, this.geometry, this.material, this.mesh);

  };

  _.extend(PointData, {

    isReady: false,

    ready: function(func) {

      if (PointData.isReady) {
        func();
      } else {
        callbacks.push(func);
      }

    },

    getVideoBySrc: function(src) {

      var files = PointData.Files;
      for (var i = 0, l = files.length; i < l; i++) {
        var file = files[i];
        if (file.value === src) {
          return Sandbox.Nodes.VideoTexture.getVideoBySrc(file.videoSrc);
        }
      }

      return null;

    },

    getDataBySrc: function(src) {

      var files = PointData.Files;
      for (var i = 0, l = files.length; i < l; i++) {
        var file = files[i];
        if (file.value === src) {
          return file.data;
        }
      }

      return null;

    },

    getOffsetBySrc: function(src) {

      var files = PointData.Files;
      for (var i = 0, l = files.length; i < l; i++) {
        var file = files[i];
        if (file.value === src) {
          return file.offset;
        }
      }

      return 0;

    },

    Files: [

      {
        name: 'Portrait',
        value: './media/tracking/videogrid.json',
        videoSrc: './media/video/640/reflektor_4.webm',
        offset: 50
      },

      {
        name: 'Zombies',
        value: './media/tracking/axelle_final.json',
        videoSrc: './media/video/640/reflektor_7-11.webm',
        offset: 160
      }

    ]

  });

  reveal = _.after(PointData.Files.length, function() {

    PointData.isReady = true;
    _.each(callbacks, function(c) {
      c();
    });

    callbacks.length = 0;

  });

  _.each(PointData.Files, function(file) {

    var src = file.value;

    $.get(src, function(resp) {
      file.data = resp;
      reveal();
    });

  });

  _.extend(PointData.prototype, Sandbox.Node.prototype, {

    name: 'Point Data',

    resize: function(width, height) {

      var scale = Math.min(1, MAX_WIDTH / width);

      var index = _.indexOf(this.destructables, this.buffer);
      if (index >= 0) {
        this.destructables.splice(index, 1);
      }
      this.buffer.dispose();
      this.buffer = this.createBuffer({ width: width * scale, height: height * scale });
      this.destructables.push(this.buffer);

      return this;

    },

    update: function() {

      if (this.video) {

        // Update time
        this.currentFrame = Math.floor(this.video.currentTime * VIDEO_FRAMERATE) + this.frameOffset;

      } else {

        this.currentFrame++;
        if (this.currentFrame > this.maxFrames) {
          this.currentFrame = 0;
        }

      }

      if (this.outputs.data) {

        // Do some drawing here....

        var tracks = this.outputs.data.tracks;
        for (var i = 0, l = this.geometry.vertices.length; i < l; i++) {

          var track = tracks[i];
          var v = this.geometry.vertices[i];

          if (!track) {
            v.set(-100, -100, 0);
            continue;
          }

          var position = track.positions[this.currentFrame];

          if (!position) {
            v.set(-100, -100, 0);
            continue;
          }

          var x = position.x;
          var y = position.y;
          v.set(2 * x, y * 2, 0);

        }

        this.geometry.verticesNeedUpdate = true;

        this.renderer.render(this.scene, this.camera, this.buffer, true);

      }

      return this.trigger('update');

    }

  });

})();