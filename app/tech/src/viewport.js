(function() {

  var $window = $(window);

  var Viewport = Sandbox.Viewport = function(options) {

    var params = _.defaults(options || {}, {
      width: 1920,
      height: 1080
    });

    this.width = params.width;
    this.height = params.height;

    this.domElement = document.createElement('div');
    // this.domElement.classList.add(Viewport.className, Sandbox.className);
    $(this.domElement).addClass(Viewport.className + ' ' + Sandbox.className);

    this.renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true, antialias:false });
    this.renderer.setClearColor(new THREE.Color( 0x000000 ), 0);
    this.renderer.autoClear = false;

    this.domElement.appendChild(this.renderer.domElement);

    this.setSize(this.width, this.height);

    this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, -1, 1 );
    this.quad = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), new THREE.MeshBasicMaterial( { map: null } ) );
    this.scene = new THREE.Scene();
    this.scene.add(this.quad);

    this.inputs = {
      buffer: null
    };

  };

  _.extend(Viewport, {

    className: 'viewport'

  });

  _.extend(Viewport.prototype, {

    appendTo: function(elem) {

      elem.appendChild(this.domElement);
      return this;

    },

    setSize: function(width, height) {

      // console.log(width,height);

      this.width = width;
      this.height = height;

      this.renderer.setSize(width / (window.devicePixelRatio || 1), height / (window.devicePixelRatio || 1));

      _.extend(this.domElement.style, {
        width: width + 'px',
        height: height + 'px'
      });
      
      _.extend(this.renderer.domElement.style, {
        width: width + 'px',
        height: height + 'px'
      });

      return this;

    },

    update: function() {

      if (this.inputs.buffer) {
        this.render(this.inputs.buffer, this.width / 2, 0, this.width / 2, this.height);
      }

      return this;

    },

    render: function(buffer, x, y, width, height) {

      this.quad.material.map = buffer;
      // this.quad.material.needsUpdate = true;
      this.renderer.setViewport(x, this.height - height - y, width, height);
      this.renderer.render(this.scene, this.camera);

      return this;

    }

  });

})();