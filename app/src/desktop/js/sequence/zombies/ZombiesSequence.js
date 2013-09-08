/**
 * @author Édouard Lanctôt  < edouardlb@gmail.com >
 *
 */
var ZombiesSequence = Sequence._extend({

    _public:  {

        //state and constants
        LOADED_MESH_SCALE_BASE: new THREE.Vector3(1280,672,1.0), //2/1300,1.05/800,1),
        LOADED_MESH_OFFSET_BASE: new THREE.Vector3(-1280/2,-672/2,0),

        LOADED_MESH_SCALE: new THREE.Vector3(2,2,0), //2/1300,1.05/800,1),
        LOADED_MESH_OFFSET: new THREE.Vector3(-1,-1,0),
        LOADED_MESH_FLIP: new THREE.Vector3( 1, -1, 1 ),

        REFLEKTOR_BURST_TIME: 280,
        REFLEKTOR_BURST_TIME_END: 292,
        NUM_LINES_BURST: 150,

        //grid points
        gridPointsAxelle: [],
        gridPointsZombies: [],
        gridPointsById: [],
        trackingPointsSourceZombies: [],
        trackingPointsSourceAxelle: [],
        trackingPointsZombies: [],
        trackingPointsAxelle: [],
        trianglesAxelle: [],
        trianglesZombies: [],
        verticesAxelle: [],
        centerX: [],
        centerY: [],
        perlin: null,

        //points and lines
        numZombiePoints: 200,
        zombiesCloudGeom: null,
        zombiesCloudMesh: null,
        numAxellePoints: 100,
        axelleCloudGeom: null,
        axelleCloudMesh: null,

        //the planes
        maxBeams: 100,
        axelleBeams: [],
        beamTexture: null,
        beamTipTexture:null,
        beamTipPlane:null,
        zombieFlareMode: true,
        zombieTransferMode: false,


        //zombie flare planes
        maxZombieFlares: 100,
        zombieFlareTexture: null,
        zombieFlarePlanes: [],
        //zombieFlarePlanesLayerB: [],
        //zombieFlarePlanesLayerC: [],
        // zombieFlareFbo: null,
        // zombieFlareMaterial: null,
        // zombieFlareFboPing: null,
        // zombieFlareFboPong: null,
        // zombieFlareFboIsPing: false,

        //beam trail
        maxTrailBeams: 30,
        trailBeams: [],
        trailBeamsTexture: null,


        //rendering material and targets
        windowCamera: null,
        linesFbo: null,
        linesFbo2: null,
        linesFbo3: null,
        beamWidthA: 10.0,
        beamWidthB: 50.0,
        beamWidthC: 100.0,

        linesBlurMaterial: null,

        // linesAccumMaterial: null,
        // linesAccumFboPing: null,
        // linesAccumFboPong: null,
        // linesAccumFboIsPing: false,

        lightMaterial: null,
        lightFboPing: null,
        lightFboPong: null,
        lightFboIsPing: false,
        finalCompositionMaterial: null,
        finalCompositionFbo: null,
        finalPhonePosition: new THREE.Vector3( 0, 0, 0.5 ),

        nearScale: 1.0,


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

            console.log('init zombies');
            
            //
            // Localise some variables / references
            //
            var videoWidth = 1280, //this.videoTexture.width,
                videoHeight = 672, //this.videoTexture.height,
                renderer = RendererController.getInstance().getRenderer();
            
            this.perlin = new SimplexNoise(Math);


            //
            // Parse grid points json
            //
            this.windowCamera = new THREE.PerspectiveCamera( 45, videoWidth/videoHeight, 0.001, 100000 );
            this.windowCamera.position.z = this.getCameraZ(this.windowCamera,videoHeight);

            //parse the points
            this.trackingPointsSourceZombies = AssetsController.getInstance().getFile('media/tracking/zombies_final.json');
            this.trackingPointsSourceAxelle = AssetsController.getInstance().getFile('media/tracking/axelle_final.json');
            this.trackingPointsZombies = this.trackingPointsSourceZombies.tracks;
            this.trackingPointsAxelle = this.trackingPointsSourceAxelle.tracks;
            this.trianglesAxelle = this.trackingPointsSourceAxelle.triangles;
            this.trianglesZombies = this.trackingPointsSourceZombies.triangles;
            this.verticesAxelle = this.trackingPointsSourceAxelle.vertices;
            this.centerX = this.trackingPointsSourceAxelle.centerX;
            this.centerY = this.trackingPointsSourceAxelle.centerY;

            for (var i=0; i<this.trackingPointsAxelle.length; i++) {
               this.gridPointsAxelle[i] = new GridPoint(this.trackingPointsAxelle[i],i);
               this.gridPointsAxelle[i].frameOffset = - 0;
               this.gridPointsById[this.gridPointsAxelle[i].trackingId] = this.gridPointsAxelle[i];
            }
            for (var i=0; i<this.trackingPointsZombies.length; i++) {
               this.gridPointsZombies[i] = new GridPoint(this.trackingPointsZombies[i],i);
            }

            //
            // Get textures
            //
            for (var i=0; i<this.starTextureSmallNames.length; i++) {
                this.starTextureSmall[i] = AssetsController.getInstance().getFile(this.starTextureSmallNames[i]);   
                this.starTextureSmall[i].generateMipmaps = true;
            }
            for (var i=0; i<this.starTextureLargeNames.length; i++) {
                this.starTextureLarge[i] = AssetsController.getInstance().getFile(this.starTextureLargeNames[i]);   
                this.starTextureLarge[i].generateMipmaps = true;
            }


            //
            //
            // Composite / rendering
            //
            //
            this.linesFbo = new FramebufferWrapper(videoWidth,videoHeight,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                camera:this.windowCamera,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });

            this.linesFbo2 = new FramebufferWrapper(videoWidth/2,videoHeight/2,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                scene:this.linesFbo.scene,
                camera:this.windowCamera,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });

            this.linesFbo3 = new FramebufferWrapper(videoWidth/4,videoHeight/4,{
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                format:THREE.RGBAFormat,
                type:THREE.UnsignedByteType,
                scene:this.linesFbo.scene,
                camera:this.windowCamera,
                depthBuffer:false,
                stencilBuffer:false,
                premultiplyAlpha:false,
                generateMipmaps:false,
                renderer:renderer
            });


            // //accum material
            // this.linesAccumMaterial  = new THREE.ShaderMaterial( {
            //     vertexShader:   AssetsController.getInstance().getFile('shaders/common/vertex.vert'),
            //     fragmentShader: AssetsController.getInstance().getFile('shaders/zombies/linesAccumulation.frag'),
            //     attributes:{},
            //     uniforms: {
            //         'tLines':{type:'t',value:this.linesFbo2.texture},
            //         'tAccum':{type:'t',value:null},
            //         'center':{type:'v2', value:new THREE.Vector2(0.5,0.5)},
            //         'offset':{type:'v2', value:new THREE.Vector2(1.0/videoWidth, 1.0/videoWidth)},
            //         'accumDistance':{type:'f', value: 0.025 },
            //         'accumSpeed': {type:'f', value:0.99}
            //     },
            //     depthTest:false,
            //     transparent:true,
            //     blending:THREE.AdditiveBlending,
            //     side:THREE.DoubleSide
            // });
            // this.linesAccumFboPing = new FramebufferWrapper(videoWidth/8,videoHeight/8,{
            //     minFilter:THREE.LinearFilter,
            //     magFilter:THREE.LinearFilter,
            //     format:THREE.RGBAFormat,
            //     type:THREE.UnsignedByteType,
            //     renderMaterial:this.linesAccumMaterial,
            //     depthBuffer:false,
            //     stencilBuffer:false,
            //     premultiplyAlpha:false,
            //     generateMipmaps:false,
            //     renderer:renderer
            // });
            // this.linesAccumFboPong = new FramebufferWrapper(videoWidth/4,videoHeight/4,{
            //     minFilter:THREE.LinearFilter,
            //     magFilter:THREE.LinearFilter,
            //     format:THREE.RGBAFormat,
            //     type:THREE.UnsignedByteType,
            //     renderMaterial:this.linesAccumMaterial,
            //     depthBuffer:false,
            //     stencilBuffer:false,
            //     premultiplyAlpha:false,
            //     generateMipmaps:false,
            //     renderer:renderer
            // });

            //
            // Zombie flares
            //
            // this.zombieFlareFbo = new FramebufferWrapper(videoWidth/2,videoHeight/2,{
            //     minFilter:THREE.LinearFilter,
            //     magFilter:THREE.LinearFilter,
            //     format:THREE.RGBAFormat,
            //     type:THREE.UnsignedByteType,
            //     camera:this.windowCamera,
            //     depthBuffer:false,
            //     stencilBuffer:false,
            //     premultiplyAlpha:false,
            //     generateMipmaps:false,
            //     renderer:renderer
            // });
            // this.windowCamera = new THREE.PerspectiveCamera( 45, videoWidth/videoHeight, 0.001, 100000 );
            // this.windowCamera.position.z = this.getCameraZ(this.windowCamera,videoHeight);

            this.zombieFlareTexture = AssetsController.getInstance().getFile('media/images/zombies/axelle_light_0.png')
            
            for (var i=0; i<this.maxZombieFlares; i++) {
                var flareGeom = new THREE.PlaneGeometry( 1, 1.00, 1, 1 );
                //flareGeom.applyMatrix(new THREE.Matrix4().makeTranslation(0,0.5,0));
                this.zombieFlarePlanes[i] = new THREE.Mesh(
                    flareGeom,
                    new THREE.MeshBasicMaterial( {
                        color:0xffffff,
                        map:this.starTextureSmall[0],
                        opacity: 1.0,
                        transparent: true,
                        side:THREE.DoubleSide
                    })
                );
                this.zombieFlarePlanes[i].isFollowing = false;
                //this.zombieFlareFbo.scene.add(this.zombieFlarePlanes[i]);
            }


            //
            // Zombie Flare Extrude
            //
            // this.zombieFlareMaterial = new THREE.ShaderMaterial( {
            //     vertexShader:   AssetsController.getInstance().getFile('shaders/common/vertex.vert'),
            //     fragmentShader: AssetsController.getInstance().getFile('shaders/zombies/flareiterations.frag'),
            //     attributes:{},
            //     uniforms: {
            //         'tFlare':{type:'t', value: this.zombieFlareFbo.texture},
            //         'tAccum':{type:'t', value: null },
            //         'center':{type:'v2', value:new THREE.Vector2(0.5,0.5)},
            //         'offset':{type:'v2', value:new THREE.Vector2(6/videoWidth,6/videoHeight)},
            //         'pass':{type:'f', value: 0.0},
            //         'randomUV':{type:'v2',value:new THREE.Vector2(Math.random(),Math.random())}
            //     },
            //     depthTest:false,
            //     transparent:true,
            //     blending:THREE.AdditiveBlending,
            //     side:THREE.DoubleSide
            // });
            // this.zombieFlareFboPing = new FramebufferWrapper(videoWidth/2,videoHeight/2,{
            //     minFilter:THREE.LinearFilter,
            //     magFilter:THREE.LinearFilter,
            //     format:THREE.RGBAFormat,
            //     type:THREE.UnsignedByteType,
            //     renderMaterial:this.zombieFlareMaterial,
            //     depthBuffer:false,
            //     stencilBuffer:false,
            //     premultiplyAlpha:false,
            //     generateMipmaps:false,
            //     renderer:renderer
            // });
            // this.zombieFlareFboPong = new FramebufferWrapper(videoWidth/2,videoHeight/2,{
            //     minFilter:THREE.LinearFilter,
            //     magFilter:THREE.LinearFilter,
            //     format:THREE.RGBAFormat,
            //     type:THREE.UnsignedByteType,
            //     renderMaterial:this.zombieFlareMaterial,
            //     depthBuffer:false,
            //     stencilBuffer:false,
            //     premultiplyAlpha:false,
            //     generateMipmaps:false,
            //     renderer:renderer
            // });

            //final composite
            this.finalCompositionMaterial = new THREE.ShaderMaterial( {
                vertexShader:   AssetsController.getInstance().getFile('shaders/common/vertexinv.vert'),
                fragmentShader: AssetsController.getInstance().getFile('shaders/zombies/linesCompositeNoise.frag'),
                attributes:{},
                uniforms: {
                    'tVideo':{type:'t',value:this.videoTexture.texture},
                    'tLines':{type:'t',value:this.linesFbo.texture},
                    'tLinesBlur':{type:'t',value:this.linesFbo2.texture},
                    'tLinesBlur2':{type:'t',value:this.linesFbo3.texture},
                    //'tLinesAccum': {type:'t', value: null},
                    //'tFlares': {type:'t', value: null},
                    'center':{type:'v2', value:new THREE.Vector2(0.5,0.5)},
                    'randomUV':{type:'v2',value:new THREE.Vector2(Math.random(),Math.random())},
                    'blurDistance':{type:'f', value: 0.35},
                    'blurDistance2':{type:'f', value: 0.15},
                },
                depthTest:false,
                transparent:true,
                blending:THREE.AdditiveBlending,
                side:THREE.DoubleSide
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
            //this.finalCompositionFbo.renderPlane.scale.set(videoWidth/2,videoHeight/2,1);


            //
            // beamTextures
            //
            this.beamTexture = AssetsController.getInstance().getFile('media/images/zombies/axelle_light_beam_6.png');
            this.beamTipTexture = AssetsController.getInstance().getFile('media/images/zombies/axelle_light_0.png');
            this.beamTipPlane = new THREE.Mesh(
                new THREE.PlaneGeometry( 1,1,1,1),
                new THREE.MeshBasicMaterial( {
                    map:this.beamTipTexture,
                    color:0xffffff,
                    transparent:true,
                    opacity:0.5
                } )
            );
            this.linesFbo.scene.add(this.beamTipPlane);

            //
            // Create the beam planes
            //
            for (var i=0; i<this.maxBeams; i++) {
                var geom = new THREE.PlaneGeometry( 1, 1.04, 1, 4 );
                geom.applyMatrix(new THREE.Matrix4().makeTranslation(0,0.5,0));
                this.axelleBeams[i] = new THREE.Mesh(
                    geom,
                    new THREE.MeshBasicMaterial( {
                        color:0xffffff,
                        map:this.beamTexture,
                        opacity: 1.0,
                        transparent: true
                    })
                );
                this.axelleBeams[i].isFollowed = false;
            }


            //
            // Create the zombies point cloud
            //
            // this.zombiesCloudGeom = new THREE.Geometry();
            // for (var i=0; i<this.numZombiePoints; i++) {
            //     this.zombiesCloudGeom.vertices[i] = new THREE.Vector3(Math.random()*videoWidth-videoWidth/2,Math.random()*videoHeight-videoHeight/2);
            //     this.zombiesCloudGeom.colors[i] = new THREE.Color(0xffffff);
            //     this.zombiesCloudGeom.vertices[i].originalPosition = this.zombiesCloudGeom.vertices[i].clone();
            // }
            // this.zombiesCloudGeom.verticesNeedUpdate = true;
            // this.zombiesCloudGeom.colorsNeedUpdate = true;
            // this.zombiesCloudMesh = new THREE.ParticleSystem(
            //     this.zombiesCloudGeom,
            //     new THREE.ParticleBasicMaterial( {
            //         color: new THREE.Color(0xffffff),
            //         map: null,
            //         size: 5,
            //         vertexColors: true,
            //         fog: false,
            //         sizeAttenuation: false,
            //         transparent:true,
            //         blending:THREE.AdditiveBlending
            //     } )
            // );
            // this.linesFbo.scene.add(this.zombiesCloudMesh);


            //
            // Create the Axelle Point Cloud
            //
            // this.axelleCloudGeom = new THREE.Geometry();
            // for (var i=0; i<this.numAxellePoints; i++) {
            //     this.axelleCloudGeom.vertices[i] = new THREE.Vector3(Math.random()*videoWidth-videoWidth/2,Math.random()*videoHeight-videoHeight/2);
            //     this.axelleCloudGeom.colors[i] = new THREE.Color(0xffffff);
            // }
            // this.axelleCloudGeom.verticesNeedUpdate = true;
            // this.axelleCloudGeom.colorsNeedUpdate = true;
            // this.axelleCloudMesh = new THREE.ParticleSystem(
            //     this.axelleCloudGeom,
            //     new THREE.ParticleBasicMaterial( {
            //         color: new THREE.Color(0xffffff),
            //         map: null,
            //         size: 3,
            //         vertexColors: true,
            //         fog: false,
            //         sizeAttenuation: false,
            //         transparent:true,
            //         blending:THREE.AdditiveBlending
            //     } )
            // );
            // this.linesFbo.scene.add(this.axelleCloudMesh);
            
        },

        begin: function () {

            Sequence.prototype.begin.call(this);

            console.log('begin zombies');
            
            this.linesFbo.alloc();
            this.linesFbo2.alloc();
            this.linesFbo3.alloc();
            this.finalCompositionFbo.alloc();

            this.finalCompositionMaterial.uniforms.tVideo.value = this.videoTexture.texture;
            this.finalCompositionMaterial.uniforms.tLines.value = this.linesFbo.texture;
            this.finalCompositionMaterial.uniforms.tLinesBlur.value = this.linesFbo2.texture;
            this.finalCompositionMaterial.uniforms.tLinesBlur2.value = this.linesFbo3.texture;

        },

        end: function () {

            Sequence.prototype.end.call(this);

            this.linesFbo.dispose();
            this.linesFbo2.dispose();
            this.linesFbo3.dispose();
            this.finalCompositionFbo.dispose();


        },

        changeVideoQuality: function(nw, nh) {

            this.finalCompositionMaterial.uniforms.tVideo.value = this.videoTexture.texture;

        },

        changeRenderQuality: function (nw, nh) {

            this.renderWidth = nw;
            this.renderHeight = nh;

            this.linesFbo.resizeTexture(nw, nh);
            this.linesFbo2.resizeTexture(nw/2,nh/2);
            this.linesFbo3.resizeTexture(nw/4,nh/4);

            // this.zombieFlareFbo.resizeTexture(nw, nh);
            // this.zombieFlareFboPing.resizeTexture(nw/2, nh/2);
            // this.zombieFlareFboPong.resizeTexture(nw/2, nh/2);

            this.finalCompositionFbo.resizeTexture(nw, nh);

            //update uniforms references
            // this.zombieFlareMaterial.uniforms.tFlare.value = this.zombieFlareFbo.texture;
            // this.zombieFlareMaterial.uniforms.offset.value.set(6/nw,6/nh);

            this.finalCompositionMaterial.uniforms.tLines.value = this.linesFbo.texture;
            this.finalCompositionMaterial.uniforms.tLinesBlur.value = this.linesFbo2.texture;
            this.finalCompositionMaterial.uniforms.tLinesBlur2.value = this.linesFbo3.texture;
            //this.finalCompositionMaterial.uniforms.tFlares.value = this.zombieFlareFbo.texture;




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
        update: function (options, currentFrame, delta, time, progress, position, orientation) {

            //
            // Update controls
            //
            var rawPhonePosition = InputController.getInstance().getPositionDirectional().clone(),
                dist = rawPhonePosition.distanceTo(this.finalPhonePosition),
                finalPhonePosition = InputController.getInstance().isMouseVersion() ? rawPhonePosition.clone() : this.finalPhonePosition.lerp(rawPhonePosition,Math.max(options.smoothingMaxDistance-dist,0) * ((1.0 - options.smoothingMaxDistance)/options.smoothingMaxDistance) + options.smoothingMaxDistance).clone(), //lerp(rawPhonePosition,0.5*delta),
                videoWidth = this.videoTexture.width,
                videoHeight = this.videoTexture.height;

            var zValue = this.cmap(finalPhonePosition.z,0.1,0.9,0.0,1.0);

            //get frame
            this.lastFrame = this.currentFrame;
            this.currentFrame = currentFrame + ((TimelineController.getInstance().initialised) ? 2 : 1); //Math.floor(time * Player.VIDEO_FRAMERATE);
            //if (!TimelineController.getInstance().initialised) this.currentFrame += 3;

            //get position arrays
            var zombiePoints = [];
            for (var i=0; i<this.gridPointsZombies.length; i++) {
                if (this.gridPointsZombies[i].isActive(this.currentFrame)) {
                    this.gridPointsZombies[i].isFollowed = false;
                    zombiePoints.push(this.gridPointsZombies[i]);
                }
            }
            var axellePoints = [];
            for (var i=0; i<this.gridPointsAxelle.length; i++) {
                if (this.gridPointsAxelle[i].isActive(this.currentFrame)) {
                    axellePoints.push(this.gridPointsAxelle[i]);
                }                
            }

            //remap phone/mouse to center of axelle
            var angle = Math.atan2(finalPhonePosition.y,finalPhonePosition.x);
            var dst = Math.sqrt(finalPhonePosition.x*finalPhonePosition.x + finalPhonePosition.y*finalPhonePosition.y);
            finalPhonePosition.x = this.centerX[this.currentFrame] + Math.cos(angle)*dst*2.0; 
            finalPhonePosition.y = this.centerY[this.currentFrame]*-0.5+0.0 + Math.sin(angle)*dst*2.0;  //  + 

            //update scale/pos of points
            //this.LOADED_MESH_SCALE.x = options.followSize * 2.0;// * 1/960;
            //this.LOADED_MESH_SCALE.y = options.followSize * 2.0;// * 1/720;
            //this.LOADED_MESH_OFFSET.x = this.LOADED_MESH_OFFSET.y = -1; //-options.followSize;

            //zombie mode
            if (options.zombieTransfer > 0.0 && options.zombieTransfer < 1.0) {
                this.zombieTransferMode = true;
            } else {
                this.zombieTransferMode = false;
            }

            //zombie flare mode
            if (options.zombieFlare > 0.0 && options.zombieFlare <= 1.0) {
                this.zombieFlareMode = true;
            } else {
                this.zombieFlareMode = false;
            }


            //
            // Update Z
            //
            var numBeams = (options.numBeams);
            numBeams += (50 - options.numBeams) * (1.0-zValue);
            numBeams = Math.floor(numBeams);
            var randomConsider = options.randomBeamsConsider;
            randomConsider += (50 - options.randomBeamsConsider) * (1.0-zValue);
            randomConsider = Math.floor(randomConsider);


            this.nearScaling = 1.0 + ((1.0-zValue) * options.nearScaling);

            //
            // update Shaders
            //
            //this.linesBlurMaterial.uniforms.center.value.set(finalPhonePosition.x * 0.5 + 0.5, finalPhonePosition.y * 0.5 + 0.5);
            this.beamWidthA = options.beamWidth * (1280 / this.renderWidth);
            this.beamWidthB = options.beamWidthBlur;
            this.beamWidthC = options.beamWidthBlur2;
            //this.linesAccumMaterial.uniforms.center.value.set(finalPhonePosition.x * 0.5 + 0.5, finalPhonePosition.y * 0.5 + 0.5);
            //this.zombieFlareMaterial.uniforms.center.value.set(finalPhonePosition.x * 0.5 + 0.5, finalPhonePosition.y * 0.5 + 0.5);
            this.finalCompositionMaterial.uniforms.center.value.set(finalPhonePosition.x * 0.5 + 0.5, finalPhonePosition.y * 0.5 + 0.5);
            this.finalCompositionMaterial.uniforms.randomUV.value.set(Math.random(),Math.random());
            this.finalCompositionMaterial.uniforms.blurDistance.value = options.blurDistance;
            this.finalCompositionMaterial.uniforms.blurDistance2.value = options.blurDistance2;
            this.beamTipPlane.position.x = finalPhonePosition.x * 1280/2;
            this.beamTipPlane.position.y = finalPhonePosition.y * 672/2;
            this.beamTipPlane.position.z = 0;
            this.beamTipPlane.scale.set(options.beamTip,options.beamTip,options.beamTip);
            this.beamTipPlane.material.opacity = options.beamTipOpacity;


            //
            // Pick nearest points
            //
            var mouse = new THREE.Vector3(finalPhonePosition.x,finalPhonePosition.y,0.0);
            for (var i = 0; i < axellePoints.length; i++) {
                axellePoints[i].currentMouseDistance = axellePoints[i].getPosition(this.currentFrame,this.LOADED_MESH_SCALE,this.LOADED_MESH_OFFSET,this.LOADED_MESH_FLIP).distanceTo(mouse);
            }
            axellePoints.sort(this.sortPoints);

            var axellePointsNear = [];
            for (var i=0; i<randomConsider; i++) { //Math.min(options.randomBeamsConsider,axellePoints.length); i++) {
                if (axellePoints[i]) axellePointsNear.push(axellePoints[i]);
            }



            //
            // update light beams to nearest points
            //
            for (var i=0; i<this.axelleBeams.length; i++) {
                if (i<numBeams && !this.axelleBeams[i].parent) this.linesFbo.scene.add(this.axelleBeams[i]);
                if (i>=numBeams && this.axelleBeams[i].parent) this.linesFbo.scene.remove(this.axelleBeams[i]);
            }

            var beam, beamTarget;
            if (!this.zombieTransferMode && !this.zombieFlareMode) {
                for (var i=0; i<numBeams; i++) {
                    beam = this.axelleBeams[i];

                    //pick a new unpicked point
                    if (!beam.targetPoint || !beam.targetPoint.isActive(this.currentFrame) || beam.targetPoint.life >= options.maxBeamLife) {
                        if (beam.targetPoint) { beam.targetPoint.isFollowed = false; beam.targetPoint.life = 0; beam.targetPoint = null;}
                        axellePointsNear = this.shuffle(axellePointsNear);
                        for (var j=0; j<axellePointsNear.length; j++) {
                            if (!axellePointsNear[j].isFollowed) {
                                beam.targetPoint = axellePointsNear[j];
                                beam.targetPoint.isFollowed = true;
                                beam.targetPoint.life = 0;
                                j = axellePointsNear.length;
                            }
                        }
                    }

                    //update beam
                    if (beam.targetPoint) {
                        beam.targetPoint.life++;
                        var pos = beam.targetPoint.getPosition(this.currentFrame,this.LOADED_MESH_SCALE_BASE,this.LOADED_MESH_OFFSET_BASE,this.LOADED_MESH_FLIP).clone();
                        var posNorm =  beam.targetPoint.getPosition(this.currentFrame,this.LOADED_MESH_SCALE,this.LOADED_MESH_OFFSET,this.LOADED_MESH_FLIP).clone();

                        var a = (posNorm.x*1280 - mouse.x*1280);
                        var b = (posNorm.y*672 - mouse.y*672);
                        var angle = Math.atan2(b,a);
                        beam.rotation.z = ( angle ) + Math.PI/2;

                        beam.scale.y = Math.sqrt(a*a + b*b) * 0.5; //mouse.y-posNorm.y, posNorm.x-mouse.x
                        beam.scale.x = options.beamWidth;
                        beam.scale.z = options.beamWidth;
                        beam.position.copy(pos);

                        //beam.position.copy(mouse);
                        //console.log(beam.position);
                    } else {
                        this.linesFbo.scene.remove(beam);
                    }
                }

                //
                // Update current trail
                //
                // var numTrails = Math.floor(options.trailLength);
                // trailBeams.unshift(trailBeams.splice(numTrails,1)[0]);

                // //update existing trail
                // for (var i=0; i<numTrails; i++) {

                // }
                for (var i=numBeams; i < this.maxBeams; i++) {
                    if (this.axelleBeams[i].targetPoint) {
                        this.axelleBeams[i].targetPoint.isFollowed = false; this.axelleBeams[i].targetPoint.life = 0; this.axelleBeams[i].targetPoint = null;
                    }
                }
            }


            //
            //zombie transfer mode!
            //
            if (this.zombieTransferMode) {

                //this.beamWidthA += (1.0 - Math.pow(options.zombieTransfer,2)) *  this.beamWidthA*2.0;
                this.beamTipPlane.material.opacity = options.beamTipOpacity * ( Math.pow(options.zombieTransfer,6));


                for (var i=0; i<axellePoints.length; i++) {
                    axellePoints[i].isFollowed = false;
                }

                var numZombiesBurst = Math.floor( Math.pow(options.zombieTransfer,3) * (this.axelleBeams.length-1) + 1);
                for (var i=0; i<numZombiesBurst; i++) {
                    beam = this.axelleBeams[i];
                    var source = zombiePoints[Math.floor(Math.random()*zombiePoints.length)];
                    var pos = source.getPosition(this.currentFrame,this.LOADED_MESH_SCALE_BASE,this.LOADED_MESH_OFFSET_BASE,this.LOADED_MESH_FLIP).clone();
                    var posNorm =  source.getPosition(this.currentFrame,this.LOADED_MESH_SCALE,this.LOADED_MESH_OFFSET,this.LOADED_MESH_FLIP).clone();

                    if (Math.random()<Math.pow( Math.max(options.zombieTransfer-0.5,0.0) * 2.0, 10)) {
                        posNorm.copy(mouse);
                        pos.copy(posNorm);
                        pos.x *= 1280*0.5;
                        pos.y *= 672*0.5;
                        //.multiply(this.LOADED_MESH_SCALE_BASE);
                    }

                    for (var j=0; j<axellePoints.length; j++) {
                        axellePoints[j].currentMouseDistance = axellePoints[j].getPosition(this.currentFrame,this.LOADED_MESH_SCALE,this.LOADED_MESH_OFFSET,this.LOADED_MESH_FLIP).distanceTo(posNorm);
                    }
                    axellePoints.sort(this.sortPoints);


                    var target = axellePoints[Math.floor(Math.random()*randomConsider)];
                    if (target && pos) {
                        var beamTarget = target.getPosition(this.currentFrame,this.LOADED_MESH_SCALE,this.LOADED_MESH_OFFSET,this.LOADED_MESH_FLIP).clone();
                        //target.isFollowed = true;
                        source.isFollowed = true;

                        var a = (posNorm.x*1280 - beamTarget.x*1280);
                        var b = (posNorm.y*672 - beamTarget.y*672);
                        var angle = Math.atan2(b,a);
                        beam.rotation.z = ( angle ) + Math.PI/2;

                        beam.scale.y = Math.sqrt(a*a + b*b) * 0.5 ; //mouse.y-posNorm.y, posNorm.x-mouse.x
                        beam.scale.x = options.beamWidth;
                        beam.scale.z = options.beamWidth;
                        beam.position.copy(pos);
                        if (!beam.parent) this.linesFbo.scene.add(beam);
                    } else {
                        if (beam.parent) this.linesFbo.scene.remove(beam);
                    }
                    
                }
                for (var i = numZombiesBurst; i<this.axelleBeams.length; i++) {
                    if (this.axelleBeams[i].parent) this.linesFbo.scene.remove(this.axelleBeams[i]);
                }
            }


            //
            // Zombie flares mode
            //
            if (this.zombieFlareMode) {

                var scaledMouse = mouse.clone().multiply(new THREE.Vector3(1280,672,1));


                for (var i=0; i<zombiePoints.length; i++) {
                    zombiePoints[i].currentMouseDistance = mouse.distanceTo(zombiePoints[i].getPosition(this.currentFrame,this.LOADED_MESH_SCALE,this.LOADED_MESH_OFFSET,this.LOADED_MESH_FLIP));   
                }
                zombiePoints = zombiePoints.sort(this.sortPoints);
                
                var np = Math.floor(zombiePoints.length * 0.75);

                for (var i=0; i<np; i++) {
                    if (this.zombieFlarePlanes[i] && zombiePoints[i]) {
                        
                        this.zombieFlarePlanes[i].isFollowing = true;
                        
                        if (!this.zombieFlarePlanes[i].parent) this.linesFbo.scene.add(this.zombieFlarePlanes[i]);

                        this.zombieFlarePlanes[i].position.copy(zombiePoints[i].getPosition(this.currentFrame,this.LOADED_MESH_SCALE_BASE,this.LOADED_MESH_OFFSET_BASE,this.LOADED_MESH_FLIP).clone());
                 
                        var dst = Math.pow(1.0 * (1.0 - i / np), 1.25);

                        this.zombieFlarePlanes[i].scale.x = this.zombieFlarePlanes[i].scale.y = options.zombieFlareSize * 0.5 + options.zombieFlareSize * dst * 1.0;

                        this.zombieFlarePlanes[i].material.map = this.starTextureLarge[Math.floor(Math.random()*this.starTextureLarge.length)];
                        if (Math.random()<0.5) this.zombieFlarePlanes[i].material.map = this.starTextureSmall[Math.floor(Math.random()*this.starTextureSmall.length)];

                        this.zombieFlarePlanes[i].material.opacity = Math.random() * options.zombieFlare * dst + 0.8 ;
                    }
                }
                for (var i=np; i<this.zombieFlarePlanes.length; i++) {
                    if (this.zombieFlarePlanes[i].parent) this.linesFbo.scene.remove(this.zombieFlarePlanes[i]);
                }

                if (!this.zombieTransferMode) {
                    for (var i=0; i < this.maxBeams; i++) {
                        if (this.axelleBeams[i].targetPoint) {
                            this.axelleBeams[i].targetPoint.isFollowed = false; this.axelleBeams[i].targetPoint.life = 0; this.axelleBeams[i].targetPoint = null;
                        }
                        if (this.axelleBeams[i].parent) {
                            this.linesFbo.scene.remove(this.axelleBeams[i]);
                        }
                    }
                }
            } else {
                 for (var i=0; i<this.zombieFlarePlanes.length; i++) {
                    if (this.zombieFlarePlanes[i].parent) this.linesFbo.scene.remove(this.zombieFlarePlanes[i]);
                 }
            }




            // //
            // // Update zombie points cloud
            // //
            // var showZombies = options.showPointsZombies ? 1 : 0;
            // for (var i = 0; i < zombiePoints.length; i++) {
            //     this.zombiesCloudGeom.vertices[i].copy(zombiePoints[i].getPosition(this.currentFrame,this.LOADED_MESH_SCALE_BASE,this.LOADED_MESH_OFFSET_BASE,this.LOADED_MESH_FLIP));
            //     //showZombies = (this.zombieFlareMode || (options.showPointsZombies && zombiePoints[i].isFollowed)) ? 1 : 0;
            //     showZombies = (options.showPointsZombies && zombiePoints[i].isFollowed) ? 1 : 0;
            //     this.zombiesCloudGeom.colors[i].setRGB(showZombies,showZombies,showZombies);
            // }
            // for (var i = zombiePoints.length; i < this.numZombiePoints; i++) {
            //     this.zombiesCloudGeom.colors[i].setRGB(0,0,0);
            // }
            // this.zombiesCloudGeom.verticesNeedUpdate = true;
            // this.zombiesCloudGeom.colorsNeedUpdate = true;

            // //console.log(zombiePoints,this.currentFrame);



            // //
            // // Update Axelle points cloud
            // //
            // var showAxelle = options.showPointsAxelle ? 1 : 0;
            // for (var i = 0; i < axellePoints.length; i++) {
            //     if (this.axelleCloudGeom.vertices[i]) {
            //         this.axelleCloudGeom.vertices[i].copy(axellePoints[i].getPosition(this.currentFrame,this.LOADED_MESH_SCALE_BASE,this.LOADED_MESH_OFFSET_BASE,this.LOADED_MESH_FLIP));
            //         showAxelle = (options.showPointsAxelle && axellePoints[i].isFollowed) ? 1 : 0;
            //         this.axelleCloudGeom.colors[i].setRGB(showAxelle,showAxelle,showAxelle);
            //     }
            // }
            // for (var i = axellePoints.length; i < this.numAxellePoints; i++) {
            //     if (this.axelleCloudGeom.colors[i]) this.axelleCloudGeom.colors[i].setRGB(0,0,0);
            // }
            // this.axelleCloudGeom.verticesNeedUpdate = true;
            // this.axelleCloudGeom.colorsNeedUpdate = true;


        },

        /**
         *
         * Renders three.js scene in this sequence's Render Target
         *
         */
        render: function () {
            RendererController.getInstance().getRenderer().setClearColor(new THREE.Color(0));
            RendererController.getInstance().getRenderer().clear();
        

            // if (this.zombieFlareMode) {
            //     this.zombieFlareFbo.render();
            //     //this.zombieFlareFboPing.render();
            //     //RendererController.getInstance().renderToScreen(this.zombieFlareFbo.texture,false,true);
            // }

            this.beamTipPlane.scale.multiplyScalar(this.nearScaling);
            for (var i=0; i<this.axelleBeams.length; i++) {
                this.axelleBeams[i].scale.x = this.axelleBeams[i].scale.z = this.beamWidthA * this.nearScaling ;
            }
            this.linesFbo.render();

            for (var i=0; i<this.axelleBeams.length; i++) {
                this.axelleBeams[i].scale.x = this.axelleBeams[i].scale.z = this.beamWidthB * this.nearScaling;
            }
            for (var i=0; i<this.zombieFlarePlanes.length; i++) {
                this.zombieFlarePlanes[i].scale.multiplyScalar(Math.random()*1.0 + 0.5);
            }
            this.beamTipPlane.scale.multiplyScalar(4.0).multiplyScalar(this.nearScaling);
            this.linesFbo2.render();

            for (var i=0; i<this.axelleBeams.length; i++) {
                this.axelleBeams[i].scale.x = this.axelleBeams[i].scale.z = this.beamWidthC*this.nearScaling;
            }
            for (var i=0; i<this.zombieFlarePlanes.length; i++) {
                this.zombieFlarePlanes[i].scale.multiplyScalar(Math.random()*1.0 + 1.0);
            }
            this.beamTipPlane.scale.multiplyScalar(1.5).multiplyScalar(this.nearScaling);
            this.linesFbo3.render();


            //accum
            // var ping = this.linesAccumFboIsPing ? this.linesAccumFboPing : this.linesAccumFboPong;
            // var pong = this.linesAccumFboIsPing ? this.linesAccumFboPong : this.linesAccumFboPing;
            // this.linesAccumMaterial.uniforms.tAccum.value = pong.texture;
            // ping.render();
            // this.linesAccumFboIsPing = !this.linesAccumFboIsPing;

            //composite
            //this.finalCompositionMaterial.uniforms.tLinesAccum.value = ping.texture;
            
            this.finalCompositionFbo.render();
            RendererController.getInstance().renderToScreen(this.finalCompositionFbo.texture,false,true);
            
        }
    },


    /**
     *
     *
     * Private utils
     * 
     *
    */
    _private: {
        cmap: function(value, istart, istop, ostart, ostop) {
         return Math.max(Math.min(ostart + (ostop - ostart) * ((value - istart) / (istop - istart)),ostop),ostart);
        },

        getCameraZ: function(camera,videoHeight) {
            return videoHeight / (2 * Math.tan(camera.fov / 2 * (Math.PI / 180)));
        },
        sortPoints: function(a,b) {
            if (a.currentMouseDistance===b.currentMouseDistance) return 0;
            return (a.currentMouseDistance>b.currentMouseDistance)?1:-1;
        },

        shuffle: function(array) {
            var unshuffled = array.slice();
            var shuffled = [];
            for (var i=0; i<array.length; i++) {
                shuffled.push(unshuffled.splice(Math.floor(Math.random()*unshuffled.length),1)[0]);
            }
            return shuffled;
        }
    }

});