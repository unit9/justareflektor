/**
 * @author Maciej Zasada
 */

(function(window, document, undefined) {

	/* compatibility fixes */
	window.requestAnimationFrame = (function() {
		return  window.requestAnimationFrame	|| 
		window.webkitRequestAnimationFrame		||
		window.mozRequestAnimationFrame			||
		window.oRequestAnimationFrame			||
		window.msRequestAnimationFrame			||
		function(callback) {
			window.setTimeout(callback, 1000 / 60);
		};
    })();
    
    window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

    /* classes */
	function CandlelightCore() {

		var libraries = [];
		var version = 1;

		/* Classes */
		this.Library = function(code) {

			var library = function() {

				this.version = 1;
				this.requiredMinCoreVersion = 1;
				this.requiredMaxCoreVersion = 1;

				for(var fieldName in code) {

					this[fieldName] = code[fieldName];

				}

			};

			return library;

		};

		/* public */
		this.registerLibrary = function(name, library) {

			if(libraries[name]) {
				throw 'library ' + name + ' already registered';
			}

			if(library.requiredCoreVersion > version) {
				throw 'library ' + name + ' requires higher CandlelightCore version';
			}

			if(library.requiredCoreVersion < version) {
				throw 'library ' + name + ' requires lower CandlelightCore version';
			}

			libraries[name] = library;
				
			this.__defineGetter__(name, function() {
				return libraries[name];
			});

			this.__defineSetter__(name, function() {
//				throw 'cannot override a registered library';
			});

            return library;

		};

	}

	window.candlelightcore = window.candlelightcore || new CandlelightCore();

})(window, document);
