(function() {

  var MAX_WIDTH = 1920 / 4, perlin = new SimplexNoise(Math);

  var loadTexture = THREE.ImageUtils.loadTexture, textureParams = {
    minFilter: THREE.LinearMipMapLinearFilter,
    wrapS: THREE.MirroredRepeatWrapping,
    wrapT: THREE.MirroredRepeatWrapping,
    generateMipmaps: true
  };
  var target = new THREE.Vector3();

  var BrokenMirror = Sandbox.Nodes.BrokenMirror = function() {

    Sandbox.Node.call(this);

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    this.camera.near = -1000;
    this.camera.far = 1000;
    this.camera.updateProjectionMatrix();

    this.shader = this.quad.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(THREE.BrokenMirrorShader.uniforms),
      vertexShader: THREE.BrokenMirrorShader.vertexShader,
      fragmentShader: THREE.BrokenMirrorShader.fragmentShader,
      depthTest: false,
      transparent: false
    });

    this.params = {
      offset: { value: 50, min: 0, max: 100, step: 1 },
      scale: { value: 5, min: 0, max: 10, step: 1 },
      'color offset': { value: 0, min: 0, max: 12, step: 0.1 },
      diffraction: { value: 0, min: 0, max: 1, step: 0.001 },
      parallax: { value: 0, min: 0, max: 1, step: 0.001 },
      flipX: { value: false },
      flipY: { value: false }
    };

    this.shader.uniforms.tDiffuse.value = BrokenMirror.Textures.diffuse;
    this.shader.uniforms.tMask.value = BrokenMirror.Textures.mask;
    this.shader.uniforms.tEdges.value = BrokenMirror.Textures.edges;

    this.blankBuffer = this.createBuffer();
    this.blankCamera = new THREE.OrthographicCamera( -1, 1, 1, -1, -1, 1 );
    this.blankScene = new THREE.Scene();
    this.blankScene.add( new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ) ) );

    this.inputs.video = null;
    this.outputs.buffer = this.buffer = this.createBuffer();

    this.destructables.push(this.camera, this.buffer, this.shader,
      this.blankBuffer, this.blankCamera, this.blankScene);

  };

  _.extend(BrokenMirror, {

    Textures: {
      diffuse: loadTexture(
        resource.get('/media/images/brokenmirror/mirror_diffuse.jpg'),
        textureParams
      ),
      mask: loadTexture(
        resource.get('/media/images/brokenmirror/mirror_mask.png'),
        textureParams
      ),
      edges: loadTexture(
        resource.get('/media/images/brokenmirror/mirror_edges.jpg'),
        textureParams
      )
    }

  });

  _.extend(BrokenMirror.prototype, Sandbox.Node.prototype, {

    name: 'Broken Mirror',

    resize: function(width, height) {

      var scale = Math.min(1, MAX_WIDTH / width);
      var params = { width: width * scale, height: height * scale };

      this.dispose(this.buffer);
      this.buffer = this.outputs.buffer = this.createBuffer(params);

      this.dispose(this.blankBuffer);
      this.blankBuffer = this.createBuffer(params);

      this.destructables.push(this.buffer, this.blankBuffer);

      return this;

    },

    update: function() {

      if (this.inputs.video) {

        if (this.shader.uniforms['tWebcam'].value !== this.inputs.video) {
          this.shader.uniforms['tWebcam'].value = this.inputs.video;
        }

        var width = (this.inputs.video.image && (this.inputs.video.image.videoWidth || this.inputs.video.image.width)) || this.inputs.video.width;
        var height = (this.inputs.video.image && (this.inputs.video.image.videoHeight || this.inputs.video.image.height)) || this.inputs.video.height;
        var maxOffset = this.getParam('offset') * 2 - this.params.offset.max;
        var scale = this.getParam('scale') * 2 - this.params.scale.max;

        this.shader.uniforms['offset'].value.set(1 / width, 1 / height);
        this.shader.uniforms['maxOffset'].value.set(maxOffset / width, maxOffset / height);
        this.shader.uniforms['maxScale'].value = scale;
        this.shader.uniforms['chromaticAberration'].value = this.getParam('color offset');
        this.shader.uniforms['edgesDiffraction'].value = this.getParam('diffraction');
        this.shader.uniforms['parallax'].value = this.getParam('parallax');
        this.shader.uniforms['flipX'].value = this.getParam('flipX');
        this.shader.uniforms['flipY'].value = this.getParam('flipY');

      } else {

        if (this.shader.uniforms['tWebcam'].value !== this.blankBuffer) {
          this.shader.uniforms['tWebcam'].value = this.blankBuffer;
        }

      }

      this.renderer.render(this.scene, this.camera, this.buffer, false);

      return this.trigger('update');

    }

  });

  function getCameraZ(camera, vh) {
    return vh / (2 * Math.tan((camera.fov || 45) / 2 * (Math.PI / 180)));
  }

})();