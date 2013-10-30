(function() {

  var root = this;
  var previousSandbox = root.Sandbox || {};
  var now, same = 0;

  var Sandbox = root.Sandbox = function(options) {

    var scope = this;

    var params = _.defaults(options || {}, {
      showGraph: true,
      showNodeListing: true,
      width: window.innerWidth,
      height: window.innerHeight,
      size: 50,
      useDefault: false,
      defaultStyles: true
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

    if (params.defaultStyles) {
      var node = document.createElement('style');
      node.innerHTML = Sandbox.defaultStyles;
      document.body.appendChild(node);
    }

  };

  _.extend(Sandbox, {

    noConflict: function() {
      root.Sandbox = previousSandbox;
      return this;
    },

    className: 'sb',

    aspectRatio: 16 / 9,

    defaultStyles: 'body.dragging,body.dragging.drag-enabled,body.dragging *,body.dragging.drag-enabled *,.inner-dom{-webkit-user-select:none !important;-moz-user-select:none !important;-ms-user-select:none !important;-o-user-select:none !important;user-select:none !important;cursor:-webkit-grabbing}body.dragging .frame,body.dragging.drag-enabled .frame,body.dragging * .frame,body.dragging.drag-enabled * .frame,.inner-dom .frame{cursor:-webkit-grabbing}body.drag-enabled{cursor:-webkit-grab}*{margin:0;padding:0}.sb.container{position:relative;overflow:hidden;z-index:1000;top:0;left:0;right:0;bottom:0}.sb.container *{letter-spacing:0;font-family:times,serif}.sb.wrapper{position:relative;-webkit-transition:left 350ms cubic-bezier(0.075,0.82,0.165,1);-moz-transition:left 350ms cubic-bezier(0.075,0.82,0.165,1);transition:left 350ms cubic-bezier(0.075,0.82,0.165,1)}.connection{cursor:pointer !important}.connection.agent,.glow,.fo,foreignobject,foreignObject{pointer-events:none}.context-menu,.context-label{position:absolute;top:-1000px;left:-1000px;width:150px;font-family:"Lucida Grande",sans-serif;font-style:normal;font-size:10px;letter-spacing:0;color:#333;line-height:20px;background:white;box-shadow:0 0 20px black;border:2px solid white;z-index:9999}.context-menu ul li,.context-label ul li{list-style:none;padding-left:15px;cursor:pointer}.context-menu ul li:hover,.context-label ul li:hover{background:rgba(0,0,0,0.1)}.context-menu .nub,.context-label .nub{position:absolute;bottom:-13px;left:50%;margin-left:-6px;height:0;width:0;border-color:transparent;border-style:solid;border-width:6px;border-top-color:white}.tool-tip{pointer-events:none;position:absolute;top:-10000px;left:-10000px;font-family:"Lucida Grande",sans-serif;font-style:normal;font-size:10px;letter-spacing:0;color:#333;line-height:20px;background:white;box-shadow:0 0 20px black;border:2px solid white;z-index:9999;padding:0 15px}.tool-tip:after{position:absolute;top:50%;right:-13px;margin-top:-6px;height:0;width:0;border-color:transparent;border-style:solid;border-width:6px;border-left-color:white;content:""}.context-label{content:" ";width:auto;padding:0 12.5px;text-transform:capitalize;min-width:50px;text-align:center}@-webkit-keyframes glow{from{box-shadow:0 0 0 #ff3f3f}to{box-shadow:0 0 18px #ff3f3f}}@-moz-keyframes glow{from{box-shadow:0 0 0 #ff3f3f}to{box-shadow:0 0 18px #ff3f3f}}@-o-keyframes glow{from{box-shadow:0 0 0 #ff3f3f}to{box-shadow:0 0 18px #ff3f3f}}@keyframes glow{from{box-shadow:0 0 0 #ff3f3f}to{box-shadow:0 0 18px #ff3f3f}}.inner-dom{cursor:-webkit-grab;width:100%;height:100%;overflow:hidden;background:#191919;line-height:0}.inner-dom .preview p{display:inline-block;vertical-align:baseline;zoom:1;*display:inline;*vertical-align:auto;line-height:25px;vertical-align:top}.inner-dom .preview p:hover{color:#ff3f3f}.inner-dom .preview p:hover:before{background-image:url(./images/hover/viewport.svg)}.inner-dom .preview p:before{display:inline-block;vertical-align:baseline;zoom:1;*display:inline;*vertical-align:auto;width:25px;height:25px;background:url(./images/viewport.svg) center center no-repeat;content:""}.inner-dom .description{min-width:128px;min-height:210px;padding:10px 0 0 10px;z-index:9999;color:#fff;line-height:25px}.inner-dom .description span:hover{color:#ff3f3f}.inner-dom .description.s-video{background:red !important}.inner-dom .description.s-data{background:green !important}.inner-dom .description.s-shader{background:blue !important}.inner-dom .description i.info{margin-bottom:20px;text-align:center;display:block;width:12px;height:12px;line-height:18px;overflow:hidden;text-indent:-9999px;background:black;border-radius:50%}.inner-dom .description i.info:hover{background:#ff3f3f}.inner-dom .description i.info.enabled{background:#ff3f3f;-webkit-animation-name:glow;-moz-animation-name:glow;animation-name:glow;-webkit-animation-duration:750ms;-moz-animation-duration:750ms;animation-duration:750ms;-webkit-animation-timing-function:ease-out;-moz-animation-timing-function:ease-out;animation-timing-function:ease-out;-webkit-animation-direction:alternate;-moz-animation-direction:alternate;animation-direction:alternate;-webkit-animation-iteration-count:infinite;-moz-animation-iteration-count:infinite;animation-iteration-count:infinite}g g g:hover .inner-dom .description{display:block}g g g:hover .inner-dom img,g g g:hover .inner-dom canvas,g g g:hover .inner-dom video{display:none}.sb.graph{position:relative;width:100%;height:100%;background-color:#191919}.sb.graph .frame{cursor:-webkit-grab}.sb.viewport{position:absolute;top:0;left:0;right:0;bottom:0}.sb.viewport,.sb.viewport *{pointer-events:none}.sb.inspector{position:absolute;right:0;top:0;bottom:0;width:25px;overflow:visible;line-height:18px;color:white}.sb.inspector h1,.sb.inspector h2,.sb.inspector h3,.sb.inspector h4,.sb.inspector h5,.sb.inspector h6{font-weight:normal}.sb.inspector:not(.hide-drawer):hover .drawer,.sb.inspector:not(.hide-drawer) .drawer.enabled{left:-300px}.sb.inspector .add,.sb.inspector .home,.sb.inspector .share,.sb.inspector .fullpage,.sb.inspector .fullscreen,.sb.inspector .switch{position:relative;overflow:visible;width:25px;height:18px;margin:15px 0 32px 0}.sb.inspector .add{height:18px;background:url(./images/plus.svg) center center no-repeat}.sb.inspector .add:hover,.sb.inspector .add.enabled{background-image:url(./images/hover/plus.svg)}.sb.inspector .home{height:18px;background:url(./images/toggle.svg) center center no-repeat}.sb.inspector .home:hover,.sb.inspector .home.enabled{background-image:url(./images/hover/toggle.svg)}.sb.inspector .share{margin-left:2px;height:18px;background:url(./images/link.svg) center center no-repeat}.sb.inspector .share:hover,.sb.inspector .share.enabled{background-image:url(./images/hover/link.svg)}.sb.inspector .fullpage{height:18px;background:url(./images/fullpage.svg) center center no-repeat}.sb.inspector .fullpage:hover,.sb.inspector .fullpage.enabled{background-image:url(./images/hover/fullpage.svg)}.sb.inspector .fullscreen{height:18px;background:url(./images/fullscreen.svg) center center no-repeat}.sb.inspector .fullscreen:hover,.sb.inspector .fullscreen.enabled{background-image:url(./images/hover/fullscreen.svg)}.sb.inspector .fullscreen.set{background:url(./images/i-fullscreen.svg) center center no-repeat}.sb.inspector .fullscreen.set:hover,.sb.inspector .fullscreen.set.enabled{background-image:url(./images/hover/i-fullscreen.svg)}.sb.inspector .switch{height:18px;background:url(./images/viewport.svg) center center no-repeat}.sb.inspector .switch:hover,.sb.inspector .switch.enabled{background-image:url(./images/hover/viewport.svg)}.sb.inspector .switch.viewport{height:18px;background:url(./images/graph.svg) center center no-repeat}.sb.inspector .switch.viewport:hover,.sb.inspector .switch.viewport.enabled{background-image:url(./images/hover/graph.svg)}.sb.inspector div.number{overflow:hidden}.sb.inspector div.string textarea{margin:0 0 0 20px;width:139px;height:200px;display:block;background:#3b3b3b;color:white;font-size:13px;line-height:18px;border:0;padding:0 10px;resize:none;outline:0}.sb.inspector div.number div.slider{display:inline-block;vertical-align:baseline;zoom:1;*display:inline;*vertical-align:auto;position:relative;line-height:0;width:60%;line-height:15px;height:18px;background:rgba(255,255,255,0.1);vertical-align:top;cursor:ew-resize}.sb.inspector div.number div.slider div.fg{background:rgba(255,255,255,0.1);border-right:1px solid rgba(255,255,255,0.5);height:100%;top:0;left:0;bottom:0;width:0}.sb.inspector div.number input[type="text"],.sb.inspector div.string input[type="text"]{color:white;margin-left:12px;font-size:85%;height:16px;border:0;background:transparent;border-bottom:1px solid #bbb;text-align:right;width:20%;outline:0}.sb.inspector .drawer{position:absolute;height:100%;width:300px;background:#0f0f0f;-webkit-transition:left 350ms cubic-bezier(0.075,0.82,0.165,1);-moz-transition:left 350ms cubic-bezier(0.075,0.82,0.165,1);transition:left 350ms cubic-bezier(0.075,0.82,0.165,1)}.sb.inspector .drawer ul.params-listing,.sb.inspector .drawer ul.node-listing{position:absolute;top:0;left:0;right:0;bottom:0;overflow:auto}.sb.inspector .drawer ul.params-listing li.shell,.sb.inspector .drawer ul.node-listing li.shell{margin:0 !important;padding:0 !important;border:0 !important}.sb.inspector .drawer ul.params-listing li.shell:hover,.sb.inspector .drawer ul.node-listing li.shell:hover{background:transparent}.sb.inspector .drawer ul.params-listing li:not(:first-child){cursor:default}.sb.inspector .drawer ul.params-listing li.function{cursor:pointer}.sb.inspector .drawer li h3{letter-spacing:1px;font-size:100%;vertical-align:top;position:relative}.sb.inspector .drawer li h3 div.delete{position:absolute;top:3px;right:30px;width:10px;height:10px;text-indent:-9999px;cursor:pointer;background:url(./images/x.svg) center center no-repeat;content:""}.sb.inspector .drawer li h3 div.delete:hover{background-image:url(./images/hover/x.svg)}.sb.inspector .drawer li.param{font-style:italic;overflow:hidden}.sb.inspector .drawer li.param:hover{overflow:visible}.sb.inspector .drawer li.param:hover label+div.string{overflow:visible}.sb.inspector .drawer .io-0-1{padding-left:60px;background:url(./images/nodes/0-1.svg) 25px center no-repeat}.sb.inspector .drawer .io-1-1{padding-left:60px;background:url(./images/nodes/1-1.svg) 25px center no-repeat}.sb.inspector .drawer .io-2-1{padding-left:60px;background:url(./images/nodes/2-1.svg) 25px center no-repeat}.sb.inspector .drawer .io-3-1{padding-left:60px;background:url(./images/nodes/3-1.svg) 25px center no-repeat}.sb.inspector .drawer label{cursor:pointer;width:25%;text-transform:capitalize;text-overflow:ellipsis;letter-spacing:1px;font-size:15px}.sb.inspector .drawer label,.sb.inspector .drawer label+*{display:inline-block;vertical-align:baseline;zoom:1;*display:inline;*vertical-align:auto;overflow:hidden;height:18px;vertical-align:top}.sb.inspector .drawer label+*{width:75%}.sb.inspector .drawer ul{list-style:none}.sb.inspector .drawer ul li{letter-spacing:1px;padding:15px 0 16px 25px;border-bottom:1px solid rgba(255,255,255,0.1)}.sb.inspector .drawer ul li:not(:first-child){cursor:pointer}.sb.inspector .drawer ul li:not(:first-child):hover{background-color:rgba(255,255,255,0.1)}.sb.inspector .drawer ul li:first-child{border-bottom-color:rgba(255,255,255,0.2)}.sb.inspector .panel{position:absolute;top:0;left:0;right:0;bottom:0;background:#191919;text-align:center;list-style:none;padding:0;font-size:12px}.sb.inspector .panel li.enabled,.sb.inspector .panel li:hover{color:#ff3f3f}.sb.inspector .panel li{cursor:pointer}.sb.inspector .panel li.fullpage{position:absolute;margin:0;bottom:115px}.sb.inspector .panel li.fullscreen{position:absolute;margin:0;bottom:65px}.sb.inspector .panel li.switch{position:absolute;margin:0;bottom:15px}.url-context-menu{display:none;opacity:0;position:absolute;top:0;left:0;width:100%;height:100%;-webkit-transition:opacity 150ms ease-out;-moz-transition:opacity 150ms ease-out;transition:opacity 150ms ease-out;color:white}.url-context-menu .backdrop{position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.25)}.url-context-menu .loader{position:absolute;top:0;left:0;width:100%;height:100%}.url-context-menu .loader .content{padding-top:40px}.url-context-menu .container{position:absolute;width:500px;height:165px;top:50%;left:50%;margin-left:-250px;margin-top:-82px;background:black;box-shadow:0 0 20px rgba(0,0,0,0.5);text-align:center;border:1px solid #444}.url-context-menu .container>div{padding:30px 25px 25px}.url-context-menu .container div.divider{width:25%;border-bottom:1px solid #666;content:"";height:0;margin:0 auto}.url-context-menu .container p{letter-spacing:1px;margin-bottom:25px}.url-context-menu .container input{color:white;font-size:100%;font-family:times,serif;display:inline-block;vertical-align:baseline;zoom:1;*display:inline;*vertical-align:auto;margin-top:25px;border:0;border-bottom:1px solid #bbb;outline:0;letter-spacing:1px;width:60%;background:transparent}svg .preset{cursor:pointer;opacity:.9;-webkit-transition:opacity .35s ease-out;-moz-transition:opacity .35s ease-out;transition:opacity .35s ease-out}svg .preset:hover{opacity:1.0}',

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