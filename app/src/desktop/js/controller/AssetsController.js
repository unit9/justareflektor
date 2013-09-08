/**
 *
 * @author Édouard Lanctôt < edouardlb@gmail.com >
 * @description Global way to access loaded textures, shaders and json files
 *
 */
var AssetsController = Class._extend(Class.SINGLETON, {

    _public: {

        addFile: function (name, file) {
            this.allAssets.push(file);
            this.assetsByName[name] = file;
        },

        getFile: function (name) {
            if (!this.assetsByName[name]) {
                throw new Error('Asset was not loaded: ' + name);
            }
            this.usedFiles[name] = true;
            return this.assetsByName[name];
        },

        hasFile: function(name) {
            return Boolean(this.assetsByName[name]);
        },

        addLoadingFile: function(name) {
            this.loadingAssetsByName[name] = true;
        },

        fileIsLoading: function(name) {
            return Boolean(this.loadingAssetsByName[name]);
        },

        fileIsLoaded: function(name) {
            return Boolean(this.assetsByName[name]);
        },

        getUnusedFiles: function() {
            console.log('----------------------------------');
            console.log('Printing list of unused resources:');
            for (var name in this.assetsByName) {
                if (!this.usedFiles[name]) {
                    console.log(name);
                }
            }
            console.log('----------------------------------');
        }
    },

    _private: {
        loadingAssetsByName: {},
        assetsByName: {},
        allAssets: [],

        usedFiles: {} //debug -> find unused assets
    }

});
