(function() {

  var MAX_WIDTH = 1920 / 4;

  var Invert = Sandbox.Nodes.Invert = function() {

    Sandbox.Node.call(this);

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    this.params = {
      amount: { value: 1, min: 0, max: 1, step: 0.001 }
    };

    this.shader = this.quad.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(THREE.InvertShader.uniforms),
      vertexShader: THREE.InvertShader.vertexShader,
      fragmentShader: THREE.InvertShader.fragmentShader,
      transparent: false
    });

    this.inputs.buffer = null;
    this.buffer = this.outputs.buffer = this.createBuffer();

    this.destructables.push(this.shader, this.outputs.buffer);

  };

  _.extend(Invert.prototype, Sandbox.Node.prototype, {

    name: 'Invert',

    resize: function(width, height) {

      var scale = Math.min(1, MAX_WIDTH / width);
      var params = { width: width * scale, height: height * scale };

      this.dispose(this.buffer);
      this.buffer = this.outputs.buffer = this.createBuffer(params);

      this.destructables.push(this.buffer);

      return this;

    },

    update: function() {

      if (this.inputs.buffer) {

        this.shader.uniforms['texture'].value = this.inputs.buffer;
        this.shader.uniforms['amount'].value = this.getParam('amount');

        this.renderer.render(this.scene, this.camera, this.buffer, false);

      }

      return this.trigger('update');

    }

  });

})();