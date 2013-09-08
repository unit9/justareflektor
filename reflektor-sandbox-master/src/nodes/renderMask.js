(function() {

  var MAX_WIDTH = 1920;
  
  var RenderMask = Sandbox.Nodes.RenderMask = function() {

    Sandbox.Node.call(this);

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    this.inputs.scene = null;
    this.buffer = this.outputs.buffer = this.createBuffer();

    this.destructables.push(this.buffer);

  };

  _.extend(RenderMask.prototype, Sandbox.Node.prototype, {

    name: 'Render Mask',

    resize: function(width, height) {

      var scale = Math.min(1, MAX_WIDTH / width);

      var index = _.indexOf(this.destructables, this.buffer);
      if (index >= 0) {
        this.destructables.splice(index, 1);
      }
      this.buffer.dispose();
      this.buffer = this.outputs.buffer = this.createBuffer({ width: width * scale, height: height * scale });
      this.destructables.push(this.buffer);

      return this;

    },

    update: function() {

      if (this.inputs.scene) {

        this.inputs.scene.overrideMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.renderer.setClearColor(new THREE.Color( 0xffffff ), 0);

        this.renderer.render(this.inputs.scene, this.inputs.scene.camera, this.outputs.buffer, true);

        this.inputs.scene.overrideMaterial = null;
        this.renderer.setClearColor(new THREE.Color( 0x000000 ), 0);

      }


      return this.trigger('update');

    }

  });

})();