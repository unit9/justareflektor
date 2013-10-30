(function() {

  var $window, $body;
  var TEMP = document.createElement('div');

  $(function() {

    $window = $(window);
    $body = $(document.body);

  });

  var Inspector = Sandbox.Inspector = function(options) {

    var params = _.defaults(options || {}, {
      defaultJSON: true
    });

    this.parent = params.parent; // Reference to Parent
    this.fullpage = false;

    this.domElement = document.createElement('div');
    $(this.domElement).addClass(Sandbox.className + ' inspector');

    this.drawer = document.createElement('div');
    this.drawer.classList.add('drawer');

    this.panel = document.createElement('ul');
    this.panel.classList.add('panel');

    this.domElement.appendChild(this.drawer);
    this.domElement.appendChild(this.panel);

    Inspector.CreateContextMenu(this);
    Inspector.CreateNavigation(this);
    Inspector.CreateNodeListing(this);
    Inspector.CreateParamsListing(this);

    this.showNodeListing();

    var makeFullPage = _.bind(function() {
      $(this.panel.querySelector('.fullpage')).trigger('click');
    }, this);

    if (url.setup) {
      var json = JSON.parse(decodeURIComponent(url.setup));
      this.parent.setJSON(json, makeFullPage);
    }

  };

  _.extend(Inspector, {

    defaultJSON: {"output":{"id":1376350967933,"position":{"x":800,"y":275}},"connections":[{"input":{"id":1376350967933,"property":"buffer"},"output":{"id":1376350999822,"property":"buffer"}},{"input":{"id":1376351020528,"property":"scene"},"output":{"id":1376351013022,"property":"scene"}},{"input":{"id":1376350999822,"property":"normal"},"output":{"id":1376351020528,"property":"buffer"}},{"input":{"id":1376350999822,"property":"video"},"output":{"id":1376350984248,"property":"texture"}}],"nodes":[{"property":"VideoTexture","id":1376350984248,"params":{"source":"/media/sandbox/reflektor_1_640.mp4"},"position":{"x":275,"y":400}},{"property":"Refraction","id":1376350999822,"params":{},"position":{"x":575,"y":275}},{"property":"BreakingGlassScene","id":1376351013022,"params":{"force":0.05,"spin":1,"randomness":0.15,"radius":0.03,"damping":0.025},"position":{"x":175,"y":125}},{"property":"RenderNormals","id":1376351020528,"params":{},"position":{"x":400,"y":125}}]},

    Templates: {

      navigation: '<li class="add" description="Add node"></li><li class="home" description="Node options"></li><li class="share" description="Share a link"></li><li class="fullpage" description="Expand"></li><li class="fullscreen" description="Fullscreen"></li><li class="switch" description="View output"></li>',

      nodeListing: '<li class="title"><h3><%= title %></h3></li><% _.each(nodes, function(o) { %><li class="io-<%= o.inputs %>-<%= o.outputs %>" reference="<%= o.reference %>"><%= o.name %></li><% }); %>',

      paramsListing: '<li class="title"><h3><%= title %><div class="delete"></div></h3></li><% _.each(nodes, function(o, i) { %><li reference="<%= o.reference %>" class="param"><label for="<%= o.id %>"><%= o.name %></label><%= o.html %></li><% }); %>',

      defaultParamsListing: ''  //'<li><h3>Click on a Node&apos;s name to Edit</h3></li>'

    },

    CreateNavigation: function(inspector) {

      var width = inspector.parent.width;
      var height = inspector.parent.height;
      var resize = function() {
        inspector.snapToScreen();
      };

      inspector.$ = {};

      var showToolTip = function() {
        var rect = this.getBoundingClientRect();
        inspector.toolTip.show(rect.left + $body.scrollLeft(), rect.top + $body.scrollTop() + rect.height / 2, this.getAttribute('description'));
      };
      var hideToolTip = function() {
        inspector.toolTip.hide();
      };
      var __flashTitles = _.debounce(function() {
        inspector.parent.graph.shouldRender = true;
      }, 2000);
      var flashTitles = function() {
        inspector.parent.graph.shouldRender = false;
        inspector.parent.viewport.renderer.clear();
        __flashTitles();
      };

      inspector.panel.innerHTML = Inspector.Templates.navigation;

      var noGraph = !(localStorage && localStorage.getItem('opened-graph'));

      if (noGraph) {
        _.delay(function() {
          showToolTip.call(inspector.$.switcher[0]);
        }, 10000);
      }

      inspector.$.add = $(inspector.panel.querySelector('.add'))
        .hover(showToolTip, hideToolTip)
        .bind('click', function() {
          if (!inspector.parent.showing.value) {
            inspector.parent.toggle();
          }
          inspector.showNodeListing();
        });

      inspector.$.home = $(inspector.panel.querySelector('.home'))
        .hover(showToolTip, hideToolTip)
        .bind('click', function() {
          // if (!inspector.parent.showing.value) {
          //   inspector.parent.toggle();
          // }
          inspector.showParamsListing();
          if (!inspector.__focused) {
            flashTitles();
          }
        });

      inspector.$.share = $(inspector.panel.querySelector('.share'))
        .hover(showToolTip, hideToolTip)
        .bind('click', function() {
          var base = window.location.protocol + '//' + window.location.host;
          var path = window.location.pathname;
          var json = inspector.parent.toJSON(true).replace(/\s/ig, '');
          var extras = '?editor=' + inspector.parent.showing.value + '&setup=' + json;
          var uri = base + path + extras;
          inspector.contextMenu.show(uri);
          // return;
          // inspector.contextMenu.showLoader('Generating Share Link...');
          // patch = new Patch();
          // patch.Payload = inspector.parent.toJSON(true);
          // patch.$save(
          //   function(resp) {
          //     _.delay(function() {
          //       inspector.contextMenu.show('http://' + window.location.host + window.location.pathname + '?id=' + patch.Id);
          //     }, 1000);
          //   },
          //   function(resp) {
          //     _.delay(function() {
          //       inspector.contextMenu.showLoader('Unable To Generate. Please Try Again.')
          //       _.delay(function() {
          //         inspector.contextMenu.hide();
          //       }, 3000);
          //     }, 1000);
          //   });
        });

      var $fullpage = inspector.$.fullpage = $(inspector.panel.querySelector('.fullpage'))
        .hover(showToolTip, hideToolTip)
        .bind('click', function() {
          BigScreen.exit();
          if (!inspector.fullpage && !inspector.fullscreen) {
            $body.addClass('fullpage');
            inspector.snapToScreen();
            $window.bind('resize', resize);
            $fullpage.attr('description', 'Reduce sandbox within the page');
          } else {
            $body.removeClass('fullpage');
            _.extend(inspector.parent.domElement.style, {
              margin: 0
            });
            inspector.parent.setSize(width, height);
            $window.unbind('resize', resize);
            $fullpage.attr('description', 'Expand sandbox to the page');
          }
          inspector.fullpage = !inspector.fullpage;
        });

      var $fullscreen = inspector.$.fullscreen = $(inspector.panel.querySelector('.fullscreen'))
        .hover(showToolTip, hideToolTip)
        .bind('click', function() {
          if (inspector.fullpage) {
            $body.removeClass('fullpage');
            _.extend(inspector.parent.domElement.style, {
              margin: 0
            });
            inspector.parent.setSize(width, height);
            $window.unbind('resize', resize);
          }
          BigScreen.toggle(inspector.parent.domElement,
            function() {
              inspector.parent.setSize(screen.width, screen.height);
              inspector.fullscreen = true;
              inspector.fullpage = false;
              $fullscreen.addClass('set');
              $fullscreen.attr('description', 'Exit fullscreen');
            },
            function() {
              $body.removeClass('fullpage');
              _.extend(inspector.parent.domElement.style, {
                margin: 0
              });
              inspector.parent.setSize(width, height);
              inspector.fullscreen = false;
              $fullscreen.removeClass('set');
              $fullscreen.attr('description', 'Fullscreen');
            },
            function() {
              // Whoops an error :(
            });
        });

      var switcher = inspector.$.switcher = $(inspector.panel.querySelector('.switch'))
        .hover(showToolTip, hideToolTip)
        .bind('click', function() {
          if (noGraph) {
            localStorage && localStorage.setItem('opened-graph', true);
          }
          inspector.parent.toggle();
        });

      inspector.parent
        .bind('viewport', function() {
          switcher.addClass('viewport');
          switcher.attr('description', 'Hide output');
        })
        .bind('graph', function() {
          switcher.removeClass('viewport');
          switcher.attr('description', 'View output');
        });

    },

    CreateNodeListing: function(inspector) {

      inspector.nodeListing = document.createElement('ul');
      inspector.nodeListing.classList.add('node-listing');
      var data = {
        title: 'Select a Node to Add',
        nodes: _.map(Sandbox.Nodes, function(v, k) {
          var instance = new v();
          var result = {
            reference: k,
            name: v.prototype.name,
            inputs: _.size(instance.inputs),
            outputs: _.size(instance.outputs)
          };
          instance.destroy();
          return result;
        })
      };
      inspector.nodeListing.innerHTML = _.template(Inspector.Templates.nodeListing, data);
      inspector.drawer.appendChild(inspector.nodeListing);

      _.each(inspector.nodeListing.children, function(child) {
        var reference = child.getAttribute('reference');
        if (!reference) {
          return;
        }
        $(child).bind('click', function() {
          var node = new Sandbox.Nodes[reference];
          inspector.parent.add(node);
        });
      });

    },

    CreateParamsListing: function(inspector) {

      inspector.paramsListing = document.createElement('ul');
      inspector.paramsListing.classList.add('params-listing');

      inspector.paramsListing.innerHTML = Inspector.Templates.defaultParamsListing;

      inspector.drawer.appendChild(inspector.paramsListing);

    },

    CreateContextMenu: function(inspector) {

      inspector.toolTip = {

        domElement: document.createElement('div'),

        show: function(x, y, message) {
          $window.bind('click', inspector.toolTip.hide);
          inspector.toolTip.content.innerHTML = message;
          _.defer(function() {
            var rect = inspector.toolTip.domElement.getBoundingClientRect();
            _.extend(inspector.toolTip.domElement.style, {
              top: y - rect.height / 2 + 'px',
              left: x - (rect.width + 12) + 'px',
              display: 'block'
            });
          });
        },

        hide: function() {
          _.extend(inspector.toolTip.domElement.style, {
            top: - 10000 + 'px',
            left: - 10000 + 'px'
          });
          $window.unbind('click', inspector.toolTip.hide);
        }

      };

      inspector.contextMenu = {

        domElement: document.createElement('div'),

        backdrop: document.createElement('div'),

        container: document.createElement('div'),

        loader: document.createElement('div'),

        showLoader: function(message) {

          inspector.contextMenu.loader.querySelector('.content').innerHTML = message;

          inspector.contextMenu.container.style.display = 'none';
          inspector.contextMenu.loader.style.display = 'block';
          fadeIn();

        },

        show: function(url) {

          var input = inspector.contextMenu.container.querySelector('input[type="text"]');
          input.value = url || 'http://justareflektor.com/sandbox/' + 4567;

          inspector.contextMenu.container.style.display = 'block';
          inspector.contextMenu.loader.style.display = 'none';
          fadeIn();

          input.select();

        },

        hide: function() {

          inspector.contextMenu.domElement.style.opacity = 0;
          _.delay(function() {
            inspector.contextMenu.domElement.style.display = 'none';
          }, 150);

        }

      };

      var fadeIn = _.throttle(function() {
        _.extend(inspector.contextMenu.domElement.style, {
          display: 'block'
        });
        _.defer(function() {
          inspector.contextMenu.domElement.style.opacity = 1.0;
        });
      }, 1000);

      inspector.contextMenu.domElement.classList.add('url-context-menu');
      inspector.contextMenu.backdrop.classList.add('backdrop');
      inspector.contextMenu.container.classList.add('container');
      inspector.contextMenu.loader.classList.add('loader');

      inspector.toolTip.domElement.classList.add('tool-tip');
      inspector.toolTip.domElement.innerHTML = '<span class="content"></span>';
      inspector.toolTip.content = inspector.toolTip.domElement.querySelector('.content');

      inspector.contextMenu.container.innerHTML = '<div><p>To share this patch with others, copy and paste this link:</p><div class="divider"></div><input type="text" value=""></div>';
      inspector.contextMenu.container.querySelector('input').value = 'http://justareflektor.com/sandbox/' + 4564;
      inspector.contextMenu.loader.innerHTML = '<div class="container"><div><p class="content"></p></div></div>';

      inspector.contextMenu.domElement.appendChild(inspector.contextMenu.backdrop);
      inspector.contextMenu.domElement.appendChild(inspector.contextMenu.container);
      inspector.contextMenu.domElement.appendChild(inspector.contextMenu.loader);

      document.body.appendChild(inspector.toolTip.domElement);

      $(inspector.contextMenu.backdrop).bind('click', function(e) {
        inspector.contextMenu.hide();
      });

    }

  });

  _.extend(Inspector.prototype, {

    appendTo: function(elem) {
      elem.appendChild(this.domElement);
      elem.appendChild(this.contextMenu.domElement);
      return this;
    },

    showParamsListing: function() {

      this.showing = true;
      this.nodeListing.style.display = 'none';
      this.paramsListing.style.display = 'block';
      this.$.home.addClass('enabled');
      this.$.add.removeClass('enabled');

      return this;

    },

    showNodeListing: function() {

      this.showing = false;
      this.nodeListing.style.display = 'block';
      this.paramsListing.style.display = 'none';
      this.$.home.removeClass('enabled');
      this.$.add.addClass('enabled');

      return this;

    },

    toggle: function() {

      if (this.showing) {
        this.showNodeListing();
      } else {
        this.showParamsListing();
      }

      return this;

    },

    /**
     * Methods to be bound to Sandbox's events.
     */

    /**
     * Add a node to the inspectors paramsListing.
     */
    add: function(node) {

      var html = _.template(Inspector.Templates.paramsListing, {
        title: node.name,
        nodes: _.map(node.params, interpretValue)
      });

      var el = document.createElement('li');
      el.classList.add('shell');
      el.id = 'params-' + node.id;
      el.innerHTML = html;

      addInteractivity(this, node, el);

      this.paramsListing.appendChild(el);

      return this;

    },

    remove: function(node) {

      var id = '#params-' + node.id;
      var el = document.querySelector(id);
      $(el).remove();

      return this;

    },

    focus: function(node) {

      this.__focused = true;

      this.drawer.classList.add('enabled');
      var endSticky = _.bind(function() {
        this.drawer.classList.remove('enabled');
        $(this.domElement).unbind('mouseleave', endSticky);
      }, this);
      $(this.domElement).bind('mouseleave', endSticky);

      return this.showParamsListing();

    },

    snapToScreen: function() {

      var width = w = $window.width();
      var height = h = $window.height();
      var toY = width / Sandbox.aspectRatio > height;

      // Constrain dimensions to aspect ratio and window size.
      if (toY) {
        w = height * Sandbox.aspectRatio;
      }

      w = Math.min(w, 1920);
      h = w / Sandbox.aspectRatio;

      this.parent.setSize(w, h);

      // Vertically center
      _.extend(this.parent.domElement.style, {
        marginLeft: (width - w)  / 2 + 'px',
        marginTop: (height - h) / 2 + 'px'
      });

      return this;

    }

  });

  function interpretValue(param, name) {

    var html, id = _.uniqueId('param-');

    if (param.options) {

      // Selection of choices / array

      html = _.template(
        '<div class="array"><select id="<%= id %>"><% _.each(array, function(o, i) { %><option value="<%= o.value %>" <%= (!_.isUndefined(value) && o.value.toString() === value.toString()) ? "selected" : "" %>><%= o.name %></option><% }); %></select></div>',
      {
        id: id,
        array: param.options,
        value: param.value
      });

    } else if (_.isNumber(param.value)) {

      param.id = id;

      // This is a number
      html = _.template(
        '<div class="number"><div class="slider"><div class="fg"></div></div><input id="<%= id %>" type="text" value="<%= value %>"></div>',
        param
      );

    } else if (_.isBoolean(param.value)) {

      param.id = id;

      html = _.template(
        '<div class="boolean"><input id="<%= id %>" type="checkbox" value="<%= name %>" <%= !!value ? "checked" : "" %>></div>',
        param
      );

    } else if (_.isString(param.value)) {

      param.id = id;
      html = _.template(
        '<div class="string"><textarea id="<%= id %>"><%= value %></textarea></div>',
        param
      );

    }

    return {
      id: id,
      name: name,
      reference: name,
      html: html
    };

  }

  function addInteractivity(inspector, node, parentElement) {

    var params = node.params;
    var domElement = parentElement || inspector.paramsListing;

    _.each(domElement.querySelectorAll('.param'), function(elem) {

      var name = elem.getAttribute('reference');
      var param = params[name];

      if (param.options) {

        $(elem.querySelector('select')).change(function(e) {
          param.value = this.value;
          if (_.isFunction(param.onUpdate)) {
            param.onUpdate();
          }
        });

      } else if (_.isNumber(param.value)) {

        var drag = function(e) {
          e.preventDefault();
          e.stopPropagation();
          var rect = $slider[0].getBoundingClientRect();
          var value = pctToValue((e.clientX - rect.left) / (rect.width), param);
          if (_.isNumber(param.step)) {
            value = snapValue(value, param.step);
          }
          $input.val(value).trigger('blur');
        };
        var endDrag = function(e) {
          e.preventDefault();
          e.stopPropagation();
          $body.removeClass('dragging');
          $window
            .unbind('mousemove', drag)
            .unbind('mouseup', endDrag);
        }

        var $slider = $(elem.querySelector('.slider'))
          .bind('mousedown', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $body.addClass('dragging');
            $window
              .bind('mousemove', drag)
              .bind('mouseup', endDrag);
          });
        var $fg = $(elem.querySelector('.fg'));
        var $input = $(elem.querySelector('input'))
          .bind('keyup', function(e) {

            if (e.which === 13) { // Enter key
              $input.trigger('blur');
            }

          })
          .bind('blur', function(e) {

            param.value = clamp(this.value, param.min, param.max);
            $fg.css('width', pct(param) + '%');

          })
          .trigger('blur');

      } else if (_.isBoolean(param.value)) {

        $(elem.querySelector('input')).change(function(e) {

          param.value = !!this.checked;

        });

      } else if (_.isString(param.value)) {

        $(elem.querySelector('textarea'))
          .blur(function(e) {

            param.value = $(this).val();
            param.onUpdate();

          });

      }

    });

    $(domElement.querySelector('.delete')).bind('click', function(e) {

      // var children = domElement.children;
      // destroy(domElement);
      inspector.parent.remove(node);
      // inspector.__focused = false;
      // domElement.innerHTML = Inspector.Templates.defaultParamsListing;
      // inspector.showNodeListing();

    });

  }

  function snapValue(v, amt) {
    return Math.round(v / amt) * amt;
  }

  function pctToValue(pct, param) {
    return map(clamp(pct, 0, 1), 0, 1, param.min, param.max);
  }

  function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
  }

  function pct(object) {
    return 100 * object.value / (object.max - object.min);
  }

  function map(v, i1, i2, o1, o2) {
    return o1 + (o2 - o1) * ((v - i1) / (i2 - i1));
  }

  function destroy(elems) {

    _.each(_.toArray(elems), function(elem) {
      $(elem).remove();
    });

  }

  function generateDOM(html) {
    TEMP.innerHTML = html;
    return TEMP.children[0];
  }

})();