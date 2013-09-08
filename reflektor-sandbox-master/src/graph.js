(function() {

  var root = Sandbox;
  var TEMP = document.createElement('canvas');
  var $window = $(window);
  var $body = $(document.body);
  var scrolled = new Two.Vector();
  var B_T_V = /^(buffer|texture|video)$/ig;
  var D_S = /^(scene|data)$/ig;

  $(function() {

    $window = $(window);
    $body = $(document.body);

    $window.scroll(function() {
      scrolled.set($window.scrollLeft(), $window.scrollTop());
    });

  });

  var Graph = root.Graph = function(options) {

    var _this = graph = this;
    var params = _.defaults(options || {}, {
      size: 50
    });

    this.size = params.size;

    this.domElement = document.createElement('div');
    this.two = new Two({
      width: params.width,
      height: params.height
    }).appendTo(this.domElement);

    _.extend(this.domElement.style, {
      width: params.width + 'px',
      height: params.height + 'px'
    });

    this.inputs = [];
    this.outputs = [];
    this.needsReset = true;
    this.shouldRender = true;

    Object.defineProperty(this, 'width', {
      get: function() {
        return this.two.width;
      },
      set: function(v) {
        this.setSize(v, this.height);
      }
    });
    Object.defineProperty(this, 'height', {
      get: function() {
        return this.two.height;
      },
      set: function(v) {
        this.setSize(this.width, v);
      }
    });

    _.extend(this.two.renderer.domElement.style, {
      position: 'absolute'
    });

    Graph.InitializeGraph(this);

    this
      .bind('connect', this.connect)
      .bind('disconnect', this.disconnect);

    // $(this.domElement).bind('click', function() {
    //   _this.trigger('blur');
    // });

    /**
     * Update the UI of the Graph
     */
    var v = new Two.Vector(), frameOffset = false;
    this.two.bind('update', function(count, timeDelta) {

      if (graph.dragging) {

        if (graph.needsReset) {
          frameOffset = count;
          graph.needsReset = false;
        }

        // graph.glow.setAttribute('r', Math.abs(Math.sin((count - frameOffset) / 12)) * 10 + 10);

      // } else {

        // var o = count / 32;
        // graph.selection.opacity = Math.abs(Math.sin(o)) * 0.5 + 0.25;

      }

      var v1 = _this.connection.vertices[1];

      v1.addSelf(
        v.copy(v1.destination)
          .subSelf(v1)
          .multiplyScalar(0.3)
      );

      if (v1.equals(_this.connection.vertices[0]) && _this.connection.visible) {
        _this.connection.visible = false;
      }

      _.each(_this.connections.children, function(child) {

        if (!child.visible || !child.domElement || child === _this.connection) {
          return;
        }

        if (child.die) {
          child.opacity -= child.opacity * 0.3;
          child.fillament.opacity = child.opacity;
          if (child.opacity <= 0.001 && child.visible) {
            _this.disconnect(child);
            return;
          }
        }

        if (!child.die && child.opacity !== child.__opacity) {

          var d = child.__opacity - child.opacity;
          if (Math.abs(d) < 0.01) {
            child.opacity = child.__opacity;
          } else {
            child.opacity += (d) * 0.125;
          }

        }

        var v0 = child.vertices[0];
        var v3 = child.vertices[3];

        if (v0.destination) {

          v0.addSelf(
            v.copy(v0.destination)
              .subSelf(v0)
              .multiplyScalar(0.3)
          );

          if (v0.equals(v0.destination)) {
            delete v0.destination;
          }

        }

        if (v3.destination) {

          v3.addSelf(
            v.copy(v3.destination)
              .subSelf(v3)
              .multiplyScalar(0.3)
          );

          if (v3.equals(v3.destination)) {
            delete v3.destination;
          }

        }

        var t = child.fillament.t;
        var length = child.domElement.getTotalLength();

        child.fillament.translation.copy(
          child.domElement.getPointAtLength(length * child.fillament.t)
        );

        child.fillament.t += 10 / length;

        if (child.fillament.t > 1 - 0.01) {
          child.fillament.t = 0;
        }

      });

      _.each(_this.background.children, function(child) {

        var object = child.object;
        if (_.isFunction(object.update)) {
          object.update();
          // TODO: Take this output and put it into the canvas.
        }

        if (!child.destination) {
          return;
        }

        child.translation.addSelf(
          v.copy(child.destination)
            .subSelf(child.translation)
            .multiplyScalar(0.3)
        );

      });

    });

  };

  _.extend(Graph, {

    className: 'graph',

    Threshold: {

      distance: {

        x: 160,

        y: 70

      }

    },

    Colors: {

      content: 'white',// '#ddd',

      active: 'rgb(255, 63, 63)',//rgb(238, 137, 0)',

      background: '#333'

    },

    Templates: {

      description: '<div class="description s-<%= type %>"><span><%= name %></span></div>',

      preview: '<div class="preview description s-<%= type %>"><p><%= name %></p></div>',

      image: '',

      canvas: '',

      video: ''

      // image: '<img class="thumbnail" src="<%= src %>" alt="" />',

      // canvas: '<canvas class="thumbnail"></canvas>',

      // video: '<video autoplay loop autoload src="<%= src %>"></video>'

    },

    ContextLabel: {

      domElement: document.createElement('div'),

      show: function(x, y, html) {

        var domElement = Graph.ContextLabel.domElement;
        var elem = domElement.querySelector('.content');

        elem.innerHTML = html.replace(/[0-9]/ig, '');

        _.defer(function() {

          var rect = domElement.getBoundingClientRect();

          _.extend(domElement.style, {
            display: 'block',
            top: (y - rect.height - 20) + 'px',
            left: (x - rect.width / 2) + 'px'
          });

        });

      },

      hide: function() {

        _.extend(Graph.ContextLabel.domElement.style, {
          top: -1000 + 'px',
          left: -1000 + 'px'
        });

      }

    },

    ContextMenu: {

      domElement: document.createElement('div'),

      show: function(x, y, callback) {

        var $elem = $(Graph.ContextMenu.domElement.querySelector('.remove'));

        var onWindowMouseUp = function(e) {
          Graph.ContextMenu.hide();
          $window.unbind('click', onWindowMouseUp);
          $elem.unbind('click', callback);
        };

        var rect = Graph.ContextMenu.domElement.getBoundingClientRect();

        _.extend(Graph.ContextMenu.domElement.style, {
          display: 'block',
          top: (y - rect.height - 10) + 'px',
          left: (x - rect.width / 2) + 'px'
        });

        _.defer(function() {
          $window.bind('click', onWindowMouseUp);
        });
        $elem.bind('click', callback);

      },

      hide: function() {

        _.extend(Graph.ContextMenu.domElement.style, {
          top: - 1000 + 'px',
          left: - 1000 + 'px'
        });

      }

    },

    GetCommonProperty: function(io, ii) {

      for (var j in io.object.outputs)  {
        for (var k in ii.object.inputs) {
          if (j === k) {
            return j;
          }
        }
      }

      return null;

    },

    ApplyConnectionStyles: function(connection, graph) {

      var two = graph.two;
      connection.fill = 'none';
      connection.stroke = Graph.Colors.active;
      connection.linewidth = 3;
      connection.fillament = two.makeCircle(0, 0, 2);
      connection.fillament.noStroke().fill = 'white';
      connection.fillament.t = 0;
      connection.visible = connection.fillament.visible = false;
      connection.domElement = document.querySelector('#two-' + connection.id);
      if (connection.domElement) {
        connection.domElement.setAttribute('class', 'connection');
      }
      connection.__opacity = 1;

      $(connection.domElement).bind('click', function(e) {
        e.preventDefault();
        Graph.ContextMenu.show(e.clientX + $body.scrollLeft(), e.clientY + $body.scrollTop(), function() {
          // graph.disconnect(connection);
          // connection.die = true;
          graph.trigger('disconnect', connection);
        });
      });

    },

    InitializeGraph: function(graph) {

      var size = graph.size, two = graph.two;
      // graph.domElement.classList.add(Graph.className, Sandbox.className);
      $(graph.domElement).addClass(Graph.className + ' ' + Sandbox.className)

      // Create a graph
      Graph.CreateGrid(graph.domElement, size);

      graph.connection = two.makeLine(0, 0, 0, 0);
      Graph.ApplyConnectionStyles(graph.connection, graph);
      graph.connection.fillament.remove();

      graph.connection.vertices[1].destination = new Two.Vector()
        .copy(graph.connection.vertices[1]);

      var width = 50 * 3;
      var height = width / Sandbox.aspectRatio;
      var borderWidth = 12;

      // graph.selection = two.makeRectangle(-10000, -10000, width, height);
      // graph.selection.domElement = two.renderer.domElement.querySelector('#two-' + graph.selection.id);
      // graph.selection.noFill().stroke = 'rgba(255, 255, 255, 0.5)';
      // graph.selection.linewidth = borderWidth + 4;
      // graph.selection.join = 'round';

      graph.connections = two.makeGroup();
      graph.background = two.makeGroup();

      // graph.bind('focus', function(group) {
      //   graph.selection.translation.unbind(Two.Events.change, graph.selection._updateMatrix);
      //   group.translation.bind(Two.Events.change, graph.selection._updateMatrix);
      //   graph.selection.translation = group.translation;
      // });

    },

    GenerateDOM: function(html) {

      var div = document.createElement('div');
      div.classList.add('inner-dom');
      div.style.visibility = 'visible';
      div.innerHTML = html;
      return div;

    },

    CreateGrid: function(elem, size) {

      TEMP.width = TEMP.height = size;
      var ctx = TEMP.getContext('2d');
      ctx.clearRect(0, 0, size, size);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(size, size);
      ctx.lineTo(0, size);
      ctx.stroke();

      _.extend(elem.style, {
        backgroundImage: 'url(' + TEMP.toDataURL('image/png') + ')',
        backgroundRepeat: 'repeat'
      });

    },

    CreateNub: function(params) {

      var width = params.width;
        height = params.height,
        pct = params.pct,
        bleed = params.bleed,
        spread = params.spread,
        graph = params.graph,
        two = graph.two,
        color = params.color,
        group = params.group,
        k = params.k,
        v = params.v,
        i = params.i,
        isInput = params.isInput,
        x = isInput ? - (width) / 2 : width / 2,
        y = pct * spread - spread / 2;

      var nub = two.makeCircle(x, y, bleed);
      nub.linewidth = bleed;
      nub.stroke = color;
      nub.fill = Graph.Colors.background;

      var glow = two.makeCircle(x, y, bleed + bleed);
      glow.noFill().stroke = 'rgba(255, 255, 255, 0.66)';
      glow.linewidth = 7;
      glow.elem = two.renderer.domElement.querySelector('#two-' + glow.id);
      glow.elem.classList.add('glow');
      glow.visible = false;

      nub.isInput = isInput;
      nub.parentId = group.id;
      nub.name = k;
      nub.elem = two.renderer.domElement.querySelector('#two-' + nub.id);
      // nub.elem.classList.add('frame', 'nub');
      $(nub.elem).addClass('frame nub');

      nub.glow = glow;

      return nub;

    },

    CreateElement: function(graph, object) {

      var color = Graph.Colors.content;
      var two = graph.two, bleed = 4;
      var $graph = $(graph.domElement);

      var width = object.name === Sandbox.Preview.prototype.name ? 250 : 50 * 3;
      var height = width / Sandbox.aspectRatio;

      var group = two.makeGroup();
      var frame = two.makeRectangle(0, 0, width, height).noStroke();
      var content = two.makeRectangle(0, 0, width - bleed * 2, height - bleed * 2).noStroke();

      var frameElem = two.renderer.domElement.querySelector('#two-' + frame.id);
      // frameElem.classList.add('frame', 'nub');
      $(frameElem).addClass('frame nub');
      frame.fill = color;
      group.shouldRender = true;

      var contentElem = two.renderer.domElement.querySelector('#two-' + content.id);
      contentElem.classList.add('fo');

      /**
       * Check the object's "inputs" and "outputs" for multiple
       * representations.
       */

      var length = _.size(object.inputs), i = 0;
      var inputs = {};
      var spread = height * 0.75;
      _.each(object.inputs, function(v, k) {

        var pct = (i + 1) / (length + 1);
        var input = Graph.CreateNub({
          i: i,
          k: k,
          v: v,
          graph: graph,
          group: group,
          width: width,
          height: height,
          pct: pct,
          color: color,
          spread: spread,
          bleed: bleed,
          isInput: true
        });

        $(input.elem)
          .bind('mousedown', function(e) {
            isInput = true;
            startConnection.call(input, e);
          })
          .bind('mouseup', function(e) {
            graph.__nub = input;
          })
          .hover(
            function(e) {
              var rect = input.elem.getBoundingClientRect();
              Graph.ContextLabel.show(rect.left + rect.width / 2, rect.top + rect.height / 2 + $body.scrollTop(), input.name);
            },
            function() {
              Graph.ContextLabel.hide();
            }
          );

        graph.inputs.push(input);
        inputs[k] = input;
        i++;

      });

      length = _.size(object.outputs), i = 0;
      var outputs = {};
      _.each(object.outputs, function(v, k) {

        var pct = (i + 1) / (length + 1);
        var output = Graph.CreateNub({
          i: i,
          k: k,
          v: v,
          graph: graph,
          group: group,
          width: width,
          height: height,
          pct: pct,
          color: color,
          spread: spread,
          bleed: bleed,
          isInput: false
        });

        $(output.elem)
          .bind('mousedown', function(e) {
            isInput = false;
            startConnection.call(output, e);
          })
          .bind('mouseup', function(e) {
            graph.__nub = output;
          })
          .hover(
            function(e) {
              var rect = output.elem.getBoundingClientRect();
              Graph.ContextLabel.show(rect.left + rect.width / 2, rect.top + rect.height / 2 + $body.scrollTop(), output.name);
            },
            function() {
              Graph.ContextLabel.hide();
            }
          );

        graph.outputs.push(output);
        outputs[k] = output;
        i++;

      });

      _.each(inputs, function(input) {
        group.add(input.glow);
      });

      _.each(outputs, function(output) {
        group.add(output.glow);
      });

      group.add(frame).add(_.toArray(inputs)).add(_.toArray(outputs)).add(content);
      group.translation.set(two.width / 2, two.height / 2);
      group.destination = new Two.Vector().copy(group.translation);

      // Add interaction

      var offset = new Two.Vector();
      var drag = function(e) {
        e.preventDefault();
        graph.shouldRender = false;
        var x = e.clientX - offset.x + scrolled.x;
        var y = e.clientY - offset.y + scrolled.y;
        if (e.shiftKey) {
          x = Graph.SnapTo(x, graph.size);
          y = Graph.SnapTo(y, graph.size);
        }
        group.destination.set(x, y);
      };
      var endDrag = function(e) {
        e.preventDefault();
        graph.shouldRender = true;
        document.body.classList.remove('dragging');
        // graph.disperse(group);
        $window
          .unbind('mousemove', drag)
          .unbind('mouseup', endDrag);
      };

      $(two.renderer.domElement.querySelector('#two-' + group.id))
        .hover(function() {
          group.shouldRender = false;
        }, function() {
          group.shouldRender = true;
        });

      group.mousedown = function(e) {
        e.preventDefault();
        scrollTop = $body.scrollTop();
        document.body.classList.add('dragging');
        var rect = $graph.offset();
        offset.x = (rect.left + e.clientX + scrolled.x) - (rect.left + group.translation.x);
        offset.y = (rect.top + e.clientY + scrolled.y) - (rect.top + group.translation.y);
        $window
          .bind('mousemove', drag)
          .bind('mouseup', endDrag);
      };

      $(frameElem)
        .bind('mousedown', group.mousedown);

      var object;
      var startConnection = function(e) {
        e.preventDefault();
        document.body.classList.add('dragging');
        object = this;
        graph.dragging = true;
        graph.__nub = undefined;
        object.fill = Graph.Colors.active;
        // Hinting
        graph.needsReset = true;
        var k = object.isInput ? 'outputs' : 'inputs';
        _.each(graph.connections.children, function(connection) {
          connection.__opacity = 0.33;
        });
        var a = object.name.replace(/[0-9]/ig, '');
        _.each(graph[k], function(n) {
          var b = n.name.replace(/[0-9]/ig, '');
          var putsMatch = a == b;
          var areBuffers = a.match(B_T_V) && b.match(B_T_V);
          if ((putsMatch || areBuffers) && n.parentId !== object.parentId) {
            n.glow.visible = true;
          }
        });
        var position = new Two.Vector()
          .copy(object.translation)
          .addSelf(group.translation);
        graph.connection[isInput ? 'next' : 'prev'] = group;
        _.each(graph.connection.vertices, function(v) {
          v.copy(position);
          if (v.destination) {
            v.destination.copy(position);
          }
        });
        var o = $graph.offset();
        offset.set(o.left, o.top);
        $window
          .bind('mousemove', dragConnection)
          .bind('mouseup', endConnection);
      };
      var dragConnection = function(e) {
        e.preventDefault();
        var x = e.clientX - offset.x + scrolled.x;
        var y = e.clientY - offset.y + scrolled.y;
        graph.connection.visible = true;
        graph.connection.vertices[1].destination.set(x, y);
      };
      var endConnection = function(e) {

        e.preventDefault();

        document.body.classList.remove('dragging');
        graph.dragging = false;

        $window
          .unbind('mousemove', dragConnection)
          .unbind('mouseup', endConnection);

        var mouse = new Two.Vector();
        var position = new Two.Vector();
        mouse.x = e.clientX - offset.x;
        mouse.y = e.clientY - offset.y;

        graph.connection.vertices[1].destination
          .copy(graph.connection.vertices[0]);

        // Hinting
        _.each(graph.connections.children, function(connection) {
          connection.__opacity = 1.0;
        });
        var k = object.isInput ? 'outputs' : 'inputs';
        _.each(graph[k], function(n) {
          n.glow.visible = false;
        });

        var nub = graph.__nub;

        if (nub && object.isInput !== nub.isInput) {

          var a = object, b = nub;
          if (nub.isInput) {
            a = nub;
            b = object;
          }

          var aname = a.name.replace(/[0-9]/ig, '');
          var bname = b.name.replace(/[0-9]/ig, '');
          var putsMatch = aname == bname;
          var areSpecial = aname.match(D_S) || bname.match(D_S);

          if ((putsMatch || !areSpecial) && a.parentId !== b.parentId) {

            graph.connection.vertices[0].clear();
            graph.connection.vertices[1].clear();
            graph.connection.vertices[1].destination.clear();
            delete graph.connection.prev;
            delete graph.connection.next;
            graph.trigger('connect', b, a, true);
            return;

          }

        }

        if (!isAlreadyConnected(graph, object, object.isInput ? 'next' : 'prev')) {
          object.fill = Graph.Colors.background;
        }

        delete graph.connection.prev;
        delete graph.connection.next;

      };

      group.inputs = inputs;
      group.outputs = outputs;
      group.content = content;

      graph.background.add(group);

      return group;

    },

    InjectHTML: function(graph, group, html) {

      var elem = group.content;
      var rect = elem.getBoundingClientRect();
      var foreignObject = Two[Two.Types.svg].Utils.createElement('foreignObject', {
        x: - rect.width / 2,
        y: - rect.height / 2,
        width: rect.width,
        height: rect.height
      });

      var dom = Graph.GenerateDOM(html);

      $(foreignObject).bind('mousedown', group.mousedown);

      $(dom.querySelector('span'))
        .css('cursor', 'pointer')
        .bind('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          graph.trigger('focus', group);
        });

      $(dom.querySelector('p'))
        .css('cursor', 'pointer')
        .bind('click', function(e) {
          graph.trigger('preview');
        });

      foreignObject.appendChild(dom);
      group.domElement.appendChild(foreignObject);

      return;  // Rewrite to handle if it needs update at all.

    },

    SnapTo: function(v, grid) {
      return Math.round(v / grid) * grid;
    }

  });

  _.extend(Graph.prototype, Backbone.Events, {

    appendTo: function(elem) {

      elem.appendChild(this.domElement);
      return this;

    },

    setSize: function(width, height) {

      $(this.domElement)
        .width(width)
        .height(height);

      this.two.width = width;
      this.two.height = height;

      this.two.renderer.setSize(width, height);

      return this;

    },

    add: function(object) {

      var graph = this;
      var shape = Graph.CreateElement(this, object);

      shape.object = object || {};
      shape.domElement = this.two.renderer.domElement.querySelector('#two-' + shape.id);

      if (!_.isUndefined(shape.object.html)) {
        Graph.InjectHTML(this, shape, shape.object.html);
      }

      object.bind('update', function() {

        if (!object.renderer || !graph.shouldRender || !shape.shouldRender) {
          return;
        }

        if (object.buffer) {

          var canvasRect = shape.content.getBoundingClientRect();
          object.viewport.render(
            object.buffer,
            canvasRect.left,
            canvasRect.top,
            canvasRect.width,
            canvasRect.height
          );

        }

      });

      this.disperse(shape);

      return shape;

    },

    remove: function(object) {

      var shape = this.getShapeByObject(object);

      _.each(shape.inputs, function(input) {
        this.clearNub(input);
      }, this);

      _.each(shape.outputs, function(output) {
        this.clearNub(output);
      }, this);

      // if (this.selection.translation.equals(shape.translation)) {
      //   this.selection.translation.unbind(Two.Events.change, graph.selection._updateMatrix);
      //   this.selection.translation = this.selection.translation.clone();
      //   this.selection.translation.bind(Two.Events.change, graph.selection._updateMatrix);
      //   this.selection.translation.set(-10000, -10000);
      // }

      shape.remove();

      return this;

    },

    /**
     * Clears a nub of its connections.
     */
    clearNub: function(nub) {

      _.each(this.connections.children, function(connection) {

        if ((nub.isInput && connection.next && connection.next.id === nub.id)
          || (!nub.isInput && connection.prev && connection.prev.id === nub.id)) {
          connection.die = true;
        }

      }, this);

      return this;

    },

    /**
     * Connect two nubs
     */
    connectNubs: function(nubOut, nubIn, animated) {

      var two = this.two;

      var o = this.background.children[nubOut.parentId];
      var i = this.background.children[nubIn.parentId];

      var a = nubOut.translation;
      var b = nubIn.translation;

      nubOut.fill = nubIn.fill = Graph.Colors.active;

      var points = [
        new Two.Vector(), new Two.Vector(),
        new Two.Vector(), new Two.Vector()
      ];

      var connection = two.makeCurve(points, true);
      Graph.ApplyConnectionStyles(connection, this);
      connection.fillament.visible = connection.visible = true;

      if (animated) {
        points[0].destination = new Two.Vector();
        points[3].destination = new Two.Vector();
      }

      var updatePosition = function() {

        var v0 = points[0].destination ? points[0].destination : points[0];
        var v3 = points[3].destination ? points[3].destination : points[3];

        v0.copy(o.translation);
        v3.copy(i.translation);

        points[1].copy(a).addSelf(o.translation);
        points[2].copy(b).addSelf(i.translation);

      };

      // Not sure if this commented portion is necessary...
      // a.bind(Two.Events.change, updatePosition);
      // b.bind(Two.Events.change, updatePosition);
      i.translation.bind(Two.Events.change, updatePosition);
      o.translation.bind(Two.Events.change, updatePosition);
      updatePosition();

      var theta = Math.atan2(points[2].y - points[1].y, points[2].x - points[2].y);
      var radius = a.length() / 10;
      var x = radius * Math.cos(theta) + points[2].x;
      var y = radius * Math.sin(theta) + points[2].y;
      points[3].set(x, y);

      theta += Math.PI;
      x = radius * Math.cos(theta) + points[1].x;
      y = radius * Math.sin(theta) + points[1].y;
      points[0].set(x, y);

      connection.next = nubIn;
      connection.prev = nubOut;

      this.connections.add(connection, connection.fillament);

      return connection;

      return this;

    },

    disconnect: function(connection) {

      connection.fillament.visible = connection.visible = false;

      connection.remove();
      connection.fillament.remove();

      if (!isAlreadyConnected(this, connection.prev, 'prev')) {
        connection.prev.fill = Graph.Colors.background;
      }
      if (!isAlreadyConnected(this, connection.next, 'next')) {
        connection.next.fill = Graph.Colors.background;
      }

      return this;

    },

    // Check and then disperse the position of nodes so as not to
    // overlap each other.
    disperse: function(shape) {

      // if (!url.boolean('disperse')) {
      //   return this;
      // }

      if (shape.__set) {
        return this;
      }

      var delta = new Two.Vector();
      // _.each(this.background.children, function(child) {
      for (var c in this.background.children) { 
        var child = this.background.children[c];
        if (shape.id === child.id) {
          continue;
        }
        delta.copy(shape.destination).subSelf(child.destination);
        var distance = delta.length();
        if (distance > Graph.Threshold.distance.x) { // calculated diagonal of a shape.
          continue;
        }
        var theta = Math.atan2(delta.y, delta.x) + getRandomHalfPI();
        shape.destination.x += (Graph.Threshold.distance.x - Math.abs(delta.x)) * Math.cos(theta);
        shape.destination.y += (Graph.Threshold.distance.y - Math.abs(delta.y)) * Math.sin(theta);
        _.defer(_.bind(this.disperse, this, shape));
        return this;
      }

      return this;

    },

    update: function() {

      this.two.update();

      return this;

    },

    /**
     * Utility selector functions
     */

    getShapeByObject: function(object) {

      var shapes = this.background.children;

      for (var i in shapes) {
        var shape = shapes[i];
        if (shape.object.id === object.id) {
          return shape;
        }
      }

      return null;

    },

    getConnection: function(prev, next) {

      var pid = prev.id;
      var nid = next.id;
      var children = this.connections.children;

      for (var j in children) {
        var connection = children[j];
        if (!connection.next || !connection.prev) {
          continue;
        }
        if (connection.next.id === nid && connection.prev.id === pid) {
          return connection;
        }
      }

      return null;

    },

    getConnections: function(editable) {

      var connections = [];
      _.each(this.connections.children, function(c) {

        if (c.next || c.prev) {
          connections.push(c);
        }

      });

      if (editable) {
        connections.splice(0, 1);
      }

      return connections;

    },

    /**
     * Get the position of an object's shape.
     */
    getPosition: function(object) {

      var shape = this.getShapeByObject(object);

      if (!shape) {
        return null;
      }

      return {
        x: Math.round(shape.translation.x), // Should turn into percentages
        y: Math.round(shape.translation.y)
      };

    },

    /**
     * Set the position of an object's shape.
     */
    setPosition: function(object, position) {


      var shape = this.getShapeByObject(object);

      if (!shape) {
        return this;
      }

      shape.destination.copy(position);
      shape.__set = true;

      return this;

    },

    /**
     * Organization methods
     */

    /**
     * Organize all the children in the scene into a cascade
     * of elements.
     */
    cascade: function(snap) {

      var size = this.size;
      var children = this.background.children;
      var length = _.size(children);
      var last = length - 1;
      var x = 0;
      var y = 0;
      var maxY = 0;
      var width = 0, height = 0;

      _.each(children, function(child) {

        var rect = child.getBoundingClientRect();
        width += rect.width / 2;
        height += rect.height / 2;

      });

      x = (this.width - width) / 2;
      y = (this.height - height) / 2;

      _.each(children, function(child) {

        var rect = child.getBoundingClientRect();
        child.destination.set(
          !!snap ? Graph.SnapTo(x, this.size) : x,
          !!snap ? Graph.SnapTo(y, this.size) : y
        );
        x += rect.width / 2;
        y += rect.height / 2;

      }, this);

      return this;

    },

    lineup: function(snap) {

      var size = this.size;
      var children = this.background.children;
      var length = _.size(children);
      var last = length - 1;
      var x = 0;
      var y = size;
      var maxY = 0;

      _.each(children, function(child) {
        var rect = child.getBoundingClientRect();
        maxY = Math.max(maxY, rect.height);
        if (x + size + rect.width > this.width - size) {
          x = 0;
          y += size + maxY;
          maxY = 0;
        }
        x += size;
        var a = x + rect.width / 2;
        var b = y + rect.height / 2;
        child.destination.set(
          !!snap ? Graph.SnapTo(a, this.size) : a,
          !!snap ? Graph.SnapTo(b, this.size) : b
        );
        x += rect.width;
      }, this);

      return this;

    },

    randomize: function(snap) {

      var width = this.two.width, height = this.two.height;

      _.each(this.background.children, function(child) {

        var rect = child.getBoundingClientRect();
        var x = Math.random() * (width - rect.width) + rect.width / 2;
        var y = Math.random() * (height - rect.height) + rect.height / 2;

        child.destination.set(
          !!snap ? Graph.SnapTo(x, this.size) : x,
          !! snap ? Graph.SnapTo(y, this.size) : y
        );

      }, this);

      return this;

    }

  });

  Graph.ContextMenu.domElement.classList.add('context-menu');
  Graph.ContextLabel.domElement.classList.add('context-label');
  document.body.appendChild(Graph.ContextLabel.domElement);
  document.body.appendChild(Graph.ContextMenu.domElement);
  Graph.ContextMenu.domElement.innerHTML = '<ul><li class="remove">Remove Connection</li></ul><div class="nub"></div>';
  Graph.ContextLabel.domElement.innerHTML = '<p class="content"></p><div class="nub"></div>';

  function isAlreadyConnected(graph, nub, direction) {

    var connections = graph.connections.children;
    for (var c in connections) {
      var connection = connections[c];
      if (connection[direction] && connection[direction].id === nub.id) {
        return true;
      }
    }

    return false;

  }

  function hasOtherPuts(graph, connection, direction) {

    var children = graph.connections.children;
    var id = connection.id;
    var directionId = connection[direction].id;

    for (var k in children) {

      var c = children[k];
      var put = c[direction];

      if (k != id && put && put.id == directionId) {
        has = true;
        return true;
      }

    }

    return false;

  }

  function getRandomHalfPI() {
    var a = Math.floor(Math.random() * 3)  / 2;
    return a * Math.PI - Math.PI / 2;
  }

})();