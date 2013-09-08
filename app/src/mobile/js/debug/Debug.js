/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright UNIT9 Ltd.
 * Date: 9/2/13
 * Time: 2:49 PM
 */

(function () {

    var STATS_PATH = '/src/desktop/js/lib/stats.min.js',
        GUI_PATH = '/src/desktop/js/lib/dat.gui.js';

    var Debug = {

        stats: null,
        gui: null,
        data: {
            test: 15
        },
        enabled: false,
        folders: [],
        delayedTimeoutId: -1,

        init: function (callback) {

            var numToLoad = 1,
                onLoad = function () {
                    if (--numToLoad === 0) {
                        if (typeof callback === 'function') {
                            callback();
                        }
                    }
                };

//            this.initStats(onLoad);
            this.initGui(onLoad);

        },

        initStats: function(callback) {

            var self = this;

            if (!this.enabled) {
                return;
            }

            $.getScript(STATS_PATH, function () {

                self.stats = new Stats();
                self.stats.setMode(0);
                self.stats.domElement.style.position = 'absolute';
                self.stats.domElement.style.left = '0px';
                self.stats.domElement.style.top = '0px';
                document.body.appendChild(self.stats.domElement);
                window.stats = self.stats;

                if (typeof callback === 'function') {
                    callback();
                }

            });

        },

        initGui: function (callback) {

            var self = this;

            if (!this.enabled) {
                return;
            }

            $.getScript(GUI_PATH, function () {

                self.gui = new dat.GUI();
                window.gui = self.gui;

                if (typeof callback === 'function') {
                    callback();
                }

            });

        },

        add: function (object, variable, folder) {

            var folderObject = null,
                self = this;

            if (!this.enabled) {
                return;
            }

            if (!this.gui) {
                clearTimeout(this.delayedTimeoutId);
                this.delayedTimeoutId = setTimeout(function () {
                    self.add(object, variable, folder);
                }, 50);
                return;
            }

            if (folder) {
                folderObject = this['folder' + folder];
                if (!folderObject) {
                    folderObject = this.gui.addFolder(folder);
                    this['folder' + folder] = folderObject;
                    this.folders.push(folderObject);
                }
            }

            if (folderObject) {
                return folderObject.add(object, variable).listen();
            } else {
                return this.gui.add(object, variable).listen();
            }

        },

        remove: function (object, folder) {

            var folderObject = null;

            if (!this.enabled) {
                return;
            }

            if (folder) {
                folderObject = this['folder' + folder];
            }

            if (folderObject) {
                folderObject.remove(object);
            } else {
                this.gui.remove(object);
            }

        },

        openFolder: function (folder) {
            if (this['folder' + folder]) {
                this['folder' + folder].open();
            }
        },

        closeFolder: function (folder) {
            if (this['folder' + folder]) {
                this['folder' + folder].close();
            }
        },

        closeFolders: function () {
            var i = 0;
            for (i = 0; i < this.folders.length; ++i) {
                this.folders[i].close();
            }
        }

    };

    window.Debug = Debug;

}());
