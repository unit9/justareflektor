var PositView = Class._extend(Class.ABSTRACT, {

    _static: {

        WIDTH: 256,
        HEIGHT: 256

    },

    _public: {

        initialized: false,

        renderer: null,
        scene: null,
        camera: null,
        border: 10,
        planeScale: 1.0,
        allTextures: [],
        allPlanes: [],
        allCanvas: {},
        allFbos: {},
        planesAdded: false,

        construct: function() {


        },

        setup: function () {

            if (this.initialized) return;

            var self = this;
            self.renderer = TrackingController.getInstance().renderer;

            //  self.renderer.setClearColorHex(0x000000, 1);
            self.renderer.setSize(256,256);
            self.renderer.domElement.style.position = 'absolute';
            self.renderer.domElement.style.left = '0px';
            self.renderer.domElement.style.top = '30px';
            self.renderer.autoClear = false;

            this.scene = new THREE.Scene();
            this.camera = new THREE.OrthographicCamera(-128,128,128,-128, -1000, 1000);
            this.camera.position.set(0, 0, 1);
            this.camera.lookAt(new THREE.Vector3());

            this.initDebug();
            this.initialized = true;

        },

        show: function () {


            this.isShown = true;
            TrackingController.getInstance().canClear = false;

        },

        hide: function () {

            this.isShown = false;
            TrackingController.getInstance().canClear = false;

        },

        initTexturePlanes: function(videoTexture,renderPasses) {
            if (this.planesAdded) return;
            this.planesAdded = true;
            //this.addTexture(videoTexture,0,0);

            //this.addTexture(videoTexture, 0, 0);
            //this.addCanvasTexture('contours', 1, 0);
            this.addRenderTexture('pose', 0, 0);
            this.addCanvasTexture('contours', 0, 0);

            /*this.addTexture(renderPasses['simpleExposure'].texture,1,0);
            this.addTexture(renderPasses['edges'].texture,2,0);
            this.addTexture(renderPasses['hueLuma'].texture,3,0);
            this.addTexture(renderPasses['edges2'].texture,4,0);

            this.addRenderTexture('pose',0,1);
            this.addCanvasTexture('contours',1,1);
            this.addTexture(renderPasses['frameDiff'].texture,2,1);*/
            
        },

        updateData: function(data,mainVideo,position,rotation,normalizedPosition) {
            //if (!this.isShown) return;
            if (data.contours) this.updateCanvasWithBlobs('contours',mainVideo,data.contours);
            if (data.candidates) this.updateCanvasWithCandidates('contours',null,data.candidates);
            this.updatePhoneSmooth('pose',position,rotation,data.foundHole,data.useEstimate);
            //this.updatePhoneSmoothEst('pose',normalizedPosition.clone().multiply(new THREE.Vector3(-256,-256,1000)),rotation,data.foundHole,data.useEstimate);
            this.renderer.render(this.scene,this.camera);
            //if (data.useEstimate) this.updateCanvasWithEstimate('contours',null,data.estimatedX,data.estimatedY);
            //if (data.motionX && data.motionY) this.updateCanvasWithMotion('contours',null,data.motionX,data.motionY);
        },

        render: function() {
            //if (!this.isShown) return;
            console.log('RENDER');
            for (var fbo in thisallFbos) {
                this.allFbos[fbo].render();
            }
            this.renderer.render(this.scene,this.camera);
        }

    },

    _private: {

        initDebug: function () {


            /*this.addTexture(TrackingController.getInstance().mainVideoTexture, 0, 0);
            this.addCanvasTexture('contours', 1, 0);
            this.addRenderTexture('pose', 2, 0);*/

        },


        bindEvents: function () {

        },

        bindEventsShown: function () {

        },

        unbindEventsHidden: function () {

        },

        render: function () {

            this.renderer.render(this.scene, this.camera);

        },

        onFrame: function () {

            this.render();

        },

        onTrackingUpdate: function (data) {

            /*if (data.contours) this.updateCanvasWithBlobs('contours', TrackingController.getInstance().mainVideo, data.contours);
            if (data.candidates) this.updateCanvasWithCandidates('contours', null, data.candidates);

            this.updatePhoneSmooth('pose', TrackingController.getInstance().position, TrackingController.getInstance().rotation, data.foundHole, data.useEstimate);

            if (data.useEstimate) this.updateCanvasWithEstimate('contours', null, data.estimatedX, data.estimatedY);
            if (data.motionX && data.motionY) this.updateCanvasWithMotion('contours', null, data.motionX, data.motionY);

            this.render();*/
        },

        addTexture: function (tex, posx, posy) {

            var p = new THREE.Mesh(
                new THREE.PlaneGeometry(256, 256, 1, 1),
                new THREE.MeshBasicMaterial({color: 0xffffff, map: tex, side: THREE.DoubleSide, transparent: true})
            );
            p.scale.set(-this.planeScale * this.scaleX, -this.planeScale, this.planeScale);
            p.position.x = (this.border + 256 * this.planeScale * this.scaleX) * (posx + 0.5); //position plane
            p.position.y = this.border * 2 + (this.border + 256 * this.planeScale) * (posy + 0.5); //position plane

            this.scene.add(p);
            this.allPlanes.push(p);
            this.allTextures.push(tex);
        },

        addCanvasTexture: function (name, posx, posy) {

            var canvas = document.createElement('canvas');
            canvas.c = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 256;
            canvas.c.fillStyle = 'black';
            canvas.c.fillRect(0, 0, 256, 256);
            canvas.c.fillStyle = 'white';

            var tex = new THREE.Texture(
                canvas,
                new THREE.UVMapping(),
                THREE.ClampToEdgeWrapping,
                THREE.ClampToEdgeWrapping,
                THREE.LinearFilter, THREE.LinearFilter,
                THREE.RGBAFormat, THREE.UnsignedByteType, 1);

            tex.needsUpdate = true;
            tex.generateMipmaps = false
            canvas.texture = tex;

            TextureUpdateController.getInstance().addTexture(tex, 24, this.renderer);

            var p = new THREE.Mesh(
                new THREE.PlaneGeometry(256, 256, 1, 1),
                new THREE.MeshBasicMaterial({color: 0xffffff, map: tex, side: THREE.DoubleSide, transparent: true, blending:THREE.AdditiveBlending})
            );

            p.scale.set(1,1,1);
            p.position.x = 0; //position plane
            p.position.y = 0; //position plane
            this.scene.add(p);
            this.allPlanes.push(p);
            this.allTextures.push(tex);
            this.allCanvas[name] = canvas;
        },

        addRenderTexture: function (name, posx, posy) {


            var fbo = new FramebufferWrapper(256, 256, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                type: THREE.UnsignedByteType,
                camera: new THREE.PerspectiveCamera(45, 1 / 1, 0.05, 1000),
                depthBuffer: false,
                stencilBuffer: false,
                premultiplyAlpha: false,
                generateMipmaps: false,
                backgroundColor: 0x777777,
                backgroundAlpha: 0,
                transparent: true,
                renderer: TrackingController.getInstance().renderer
            });

            //add the phone
            fbo.camera.lookAt(new THREE.Vector3(0, 0, 1));
            fbo.phone = this.createDebugPhoneModel(1, false);
            fbo.phone.position.set(0, 0, -500);
            fbo.scene.add(fbo.phone);

            fbo.camera.lookAt(new THREE.Vector3(0, 0, 1));
            fbo.phoneEst = this.createDebugPhoneModel(1, true);
            fbo.phoneEst.position.set(0, 0, -500);


            //add a light
            var directionalLight = new THREE.DirectionalLight(0xffffff);
            directionalLight.position.set(0, 0, -1).normalize();
            directionalLight.lookAt(new THREE.Vector3(0, 0, 1));
            fbo.scene.add(directionalLight);

            //
            // Add display plane
            //
            var p = new THREE.Mesh(
                new THREE.PlaneGeometry(256, 256, 1, 1),
                new THREE.MeshBasicMaterial({color: 0xffffff, map: fbo.texture, side: THREE.DoubleSide, transparent: true, blending:THREE.AdditiveBlending})
            );
            p.scale.set(1,1,1);
            p.position.x = 0; //position plane
            p.position.y = 0; //position plane

            this.scene.add(p);
            this.allPlanes.push(p);
            this.allTextures.push(fbo.texture);
            this.allFbos[name] = fbo;
            fbo.render();

        },

        createDebugPhoneModel: function (modelScale, isGhost) {

            var geometryPhone = new THREE.CubeGeometry(37 * modelScale, 70 * modelScale, 10 * modelScale);
            var geometryScreen = new THREE.CubeGeometry(31 * modelScale, 55 * modelScale, 1 * modelScale);

            isGhost = isGhost ? true : false;

            var materialBody = new THREE.MeshLambertMaterial({color: 0x44ffaa, transparent: true, depthTest: true, depthWrite: true});
            var materialScreen = new THREE.MeshLambertMaterial({color: 0x333333, transparent: true, depthTest: true, depthWrite: true});

            if (isGhost) {
                materialBody.opacity = materialScreen.opacity = 0.25;
                materialBody.color = new THREE.Color(0xff0000);
            }

            var meshPhone = new THREE.Mesh(geometryPhone, materialBody);
            var meshScreen = new THREE.Mesh(geometryScreen, materialScreen);

            meshScreen.position.y = 3 * modelScale;
            meshScreen.position.z = 5 * modelScale;

            var axis = new THREE.AxisHelper(50 * modelScale);

            var model = new THREE.Object3D();
            model.add(meshPhone);
            model.add(meshScreen);
            model.add(axis);

            model.useQuaternion = true;
            model.quaternion = new THREE.Quaternion();
            model.projectedPosition = new THREE.Vector3(0, 0, 0);
            model.mat = materialBody;

            return model;
        },

        updateCanvasWithBlobs: function (name, mainVideo, contours) {

            var canvas = this.allCanvas[name];

            if (!canvas) {
                console.error("Debug Error - Blob Canvas " + name + " doesn't exist");
                return;
            }

            var c = canvas.c;

            //video background
            if (mainVideo) c.drawImage(mainVideo, 0, 0, 256, 256);

            c.globalAlpha = 0.75;
            c.fillStyle = 'black';
            c.fillRect(0, 0, 256, 256);
            c.fillStyle = 'white';
            c.globalAlpha = 1.0;

            //draw blobs
            for (var i = 0; i < contours.length; i++) {
                if (contours[i].length > 8) {
                    c.save();
                    c.globalAlpha = 0.8;
                    c.strokeStyle = '#00ff00';
                    if (contours[i].hole) c.strokeStyle = '#ff0000';
                    if (contours[i].bad || contours[i].isBackground) c.strokeStyle = 'gray';
                    c.beginPath();
                    c.moveTo(contours[i][0].x, 256 - contours[i][0].y);
                    for (var j = 1; j < contours[i].length; j++) {
                        nc = contours[i][j];
                        c.lineTo(nc.x, 256 - nc.y);
                    }
                    c.closePath();
                    c.stroke();

                    if (contours[i].edist) {
                        c.font = "8pt Arial";
                        c.fillStyle = 'white';
                        //c.fillText(parseInt(contours[i].edist),contours[i].centerX,256-contours[i].centerY);
                    }

                    c.restore();
                }
                ;
            }


            //update the 3d texture
            canvas.texture.needsUpdate = true;
        },

        updateCanvasWithCandidates: function (name, mainVideo, candidates) {

            var canvas = this.allCanvas[name];

            if (!canvas) {
                console.error("Debug Error - Candidates Canvas " + name + " doesn't exist");
                return;
            }

            var c = canvas.c;

            //video background
            if (mainVideo) c.drawImage(mainVideo, 0, 0, 256, 256);

            c.save();

            for (var i = 0; i < candidates.length; i++) {
                if (candidates[i].hasHole) c.fillStyle = 'green'; else c.fillStyle = 'blue';
                if (candidates[i].wasMatched) c.fillStyle = 'red';
                if (candidates[i].bad || candidates[i].isBackground) c.strokeStyle = 'gray';
                for (var j = 0; j < candidates[i].length; j++) {
                    c.fillRect(candidates[i][j].x, 256 - candidates[i][j].y, 4, 4);
                }

            }

            if (TrackingController.getInstance().foundHole) {

                c.fillStyle = '#00ffff';
                c.fillRect((TrackingController.getInstance().normalizedPosition.x - 0.5) * 256 * 0.31 + 256 * 0.66, 0, 1, 256);
                c.fillRect(0, 256 - TrackingController.getInstance().normalizedPosition.y * 256 * 0.42 - 256 * 0.5, 256, 1);

            }

            c.restore();


            //phonedir 
            //var phoneDir = new THREE.Vector3(0, 0, 1).applyQuaternion(OrientationController.getInstance().getFrameInfo());
            
            var phoneDir = InputController.getInstance().getDirectionSmooth();
            phoneDir.x = phoneDir.x * -0.5 + 0.5;
            phoneDir.y = phoneDir.y * -0.5 + 0.5;
            c.save();
            c.fillStyle = 'yellow';
            c.fillRect(phoneDir.x*256 - 10, 256 - phoneDir.y*256 - 0.5, 20, 1);
            c.fillRect(phoneDir.x*256 - 0.5, 256 - phoneDir.y*256 - 10, 1, 20);
            c.restore();



            phoneDir = InputController.getInstance().getPositionDirectional().clone();
            phoneDir.x = phoneDir.x * -0.5 + 0.5;
            phoneDir.y = phoneDir.y * -0.5 + 0.5;
            c.save();
            c.fillStyle = 'red';
            c.fillRect(phoneDir.x*256 - 10, 256 - phoneDir.y*256 - 0.5, 20, 1);
            c.fillRect(phoneDir.x*256 - 0.5, 256 - phoneDir.y*256 - 10, 1, 20);
            c.restore();


            //update the 3d texture
            canvas.texture.needsUpdate = true;
        },

        updateCanvasWithEstimate: function (name, mainVideo, estimatedX, estimatedY) {

            var canvas = this.allCanvas[name];

            if (!canvas) {
                console.error("Debug Error - Candidates Canvas " + name + " doesn't exist");
                return;
            }

            var c = canvas.c;

            //video background
            if (mainVideo) c.drawImage(mainVideo, 0, 0, 256, 256);

            c.save();
            c.fillStyle = 'yellow';
            c.fillRect(estimatedX - 3, 256 - estimatedY - 0.5, 6, 1);
            c.fillRect(estimatedX - 0.5, 256 - estimatedY - 3, 1, 6);
            c.restore();


            //update the 3d texture
            canvas.texture.needsUpdate = true;
        },

        updatePhoneSmooth: function (name, position, rotation, foundHole, useEstimate) {

            var fbo = this.allFbos[name];

            if (!fbo) {
                console.error("Debug Error - Fbo Canvas " + name + " doesn't exist");
                return;
            }

            if (useEstimate) fbo.phone.mat.color = new THREE.Color(0xff0000); else fbo.phone.mat.color = new THREE.Color(0x0000ff);
            if (foundHole) fbo.phone.mat.color = new THREE.Color(0x00ffff);

            fbo.phone.useQuaternion = false;

            fbo.phone.rotation.x = rotation.x;
            fbo.phone.rotation.y = rotation.y;
            fbo.phone.rotation.z = rotation.z;
            fbo.phone.useQuaternion = true;
            fbo.phone.quaternion.copy(OrientationController.getInstance().getFrameInfo()); //-OrientationController.getInstance().worldQuaternion.x, -OrientationController.getInstance().worldQuaternion.y, OrientationController.getInstance().worldQuaternion.z, OrientationController.getInstance().worldQuaternion.w);

            fbo.phone.position.x = -position.x * (480/640);
            fbo.phone.position.y = position.y;
            fbo.phone.position.z = position.z;

            fbo.render();
        }

    }
});

