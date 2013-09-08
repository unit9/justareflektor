/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.LoadingManager = function ( onLoad, onProgress, onError ) {

  var scope = this;

  var loaded = 0, total = 0;

  this.onLoad = onLoad;
  this.onProgress = onProgress;
  this.onError = onError;

  this.itemStart = function ( url ) {

    total ++;

  };

  this.itemEnd = function ( url ) {

    loaded ++;

    if ( scope.onProgress !== undefined ) {

      scope.onProgress( url, loaded, total );

    }

    if ( loaded === total && scope.onLoad !== undefined ) {

      scope.onLoad();

    }

  };

};

THREE.DefaultLoadingManager = new THREE.LoadingManager();

/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.XHRLoader = function ( manager ) {

  this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.XHRLoader.prototype = {

  constructor: THREE.XHRLoader,

  load: function ( url, onLoad, onProgress, onError ) {

    var scope = this;
    var request = new XMLHttpRequest();

    if ( onLoad !== undefined ) {

      request.addEventListener( 'load', function ( event ) {

        onLoad( event.target.responseText );
        scope.manager.itemEnd( url );

      }, false );

    }

    if ( onProgress !== undefined ) {

      request.addEventListener( 'progress', function ( event ) {

        onProgress( event );

      }, false );

    }

    if ( onError !== undefined ) {

      request.addEventListener( 'error', function ( event ) {

        onError( event );

      }, false );

    }

    if ( this.crossOrigin !== undefined ) request.crossOrigin = this.crossOrigin;

    request.open( 'GET', url, true );
    request.send( null );

    scope.manager.itemStart( url );

  },

  setCrossOrigin: function ( value ) {

    this.crossOrigin = value;

  }

};