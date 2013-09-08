(function (window, document) {

    'use strict';
    function MotionTrackingDesktopPrototype() {
        //----------------
        //
        // Some Constants
        //
        //----------------
        var GLOBAL_VERSION_CACHE = Math.random(),
            USE_ANIMATION_FRAMES = true,

        //test scene
            DEBUG_MODE = false,
            URL_PARAMETERS = new miuri(window.location.toString()).query(),
            SCENE_NAME = URL_PARAMETERS['scene'] || 'null',
            TEST_SCENE = window[SCENE_NAME] || undefined,

        //preloading constants
            ASSETS_PATH = './',

        //----------------
        //
        // THREE.js and loading variables
        //
        //----------------
            width = 1,
            height = 1,
            loader,
            renderer,
            allShadersToLoad = [],
            shadersTextByName = {},
            stats,

            //app reference
            self = this;

        //----------------
        //
        // PrototypeApp GUI Options
        //
        //----------------
        this.options = {
            resetOrientation: function () {
                candlelightcore.websocketinterface.send('send', {gid: candlelightcore.remotecontroller.gid, data: {action: 'resetOrientation'}});
                setTimeout(function () {
                    candlelightcore.websocketinterface.send('send', {gid: candlelightcore.remotecontroller.gid, data: {action: 'resetOrientation'}});
                }, 1000);
            },
        };
        this.guiRange = {};


        if (TEST_SCENE && TEST_SCENE.addGuiOptions) TEST_SCENE.addGuiOptions(this.options, this.guiRange);
        this.gui = null;


        //----------------
        //
        // Initialize Core Project tracking classes and server connection
        //
        //----------------
        this.start = function () {
            candlelightcore.remotecontroller.startDesktop({allowRestore: true, trackingEnabled:true});
            preloadAssets();
        }


        //----------------
        //
        // Preload shader, data and texture assets
        //
        //----------------
        function preloadAssets() {
            var currentShader;

            //PRELOADING DISPLAY
            loader = new PxLoader({noProgressTimeout: 1000});
            loader.addProgressListener(function (e) {            });
            loader.addCompletionListener(function (e) {
                setup();
            });

            //add shaders to preloader
            if (TEST_SCENE && TEST_SCENE.getShadersToPreload) allShadersToLoad = allShadersToLoad.concat(TEST_SCENE.getShadersToPreload());
            for (var i = 0; i < allShadersToLoad.length; i++) {
                currentShader = allShadersToLoad[i];
                if (!shadersTextByName[currentShader]) {
                    shadersTextByName[currentShader] = loader.addAjax(ASSETS_PATH + currentShader + '?v=' + GLOBAL_VERSION_CACHE, 'text');
                }
            }
            
            //preload current test scene
            if (TEST_SCENE) TEST_SCENE.preload(loader); else console.warn('NO TEST SCENE');

            //start preloading or just go
            loader.start();
            if (!loader.isBusy()) setup();
        }

        //----------------
        //
        // Setup the main app
        //
        //----------------
        function setup() {
            //empty the current document
            var mainElement = document.getElementById('main');


            //prepare window variables
            width = window.innerWidth
            height = window.innerHeight-105;
            window.onresize = resizeHandler;

            //three.js variables
            //create the renderer
            renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
            renderer.setClearColorHex(0x000000, 1);
            renderer.setSize(width, height);
            renderer.autoClear = false;
            DEBUG_MODE = false;
            mainElement.appendChild(renderer.domElement);

            //setup debug view gui option
            var debugView = window.app.gui.add(candlelightcore.tracking, "DEBUG_MODE", true).name("debug view").listen();
            debugView.setValue(false);
            debugView.onChange( function(){
                DEBUG_MODE = !DEBUG_MODE;
                candlelightcore.remotecontroller.toggleDebugView();
                if (DEBUG_MODE) { document.getElementById('main').removeChild(renderer.domElement); }
                else { document.getElementById('main').appendChild(renderer.domElement); }
            });

            //setup the tracking
            window.onmousedown = function () {
                candlelightcore.websocketinterface.send('send', {gid: candlelightcore.remotecontroller.gid, data: {action: 'resetOrientation'}});
            }

            //setup the test scene
            if (TEST_SCENE) TEST_SCENE.setup(renderer, shadersTextByName);

            stats = new Stats();
            stats.domElement.style.position = 'absolute';
            stats.domElement.style.top = '55px';
            stats.domElement.style.left = '-100px';
            var statsDiv = document.createElement('div');
            statsDiv.style.position = 'absolute';
            statsDiv.style.left = '100%';
            statsDiv.appendChild(stats.domElement);
            document.body.appendChild(statsDiv);


            //
            // Do a quick performance test
            //
            


            //begin main loop
            update();
        }


        //----------------
        //
        // Main Update loop
        //
        //----------------
        function update() {
            if (USE_ANIMATION_FRAMES) window.requestAnimationFrame(update); else setTimeout(update, 200);
            stats.update();

            window.TextureUpdateManager.updateTextures();

            //update scene
            if (TEST_SCENE && !DEBUG_MODE) TEST_SCENE.update(
                window.candlelightcore.tracking.READY,
                window.candlelightcore.tracking.normalizedPosition,
                window.candlelightcore.remotecontroller.worldQuaternion);

            //render the content
            render();
        }


        //----------------
        //
        //
        //
        //----------------
        function render() {
            if (TEST_SCENE && !DEBUG_MODE) {
                //update renderer and textures
                renderer.clear();
                TEST_SCENE.render();
            }
        }


        //----------------
        //
        // Window events
        //
        //----------------
        function resizeHandler(e) {
            width = window.innerWidth;
            height = window.innerHeight-105;
            renderer.setSize(width, height);
            render();
        }
    }


    document.addEventListener('DOMContentLoaded', function () {

        var instructions = [
            [
                'move your phone to control the 3D model'
            ]
        ];

        window.app = new PrototypeApp(MotionTrackingDesktopPrototype, 'MotionTrackingDesktop', instructions);
        window.app.start();
        if (window.app.generalFolder) window.app.generalFolder.close();
    });
})(window, document);
