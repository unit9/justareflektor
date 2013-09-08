(function() {

  var MAX_WIDTH = 1920;
  
  var Vibrance = Sandbox.Nodes.Vibrance = function() {

    Sandbox.Node.call(this);

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    this.shader = new THREE.ShaderMaterial( {
      uniforms: THREE.UniformsUtils.clone( THREE.Vibrance.uniforms ),
      vertexShader:  THREE.Vibrance.vertexShader,
      fragmentShader: THREE.Vibrance.fragmentShader,
      depthTest:false,
      transparent:false
    } );

    // this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, -1, 1 );
    // this.scene = new THREE.Scene();
    // this.scene.add( new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), this.shader ) );
    this.quad.material = this.shader;

    this.fbo0 = this.createBuffer();
    this.buffer = this.outputs.buffer = this.fbo0;

    this.params = {
      effectAlpha: { value: 0.5, step: 0.001, min: 0, max: 1 }
    };

    this.inputs.video = null;
    this.inputs.mask = null;

    this.destructables.push(this.shader, this.fbo0);

  };

  _.extend(Vibrance.prototype, Sandbox.Node.prototype, {

    name: 'Vibrance',

    resize: function(width, height) {

      var scale = Math.min(1, MAX_WIDTH / width);

      var index = _.indexOf(this.destructables, this.fbo0);
      if (index >= 0) {
        this.destructables.splice(index, 1);
      }
      this.fbo0.dispose();
      this.fbo0 = this.createBuffer({ width: width * scale, height: height * scale });
      this.buffer = this.outputs.buffer = this.fbo0;
      this.destructables.push(this.buffer);

      return this;

    },

    update: function() {

      if (this.inputs.mask && this.inputs.video) {

        if (this.shader.uniforms.maskBuffer.value !== this.inputs.mask ) {

          this.shader.uniforms.maskBuffer.value = this.inputs.mask;

        }

        if (this.shader.uniforms.videoBuffer.value !== this.inputs.video ) {

          this.shader.uniforms.videoBuffer.value = this.inputs.video;

        }

        this.renderer.render(this.scene, this.camera, this.outputs.buffer, true);

        this.shader.uniforms.timep.value = performance.now()*0.01;
        this.shader.uniforms.effectAlpha.value = this.getParam('effectAlpha');

      }

      return this.trigger('update');

    }

  });

})();