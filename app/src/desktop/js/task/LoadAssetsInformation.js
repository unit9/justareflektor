/**
 * @author Paweł Klimkowski pawel.klimkowski@unit9.com / pawel@sqrtx.pl
 * @copyright 2013 UNIT9 Ltd.
 */

var LoadAssetsInformation = Task._extend(Class.ABSTRACT, {

    _static: {

    },

    _public: {

        construct: function (url) {

            Task.call(this, [], 1);
            this.url = url;

        }

    },

    _protected: {

        url: null,

        run: function () {

            var self = this;
            var errormsg = "Error loading resources.json. LoadAssetsInformation task failed.";

            var acquireData = $.get("resources.json", function(r) 
            {

              // connected

            }).success(function(r)
            {  


            }).error(function(r)
            { 

            	console.log(r,errormsg); 

            }).complete(function(r)
            { 
            	PreloadController.ASSETS_DATA = JSON.parse(r.responseText);
	            //console.log(r);
	            console.log(r,JSON.parse(r.responseText));
              PreloadController.getInstance().resourcesInfo = JSON.parse(r.responseText);
            	self.onComplete(); 
            	
            });
        }

    },

    _private: {

        url: null,

        onComplete: function () {

            this.notifyDone();

        }

    }

});
