(function() {

  var MAX_WIDTH = 1920 / 4;

  var Blur = Sandbox.Nodes.Blur = function() {

    Sandbox.Node.call(this);

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    this.width = 1;
    this.height = 1;

    this.params = {
      amount: { value: 4, step: 0.25, min: 0, max: 50 }
    };

    this.shader = this.quad.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(THREE.OffsetBlurShader.uniforms),
      vertexShader: THREE.OffsetBlurShader.vertexShader,
      fragmentShader: THREE.OffsetBlurShader.fragmentShader,
      transparent: false
    });

    this.inputs.buffer = null;
    this.buffer = this.outputs.buffer = this.createBuffer();

    this.destructables.push(this.shader, this.outputs.buffer);

  };

  _.extend(Blur.prototype, Sandbox.Node.prototype, {

    name: 'Blur',

    resize: function(width, height) {

      var scale = Math.min(1, MAX_WIDTH / width);
      var params = { width: width * scale, height: height * scale };

      this.width = width;
      this.height = height;

      this.dispose(this.buffer);
      this.buffer = this.outputs.buffer = this.createBuffer(params);

      this.destructables.push(this.buffer);

      return this;

    },

    update: function() {

      var res = this.getParam('amount');

      if (this.inputs.buffer) {

        this.shader.uniforms['tDiffuse'].value = this.inputs.buffer;
        this.shader.uniforms['offset'].value.set(res / this.width, res / this.height);

        this.renderer.render(this.scene, this.camera, this.buffer, false);

      }

      return this.trigger('update');

    }

  });

})();