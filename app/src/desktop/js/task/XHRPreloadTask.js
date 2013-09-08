/**
 * @author Édouard Lanctôt < edouardlb@gmail.com >
 *
 */

var XHRPreloadTask = Task._extend(Class.ABSTRACT, {

    _static: {

    },

    _public: {

        result: null,

        construct: function (batch, url, dataType, weight) {

            Task.call(this, [], weight);
            this.url = url;
            this.dataType = dataType;

        },

        getResult: function(){
            return this.result
        }

    },

    _protected: {

        url: null,
        dataType: 'text',

        run: function () {

            var self = this;
            
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if ( xhr.readyState === 4 ) {
                    if ( xhr.status === 200 ) {
                        // remove PerformanceController.getInstance().addBandwithData(self.url, window.performance.now() - self.startTime);
                        self.result = (self.dataType==='json')?JSON.parse(xhr.response):xhr.response;
                        AssetsController.getInstance().addFile(self.url,self.result);
                        self.onComplete();
                    } else {
                        console.error('XHR Loading Error',xhr);
                        self.onTimeout();
                    }
                }
            }
            xhr.onerror = function () { 
                console.error(xhr, xhr.status); 
            }; 

            xhr.responseType = (this.dataType==='json')?'text':this.dataType;
            // remove this.startTime = window.performance.now();
            xhr.open("GET", (this.dataType==='json') ? Resource.get(this.url) : this.url, true);
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
            xhr.send(null);

        }

    },

    _private: {

        onComplete: function () {

            this.notifyDone();

        },

        onTimeout: function () {

            // TODO: handle differently
            this.notifyDone();

        }

    }

});
