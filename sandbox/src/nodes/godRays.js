(function() {

  var MAX_WIDTH = 1920 / 4;

  var GodRays = Sandbox.Nodes.GodRays = function() {

    Sandbox.Node.call(this);

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    this.params = {
      intensity: { value: 1.5, min: 0, max: 10, step: 0.001 },
      rayLength: { value: 1.0, min: 0, max: 1, step: 0.001 }
    };

    this.shader = this.quad.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone( THREE.GodRaysShader.uniforms ),
      vertexShader: THREE.GodRaysShader.vertexShader,
      fragmentShader: THREE.GodRaysShader.fragmentShader,
      blending: THREE.AdditiveBlending,
      defines: THREE.GodRaysShader.defines,
      transparent: false
    });

    this.inputs.texture = null;

    this.fbo0 = this.createBuffer();
    this.fbo1 = this.createBuffer();
    this.buffer = this.outputs.buffer = this.fbo0;

    this.destructables.push(this.fbo0, this.fbo1, this.shader);

  };

  _.extend(GodRays.prototype, Sandbox.Node.prototype, {

    name: 'God Rays',

    resize: function(width, height) {

      var scale = Math.min(1, MAX_WIDTH / width);

      this.dispose(this.fbo0);
      this.fbo0 = this.createBuffer({ width: width * scale, height: height * scale });

      this.dispose(this.fbo1);
      this.fbo1 = this.createBuffer({ width: width * scale, height: height * scale });

      this.destructables.push(this.fbo0, this.fbo1);
      this.buffer = this.outputs.buffer = this.fbo0;

      return this;

    },

    update: function() {

      if (this.inputs.texture) {

        if (this.shader.uniforms[ "texture" ].value !== this.inputs.texture ) {
          this.shader.uniforms[ "texture" ].value = this.inputs.texture;
        }

        var filterLen = 1.0;
        var TAPS_PER_PASS = 6.0;

        var pass = 1.0;
        var stepLen = filterLen * Math.pow( TAPS_PER_PASS, -pass );

        this.shader.uniforms.intensity.value = this.getParam('intensity');
        this.shader.uniforms.rayLength.value = this.getParam('rayLength');
        this.shader.uniforms.aspect.value = this.buffer.width / this.buffer.height;

        this.shader.uniforms[ "fStepSize" ].value = stepLen;
        this.shader.uniforms[ "texture" ].value = this.inputs.texture;
        this.renderer.render(this.scene, this.camera, this.fbo0, false);

        pass = 2.0;
        stepLen = filterLen * Math.pow( TAPS_PER_PASS, -pass );

        this.shader.uniforms[ "fStepSize" ].value = stepLen;
        this.shader.uniforms[ "texture" ].value = this.fbo0;
        this.renderer.render(this.scene, this.camera, this.fbo1, false);

        pass = 3.0;
        stepLen = filterLen * Math.pow( TAPS_PER_PASS, -pass );

        this.shader.uniforms[ "fStepSize" ].value = stepLen;
        this.shader.uniforms[ "texture" ].value = this.fbo1;
        this.renderer.render(this.scene, this.camera, this.fbo0, true);

      }

      return this.trigger('update');

    },

    onMouseMove: function(x, y) {

      this.shader.uniforms.center.value.set(x, 1 - y);
      return this;

    }

  });

})();