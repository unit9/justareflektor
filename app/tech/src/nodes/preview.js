(function() {

  var Preview = Sandbox.Preview = function() {

    Sandbox.Node.call(this);

    var _this = this;
    var buffer = null

    this.buffer = null;
    this.inputs.buffer = null;

    Object.defineProperty(this.inputs, 'buffer', {

      get: function() {
        return buffer;
      },

      set: function(b) {
        buffer = _this.buffer = b;
      }

    });

    this.html = _.template(Sandbox.Graph.Templates.preview, this);

  };

  _.extend(Preview.prototype, Sandbox.Node.prototype, {

    name: 'Output',

    update: function() {

      return this.trigger('update');

    }

  });

})();