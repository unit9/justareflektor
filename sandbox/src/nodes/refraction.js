(function() {

  var MAX_WIDTH = 1920;

  var Refraction = Sandbox.Nodes.Refraction = function() {

    Sandbox.Node.call(this);

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    this.shader = this.quad.material = new THREE.ShaderMaterial( {
      uniforms: THREE.UniformsUtils.clone( THREE.RefractionShader.uniforms ),
      vertexShader:  THREE.RefractionShader.vertexShader,
      fragmentShader: THREE.RefractionShader.fragmentShader,
      transparent: false
    } );

    this.inputs.normal = null;
    this.inputs.video = null;

    this.buffer = this.outputs.buffer = this.createBuffer();
    this.destructables.push(this.shader, this.buffer);

  };

  _.extend(Refraction.prototype, Sandbox.Node.prototype, {

    name: 'Refraction',

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

      if (this.inputs.normal && this.inputs.video) {

        if (this.shader.uniforms.normalBuffer.value !== this.inputs.normal ) {

          this.shader.uniforms.normalBuffer.value = this.inputs.normal;

        }

        if (this.shader.uniforms.videoBuffer.value !== this.inputs.video ) {

          this.shader.uniforms.videoBuffer.value = this.inputs.video;

        }

        this.renderer.render(this.scene, this.camera, this.outputs.buffer, true);

      }


      return this.trigger('update');

    }

  });

})();