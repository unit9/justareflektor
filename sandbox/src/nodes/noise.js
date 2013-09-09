(function() {

  var MAX_WIDTH = 1920 / 4;

  var Noise = Sandbox.Nodes.Noise = function() {

    Sandbox.Node.call(this);

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    this.params = {
      fade: { value: 1, step: 0.001, min: 0, max: 1 }
    };

    this.shader = this.quad.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(THREE.NoiseShader.uniforms),
      vertexShader: THREE.NoiseShader.vertexShader,
      fragmentShader: THREE.NoiseShader.fragmentShader,
      transparent: false
    });

    this.inputs.buffer = null;
    this.buffer = this.outputs.buffer = this.createBuffer();

    this.destructables.push(this.shader, this.outputs.buffer);

  };

  _.extend(Noise.prototype, Sandbox.Node.prototype, {

    name: 'Noise',

    resize: function(width, height) {

      var scale = Math.min(1, MAX_WIDTH / width);
      var params = { width: width * scale, height: height * scale };

      this.dispose(this.buffer);
      this.buffer = this.outputs.buffer = this.createBuffer(params);

      this.destructables.push(this.buffer);

      return this;

    },

    update: function() {

      // var res = this.getParam('amount');

      if (this.inputs.buffer) {

        this.shader.uniforms['texture'].value = this.inputs.buffer;
        this.shader.uniforms['fade'].value = this.getParam('fade');

        this.renderer.render(this.scene, this.camera, this.buffer, false);

      }

      return this.trigger('update');

    }

  });

})();