
(function() {

  var MAX_WIDTH = 1920;

  var ext = "#extension GL_OES_standard_derivatives : enable\n";
  
  var ShaderToy = Sandbox.Nodes.ShaderToy = function() {

    Sandbox.Node.call(this);

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);


    this.shader = this.quad.material = new THREE.ShaderMaterial( {
      uniforms: THREE.UniformsUtils.clone( THREE.ShaderToyShader.uniforms ),
      vertexShader:  THREE.ShaderToyShader.vertexShader,
      fragmentShader: ext + THREE.ShaderToyShader.fragmentShader,
      transparent: false
    } );

    this.params = {
      fragment: { value: THREE.ShaderToyShader.fragmentShader }
    }

    this.buffer = this.outputs.buffer = this.createBuffer();
    this.destructables.push(this.shader, this.buffer);

  };

  _.extend(ShaderToy.prototype, Sandbox.Node.prototype, {

    name: 'ShaderToy',

    resize: function(width, height) {

      var scale = Math.min(1, MAX_WIDTH / width);

      this.dispose(this.buffer);
      this.buffer = this.outputs.buffer = this.createBuffer({ width: width * scale, height: height * scale });
      this.destructables.push(this.buffer);

      this.shader.uniforms.iResolution.value = new THREE.Vector3(width, height, 0);
      

      return this;

    },

    update: function() {

      this.shader.uniforms.iGlobalTime.value = (Date.now()/1000) % 1000;

      this.renderer.render(this.scene, this.camera, this.outputs.buffer, true);

      return this.trigger('update');

    }

  });

})();