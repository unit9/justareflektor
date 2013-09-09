(function() {

  var MAX_WIDTH = 1920 / 4;

  var Planes = Sandbox.Nodes.Planes = function() {

    Sandbox.Node.call(this);

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    this.params = {
      amount: { value: 1, min: 1, max: 50, step: 1 },
      drag: { value: 0.0625, min: 0, max: 1, step: 0.001 },
      blending: {
        value: THREE.AdditiveBlending,
        options: Planes.BlendingModes
      }
    };

    this.scene.remove(this.quad);
    this.dispose(this.quad);
    delete this.quad;

    var geometry = new THREE.PlaneGeometry( 2, 2 );
    this.material = new THREE.MeshBasicMaterial({
      blending: this.getParam('blending'),
      transparent: true
    });

    this.planes = _.map(_.range(this.params.amount.max), function(i) {

      var mesh = new THREE.Mesh(geometry, this.material);
      mesh.position.destination = new THREE.Vector3();

      this.scene.add(mesh);

      this.destructables.push(mesh);

      return mesh;

    }, this);

    this.inputs.video = null;
    this.buffer = this.outputs.buffer = this.createBuffer();

    this.destructables.push(this.buffer, this.material);

  };

  _.extend(Planes, {

    BlendingModes: [
      {
        name: 'None',
        value: THREE.NoBlending
      },
      {
        name: 'Normal',
        value: THREE.NormalBlending
      },
      {
        name: 'Additive',
        value: THREE.AdditiveBlending
      },
      {
        name: 'Subtractive',
        value: THREE.SubtractiveBlending
      },
      {
        name: 'Multiply',
        value: THREE.MultiplyBlending
      }
    ]

  });

  _.extend(Planes.prototype, Sandbox.Node.prototype, {

    name: 'Planes',

    resize: function(width, height) {

      var scale = Math.min(1, MAX_WIDTH / width);
      var params = { width: width * scale, height: height * scale };

      this.dispose(this.buffer);
      this.buffer = this.outputs.buffer = this.createBuffer(params);

      this.destructables.push(this.buffer);

      return this;

    },

    update: function() {

      var drag = this.getParam('drag');
      var amount = this.getParam('amount');

      if (this.inputs.video) {

        _.each(this.planes, function(plane, i) {

          if (i >= amount) {
            plane.visible = false;
            return;
          }

          if (i > 0) {
            var dest = this.planes[i - 1].position;
            plane.position.destination.copy(dest);
          }

          plane.position.add(
            plane.position.destination.clone()
              .sub(plane.position)
              .multiplyScalar(drag)
          );
          plane.visible = true;

        }, this);


        var blending = this.getParam('blending');
        if (this.material.blending !== blending) {
          this.material.blending = parseInt(blending);
          this.material.needsUpdate = true;
        }

        if (this.material.map !== this.inputs.video) {
          this.material.map = this.inputs.video;
          this.material.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera, this.outputs.buffer, true);

      }

      return this.trigger('update');

    },

    onMouseMove: function(x, y) {

      this.planes[0].position.destination.set(x - 0.5, (1 - y) - 0.5, 0);
      return this;

    }

  });

})();