

(function() {

  var Node = Sandbox.Node = function() {

    this.id = Sandbox.uniqueId();
    this.params = {};
    this.inputs = {};
    this.outputs = {};

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, -1, 1 );
    this.quad = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ) );
    this.scene.add( this.quad );

    this.destructables = [this.scene, this.camera, this.quad];

    this.shouldRender = true;

  };

  _.extend(Node.prototype, Backbone.Events, {

    type: 'Node',

    update: _.identity,

    setId: function(id) {

      this.id = id;
      return this;

    },

    setParams: function(params) {

      _.each(params, function(v, k) {

        if (!_.isUndefined(this.params[k])) {
          this.params[k].value = v;
          if (_.isFunction(this.params[k].onUpdate)) {
            this.params[k].onUpdate();
          }
        }

      }, this);

      return this;

    },

    /**
     * Get a parameter's value.
     */
    getParam: function(name) {

      return this.params[name] && this.params[name].value;

    },

    extractParams: function() {

      var result = {};
      _.each(this.params, function(o, k) {
        result[k] = this.getParam(k);
      }, this);

      return result;

    },

    /**
     * Bind a node to a given sandbox instance.
     */
    attach: function(sandbox) {
      this.sandbox = sandbox;
      this.renderer = sandbox.viewport.renderer;
      this.viewport = sandbox.viewport;
      return this;
    },

    createBuffer: function(parameters) {

      parameters = _.defaults(parameters || {}, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBFormat,
        stencilBuffer: false,
        generateMipmaps: false,
        width: 0,
        height: 0
      });

      var buffer = new THREE.WebGLRenderTarget(parameters.width, parameters.height, parameters);
      buffer.generateMipmaps = parameters.generateMipmaps;
      buffer.__parentNode = this;

      return buffer;

    },

    dispose: function(object) {

      if (_.isFunction(object.dispose)) {
        object.dispose();
      }

      var index = _.indexOf(this.destructables, object);
      if (index < 0) {
        return this;
      }

      this.destructables.splice(index, 1);
      return this;

    },

    destroy: function() {

      _.each(_.compact(this.destructables), function(i) {
        if (_.isFunction(i.dispose)) {
          i.dispose();
        }
      });

      this.destructables.length = 0;

      return this;

    }

  });

})();