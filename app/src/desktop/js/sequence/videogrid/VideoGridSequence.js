/**
 *
 * @author Édouard Lanctôt  < edouardlb@gmail.com >
 *
 */

var VideoGridSequence = Sequence._extend({

    _public:  {

        //points scale
        LOADED_MESH_SCALE_BASE: new THREE.Vector3(2.0,2.0,0),
        LOADED_MESH_OFFSET_BASE: new THREE.Vector3(-1.0,-1.0,0),
        LOADED_MESH_SCALE: new THREE.Vector3(2,2,0),
        LOADED_MESH_OFFSET: new THREE.Vector3(-1.0,-1.0,0),


        //tracking points
        trackingPointsSource: null,
        trackingPoints: null,
        centerX: null,
        centerY: null,
        gridPoints: [],
        gridPointsByTrackingId: {},
        centerPoint: null,
        CENTER_POINT_ID: 21,


        //drawing / links state
        center: new THREE.Vector3(),
        activePoints: [],
        sortedGridPoints: [],
        lastLineUpdate: 0,
        lineUpdateSpeed: 0,
        currentLineId: 0,
        lastLineId: 0,
        fadeSpeed: 0.0,


        //geometry points and meshes
        lineGeometry: null,
        line: null,
        lineGeometryUnder: null,
        lineUnder: null,
        lineCount: 120,
        pointGeom: null,


        // //extrude simili-3d lines from head 
        // lineGeometryExtrude: null,
        // lineExtrude: null,
        // lineExtrudeMax: 300,
        // lineExtrudePc: 0.0,

        //rendering targets and materials
        linesBlurMaterialA: null,
        linesBlurMaterialB: null,
        finalCompositionMaterial: null,
        linesFbo: null,
        linesBlurFboA: null,
        linesBlurFboPing: null,
        linesBlurFboPong: null,
        finalCompositionFbo: null,
        lineFboBlurIsPing: true,

        //the stars
        stars: [], //{mesh:, attachPoint:, life: }
        starTextureSmall: [],
        starTextureLarge: [],
        starTextureSmallNames: [
            'media/images/videogrid/dot_glow_S_0.png',
            'media/images/videogrid/dot_glow_S_1.png',
            'media/images/videogrid/dot_glow_S_2.png',
            'media/images/videogrid/dot_glow_S_3.png',
            'media/images/videogrid/dot_glow_S_4.png',
            'media/images/videogrid/dot_glow_S_5.png'
        ],
        starTextureLargeNames: [
            'media/images/videogrid/dot_glow_L_0.png',
            'media/images/videogrid/dot_glow_L_1.png',
            'media/images/videogrid/dot_glow_L_2.png',
            'media/images/videogrid/dot_glow_L_3.png',
            'media/images/videogrid/dot_glow_L_4.png',
            'media/images/videogrid/dot_glow_L_5.png'
        ],
        starsFbo: null,


        construct: function (id, $container, video, audio, videoTexture) {

            Sequence.call(this, id, $container, video, audio, videoTexture);

        },


        /**
         *
         *
         *
        */
        init: function () {

            if (this.wasInitialised) return;

            Sequence.prototype.init.call(this);

            console.log('init videogrid');
            
            //
            // Localise some variables / references
            //
            var videoWidth = this.videoTexture.width,
                videoHeight = this.videoTexture.height,
                renderer = RendererController.getInstance().getRenderer();


            //get tracking
            this.trackingPointsSource = AssetsController.getInstance().getFile('media/tracking/videogrid.json');
            this.trackingPoints = this.trackingPointsSource.tracks;
            this.centerX = this.trackingPointsSource.centerX;
            this.centerY = this.trackingPointsSource.centerY;
            for (var i=0; i<this.trackingPoints.length; i++) {
                this.gridPoints[i] = new GridPoint(this.trackingPoints[i],i);
                this.gridPoints[i].frameOffset = - 0;
                this.gridPointsByTrackingId[this.gridPoints[i].trackingId] = this.gridPoints[i];
            }
            this.centerPoint = this.gridPointsByTrackingId[this.CENTER_POINT_ID]; 


            //3d scene
            var camera = new THREE.OrthographicCamera( -1, 1, -1, 1, -1000, 1000 );
            camera.position.set(0,0,1);
            camera.lookAt(new THREE.Vector3());


            //
            // create the main line geometry
            //
            this.lineGeometry = new THREE.Geometry();
            for (var i=0; i<this.lineCount*2; i++) {

                this.lineGeometry.vertices[i] = new THREE.Vector3(0,0,0);
                this.lineGeometry.colors[i] = new THREE.Color(0xffffff);
                this.lineGeometry.vertices[i].meshScale = new THREE.Vector3().copy(this.LOADED_MESH_SCALE_BASE);
                this.lineGeometry.vertices[i].meshOffset = new THREE.Vector3().copy(this.LOADED_MESH_OFFSET_BASE);
                this.lineGeometry.vertices[i].shakeOffset = new THREE.Vector3();
            }
            this.line = new THREE.Line( this.lineGeometry, new THREE.LineBasicMaterial( {
                    color:0xffffff  ,
                    linewidth:1.0,
                    transparent:true,
                    opacity:4.0,
                    blending:THREE.AdditiveBlending,
                    linecap:'round',
                    linejoin:'round',
                    vertexColors:THREE.VertexColors,
                    fog:false
            }),
            THREE.LinePieces);


            //
            // create the main multi line geometry
            //
            this.lineGeometryUnder = new THREE.Geometry();
            for (var i=0; i<this.lineCount*10; i++) {

                this.lineGeometryUnder.vertices[i] = new THREE.Vector3(0,0,0);
                this.lineGeometryUnder.colors[i] = new THREE.Color(0);
            }
            this.lineUnder = new THREE.Line( this.lineGeometryUnder, new THREE.LineBasicMaterial( {
                    color:0xffffff,
                    linewidth:1.0,
                    transparent:true,
                    opacity:1.0,
                    blending:THREE.AdditiveBlending,
                    linecap:'round',
                    linejoin:'round',
                    vertexColors:THREE.VertexColors,
                    fog:false
            }),
            THREE.LinePieces);



            // //
            // // Create the line extusion
            // //
            // this.lineGeometryExtrude = new THREE.Geometry();
            // for (var i=0; i<this.lineExtrudeMax*2.0; i++) {
            //     this.lineGeometryExtrude.vertices[i] = new THREE.Vector3(0,0,0);
            //     this.lineGeometryExtrude.colors[i] = new THREE.Color(0xffffff);
            // }
            // this.lineExtrude = new THREE.Line( this.lineGeometryExtrude, new THREE.LineBasicMaterial( {
            //         color:0xffffff,
            //         linewidth:4.0,
            //         transparent:true,
            //         opacity:1.0,
            //         blending:THREE.AdditiveBlending,
            //         linecap:'round',
            //         linejoin:'round',
            //         vertexColors:THREE.VertexColors,
            //         fog:false
            // }),
            // THREE.LinePieces); 

            //
            //
            // The Lines Neon Glow FBOs
            //
            //
            this.linesBlurMaterialA = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/videogrid/blur.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/videogrid/blur.frag'),
                attributes:{},
                uniforms: {
                    'tDiffuse':{type: 't', value: null},
                    'offset':{type: 'v2', value: new THREE.Vector2(2 / videoWidth, 2 / videoHeight)},
                    'blurFactor':{type: 'f', value: 2.0 }
                },
                //equation/parameters to allow for RGBA encoding
                depthTest:false,
                transparent:true,
                blending:THREE.CustomBlending,
                blendEquation:THREE.AddEquation,
                blendSrc:THREE.OneFactor,
                blendDst:THREE.ZeroFactor,
                side:THREE.DoubleSide
            });

            this.linesBlurMaterialB = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/videogrid/blur.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/videogrid/blur.frag'),
                attributes:{},
                uniforms: {
                    'tDiffuse':{type:'t',value:null},
                    'tAccum':{type:'t',value:null},
                    'accumpc':{type:'f',value:0.995},
                    'offset':{type:'v2',value:new THREE.Vector2(3.33/512,3.33/512)},
                    'blurFactor':{type:'f',value:2.0}
                },
                //equation/parameters to allow for RGBA encoding
                depthTest:false,
                transparent:true,
                blending:THREE.CustomBlending,
                blendEquation:THREE.AddEquation,
                blendSrc:THREE.OneFactor,
                blendDst:THREE.ZeroFactor,
                side:THREE.DoubleSide
            });

            this.finalCompositionMaterial  = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/videogrid/neonLinesNoise.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/videogrid/neonLinesNoise.frag'),
                attributes:{},
                uniforms: {
                    'tVideo':{type:'t',value:null},
                    'tLines':{type:'t',value:null},
                    'tBlurA':{type:'t',value:null},
                    'tBlurB':{type:'t',value:null},
                    'neonColor':{type:'v4',value:new THREE.Vector4(1,1,1,1)},
                    'noiseuv':{type:'v2',value:new THREE.Vector2(Math.random(),Math.random())},
                    'fade':{type:'f',value:1.0}
                },
                //equation/parameters to allow for RGBA encoding
                depthTest:false,
                transparent:true,
                blending:THREE.CustomBlending,
                blendEquation:THREE.AddEquation,
                blendSrc:THREE.OneFactor,
                blendDst:THREE.ZeroFactor,
                side:THREE.DoubleSide
            });


            //
            // Create all Fbos
            //
            this.linesFbo = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                camera:camera,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:true,
                generateMipmaps:false,
                renderer:renderer
            });
            this.linesBlurFboA = new FramebufferWrapper(512,512,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.linesBlurMaterialA,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });
            this.linesBlurFboPing = new FramebufferWrapper(256,256,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.linesBlurMaterialB,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });
            this.linesBlurFboPong = new FramebufferWrapper(videoWidth/4,videoHeight/4,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.linesBlurMaterialB,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });
            this.finalCompositionFbo = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                renderMaterial:this.finalCompositionMaterial,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });
            this.linesBlurMaterialA.uniforms.tDiffuse.value = this.linesFbo.texture;
            this.linesBlurMaterialB.uniforms.tDiffuse.value = this.linesBlurFboA.texture;
            this.finalCompositionMaterial.uniforms.tVideo.value = this.videoTexture.texture;
            this.finalCompositionMaterial.uniforms.tLines.value = this.linesFbo.texture;
            this.finalCompositionMaterial.uniforms.tBlurA.value = this.linesBlurFboA.texture;
            this.finalCompositionMaterial.uniforms.tBlurB.value = this.linesBlurFboPing.texture;
            this.linesFbo.scene.add(this.line);
            this.linesFbo.scene.add(this.lineUnder);
            //this.linesFbo.scene.add(this.lineExtrude);

        },

        begin: function () {

            Sequence.prototype.begin.call(this);

            console.log('begin videogrid');
            
            this.linesFbo.alloc();
            this.linesBlurFboA.alloc();
            this.linesBlurFboPing.alloc();
            this.linesBlurFboPong.alloc();
            this.finalCompositionFbo.alloc();

             this.finalCompositionMaterial.uniforms.tVideo.value = this.videoTexture.texture;
            this.linesBlurMaterialA.uniforms.tDiffuse.value = this.linesFbo.texture;
            this.linesBlurMaterialB.uniforms.tDiffuse.value = this.linesBlurFboA.texture;
            this.finalCompositionMaterial.uniforms.tVideo.value = this.videoTexture.texture;
            this.finalCompositionMaterial.uniforms.tLines.value = this.linesFbo.texture;
            this.finalCompositionMaterial.uniforms.tBlurA.value = this.linesBlurFboA.texture;
            this.finalCompositionMaterial.uniforms.tBlurB.value = this.linesBlurFboPing.texture;

        },

        end: function () {

            Sequence.prototype.end.call(this);
            this.linesFbo.dispose();
            this.linesBlurFboA.dispose();
            this.linesBlurFboPing.dispose();
            this.linesBlurFboPong.dispose();
            this.finalCompositionFbo.dispose();

        },

        changeVideoQuality: function(nw, nh) {
            this.finalCompositionMaterial.uniforms.tVideo.value = this.videoTexture.texture;
        },

        changeRenderQuality: function (nw, nh) {
            var renderer = RendererController.getInstance().getRenderer();

            this.renderWidth = nw;
            this.renderHeight = nh;

            //resize fbo
            this.linesFbo.resizeTexture(this.renderWidth, this.renderHeight);
            this.linesBlurFboA.resizeTexture(this.renderWidth*0.4, this.renderHeight*0.4);
            this.linesBlurFboPing.resizeTextureAndCopy(this.renderWidth*0.2, this.renderHeight*0.2);
            this.linesBlurFboPong.resizeTextureAndCopy(this.renderWidth*0.25, this.renderHeight*0.25);
            if (this.renderWidth >= 640) this.finalCompositionFbo.resizeTexture(this.renderWidth, this.renderHeight); else this.finalCompositionFbo.resizeTexture(640,336);


            var camera = new THREE.OrthographicCamera( -1, 1, -1, 1, -1000, 1000 );
            camera.position.set(0,0,1);
            camera.lookAt(new THREE.Vector3());

            this.linesBlurMaterialA.uniforms.tDiffuse.value = this.linesFbo.texture;
            this.linesBlurMaterialB.uniforms.tDiffuse.value = this.linesBlurFboA.texture;
            this.finalCompositionMaterial.uniforms.tVideo.value = this.videoTexture.texture;
            this.finalCompositionMaterial.uniforms.tLines.value = this.linesFbo.texture;
            this.finalCompositionMaterial.uniforms.tBlurA.value = this.linesBlurFboA.texture;
            this.finalCompositionMaterial.uniforms.tBlurB.value = this.linesBlurFboPing.texture;
            this.line.parent.remove(this.line); this.linesFbo.scene.add(this.line);
            this.lineUnder.parent.remove(this.lineUnder); this.linesFbo.scene.add(this.lineUnder);



            //change render parameters
            this.linesBlurMaterialA.uniforms.offset.value.set(2.0 / this.renderWidth, 2.0 / this.renderHeight);
            this.linesBlurMaterialB.uniforms.offset.value.set(3.0 / this.renderWidth * 0.4, 3.0 / this.renderHeight * 0.4);
        }

    },



    /**
     *
     *
     * Main Update/Render Loop
     * 
     *
    */
    _protected: {

        /**
         *
         * Update all parameters
         *
         */
        update: function (options, cf, delta, time, progress, position, orientation) {

            //
            // Update controls
            //
            var finalPhonePosition = InputController.getInstance().getPositionDirectional();
                currentFrame = cf; //Math.floor(finalPhonePosition.x * 100); //+ (options.auto) ? -50 : 50; //Math.floor(time * Player.VIDEO_FRAMERATE + 0.85*Player.VIDEO_FRAMERATE + 2);
            
            currentFrame +=  (TimelineController.getInstance().initialised) ? 51 : 50;
            //currentFrame += Math.floor(InputController.getInstance().getMouseRaw().x * 50);
            ////console.log(Math.floor(InputController.getInstance().getMouseRaw().x * 50));

            if (!InputController.getInstance().isMouseVersion()) finalPhonePosition.multiply(new THREE.Vector3(1.8,2.0,1.0));

            // finalPhonePosition.z = 1.0;
            // var mappedPhonePosition = new THREE.Quaternion(0,1,0,1).setFromAxisAngle(finalPhonePosition,Math.PI/2);
            // finalPhonePosition.set(0.0,0.0,1.0).applyQuaternion(mappedPhonePosition);
            // console.log(finalPhonePosition);

            //
            // set scale and options
            //
            this.LOADED_MESH_SCALE.x = this.LOADED_MESH_SCALE.y = options.followSize * 2.0;
            this.LOADED_MESH_OFFSET.x = this.LOADED_MESH_OFFSET.y = -options.followSize;
            this.finalCompositionMaterial.uniforms.noiseuv.value.set(Math.random(),Math.random());
            this.finalCompositionMaterial.uniforms.fade.value = 1.0-options.fade;

            this.line.material.linewidth = options.lineWidth * (this.renderWidth/1280);
            this.lineUnder.material.linewidth = options.lineWidth * (this.renderWidth/1280);
            this.fadeSpeed = this.cmap(1.0-finalPhonePosition.z,0.1,0.9,options.fadeSpeedNear,options.fadeSpeedFar);

            //
            // get list of active points
            //
            this.center = this.centerPoint.getPosition(currentFrame,this.LOADED_MESH_SCALE_BASE,this.LOADED_MESH_OFFSET_BASE);
            this.activePoints = [];
            this.sortedGridPoints = [];

            var translationA = new THREE.Matrix4().makeTranslation(-this.center.x,-this.center.y,0.0);
            var scaleA = new THREE.Matrix4().makeScale(options.followSize,options.followSize,options.followSize);
            var translationB = new THREE.Matrix4().makeTranslation(this.center.x,this.center.y,0.0);
            var followMatrix = translationA.multiply(scaleA).multiply(translationB);


            for (var i=0; i<this.gridPoints.length; i++) {
                if (this.gridPoints[i].isActive(currentFrame)) {
                    this.sortedGridPoints.push(this.gridPoints[i]);
                    this.activePoints.push(this.gridPoints[i]);


                    var nv = new THREE.Vector3();
                    nv.copy(this.gridPoints[i].getPosition(currentFrame,this.LOADED_MESH_SCALE_BASE,this.LOADED_MESH_OFFSET_BASE));
                    this.gridPoints[i].lastBaseVertice.copy(this.gridPoints[i].latestBaseVertice);
                    this.gridPoints[i].latestBaseVertice.copy(nv);

                    nv.applyMatrix4(followMatrix);
                    //nv.applyMatrix4(scaleA);
                    //nv.applyMatrix4(translationB);

                    var x = this.gridPoints[i].trackingPoint.positions[currentFrame].x;
                    var y = this.gridPoints[i].trackingPoint.positions[currentFrame].y;

                    //if (options.scaleFromCenter)  {
                    nv.x = nv.x-(nv.x-(x*this.LOADED_MESH_SCALE.x + this.LOADED_MESH_OFFSET.x))*options.scaleFromCenter;
                    nv.y = nv.y-(nv.y-(-y*this.LOADED_MESH_SCALE.y - this.LOADED_MESH_OFFSET.y))*options.scaleFromCenter;
                    this.gridPoints[i].lastVertice.copy(this.gridPoints[i].latestVertice);
                    this.gridPoints[i].latestVertice.copy(nv);
                }
            }

            //
            // options && GUI
            //
            this.updateLines(finalPhonePosition, options, currentFrame);


            // Lines Extrusion
            //this.updateExtrudedLines(delta, finalPhonePosition,options,currentFrame);


            //clean up motion and update background particles
            var pt = 0;
            for (var i=0; i<this.gridPoints.length; i++) {
                this.gridPoints[i].currentMotion.set(0,0,0);
                if (options.showPoints && pt<this.pointGeom.vertices.length && this.gridPoints[i].isActive(currentFrame)) {
                    pt++;
                }
            }
            this.lineGeometry.verticesNeedUpdate = true;
        },

        /**
         *
         * Renders three.js scene in this sequence's Render Target
         *
         */
        render: function () {
            RendererController.getInstance().getRenderer().setClearColor(new THREE.Color(0));
            RendererController.getInstance().getRenderer().clear();
           

            this.linesFbo.render();
            this.linesBlurFboA.render();

            //blur accum pingpong
            var ping = this.lineFboBlurIsPing ? this.linesBlurFboPing : this.linesBlurFboPong;
            var pong = this.lineFboBlurIsPing ? this.linesBlurFboPong : this.linesBlurFboPing;
            this.lineFboBlurIsPing = !this.lineFboBlurIsPing;
            this.linesBlurMaterialB.uniforms.tAccum.value = pong.texture;
            this.finalCompositionMaterial.uniforms.tBlurB.value = ping.texture;
            ping.render();
            this.finalCompositionFbo.render();

            RendererController.getInstance().renderToScreen(this.finalCompositionFbo.texture,false,true);
        }
    },


    /**
     *
     * Lines updating
     *
    */
    _private: {

        // updateExtrudedLines: function(delta, finalPhonePosition, options, currentFrame) {

        //     this.lineExtrudePc = this.lineExtrudePc * (0.5-0.5*delta) + this.cmap(1.0-finalPhonePosition.z,0.1,0.9,0.0,1.0) * (0.5+0.5*delta);

        //     if (this.lineExtrudePc <= 0.02) {
        //         this.lineExtrudePc = 0.0;
        //         if (this.lineExtrude.parent) this.linesFbo.scene.remove(this.lineExtrude);
        //         return;
        //     } else {
        //         if (!this.lineExtrude.parent) this.linesFbo.scene.add(this.lineExtrude);
        //     }

        //     //reposition 3d extrusion and size
        //     //this.LOADED_MESH_SCALE_EXTRUDE.set(options.extrudeDistance*2.0,options.extrudeDistance*2.0,0);
        //     //this.LOADED_MESH_OFFSET.set(options.extrudeDistance*-1.0 + thios.);  
        //     //this.center = this.centerPoint.getPosition(currentFrame,this.LOADED_MESH_SCALE_BASE,this.LOADED_MESH_OFFSET_BASE);

        //     var translationPhone = new THREE.Matrix4().makeTranslation(
        //         finalPhonePosition.x*1.0,
        //         finalPhonePosition.y*1.0,
        //     0.0);
        //     var translationA = new THREE.Matrix4().makeTranslation(-this.center.x*2.0,-this.center.y*2.0,0.0);
        //     var scaleA = new THREE.Matrix4().makeScale(1.0+this.lineExtrudePc*options.extrudeDistance,1.0+this.lineExtrudePc*options.extrudeDistance,1.0+this.lineExtrudePc*options.extrudeDistance);
        //     var translationB = new THREE.Matrix4().makeTranslation(this.center.x*2.0,this.center.y*2.0,0.0);
        //     var extrudeMatrix = translationA.clone().multiply(scaleA).multiply(translationB);


        //     //add a line for each tracking point
        //     var linec = 0;
        //     var connectedAlready = {}
        //     //for (linec = 0; linec < this.activePoints.length; linec++) {
        //     for (var i=0; i<this.lineGeometry.vertices.length/2; i++) {
        //         var va = this.lineGeometry.vertices[i*2]; 
        //         if (va.active && va.point && va.point.isActive(currentFrame) && va.pointconn) {
        //             for (var j=0; j<va.pointconn.length; j++) {
        //                 if (linec< this.lineExtrudeMax && !connectedAlready[va.pointconn[j].id] && va.pointconn[j] && va.pointconn[j].isActive(currentFrame) && va.pointconn[j].fs >= options.snapWidth) {

        //                     connectedAlready[va.pointconn[j].id] = true;
        //                     var positionBase = va.pointconn[j].latestBaseVertice; //this.activePoints[linec]
        //                     var positionExtruded = positionBase.clone().applyMatrix4(extrudeMatrix);

        //                     this.lineGeometryExtrude.vertices[linec*2.0].copy(positionBase);
        //                     this.lineGeometryExtrude.vertices[linec*2.0+1].copy(positionExtruded);

        //                     this.lineGeometryExtrude.colors[linec*2.0].setRGB(0.2,0.2,0.2);
        //                     this.lineGeometryExtrude.colors[linec*2.0+1].setRGB(1,1,1);
        //                     linec++;

        //                 }
        //             }
        //         }
        //     }


        //     //hide all other lines
        //     for (linec; linec < this.lineExtrudeMax; linec++) {

        //         this.lineGeometryExtrude.vertices[linec*2.0].set(0,0,0);
        //         this.lineGeometryExtrude.vertices[linec*2.0+1].set(0,0,0);

        //         this.lineGeometryExtrude.colors[linec*2.0].setRGB(0,0,0);
        //         this.lineGeometryExtrude.colors[linec*2.0+1].setRGB(0,0,0);

        //     }


        //     this.lineGeometryExtrude.verticesNeedUpdate = true;
        //     this.lineGeometryExtrude.colorsNeedUpdate = true;
        // },

        updateLines: function(finalPhonePosition, options, currentFrame) {

            //some constants
            var lineUpdateSpeed = 0;


            //create a new point
            if (Date.now()-this.lastLineUpdate > this.lineUpdateSpeed) {
                this.lastLineUpdate = Date.now();


                //
                // Snap to nearest point at scale 0
                //
                var va = this.lineGeometry.vertices.shift();
                var vb = this.lineGeometry.vertices.shift();
                this.lineGeometry.vertices.push(va);
                this.lineGeometry.vertices.push(vb);
                va.set(finalPhonePosition.x,finalPhonePosition.y,0.0);
                vb.copy(va);
                //vb.copy(vo);
                //va.vo = vo;


                va.active = true;
                va.near = false;
                vb.near = false;
                va.point = null;
                vb.point = null;
                va.startTime = Date.now();
                va.pointconn = [];
            
                va.point = this.getNearestPoint(va,false,0);
                
                this.lastLineId = this.currentLineId;
                this.currentLineId++;
                if (this.currentLineId>=this.lineCount) this.currentLineId = 1;
                
            }

            var mu = 0;


            var numconn = options.numConnectionsFar + (1.0-finalPhonePosition.z) * (options.numConnectionsNear - options.numConnectionsFar);


            //
            // update lines
            //
            for (var i=0; i<this.lineGeometry.vertices.length/2; i++) {
                var va = this.lineGeometry.vertices[i*2];
                var vb = (i>0)?this.lineGeometry.vertices[i*2-1]:null;

                //get nearest point
                if (!va.point || !va.point.isActive(currentFrame)) {
                    va.point = this.getNearestPoint(va,va.near,0);
                }

                //add motion
                if (va.point) {
                    if (va.near) va.add(va.point.getMotionCenteredBase()); else va.add(va.point.getMotionCentered());
                }
                if (vb) vb.copy(va);

                //fade
                if (va.active) {
                    var fadepc = 1.0-Math.min( (Date.now()-va.startTime)/this.fadeSpeed  ,1.0);
                    if (fadepc<=0.0) {
                        va.active = false;
                    }
                    this.lineGeometry.colors[i*2].setRGB(fadepc,fadepc,fadepc);
                    if (vb) this.lineGeometry.colors[i*2-1].setRGB(fadepc,fadepc,fadepc);


                    var fs = fadepc*options.snapWidth;
                    for (var j=0; j<numconn; j++) {
                        if (!va.pointconn[j] || !va.pointconn[j].isActive(currentFrame)) {
                            va.pointconn[j] = this.getNearestPoint(va,va.near,j)
                        }
                        if (va.pointconn[j]) {
                            this.lineGeometryUnder.vertices[mu*2].copy(va);
                            this.lineGeometryUnder.vertices[mu*2+1].copy(va.pointconn[j].latestBaseVertice);
                            this.lineGeometryUnder.colors[mu*2].setRGB(fs,fs,fs);
                            this.lineGeometryUnder.colors[mu*2+1].setRGB(fs,fs,fs);
                            va.pointconn[j].fs = fs;
                            mu++;
                        }   
                    }
                } else {
                    this.lineGeometry.colors[i*2].setRGB(0,0,0);
                    if (vb) this.lineGeometry.colors[i*2-1].setRGB(0,0,0);
                }
            }

            for (var i=mu*2; i<this.lineGeometryUnder.vertices.length; i++) {
                this.lineGeometryUnder.colors[i].setRGB(0,0,0);
            }


            //update geometry
            this.lineGeometryUnder.verticesNeedUpdate = true;
            this.lineGeometryUnder.colorsNeedUpdate = true;
            this.lineGeometry.verticesNeedUpdate = true;
            this.lineGeometry.colorsNeedUpdate = true;

        },


        //
        // sorting and finding specific points
        //
        getNearestPoint: function(p,near,v) {
            var nv = v || 0;
            if (near) {
                for (var j=0; j<this.activePoints.length; j++) {
                    this.activePoints[j].currentMouseDistance = this.activePoints[j].latestBaseVertice.distanceTo(p);
                }
            } else {
                for (var j=0; j<this.activePoints.length; j++) {
                    this.activePoints[j].currentMouseDistance = this.activePoints[j].latestVertice.distanceTo(p);
                }
            }
            this.activePoints.sort(this.sortPoints);
            return this.activePoints[nv];
        },


        sortPoints: function(a,b) {
            if (a.currentMouseDistance===b.currentMouseDistance) return 0;
            return (a.currentMouseDistance>b.currentMouseDistance)?1:-1;
        },

        cmap: function(value, istart, istop, ostart, ostop) {
         return Math.max(Math.min(ostart + (ostop - ostart) * ((value - istart) / (istop - istart)),ostop),ostart);
        }
    }
});