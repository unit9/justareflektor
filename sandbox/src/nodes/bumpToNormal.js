(function() {

  var MAX_WIDTH = 1920;
  
  var BumpToNormal = Sandbox.Nodes.BumpToNormal = function() {

    Sandbox.Node.call(this);

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    this.shader = new THREE.ShaderMaterial( {
      uniforms: THREE.UniformsUtils.clone( THREE.BumpToNormal.uniforms ),
      vertexShader:  THREE.BumpToNormal.vertexShader,
      fragmentShader: THREE.BumpToNormal.fragmentShader,
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
      intensity: { value: 1, step: 0.001, min: 0, max: 100 }
    };


    this.inputs.buffer = null;

    this.destructables.push(this.shader, this.fbo0, this.buffer);

  };

  _.extend(BumpToNormal.prototype, Sandbox.Node.prototype, {

    name: 'Bump To Normal',

    resize: function(width, height) {

      var scale = Math.min(1, MAX_WIDTH / width);

      this.fbo0.dispose();
      var index = _.indexOf(this.destructables, this.fb0);
      if (index >= 0) {
        this.destructables.splice(index, 1);
      }
      this.fbo0 = this.createBuffer({ width: width * scale, height: height * scale });
      this.buffer = this.outputs.buffer = this.fbo0;

      this.shader.uniforms.resolution.value.set( width * scale, height * scale );
      this.destructables.push(this.fbo0);
      // console.log(this.shader.uniforms.resolution.value);

      return this;

    },

    update: function() {

      if (this.inputs.buffer) {

        if (this.shader.uniforms.bumpBuffer.value !== this.inputs.buffer ) {

          this.shader.uniforms.bumpBuffer.value = this.inputs.buffer;

        }

        this.shader.uniforms.intensity.value = this.getParam('intensity');

        this.renderer.render(this.scene, this.camera, this.outputs.buffer, true);

      }

      return this.trigger('update');

    }

  });

})();