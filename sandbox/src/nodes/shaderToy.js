
(function() {

  var MAX_WIDTH = 1920;
  
  var ShaderToy = Sandbox.Nodes.ShaderToy = function() {

    Sandbox.Node.call(this);

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    this.buffer = this.outputs.buffer = this.createBuffer();

    this.normalMaterial = new THREE.MeshNormalMaterial();
    this.destructables.push(this.normalMaterial, this.buffer);

    this.params = {
      fragment: { value: "test" }
    }

  };

  _.extend(ShaderToy.prototype, Sandbox.Node.prototype, {

    name: 'ShaderToy',

    resize: function(width, height) {

      var scale = Math.min(1, MAX_WIDTH / width);

      this.dispose(this.buffer);
      this.buffer = this.outputs.buffer = this.createBuffer({ width: width * scale, height: height * scale });
      this.destructables.push(this.buffer);

      return this;

    },

    update: function() {



      return this.trigger('update');

    }

  });

})();