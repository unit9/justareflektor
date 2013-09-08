(function() {

  var MAX_WIDTH = 1920;
  
  var VideoFeedback = Sandbox.Nodes.VideoFeedback = function() {

    Sandbox.Node.call(this);

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    this.shader = new THREE.ShaderMaterial( {
      uniforms: THREE.UniformsUtils.clone( THREE.VideoFeedback.uniforms ),
      vertexShader:  THREE.VideoFeedback.vertexShader,
      fragmentShader: THREE.VideoFeedback.fragmentShader,
      depthTest:false,
      transparent:false
    } );

    // this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, -1, 1 );
    // this.scene = new THREE.Scene();
    // this.scene.add( new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), this.shader ) );
    this.quad.material = this.shader;

    this.fbo0 = this.createBuffer();
    this.fbo1 = this.createBuffer();
    this.buffer = this.outputs.buffer = this.fbo0;

    this.inputs.video = null;
    this.inputs.mask = null;

    this.destructables.push(this.shader, this.fbo0, this.fbo1);

  };

  _.extend(VideoFeedback.prototype, Sandbox.Node.prototype, {

    name: 'Video Feedback',

    resize: function(width, height) {

      var scale = Math.min(1, MAX_WIDTH / width);

      var index = _.indexOf(this.destructables, this.fbo0);
      if (index >= 0) {
        this.destructables.splice(index, 1);
      }
      this.fbo0.dispose();
      this.fbo0 = this.createBuffer({ width: width * scale, height: height * scale });

      index = _.indexOf(this.destructables, this.fbo0);
      if (index >= 0) {
        this.destructables.splice(index, 1);
      }
      this.fbo1.dispose();
      this.fbo1 = this.createBuffer({ width: width * scale, height: height * scale });
      this.buffer = this.outputs.buffer = this.fbo0;

      this.destructables.push(this.fbo0, this.fbo1);

      return this;

    },

    update: function() {

      var temp = this.fbo1;
      this.fbo1 = this.fbo0;
      this.fbo0 = this.outputs.buffer = temp;

      if (this.inputs.mask && this.inputs.video) {

        if (this.shader.uniforms.maskBuffer.value !== this.inputs.mask ) {

          this.shader.uniforms.maskBuffer.value = this.inputs.mask;

        }

        if (this.shader.uniforms.videoBuffer.value !== this.inputs.video ) {

          this.shader.uniforms.videoBuffer.value = this.inputs.video;

        }

        this.shader.uniforms.previousBuffer.value = this.fbo1;

        this.renderer.render(this.scene, this.camera, this.outputs.buffer, true);

      }

      return this.trigger('update');

    }

  });

})();