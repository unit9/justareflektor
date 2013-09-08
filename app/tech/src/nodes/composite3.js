(function() {

  var targetParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };

  var MAX_WIDTH = 1920;

  var Composite3 = Sandbox.Nodes.Composite3 = function() {

    Sandbox.Node.call(this);

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    this.shader = new THREE.ShaderMaterial( {
      uniforms: THREE.UniformsUtils.clone( THREE.Composite3Shader.uniforms ),
      vertexShader:  THREE.Composite3Shader.vertexShader,
      fragmentShader: THREE.Composite3Shader.fragmentShader,
      transparent: false
    });

    this.params = {
      opacity1: { value: 1, min: 0, max: 1, step: 0.001 },
      opacity2: { value: 1, min: 0, max: 1, step: 0.001 },
      blending: {
        options: Composite3.BlendModes,
        onUpdate: _.bind(function() {

          var mode = this.getParam('blending');
          this.shader.uniforms.mode.value = mode;

        }, this)
      }
    };

    this.quad.material = this.shader;

    this.blankBuffer = this.createBuffer();
    this.blankCamera = new THREE.OrthographicCamera( -1, 1, 1, -1, -1, 1 );
    this.blankScene = new THREE.Scene();
    this.blankScene.add( new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ) ) );

    this.inputs.buffer1 = null;
    this.inputs.buffer2 = null;

    this.buffer = this.outputs.buffer = this.createBuffer();

    this.destructables.push(
      this.shader, this.buffer, this.blankBuffer,
      this.blankCamera, this.blankScene
    );

  };

  _.extend(Composite3, {

    BlendModes: [
      {
        name: 'Additive',
        value: 0
      },
      {
        name: 'Subtractive',
        value: 1
      },
      {
        name: 'Multiply',
        value: 2
      }
    ]

  });

  _.extend(Composite3.prototype, Sandbox.Node.prototype, {

    name: 'Composite',

    resize: function(width, height) {

      var scale = Math.min(1, MAX_WIDTH / width);
      var params = { width: width * scale, height: height * scale };

      this.dispose(this.buffer);
      this.buffer = this.outputs.buffer = this.createBuffer(params);

      this.dispose(this.blankBuffer);
      this.blankBuffer = this.createBuffer(params);

      return this;

    },

    update: function() {

      var buffer  = _.isNull(this.inputs.buffer1) ? this.blankBuffer : this.inputs.buffer1;

      if (this.shader.uniforms.texture1.value !== buffer) {

        this.shader.uniforms.texture1.value = buffer;

      }

      buffer = _.isNull(this.inputs.buffer2) ? this.blankBuffer : this.inputs.buffer2;

      if (this.shader.uniforms.texture2.value !== buffer) {

        this.shader.uniforms.texture2.value = buffer;

      }

      this.shader.uniforms.opacity1.value = this.getParam('opacity1');
      this.shader.uniforms.opacity2.value = this.getParam('opacity2');

      this.renderer.render(this.scene, this.camera, this.outputs.buffer, true);

      return this.trigger('update');

    }

  });

})();