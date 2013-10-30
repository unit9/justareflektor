
(function() {

  var MAX_WIDTH = 1920;

  var ext = "#extension GL_OES_standard_derivatives : enable\n";
  
  var ShaderToy = Sandbox.Nodes.ShaderToy = function() {

    Sandbox.Node.call(this);

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    this.params = {
      resolution: { value: new THREE.Vector3(0, 0, 0) },
      vertexShader: { value: THREE.ShaderToyShader.vertexShader },
      fragmentShader: { value: THREE.ShaderToyShader.fragmentShader }
    }

    this.compile();

    this.inputs.iChannel0 = null;
    this.inputs.iChannel1 = null;
    this.inputs.iChannel2 = null;
    this.inputs.iChannel3 = null;

    this.buffer = this.outputs.buffer = this.createBuffer();
    this.destructables.push(this.shader, this.buffer);

  };

  _.extend(ShaderToy.prototype, Sandbox.Node.prototype, {

    name: 'ShaderToy',

    compile: function() {

      this.shader = this.quad.material = new THREE.ShaderMaterial( {
        uniforms: THREE.UniformsUtils.clone( THREE.ShaderToyShader.uniforms ),
        vertexShader:  this.params.vertexShader.value,
        fragmentShader: ext + this.params.fragmentShader.value,
        transparent: false
      } );

    },

    resize: function(width, height) {

      var scale = Math.min(1, MAX_WIDTH / width);

      this.dispose(this.buffer);
      this.buffer = this.outputs.buffer = this.createBuffer({ width: width * scale, height: height * scale });
      this.destructables.push(this.buffer);

      this.params.resolution.value.set(width, height, 0);

      return this;

    },

    update: function() {

      this.shader.uniforms.iGlobalTime.value = (Date.now()/1000) % 1000;
      this.shader.uniforms.iResolution.value = this.params.resolution.value;

      if (this.inputs.iChannel0) {
        if (this.shader.uniforms.iChannel0.value !== this.inputs.iChannel0 ) {
          this.shader.uniforms.iChannel0.value = this.inputs.iChannel0;
        }
      }

      if (this.inputs.iChannel1) {
        if (this.shader.uniforms.iChannel1.value !== this.inputs.iChannel1 ) {
          this.shader.uniforms.iChannel1.value = this.inputs.iChannel1;
        }
      }

      if (this.inputs.iChannel2) {
        if (this.shader.uniforms.iChannel2.value !== this.inputs.iChannel2 ) {
          this.shader.uniforms.iChannel2.value = this.inputs.iChannel2;
        }
      }

      if (this.inputs.iChannel3) {
        if (this.shader.uniforms.iChannel3.value !== this.inputs.iChannel3 ) {
          this.shader.uniforms.iChannel3.value = this.inputs.iChannel3;
        }
      }

      this.renderer.render(this.scene, this.camera, this.outputs.buffer, true);

      return this.trigger('update');

    }

  });

})();