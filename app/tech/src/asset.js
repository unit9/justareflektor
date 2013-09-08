(function() {

  var Asset = Sandbox.Asset = function(attrs) {

    this._callbacks = [];

    _.each(attrs, function(v, k) {
      this[k] = v;
    }, this);

  };

  _.extend(Asset.prototype, Backbone.Events, {

    isReady: false,

    ready: function(sandbox, func) {

      if (!_.isFunction(func)) {
        return this;
      }

      if (this.isReady) {
        func.call(this);
        return this;
      }

      this._callbacks.push(func);
      sandbox.loader.add(this);

      return this;

    },

    available: function() {

      this.isReady = true;

      _.each(this._callbacks, function(c) {
        c.call(this);
      }, this);

      this._callbacks.length = 0;
      this.trigger('dequeue');

      return this;

    }

  });

})();