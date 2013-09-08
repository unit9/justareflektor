(function() {

  var root = this;
  var previousPresets = root.Presets || {};
  var defaultData = [0.8545348073821515, 0.6449834604281932, 0.4375324007123709, 0.22794777108356357, 0.6350919008255005, 0.7243804500903934, 0.5150789797771722, 0.05259145935997367, 0.7614971525035799, 0.8993644588626921, 0.4340125855524093, 0.44820141256786883, 0.27612061938270926, 0.774358943104744, 0.7313310133758932, 0.9067193132359535, 0.09752604062668979, 0.006957493489608169, 0.6132684554904699, 0.8749618909787387, 0.6230360376648605, 0.2612884775735438, 0.7366344053298235, 0.44579513324424624, 0.7942398120649159, 0.29524966748431325, 0.5856982008554041, 0.9812010901514441, 0.5537883017677814, 0.6397414817474782, 0.06563076912425458, 0.7027583869639784, 0.9143889769911766, 0.1288281069137156, 0.946539397817105, 0.5204102650750428, 0.2846473592799157, 0.7964318916201591, 0.12211122759617865, 0.3008610450197011, 0.6569329330231994, 0.8113144277594984, 0.427732456009835, 0.9209129242226481, 0.1099346976261586, 0.694671907229349, 0.2653880778234452, 0.690507810562849, 0.7715856258291751, 0.822136023780331, 0.44876224850304425, 0.07343343459069729, 0.7558092111721635, 0.6947648564819247, 0.003142944537103176, 0.44641775893978775, 0.09125432255677879, 0.44552362291142344, 0.734915969427675, 0.6415500903967768, 0.5052988447714597, 0.8852059869095683, 0.8928992333821952, 0.3866059195715934, 0.00126143847592175, 0.9016434701625258, 0.95179548044689, 0.41803476330824196, 0.32514015887863934, 0.6269760294817388, 0.11422493914142251, 0.17136683454737067, 0.08433137810789049, 0.41016195830889046, 0.4192883151117712, 0.689172402722761, 0.7900370811112225, 0.26828888594172895, 0.11189790884964168, 0.6445269179530442, 0.9113203366287053, 0.48726505949161947, 0.12856535986065865, 0.5994965792633593, 0.40974911395460367, 0.3376194112934172, 0.4237371664494276, 0.7128617418929935, 0.5956347535829991, 0.8210859394166619, 0.579063409473747, 0.3274014357011765, 0.7984416319523007, 0.10231462121009827, 0.38806268386542797, 0.8508633642923087, 0.9944734785240144, 0.646829821402207, 0.9810234524775296, 0.5279441084712744];

  var Presets = root.Presets = function(options) {

    var params = _.defaults(options || {}, {
      data: defaultData
    });

    var _this = this;

    this.domElement = document.createElement('div');

    var two = this.two = new Two({
      width: params.width,
      height: params.height
    }).appendTo(this.domElement);

    var length = params.data.length;
    var top = [];
    var bottom = [];

    _.each(params.data, function(amplitude, i) {

      var pct = i / length;
      var x = pct * two.width;
      var y = two.height / 2;
      var width = Math.ceil(two.width / length);
      var height = amplitude * two.height;
      var ratio = 0.75;

      var t = new Two.Vector(x, height / 2);
      var b = new Two.Vector(x, height / 2);

      t.destination = y - height * ratio;
      b.destination = y + height * (1 - ratio);

      top.push(t);
      bottom.push(b);

    }, this);

    var points = top.concat(bottom.reverse());
    var polygon = two.makePolygon(points);
    polygon.translation.set(two.width / 2, two.height * 0.25);
    polygon.noStroke().fill = 'rgb(25, 25, 25)';

    var line = two.makePolygon(top, true);
    line.linewidth = 1.5;
    line.translation.set(two.width / 2, two.height * 0.25);
    line.noFill().stroke = 'white';

    var rectangle = two.makeRectangle(two.width / 2, two.height * 0.875, two.width, two.height * 0.25);
    rectangle.noStroke().fill = 'rgba(0, 0, 0, 0.33)';

    bottom.reverse();

    _.each(top, function(t, i) {
      var b = bottom[i];
      t.y = b.y = b.destination;
      delete b.destination;
    });

    Presets.AddOverlay(this);

    var complete = _.after(30, _.bind(function() {
      this._completed = true;
      this.trigger('completed');
    }, this));

    two.bind('update', _.bind(function(frameCount) {

      if (this._completed) {
        return;
      }

      _.each(polygon.vertices, function(v) {
        var equals = v.y === v.destination;
        if (v.destination) {
          v.y += (v.destination - v.y) * 0.125;
        }
      }, this);

      complete();

    }, this));

  };

  _.extend(Presets, {

    noConflict: function() {
      root.Presets = previousPresets;
      return this;
    },

    Size: 25,

    Templates: {

      thumbnail: '<div class="image-preview"><img src="<%= src %>" onmousedown="return false" width="300" height="150" alt="" /></div>'

    },

    defaults: [
      {
        placement: 0.06,
        thumbnail: 'images/thumbnails/light.jpg',
        isFilm: true,
        json: {"output":{"id":1376350967933,"position":{"x":800,"y":275}},"connections":[{"input":{"id":1377641422619,"property":"buffer2"},"output":{"id":1376350984248,"property":"texture"}},{"input":{"id":1377641422619,"property":"buffer1"},"output":{"id":1377641430030,"property":"buffer"}},{"input":{"id":1377641428158,"property":"texture"},"output":{"id":1377641422619,"property":"buffer"}},{"input":{"id":1377641423602,"property":"buffer2"},"output":{"id":1377641422619,"property":"buffer"}},{"input":{"id":1376350967933,"property":"buffer"},"output":{"id":1377641423602,"property":"buffer"}},{"input":{"id":1377641423602,"property":"buffer1"},"output":{"id":1377641428158,"property":"buffer"}}],"nodes":[{"property":"VideoTexture","id":1376350984248,"params":{"source":resource.get("/media/video/640/reflektor_1.webm")},"position":{"x":125,"y":325}},{"property":"Composite3","id":1377641422619,"params":{"opacity1":1,"opacity2":1,"blending":"2"},"position":{"x":350,"y":425}},{"property":"Composite3","id":1377641423602,"params":{"opacity1":1,"opacity2":1,"blending":"0"},"position":{"x":550,"y":275}},{"property":"GodRays","id":1377641428158,"params":{"steps":6},"position":{"x":350,"y":100}},{"property":"DrawingBlur","id":1377641430030,"params":{"size":0.3,"sizeRandomness":0.25,"intensity":1,"fade":0.01},"position":{"x":125,"y":200}}]}
      },
      {
        placement: 0.17,
        thumbnail: 'images/thumbnails/sea.jpg',
        isFilm: true,
        json: {"output":{"id":1376350967933,"position":{"x":800,"y":275}},"connections":[{"input":{"id":1376526778799,"property":"mask"},"output":{"id":1376526770052,"property":"buffer"}},{"input":{"id":1376526778799,"property":"video"},"output":{"id":1376526764556,"property":"texture"}},{"input":{"id":1376526787327,"property":"video"},"output":{"id":1376526778799,"property":"buffer"}},{"input":{"id":1376526787327,"property":"mask"},"output":{"id":1376526770052,"property":"buffer"}},{"input":{"id":1376350967933,"property":"buffer"},"output":{"id":1376526787327,"property":"buffer"}}],"nodes":[{"property":"VideoTexture","id":1376526764556,"params":{"source":resource.get("/media/video/640/reflektor_3.webm")},"position":{"x":175,"y":100}},{"property":"DrawingBlur","id":1376526770052,"params":{"size":0.3,"sizeRandomness":0.4,"intensity":0.9,"fade":0.01},"position":{"x":150,"y":450}},{"property":"VideoFeedback","id":1376526778799,"params":{},"position":{"x":350,"y":250}},{"property":"Vibrance","id":1376526787327,"params":{"effectAlpha":0.5},"position":{"x":550,"y":350}}]}
      },
      {
        placement: 0.29,
        thumbnail: 'images/thumbnails/portrait.jpg',
        isFilm: true,
        json: {"output":{"id":1376350967933,"position":{"x":775,"y":450}},"connections":[{"input":{"id":1377222178595,"property":"data"},"output":{"id":1377222174292,"property":"data"}},{"input":{"id":1377222189635,"property":"buffer1"},"output":{"id":1377222169874,"property":"texture"}},{"input":{"id":1377563969859,"property":"buffer"},"output":{"id":1377222178595,"property":"buffer"}},{"input":{"id":1377563969111,"property":"buffer"},"output":{"id":1377563969859,"property":"buffer"}},{"input":{"id":1377222189635,"property":"buffer2"},"output":{"id":1377563969111,"property":"buffer"}},{"input":{"id":1378337783835,"property":"buffer1"},"output":{"id":1377222189635,"property":"buffer"}},{"input":{"id":1376350967933,"property":"buffer"},"output":{"id":1378337783835,"property":"buffer"}},{"input":{"id":1378337783835,"property":"buffer2"},"output":{"id":1377563983240,"property":"buffer"}},{"input":{"id":1377563983240,"property":"buffer"},"output":{"id":1377563969111,"property":"buffer"}}],"nodes":[{"property":"VideoTexture","id":1377222169874,"params":{"source":resource.get("/media/video/640/reflektor_4.webm")},"position":{"x":125,"y":75}},{"property":"PointData","id":1377222174292,"params":{"source":resource.get("/media/tracking/videogrid.json")},"position":{"x":125,"y":200}},{"property":"Lines","id":1377222178595,"params":{"amount":100,"thickness":4,"connections":true,"threshold":0.33},"position":{"x":125,"y":350}},{"property":"Composite3","id":1377222189635,"params":{"opacity1":1,"opacity2":1,"blending":"0"},"position":{"x":550,"y":100}},{"property":"Blur","id":1377563969111,"params":{"amount":2},"position":{"x":350,"y":200}},{"property":"Blur","id":1377563969859,"params":{"amount":4},"position":{"x":125,"y":475}},{"property":"Noise","id":1377563983240,"params":{"fade":0.66},"position":{"x":550,"y":275}},{"property":"Composite3","id":1378337783835,"params":{"opacity1":1,"opacity2":1,"blending":"0"},"position":{"x":750,"y":200}}]}
      },
      {
        placement: 0.36,
        thumbnail: 'images/thumbnails/multiplication.jpg',
        isFilm: true,
        json: {"output":{"id":1376350967933,"position":{"x":800,"y":275}},"connections":[{"input":{"id":1377815520362,"property":"video"},"output":{"id":1376350984248,"property":"texture"}},{"input":{"id":1377815606612,"property":"buffer"},"output":{"id":1377815520362,"property":"buffer"}},{"input":{"id":1376350967933,"property":"buffer"},"output":{"id":1377815606612,"property":"buffer"}}],"nodes":[{"property":"VideoTexture","id":1376350984248,"params":{"source":resource.get("/media/video/640/reflektor_5.webm")},"position":{"x":150,"y":275}},{"property":"Planes","id":1377815520362,"params":{"amount":10,"drag":0.125},"position":{"x":350,"y":275}},{"property":"Blur","id":1377815606612,"params":{"amount":1},"position":{"x":550,"y":275}}]}
      },
      {
        placement: 0.46,
        thumbnail: 'images/thumbnails/zombies.jpg',
        isFilm: true,
        json: {"output":{"id":1376350967933,"position":{"x":775,"y":275}},"connections":[{"input":{"id":1377222178595,"property":"data"},"output":{"id":1377222174292,"property":"data"}},{"input":{"id":1377222189635,"property":"buffer1"},"output":{"id":1377222169874,"property":"texture"}},{"input":{"id":1376350967933,"property":"buffer"},"output":{"id":1377222189635,"property":"buffer"}},{"input":{"id":1377563969859,"property":"buffer"},"output":{"id":1377222178595,"property":"buffer"}},{"input":{"id":1377563969111,"property":"buffer"},"output":{"id":1377563969859,"property":"buffer"}},{"input":{"id":1377563983240,"property":"buffer"},"output":{"id":1377563969111,"property":"buffer"}},{"input":{"id":1377222189635,"property":"buffer2"},"output":{"id":1377563983240,"property":"buffer"}}],"nodes":[{"property":"VideoTexture","id":1377222169874,"params":{"source":resource.get("/media/video/640/reflektor_7-11.webm")},"position":{"x":125,"y":75}},{"property":"PointData","id":1377222174292,"params":{"source":resource.get("/media/tracking/axelle_final.json")},"position":{"x":125,"y":200}},{"property":"Lines","id":1377222178595,"params":{"amount":1000,"thickness":4},"position":{"x":125,"y":325}},{"property":"Composite3","id":1377222189635,"params":{"opacity1":1,"opacity2":1},"position":{"x":500,"y":200}},{"property":"Blur","id":1377563969111,"params":{"amount":10},"position":{"x":325,"y":425}},{"property":"Blur","id":1377563969859,"params":{"amount":4},"position":{"x":125,"y":425}},{"property":"Noise","id":1377563983240,"params":{"fade":1},"position":{"x":325,"y":325}}]}
      },
      {
        placement: 0.56,
        thumbnail: 'images/thumbnails/mirror.jpg',
        isFilm: true,
        json: {"output":{"id":1376350967933,"position":{"x":800,"y":275}},"connections":[{"input":{"id":1377733693509,"property":"video"},"output":{"id":1377733687584,"property":"texture"}},{"input":{"id":1376350967933,"property":"buffer"},"output":{"id":1377733693509,"property":"buffer"}}],"nodes":[{"property":"Webcam","id":1377733687584,"params":{},"position":{"x":250,"y":275}},{"property":"BrokenMirror","id":1377733693509,"params":{"offset":50,"scale":4.75,"color offset":2,"perspective":1.25,"diffraction":0.8,"flipX":true,"flipY":true},"position":{"x":475,"y":275}}]}
      },

      {
        thumbnail: 'images/thumbnails/broken-glass.jpg',
        isFilm: false,
        json: {"output":{"id":1376350967933,"position":{"x":800,"y":275}},"connections":[{"input":{"id":1376351020528,"property":"scene"},"output":{"id":1376351013022,"property":"scene"}},{"input":{"id":1376350999822,"property":"normal"},"output":{"id":1376351020528,"property":"buffer"}},{"input":{"id":1376350999822,"property":"video"},"output":{"id":1376350984248,"property":"texture"}},{"input":{"id":1378342757461,"property":"scene"},"output":{"id":1376351013022,"property":"scene"}},{"input":{"id":1378342767007,"property":"buffer1"},"output":{"id":1376350999822,"property":"buffer"}},{"input":{"id":1378342767007,"property":"buffer2"},"output":{"id":1378342757461,"property":"buffer"}},{"input":{"id":1376350967933,"property":"buffer"},"output":{"id":1378342767007,"property":"buffer"}}],"nodes":[{"property":"VideoTexture","id":1376350984248,"params":{"source":resource.get("/media/video/640/reflektor_1.webm")},"position":{"x":100,"y":400}},{"property":"Refraction","id":1376350999822,"params":{},"position":{"x":325,"y":275}},{"property":"BreakingGlassScene","id":1376351013022,"params":{"force":0.05,"spin":1,"randomness":0.15,"radius":0.03,"damping":0.025},"position":{"x":100,"y":125}},{"property":"RenderNormals","id":1376351020528,"params":{},"position":{"x":325,"y":125}},{"property":"RenderMask","id":1378342757461,"params":{},"position":{"x":325,"y":400}},{"property":"Composite3","id":1378342767007,"params":{"opacity1":1,"opacity2":1,"blending":"1"},"position":{"x":550,"y":275}}]}
      },
      {
        thumbnail: 'images/thumbnails/refraction.jpg',
        isFilm: false,
        json: {"output":{"id":1376350967933,"position":{"x":800,"y":275}},"connections":[{"input":{"id":1377651760624,"property":"video"},"output":{"id":1377651765138,"property":"texture"}},{"input":{"id":1377652202329,"property":"buffer"},"output":{"id":1376350984248,"property":"texture"}},{"input":{"id":1376350967933,"property":"buffer"},"output":{"id":1377651760624,"property":"buffer"}},{"input":{"id":1377652381140,"property":"buffer"},"output":{"id":1377652202329,"property":"buffer"}},{"input":{"id":1377651760624,"property":"normal"},"output":{"id":1377652381140,"property":"buffer"}}],"nodes":[{"property":"VideoTexture","id":1376350984248,"params":{"source":resource.get("/media/video/640/reflektor_1.webm")},"position":{"x":125,"y":275}},{"property":"Refraction","id":1377651760624,"params":{},"position":{"x":525,"y":275}},{"property":"VideoTexture","id":1377651765138,"params":{"source":resource.get("/media/video/640/reflektor_3.webm")},"position":{"x":125,"y":475}},{"property":"BumpToNormal","id":1377652202329,"params":{"intensity":50},"position":{"x":275,"y":100}},{"property":"Blur","id":1377652381140,"params":{"amount":4},"position":{"x":475,"y":100}}]}
      },
      {
        thumbnail: 'images/thumbnails/spotlight.jpg',
        isFilm: false,
        json: {"output":{"id":1376350967933,"position":{"x":775,"y":275}},"connections":[{"input":{"id":1377222178595,"property":"data"},"output":{"id":1377222174292,"property":"data"}},{"input":{"id":1377222189635,"property":"buffer1"},"output":{"id":1377222169874,"property":"texture"}},{"input":{"id":1376350967933,"property":"buffer"},"output":{"id":1377222189635,"property":"buffer"}},{"input":{"id":1377651890790,"property":"texture"},"output":{"id":1377222178595,"property":"buffer"}},{"input":{"id":1377651952531,"property":"buffer"},"output":{"id":1377651890790,"property":"buffer"}},{"input":{"id":1377222189635,"property":"buffer2"},"output":{"id":1377651952531,"property":"buffer"}}],"nodes":[{"property":"VideoTexture","id":1377222169874,"params":{"source":resource.get("/media/video/640/reflektor_4.webm")},"position":{"x":125,"y":75}},{"property":"PointData","id":1377222174292,"params":{"source":resource.get("/media/tracking/videogrid.json")},"position":{"x":125,"y":200}},{"property":"Lines","id":1377222178595,"params":{"amount":25,"thickness":5},"position":{"x":125,"y":325}},{"property":"Composite3","id":1377222189635,"params":{"opacity1":1,"opacity2":1},"position":{"x":575,"y":100}},{"property":"GodRays","id":1377651890790,"params":{"intensity":1},"position":{"x":350,"y":325}},{"property":"Blur","id":1377651952531,"params":{"amount":25},"position":{"x":350,"y":200}}]}
      },
      {
        thumbnail: 'images/thumbnails/suminagashi.jpg',
        isFilm: false,
        json: {"output":{"id":1376350967933,"position":{"x":700,"y":300}},"connections":[{"input":{"id":1376350967933,"property":"buffer"},"output":{"id":1377658220079,"property":"buffer"}},{"input":{"id":1377658220079,"property":"video"},"output":{"id":1377657792205,"property":"texture"}},{"input":{"id":1377658220079,"property":"mask"},"output":{"id":1376350984248,"property":"texture"}}],"nodes":[{"property":"VideoTexture","id":1376350984248,"params":{"source":resource.get("/media/video/640/reflektor_3.webm")},"position":{"x":175,"y":225}},{"property":"Suminagashi","id":1377657792205,"params":{"interval":1000,"resolution":16,"velocity":5,"drag":0.125,"randomness":1,"perlin":true},"position":{"x":175,"y":400}},{"property":"VideoFeedback","id":1377658220079,"params":{},"position":{"x":425,"y":300}}]}
      },
      {
        thumbnail: 'images/thumbnails/bokeh.jpg',
        isFilm: false,
        json: {"output":{"id":1376350967933,"position":{"x":800,"y":275}},"connections":[{"input":{"id":1377815520362,"property":"video"},"output":{"id":1376350984248,"property":"texture"}},{"input":{"id":1377815862235,"property":"texture"},"output":{"id":1377815520362,"property":"buffer"}},{"input":{"id":1376350967933,"property":"buffer"},"output":{"id":1377815862235,"property":"buffer"}}],"nodes":[{"property":"VideoTexture","id":1376350984248,"params":{"source":resource.get("/media/video/640/reflektor_5.webm")},"position":{"x":150,"y":275}},{"property":"Planes","id":1377815520362,"params":{"amount":50,"drag":0.75},"position":{"x":350,"y":275}},{"property":"GodRays","id":1377815862235,"params":{"intensity":1,"rayLength":0.1},"position":{"x":550,"y":275}}]}
      }
    ],

    AddOverlay: function(presets) {

      // Add a series of domElements to the presets panel
      // that when clicked enable a preset on the sandbox.

      var _this = presets;
      var two = _this.two;

      _.each(Presets.defaults, function(data, i) {

        if (!data.isFilm) {
          return; 
        }

        var x = data.placement * 100;

        var line = document.createElement('div');
        line.classList.add('vert');
        _.extend(line.style, {
          position: 'absolute',
          bottom: 0,
          left: x + '%',
          height: 0,
          borderLeft: '2px solid rgba(0, 0, 0, 0.25)'
        });

        var el = document.createElement('div');
        el.classList.add('thumbnail');
        _.extend(el.style, {
          position: 'absolute',
          top: 28 + '%',
          left: x + '%'
        });

        el.innerHTML = _.template(Presets.Templates.thumbnail, {
          src: data.thumbnail
        });

        this.bind('completed', function() {
          el.children[0].classList.add('live');
          line.style.height = 100 + '%';
        });

        el.addEventListener('click', _.bind(function() {
          if (_this.sandbox) {
            this.sandbox.loadJSON(data.json);
            this.sandbox.showViewport();
          }
        }, this));

        this.domElement.appendChild(line);
        this.domElement.appendChild(el);

      }, _this);

    }

  });

  _.extend(Presets.prototype, Backbone.Events, {

    appendTo: function(elem) {
      elem.appendChild(this.domElement);
      return this;
    },

    setSandbox: function(sandbox) {
      this.sandbox = sandbox;
      return this;
    },

    update: function() {
      this.two.update();
    }

  });

})();