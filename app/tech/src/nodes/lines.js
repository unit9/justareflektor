(function() {

  var MAX_WIDTH = 1920;
  var ZERO = new THREE.Vector3(0, 2, 0);
  var THRESHOLD = 0.2;

  var Lines = Sandbox.Nodes.Lines = function() {

    Sandbox.Node.call(this);

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    this.params = {
      amount: { value: 10, min: 1, max: 1000, step: 1 },
      thickness: { value: 4, min: 1, max: 50, step: 1 },
      connections: { value: false },
      threshold: { value: 0.33, min: 0, max: 1 }
    };

    this.center = new THREE.Vector2();
    this.geometry = new THREE.Geometry();

    for (var i = 0, l = this.params.amount.max * 2; i < l; i+=2) {

      this.geometry.vertices[i] = new THREE.Vector3().copy(ZERO);
      this.geometry.vertices[i + 1] = new THREE.Vector3().copy(ZERO);

    }

    this.mesh = new THREE.Line(
      this.geometry,
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: this.getParam('thickness')
      }),
      THREE.LinePieces
    );
    this.mesh.position.set(-1, -1, 0);
    this.scene.add(this.mesh);

    // Don't need the default quad
    this.scene.remove(this.quad);
    delete this.quad;

    this.inputs['data'] = null;

    this.buffer = this.outputs.buffer = this.createBuffer();
    this.destructables.push(this.buffer, this.mesh, this.geometry, this.mesh.material);

  };

  _.extend(Lines.prototype, Sandbox.Node.prototype, {

    name: 'Lines',

    resize: function(width, height) {

      var scale = Math.min(1, MAX_WIDTH / width);

      this.dispose(this.buffer);
      this.buffer = this.outputs.buffer = this.createBuffer({ width: width * scale, height: height * scale });
      this.destructables.push(this.buffer);

      return this;

    },

    update: function() {

      var data = this.inputs['data'];

      if (data) {

        if (this.getParam('connections')) {

          updateVideogrid.call(this, data);

        } else {

          updateZombies.call(this, data);

        }

      }

      var linewidth = this.getParam('thickness');

      if (this.mesh.material.linewidth !== linewidth) {
        this.mesh.material.linewidth = linewidth;
        this.mesh.material.needsUpdate = true;
      }

      this.renderer.render(this.scene, this.camera, this.outputs.buffer, true);

      return this.trigger('update');

    },

    onMouseMove: function(x, y) {

      this.center.set(2 * x, (1 - y) * 2);

      return this;

    }

  });

  function updateVideogrid(data) {

    var amount = this.getParam('amount');
    var tracks = data.tracks;
    var length = tracks.length;
    var currentFrame = data.parent.currentFrame;
    var threshold = this.getParam('threshold');

    for (var i = 0, l = this.params.amount.max * 2; i < l; i+=2) {

      var position, track, x, y, connections, cid, connection, dx, dy;

      var a = this.geometry.vertices[i];
      var b = this.geometry.vertices[i + 1];

      if (i > amount) {
        b.set(this.center.x, this.center.y, 0);
        a.copy(b);
        continue;
      }

      var passes = Math.floor(i / length);
      var id = i % length;

      track = tracks[id];
      position = track.positions[currentFrame];

      if (!position) {
        b.set(this.center.x, this.center.y, 0);
        a.copy(b);
        continue;
      }

      connections = track.connections[currentFrame];
      if (!connections) {
        b.set(this.center.x, this.center.y, 0);
        a.copy(b);
        continue;
      }

      cid = connections[passes];
      connection = tracks[cid || 0];

      if (!connection) {
        b.set(this.center.x, this.center.y, 0);
        a.copy(b);
        continue;
      }

      connection = connection.positions[currentFrame];

      if (!connection) {
        b.set(this.center.x, this.center.y, 0);
        a.copy(b);
        continue;
      }

      x = 2 * connection.x, y = 2 * connection.y;
      dx = Math.abs(this.center.x - x);
      dy = Math.abs(this.center.y - y);

      if (dx > threshold || dy > threshold) {
        b.set(this.center.x, this.center.y, 0);
        a.copy(b);
        continue;
      }

      a.set(x, y, 0);

      x = 2 * position.x, y = 2 * position.y;
      dx = Math.abs(this.center.x - x);
      dy = Math.abs(this.center.y - y);

      if (dx > threshold || dy > threshold) {
        b.set(this.center.x, this.center.y, 0);
        a.copy(b);
        continue;
      }

      b.set(x, y, 0);

    }

    this.geometry.verticesNeedUpdate = true;

  }

  function updateZombies(data) {

    var amount = this.getParam('amount');
    var tracks = data.tracks;
    var length = tracks.length;
    var currentFrame = data.parent.currentFrame;

    for (var i = 0, l = this.params.amount.max * 2; i < l; i+=2) {

      var position, track, x, y;

      var a = this.geometry.vertices[i];
      var b = this.geometry.vertices[i + 1];

      b.set(this.center.x, this.center.y, 0);

      if (i > amount) {
        a.copy(b);
        continue;
      }

      track = tracks[i];
      if (!track) {

        track = tracks[i % length];
        position = track.positions[currentFrame];

        if (!position) {
          a.copy(b);
          continue;
        }

        x = position.x;
        y = position.y;

        var ids = track.connections[currentFrame];

        if (!ids) {
          a.copy(b);
          continue;
        }

        var index = ids[Math.floor(i / length)];
        var v = this.geometry.vertices[index];

        if (!v) {
          a.copy(b);
          continue;
        }

        b.set(2 * x, y * 2, 0);
        a.copy(v);
        continue;

      }

      position = track.positions[currentFrame];
      if (!position) {
        a.copy(b);
        continue;
      }

      x = position.x;
      y = position.y;

      a.set(2 * x, y * 2, 0);

    }

    this.geometry.verticesNeedUpdate = true;

  }

})();