(function() {

  var MAX_WIDTH = 1920;
  
  var DrawingBlur = Sandbox.Nodes.DrawingBlur = function() {

    Sandbox.Node.call(this);

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    this.shader = new THREE.ShaderMaterial( {
      uniforms: THREE.UniformsUtils.clone( THREE.DrawingBlur.uniforms ),
      vertexShader:  THREE.DrawingBlur.vertexShader,
      fragmentShader: THREE.DrawingBlur.fragmentShader,
      depthTest: false,
      transparent: false
    } );

    this.params = {
      size: { value: 0.3, step: 0.001, min: 0, max: 1 },
      sizeRandomness: { value: 0.4, step: 0.001, min: 0, max: 1 },
      intensity: { value: 0.9, step: 0.001, min: 0, max: 1 },
      fade: { value: 0.01, step: 0.001, min: 0, max: 1 }
    };

    // this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, -1, 1 );
    // this.scene = new THREE.Scene();
    // this.scene.add( new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), this.shader ) );
    this.quad.material = this.shader;

    this.fbo0 = this.createBuffer();
    this.fbo1 = this.createBuffer();
    this.buffer = this.outputs.buffer = this.fbo0;

    this.destructables.push(this.shader, this.fbo0, this.fbo1);

  };

  _.extend(DrawingBlur.prototype, Sandbox.Node.prototype, {

    name: 'Drawing Blur',

    resize: function(width, height) {

      var scale = Math.min(1, MAX_WIDTH / width);

      this.fbo0.dispose();
      var index = _.indexOf(this.destructables, this.fbo0)
      if (index >= 0) {
        this.destructables.splice(index, 1);
      }
      this.fbo0 = this.createBuffer({ width: width * scale, height: height * scale });

      this.fbo1.dispose();
      index = _.indexOf(this.destructables, this.fbo1);
      if (index >= 0) {
        this.destructables.splice(index, 1);
      }
      this.fbo1 = this.createBuffer({ width: width * scale, height: height * scale });

      this.shader.uniforms.ratio.value.set( width / height, 1.0 );
      this.destructables.push(this.fbo0, this.fbo1);
      this.buffer = this.outputs.buffer = this.fbo0;

      return this;

    },

    update: function() {

      var temp = this.fbo1;
      this.fbo1 = this.fbo0;
      this.fbo0 = this.outputs.buffer = temp;

      this.shader.uniforms.drawingSize.value = this.getParam('size') + Math.pow(Math.random(),6.0) * this.getParam('sizeRandomness');
      this.shader.uniforms.intensity.value = this.getParam('intensity');
      this.shader.uniforms.fade.value = this.getParam('fade');

      this.shader.uniforms.previousBuffer.value = this.fbo1;

      this.renderer.render(this.scene, this.camera, this.outputs.buffer, true);

      return this.trigger('update');

    },

    onMouseMove: function(x,y) {

      this.shader.uniforms.center.value.set(x, 1 - y);

      return this;

    }

  });

})();