(function() {

  var targetParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };

  var MAX_WIDTH = 1920;

  var Bloom = Sandbox.Nodes.Bloom = function() {

    Sandbox.Node.call(this);

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    var strength = ( strength !== undefined ) ? strength : 0.5;
    var kernelSize = ( kernelSize !== undefined ) ? kernelSize : 25;
    var sigma = ( sigma !== undefined ) ? sigma : 4.0;

    this.params = {
      strength: { value: strength, step: 0.1, min: 0, max: 2 },
      'horizontal blur': { value: 0.001953125, step: 0.001, min: 0, max: 10 },
      'vertical blur': { value: 0, step: 0.001, min: 0, max: 10 }
    };

    this.blur = new THREE.Vector2( this.getParam('horizontal blur'), this.getParam('vertical blur') );

    // copy material
    this.blendShader = new THREE.ShaderMaterial( {
      uniforms: THREE.UniformsUtils.clone( THREE.AddBlendShader.uniforms ),
      vertexShader: THREE.AddBlendShader.vertexShader,
      fragmentShader: THREE.AddBlendShader.fragmentShader,
      transparent: false
    } );
    this.blendShader.uniforms[ "blend" ].value = this.getParam('strength');

    // convolution material
    this.shader = new THREE.ShaderMaterial( {
      uniforms: THREE.UniformsUtils.clone( THREE.ConvolutionShader.uniforms ),
      vertexShader:  THREE.ConvolutionShader.vertexShader,
      fragmentShader: THREE.ConvolutionShader.fragmentShader,
      defines: {
        "KERNEL_SIZE_FLOAT": kernelSize.toFixed( 1 ),
        "KERNEL_SIZE_INT": kernelSize.toFixed( 0 )
      }
    } );
    this.shader.uniforms[ "uImageIncrement" ].value = this.blur; // TODO
    this.shader.uniforms[ "cKernel" ].value = THREE.ConvolutionShader.buildKernel( sigma );

    // this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, -1, 1 );
    // this.scene = new THREE.Scene();
    // this.scene.add( new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), this.shader ) );
    this.quad.material = this.shader;

    this.inputs.buffer = null;

    this.fbo0 = new THREE.WebGLRenderTarget(0, 0, targetParameters);
    this.fbo1 = new THREE.WebGLRenderTarget(0, 0, targetParameters);
    
    this.buffer = this.outputs.buffer = new THREE.WebGLRenderTarget(0, 0, targetParameters);
    this.outputs.buffer.__parentNode = this;

    this.destructables.push(this.shader, this.blendShader, this.buffer, this.fbo0, this.fbo1);

  };

  _.extend(Bloom.prototype, Sandbox.Node.prototype, {

    name: 'Bloom',

    resize: function(width, height) {

      var scale = Math.min(1, MAX_WIDTH / width);

      this.outputs.buffer.width = width * scale;
      this.outputs.buffer.height = height * scale;

      this.fbo0.width = width * scale / 16;
      this.fbo0.height = height * scale / 16;
      this.fbo1.width = width * scale / 16;
      this.fbo1.height = height * scale / 16;
      this.outputs.buffer.width = width * scale;
      this.outputs.buffer.height = height * scale;

      return this;

    },

    update: function() {

      if (this.inputs.buffer) {

        this.blur.x = this.getParam('horizontal blur');
        this.blur.y = this.getParam('vertical blur');

        this.blendShader.uniforms[ "blend" ].value = this.getParam('strength');

        this.shader.uniforms[ "texture" ].value = this.inputs.buffer;
        this.shader.uniforms[ "uImageIncrement" ].value = this.blur;
        this.renderer.render(this.scene, this.camera, this.fbo0, false);

        this.shader.uniforms[ "texture" ].value = this.fbo0;
        // this.shader.uniforms[ "uImageIncrement" ].value = this.blurY;
        this.renderer.render(this.scene, this.camera, this.fbo1, false);

        this.scene.overrideMaterial = this.blendShader;
        this.blendShader.uniforms[ "texture1" ].value = this.inputs.buffer;
        this.blendShader.uniforms[ "texture2" ].value = this.fbo1;
        this.renderer.render(this.scene, this.camera, this.outputs.buffer, false);
        this.scene.overrideMaterial = null;

      }

      return this.trigger('update');

    }

  });

})();