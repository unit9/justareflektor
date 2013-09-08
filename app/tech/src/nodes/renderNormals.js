(function() {

  var MAX_WIDTH = 1920;
  
  var RenderNormals = Sandbox.Nodes.RenderNormals = function() {

    Sandbox.Node.call(this);

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    this.inputs.scene = null;
    this.buffer = this.outputs.buffer = this.createBuffer();

    this.normalMaterial = new THREE.MeshNormalMaterial();
    this.destructables.push(this.normalMaterial, this.buffer);

  };

  _.extend(RenderNormals.prototype, Sandbox.Node.prototype, {

    name: 'Render Normals',

    resize: function(width, height) {

      var scale = Math.min(1, MAX_WIDTH / width);

      this.dispose(this.buffer);
      this.buffer = this.outputs.buffer = this.createBuffer({ width: width * scale, height: height * scale });
      this.destructables.push(this.buffer);

      return this;

    },

    update: function() {

      if (this.inputs.scene) {

        this.inputs.scene.overrideMaterial = this.normalMaterial;

        this.renderer.render(this.inputs.scene, this.inputs.scene.camera, this.buffer, true);

        this.inputs.scene.overrideMaterial = null;

      }

      return this.trigger('update');

    }

  });

})();