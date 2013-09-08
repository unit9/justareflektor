(function() {

  var root = this;
  var previousResource = root.resource || {};

  var resource = root.resource = {

    local: /localhost/.test(window.location.host),

    get: function(path) {

      if (this.local) {
        return '/localmedia' + path;
      }
      
      return path;

    }

  };

})();