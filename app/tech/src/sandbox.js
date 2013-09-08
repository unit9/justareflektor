(function() {

  var root = this;
  var previousSandbox = root.Sandbox || {};
  var now, same = 0;
  var analytics = AnalyticsController.getInstance();

  var Sandbox = root.Sandbox = function(options) {

    var scope = this;

    var params = _.defaults(options || {}, {
      showGraph: true,
      showNodeListing: true,
      width: window.innerWidth,
      height: window.innerHeight,
      size: 50,
      useDefault: false
    });

    this.width = params.width;
    this.height = params.height;
    this.showing = {
      value: params.showGraph,
      graph: params.showGraph,
      viewport: !params.showGraph,
      force: false
    };

    this.domElement = document.createElement('div');
    this.domElement.classList.add(Sandbox.className, 'container');

    var rect, x, y;

    $(this.domElement).bind('mousemove', function(event) {
      
      if (scope.showing.value) return;

      rect = this.getBoundingClientRect();
      x = (event.clientX - rect.left) / rect.width;
      y = (event.clientY - rect.top) / rect.height;

      _.each(_.toArray(scope.nodes), function(node) {
        if (node.onMouseMove) node.onMouseMove(x,y);
      }, scope);

    });

    $(this.domElement).bind('mousedown', function(event) {

      if (scope.showing.value) return;

      _.each(_.toArray(scope.nodes), function(node) {
        if (node.onMouseDown) node.onMouseDown(x,y);
      }, scope);

    });
    
    this.wrapper = document.createElement('div');
    // this.wrapper.classList.add(Sandbox.className, 'wrapper');
    $(this.wrapper).addClass(Sandbox.className + ' wrapper');

    _.extend(this.domElement.style, {
      width: this.width + 'px',
      height: this.height + 'px'
    });

    _.extend(this.wrapper.style, {
      width: this.width * 2 + 'px',
      height: this.height + 'px'
    });

    this.loader = new Sandbox.Loader(this);

    this.graph = new Sandbox.Graph({
      width: this.width,
      height: this.height,
      size: params.size
    }).appendTo(this.wrapper);

    this.graph
      .unbind('connect')
      .unbind('disconnect')
      .bind('preview', _.bind(function() {
        this.showViewport();
      }, this))
      // .bind('more-info', _.bind(function(group) {
      //   var node = group.object;
      //   this.viewport.inputBuffer = node.buffer;
      // }, this))
      // .bind('less-info', _.bind(function(group) {
      //   this.viewport.inputBuffer = null;
      // }, this))
      .bind('connect', _.bind(function(o, i, animated) {

        this.connectNubs(i, o, animated);
        // this.connect(property, a, b, animated);

      }, this))
      .bind('disconnect', _.bind(function(connection) {

        var nub = connection.next;
        var group = this.graph.background.children[nub.parentId];
        var node = group.object;
        node.inputs[nub.name] = null;
        connection.die = true;

      }, this))
      .bind('focus', _.bind(function(group) {

        var node = group.object;
        this.inspector.focus(node);

      }, this))
      // .bind('blur', _.bind(function() {

      //   this.inspector.showNodeListing();

      // }, this));

    this.viewport = new Sandbox.Viewport({
      parent: this,
      width: this.width * 2,
      height: this.height
    }).appendTo(this.wrapper);

    this.domElement.appendChild(this.wrapper);

    this.inspector = new Sandbox.Inspector({
      parent: this,
      defaultJSON: params.useDefault
    }).appendTo(this.domElement);

    this.nodes = [];

    this.preview = new Sandbox.Preview();
    this.preview.attach(this);
    this.viewport.inputs = this.preview.inputs;
    this.graph.add(this.preview);//.scale = 1.33;

    if (params.showGraph) {
      this.showGraph();
    } else {
      this.showViewport();
    }

    if (params.showNodeListing) {
      this.inspector.showNodeListing();
    } else {
      this.inspector.showParamsListing();
    }

  };

  _.extend(Sandbox, {

    noConflict: function() {
      root.Sandbox = previousSandbox;
      return this;
    },

    className: 'sb',

    aspectRatio: 16 / 9,

    /**
     * Time-based unique ID generation.
     */
    uniqueId: function(str) {

      var id = Date.now();

      if (now === id) {
        id += '-' + same;
        same++;
      } else {
        now = id;
        same = 0;
      }

      if (_.isString(str)) {
        return str + id;
      }

      return id;

    },

    Nodes: {}

  });

  _.extend(Sandbox.prototype, Backbone.Events, {

    appendTo: function(elem) {

      elem.appendChild(this.domElement);
      this.loader.appendTo(elem);

      this.container = elem;

      if (this.json) {
        this.loadJSON(this.json);
        if (_.isFunction(this.__callback)) {
          this.__callback();
        }
        delete this.json;
        delete this.__callback;
      }

      return this;

    },

    add: function(node) {

      node.attach(this);

      if (_.isFunction(node.resize)) {
        node.resize(this.width, this.height);
      }

      this.graph.add(node);
      this.nodes.push(node);
      this.inspector.add(node);
      return this;

    },

    remove: function(node) {

      var index = _.indexOf(this.nodes, node);

      node.destroy();

      if (index < 0) {
        return this;
      }

      this.nodes.splice(index, 1);
      this.graph.remove(node);
      this.inspector.remove(node);

      return this;

    },

    clear: function() {

      _.each(_.toArray(this.nodes), function(n) {
        this.remove(n);
      }, this);

      this.preview.inputs.buffer = null;
      this.inspector.__focused = false;

      return this;

    },

    /**
     * Create a connection based on nub information.
     */
    connectNubs: function(nubIn, nubOut, animated) {

      var groupIn = this.graph.background.children[nubIn.parentId];
      var objectIn = groupIn.object;
      var groupOut = this.graph.background.children[nubOut.parentId];
      var objectOut = groupOut.object;
      var property = nubIn.name;

      if (objectIn.inputs[property]) {
        objectIn.inputs[property] = null;
        this.graph.clearNub(nubIn);
      }
      this.graph.connectNubs(nubOut, nubIn, animated);
      objectIn.inputs[property] = objectOut.outputs[nubOut.name];

      return this;

    },

    /**
     * If first argument is a string then it looks at arguments like this:
     * property, input, output, animated
     * If first and third arguments are strings then it looks at args like this;
     * p1, input, p2, output, animated
     */
    connect: function(property, input, output, animated) {

      var first = _.isString(arguments[0]);
      var third = _.isString(arguments[2]);
      var p1 = p2 = property;

      // Flesh this out more
      if (first && third) {
        p1 = property;
        p2 = output;
        output = arguments[3];
        animated = arguments[4];
      }

      var a = this.graph.getShapeByObject(input);
      var b = this.graph.getShapeByObject(output);

      this.graph.connectNubs(b.outputs[p2], a.inputs[p1], !!animated);
      if (input.inputs[p1]) {
        this.disconnect(p1, input, input.inputs[p1].__parentNode);
      }
      input.inputs[p1] = output.outputs[p2];

      return this;

    },

    disconnect: function(property, input, output, connection) {

      var a = this.graph.getShapeByObject(input);
      var b = this.graph.getShapeByObject(output);
      var connection = connection || this.graph.getConnection(b.outputs[property], a.inputs[property]);

      if (!connection) {
        return this;
      }

      connection.die = true;
      input.inputs[property] = null;

      return this;

    },

    setSize: function(width, height) {

      // This needs to be smarter.., about aspect ratio and such...

      this.width = Math.min(width, 2048); // Webgl Constraints.
      this.height = this.width / Sandbox.aspectRatio; // Math.min(height, 2048);

      // _.each(this.nodes, function(node) {
      //   if (_.isFunction(node.resize)) {
      //     node.resize(this.width, this.height);
      //   }
      // }, this);

      this.graph.setSize(this.width, this.height);
      this.viewport.setSize(this.width * 2, this.height);

      _.extend(this.domElement.style, {
        width: this.width + 'px',
        height: this.height + 'px'
      });

      _.extend(this.wrapper.style, {
        width: this.width * 2 + 'px',
        height: this.height + 'px'
      });

      if (!this.showing.value) {
        this.wrapper.style.left = - this.width + 'px';
      }

      return this;

    },

    update: function() {

      // this.viewport.renderer.clear();
      this.viewport.renderer.clearTarget();

      _.each(this.nodes, function(node) {
        node.update();
      });

      this.preview.update();

      // Add logic to stop updating if not necessary
      this.showing.viewport && this.viewport.update();
      (this.showing.graph || this.showing.force) && this.graph.update();

      return this;

    },

    /**
     * Show the Viewport view
     */
    showViewport: function() {

      var _this = this;

      this.showing.graph = true;
      this.showing.viewport = true;

      clearTimeout(this.__timeout);
      this.__timeout = setTimeout(function() {
        _this.showing.graph = false;
        _this.showing.viewport = true;
      }, Sandbox.transitionDuration);

      this.showing.value = false;
      _.extend(this.wrapper.style, {
        left: - this.width + 'px'
      });

      // this.inspector.domElement.classList.add('hide-drawer');
      this.inspector.showParamsListing();

      analytics.trackEvent(AnalyticsController.EVENT_TECH_MODE, {
        label: 'View viewport'
      });

      return this.trigger('viewport');

    },

    /**
     * Show the Graph view
     */
    showGraph: function() {

      var _this = this;

      this.showing.graph = true;
      this.showing.viewport = true;

      clearTimeout(this.__timeout);
      this.__timeout = setTimeout(function() {
        _this.showing.graph = true;
        _this.showing.viewport = false;
      }, Sandbox.transitionDuration);

      this.showing.value = true;
      _.extend(this.wrapper.style, {
        left: 0
      });

      // this.inspector.domElement.classList.remove('hide-drawer');

      analytics.trackEvent(AnalyticsController.EVENT_TECH_MODE, {
        label: 'View graph'
      });

      return this.trigger('graph');

    },

    /**
     * Toggle between Viewport and Graph views.
     */
    toggle: function() {

      if (this.showing.value) {
        this.showViewport();
      } else {
        this.showGraph();
      }

      return this;

    },

    setJSON: function(json, callback) {

      this.json = json;
      if (_.isFunction(callback)) this.__callback = callback;
      return this;

    },

    loadJSON: function() {

      this.clear();

      var json = arguments[0];
      if (_.isString(json)) {
        json = JSON.stringify(JSON);
      }

      this.preview.setId(json.output.id);
      this.graph.setPosition(this.preview, json.output.position);

      _.each(json.nodes, function(n) {

        var node = new Sandbox.Nodes[n.property]();
        node.setId(n.id);
        node.setParams(n.params);

        this.add(node);
        this.graph.setPosition(node, n.position);

      }, this);

      _.each(json.connections, function(c) {

        var input = this.getNodeById(c.input.id);
        var output = this.getNodeById(c.output.id);

        this.connect(c.input.property, input, c.output.property, output);

      }, this);

      // Force update of graph in order for share link
      // to propagate correctly.
      this.showing.force = true;
      _.delay(_.bind(function() {
        this.showing.force = false;
      }, this), 1000);

      return this;

    },

    toJSON: function(stringify) {

      var result = {
        output: {
          id: this.preview.id,
          position: this.graph.getPosition(this.preview)
        },
        connections: _.map(this.graph.getConnections(), function(c) {
          var inputNode = graph.background.children[c.next.parentId].object;
          var outputNode = graph.background.children[c.prev.parentId].object;
          return {
            input: { id: inputNode.id, property: c.next.name },
            output: { id: outputNode.id, property: c.prev.name }
          };
        }),
        nodes: _.map(this.nodes, function(n) {
          return {
            property: getProperty(n),
            id: n.id,
            params: n.extractParams(),
            position: this.graph.getPosition(n)
          }
        })
      };

      return stringify ? JSON.stringify(result) : result;

    },

    getNodeById: function(id) {

      if (id === this.preview.id) {
        return this.preview;
      }

      for (var i in this.nodes) {
        var node = this.nodes[i];
        if (node.id === id) {
          return node;
        }
      }

      return null;

    }

  });

  function getProperty(node) {

    for (var k in Sandbox.Nodes) {

      if (node instanceof Sandbox.Nodes[k]) {
        return k;
      }

    }

    return null;

  }

  // Override Two.js unique id system
  _.uniqueId = Sandbox.uniqueId;

})();