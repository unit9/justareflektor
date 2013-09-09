(function() {

  var MAX_WIDTH = 1920 / 4;
  var TWO_PI = Math.PI * 2;

  var Suminagashi = Sandbox.Nodes.Suminagashi = function() {

    var _this = this;

    Sandbox.Node.call(this);

    this.destroy();

    this.two = new Two({ type: Two.Types.canvas, width: 480, height: 270 });
    this.drops = this.two.scene;

    this.outputs.texture = this.buffer = new THREE.Texture(this.two.renderer.domElement);
    this.outputs.texture.__parentNode = this;
    this.outputs.texture.minFilter = THREE.LinearFilter;
    this.outputs.texture.magFilter = THREE.LinearFilter;
    this.outputs.texture.format = THREE.RGBFormat;
    this.outputs.texture.generateMipmaps = false;

    this.params = {
      interval: { value: 2000, min: 250, max: 10000, step: 10 },
      resolution: { value: 32, min: 16, max: 64, step: 2 },
      velocity: { value: 10, min: 1, max: 20, step: 1 },
      drag: { value: 0.125, min: 0.0001, max: 1, step: 0.0001 },
      randomness: { value: 0, min: 0, max: 1, step: 0.001 },
      perlin: { value: false },
      fade: { value: false }
    };

    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    this.destructables.push(this.texture);

    this.lastTrigger = Date.now();
    this.width = this.two.width; this.height = this.two.height;
    this.mouse = { x: this.width / 2, y: this.height / 2 };

  };

  _.extend(Suminagashi.prototype, Sandbox.Node.prototype, {

    name: 'Suminagashi',

    resize: function(width, height) {

      var scale = Math.min(1, MAX_WIDTH / width);

      this.width = width * scale;
      this.height = height * scale;

      // Set size of two.js renderer
      this.two.renderer.setSize(this.width, this.height);
      this.two.width = this.width;
      this.two.height = this.height;

      return this;

    },

    addDrop: function() {

      // Params
      var velocity = this.getParam('velocity');
      var resolution = this.getParam('resolution');
      var randomness = this.getParam('randomness');
      var usePerlin = this.getParam('perlin');

      var x = this.mouse.x, y = this.mouse.y;
      var two = this.two, drops = this.drops;

      var ib = isBlack.call(this, x, y);
      var color = ib ? 'white' : 'black';
      var origin = new Two.Vector(x, y);

      var points = _.map(_.range(resolution), function(i) {

        var pct = i / resolution;
        var theta = TWO_PI * pct;
        var v = new Two.Vector(
          Math.cos(theta) + x,
          Math.sin(theta) + y
        );

        var perlin = (noise.perlin2(x, y) + 1) / 2;
        v.velocity = randomness * (usePerlin ? perlin : Math.random()) * velocity + velocity;
        v.direction = Math.atan2(y - v.y, x - v.x);

        return v;

      });

      // Reup the previous drops velocities
      _.each(drops.children, function(drop) {
        var pos = drop.translation;
        _.each(drop.vertices, function(v) {
          var distance = v.distanceTo(origin);
          var normal = distance / two.width;
          v.velocity = velocity * normal + velocity;
          v.direction = Math.atan2(y - pos.y - v.y, x - pos.x - v.x) + Math.PI;
        });
      });

      var shape = two.makeCurve(points);
      shape.color = ib ? 255 : 0;
      shape.noStroke().fill = updateColor(shape.color);
      shape.isWhite = ib;

      drops.add(shape);

    },

    update: function() {

      var now = Date.now();
      if (now - this.lastTrigger > this.getParam('interval')) {
        this.addDrop();
        this.lastTrigger = now;
      }

      updateDrops.call(this);

      this.two.render();
      this.outputs.texture.needsUpdate = true;

      return this.trigger('update');

    },

    onMouseMove: function(x, y) {

      this.mouse.x = this.width * x;
      this.mouse.y = this.height * y;

      return this;

    },

    destroy: function() {

      Sandbox.Node.prototype.destroy.call(this);

      var index = _.indexOf(Two.Instances, this.two);
      if (index >= 0) {
        Two.Instances.splice(index, 1);
      }

      return this;

    }

  });

  function updateDrops() {

    var drops = this.drops;
    var fadeOut = this.getParam('fade');
    var drag = this.getParam('drag');
    var randomness = this.getParam('randomness');
    var usePerlin = this.getParam('perlin');

    _.each(drops.children, function(drop) {

      var outside = true, stopped = false;

      if (drop.isWhite && fadeOut) {
        drop.color += - drop.color * drag / 12;
        drop.color = Math.floor(drop.color);
        drop.fill = updateColor(drop.color);
      }

      _.each(drop.vertices, function(v) {

        if (v.velocity <= 0) {
          stopped = true;
          return;
        }

        var length = v.length();
        if (length < two.width) {
          outside = false;
        }

        var perlin = (noise.perlin2(v.x, v.y) + 1) / 2;
        v.x += v.velocity * Math.cos(v.direction);
        v.y += v.velocity * Math.sin(v.direction);
        v.velocity -= v.velocity * drag * ((usePerlin ? perlin : Math.random()) * randomness || 1);

      });

      if (outside && !stopped) {
        drop.remove();
      }

    });

  }

  function updateColor(color) {
    return 'rgb(' + color + ',' + color + ',' + color + ')';
  }

  function isBlack(x, y) {
    var canvas = this.two.renderer.domElement;
    var data = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
    return data[3] <= 0 || data[0] < (255 / 2) && data[1] < (255 / 2)
      && data[2] < (255 / 2);
  }

})();