(function() {

  function centerObject( object ) {
    if ( object.geometry ) {
      object.geometry.computeBoundingBox();
      var center = object.geometry.boundingBox.min.clone().add(object.geometry.boundingBox.max.clone()).multiplyScalar(0.5);
      THREE.GeometryUtils.center(object.geometry);
      object.position.copy(center);
    }
  }

  function addPhysics( object, parameters ) {

    parameters = parameters ? parameters : {};

    // object.useQuaternion = true;
    object.randomAxis = new THREE.Vector3( Math.random()-0.5, Math.random()-0.5, Math.random()-0.5 ).normalize();
    object.angle = 0
    object.momentum = 0;

    object.velocity = parameters.velocity ? parameters.velocity : new THREE.Vector3();
    object.damping = parameters.damping ? parameters.damping : 0.999;

    object.positionStart = object.position.clone(object.position);

    object.update = function() {
      this.velocity.multiplyScalar( this.damping );
      this.position.add(this.velocity);
      this.momentum *= this.damping;
      this.angle += this.momentum;
      this.quaternion.setFromAxisAngle( this.randomAxis, this.angle );
    }
  }

  var targetParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };

  var MAX_WIDTH = 160;

  var projector = new THREE.Projector();
  var vector, raycaster, intersects, intensity, posNorm;

  var breakingGlassScene = Sandbox.Nodes.BreakingGlassScene = function() {

    Sandbox.Node.call(this);

    this.destroy();

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    var scene = this.scene = new THREE.Scene();
    this.scene.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 10000 );
    this.scene.camera.position.z = -50;
    this.scene.camera.lookAt( this.scene.position );

    var scope = this;
    this.glass = null;

    this.mouseX = 0;
    this.mouseY = 0;

    this.wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });

    var loader = new THREE.OBJLoader();
    loader.load( '/tech/models/shattered_glass.obj', function ( object ) {

      var material = new THREE.MeshNormalMaterial();

      for (var i in object.children ) {

        var child = object.children[i];
        child.material = material;
        centerObject( child );
        addPhysics( child );

        var intensity = Math.max(2.5-child.position.length()*25, 0) * 0.01;

        var posNorm = child.position.clone().normalize();
        child.velocity.x = posNorm.x*intensity*0.01;
        child.velocity.y = posNorm.y*intensity*0.01;
        child.velocity.z = -intensity*0.1;

        child.momentum = intensity;

      };

      scope.glass = object;
      scope.glass.scale.set(100,100,100);
      scene.add( scope.glass );

      scope.destructables.push(scope.glass, material);

    });

    this.params = {
      force: { value: 0.05, step: 0.001, min: 0, max: 1 },
      spin: { value: 1, step: 0.001, min: 0, max: 10 },
      randomness: { value: 0.15, step: 0.001, min: 0, max: 1 },
      radius: { value: 0.03, step: 0.001, min: 0, max: 1 },
      damping: { value: 0.025, step: 0.001, min: 0, max: 0.1 }
    };

    var collisionPlane = this.collisionPlane = new THREE.Mesh( new THREE.PlaneGeometry( 100,100, 1, 1 ), new THREE.MeshNormalMaterial());
    collisionPlane.rotation.y = Math.PI;
    collisionPlane.visible = false;
    scene.add(collisionPlane);

    this.outputs.scene = this.scene;

    this.buffer = new THREE.WebGLRenderTarget(0, 0, targetParameters);

    this.destructables.push(this.buffer, this.wireframeMaterial, this.scene, this.scene.camera);

  };

  _.extend(breakingGlassScene.prototype, Sandbox.Node.prototype, {

    name: 'Breaking Glass',

    resize: function(width, height) {

      this.scene.camera.aspect = width / height;
      this.scene.camera.updateProjectionMatrix();

      var scale = Math.min(1, MAX_WIDTH / width);

      this.buffer.width = width * scale;
      this.buffer.height = height * scale;

      return this;

    },

    update: function() {

      if ( this.glass ) {
        for (var i in this.glass.children ) {
          this.glass.children[i].update();
        };
      }

      this.scene.overrideMaterial = this.wireframeMaterial;

      this.renderer.render(this.scene, this.scene.camera, this.buffer, true);

      this.scene.overrideMaterial = null;

      return this.trigger('update');

    },

    onMouseMove: function(x,y) {

      // event.preventDefault();

      vector = new THREE.Vector3( x * 2 - 1, - y * 2 + 1, 0.5 );
      projector.unprojectVector( vector, this.scene.camera );
      raycaster = new THREE.Raycaster( this.scene.camera.position, vector.sub( this.scene.camera.position ).normalize() );
      intersects = raycaster.intersectObject( this.collisionPlane );

      if ( intersects.length > 0 && this.glass ) {

        this.mouseX = x;
        this.mouseY = 1 - y;

      }

    },

    onMouseDown: function(x,y) {

      for (var i in this.glass.children ) {
        this.glass.children[i].position.copy( this.glass.children[i].positionStart );
        this.glass.children[i].angle = 0;

        intensity = Math.max(this.getParam('radius')-this.glass.children[i].position.length()+(Math.random()*this.getParam('randomness')),0)*this.getParam('force') / this.getParam('radius');

        posNorm = this.glass.children[i].position.clone().normalize();
        this.glass.children[i].velocity.x = posNorm.x*intensity*0.01;
        this.glass.children[i].velocity.y = posNorm.y*intensity*0.01;
        this.glass.children[i].velocity.z = -intensity*0.1;

        this.glass.children[i].momentum = intensity*this.getParam('spin');

      };

      if ( intersects.length > 0 && this.glass ) {
        this.glass.position.y = intersects[ 0 ].point.y;
        this.glass.position.x = intersects[ 0 ].point.x;
      }

    }

  });

})();