var DebugView = View._extend({

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
        scaleX: (16 / 9) / (256 / 256),
        planesAdded: false,

        construct: function (id, containerSelector) {

            View.call(this, id, containerSelector);
            TrackingController.getInstance().events.bind(TrackingController.INIT_DEBUG, this.setup.bind(this));

        },

        setup: function () {

            if (this.initialized) return;

            var self = this;
            self.renderer = TrackingController.getInstance().renderer;

            //  self.renderer.setClearColorHex(0x000000, 1);
            self.renderer.setSize(240 * 5, 320);
            self.renderer.autoClear = false;

            $(".HelpView .debug").append(self.renderer.domElement);

            /*
             TrackingController.getInstance().events.bind(TrackingController.DEBUG_UPDATE, function (event, data) {

             self.onTrackingUpdate(data.data);

             });

             TrackingController.getInstance().events.bind(TrackingController.RENDER_DEBUG, function (event, data) {

             self.render();

             });
             */

            this.scene = new THREE.Scene();
            this.camera = new THREE.OrthographicCamera(0, 240 * 6, 0, 320, -1000, 1000);
            this.camera.position.set(0, 0, 1);
            this.camera.lookAt(new THREE.Vector3());

            this.initDebug();
            this.initialized = true;

        },

        show: function () {


            this.isShown = true;
            TrackingController.getInstance().canClear = false;
            TrackingController.getInstance().showDebugContours(true);

        },

        hide: function () {

            this.isShown = false;
            TrackingController.getInstance().canClear = false;
            TrackingController.getInstance().showDebugContours(false);

        },

        initTexturePlanes: function (videoTexture, renderPasses) {
            if (this.planesAdded) return;
            this.planesAdded = true;
            //this.addTexture(videoTexture,0,0);

            this.addTexture(videoTexture, 0, 0);
            this.addCanvasTexture('contours', 1, 0);
            this.addRenderTexture('pose', 2, 0);

            /*this.addTexture(renderPasses['simpleExposure'].texture,1,0);
             this.addTexture(renderPasses['edges'].texture,2,0);
             this.addTexture(renderPasses['hueLuma'].texture,3,0);
             this.addTexture(renderPasses['edges2'].texture,4,0);

             this.addRenderTexture('pose',0,1);
             this.addCanvasTexture('contours',1,1);
             this.addTexture(renderPasses['frameDiff'].texture,2,1);*/

        },

        updateData: function (data, mainVideo, position, rotation, normalizedPosition) {
            if (!this.isShown) return;
            if (data.contours) this.updateCanvasWithBlobs('contours', mainVideo, data.contours);
            if (data.candidates) this.updateCanvasWithCandidates('contours', Boolean(data.contours) ? null : mainVideo, data.candidates);
            this.updatePhoneSmooth('pose', position, rotation, data.foundHole, data.useEstimate);
            //this.updatePhoneSmoothEst('pose',normalizedPosition.clone().multiply(new THREE.Vector3(-256,-256,1000)),rotation,data.foundHole,data.useEstimate);

            if (data.useEstimate) this.updateCanvasWithEstimate('contours', null, data.estimatedX, data.estimatedY);
            if (data.motionX && data.motionY) this.updateCanvasWithMotion('contours', null, data.motionX, data.motionY);
        },

        render: function () {
            if (!this.isShown) return;
            for (var fbo in this.allFbos) {
                this.allFbos[fbo].render();
            }
            this.renderer.render(this.scene, this.camera);
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

        /* render: function () {

         this.renderer.render(this.scene, this.camera);

         },*/

        onFrame: function () {

            //this.render();

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
                new THREE.PlaneGeometry(DebugView.WIDTH, DebugView.HEIGHT, 1, 1),
                new THREE.MeshBasicMaterial({color: 0xffffff, map: tex, side: THREE.DoubleSide, transparent: true})
            );
            p.scale.set(-this.planeScale * this.scaleX, -this.planeScale, this.planeScale);
            p.position.x = (this.border + DebugView.WIDTH * this.planeScale * this.scaleX) * (posx + 0.5); //position plane
            p.position.y = this.border * 2 + (this.border + DebugView.HEIGHT * this.planeScale) * (posy + 0.5); //position plane

            this.scene.add(p);
            this.allPlanes.push(p);
            this.allTextures.push(tex);
        },

        addCanvasTexture: function (name, posx, posy) {

            var canvas = document.createElement('canvas');
            canvas.c = canvas.getContext('2d');
            canvas.width = DebugView.WIDTH;
            canvas.height = DebugView.HEIGHT;
            canvas.c.fillStyle = 'black';
            canvas.c.fillRect(0, 0, DebugView.WIDTH, DebugView.HEIGHT);
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
                new THREE.PlaneGeometry(DebugView.WIDTH, DebugView.HEIGHT, 1, 1),
                new THREE.MeshBasicMaterial({color: 0xffffff, map: tex, side: THREE.DoubleSide, transparent: false})
            );

            p.scale.set(-this.planeScale * this.scaleX, -this.planeScale, this.planeScale);
            p.position.x = (this.border + DebugView.WIDTH * this.planeScale * this.scaleX) * (posx + 0.5); //position plane
            p.position.y = this.border * 2 + (this.border + DebugView.HEIGHT * this.planeScale) * (posy + 0.5); //position plane

            this.scene.add(p);
            this.allPlanes.push(p);
            this.allTextures.push(tex);
            this.allCanvas[name] = canvas;
        },

        addRenderTexture: function (name, posx, posy) {


            var fbo = new FramebufferWrapper(DebugView.WIDTH, DebugView.HEIGHT, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBFormat,
                type: THREE.UnsignedByteType,
                camera: new THREE.PerspectiveCamera(45, 1 / 1, 0.05, 1000),
                depthBuffer: false,
                stencilBuffer: false,
                premultiplyAlpha: false,
                generateMipmaps: false,
                backgroundColor: 0x777777,
                backgroundAlpha: 1,
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
                new THREE.PlaneGeometry(DebugView.WIDTH, DebugView.HEIGHT, 1, 1),
                new THREE.MeshBasicMaterial({color: 0xffffff, map: fbo.texture, side: THREE.DoubleSide, transparent: false})
            );
            p.scale.set(-this.planeScale * this.scaleX, -this.planeScale, this.planeScale);
            p.position.x = (this.border + DebugView.WIDTH * this.planeScale * this.scaleX) * (posx + 0.5); //position plane
            p.position.y = this.border * 2 + (this.border + DebugView.HEIGHT * this.planeScale) * (posy + 0.5); //position plane

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
            meshScreen.position.z = -5 * modelScale;

            var axis = new THREE.AxisHelper(50 * modelScale);
            axis.rotation.x = Math.PI;

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
            if (mainVideo) c.drawImage(mainVideo, 0, 0, DebugView.WIDTH, DebugView.HEIGHT);

            c.globalAlpha = 0.75;
            c.fillStyle = 'black';
            c.fillRect(0, 0, DebugView.WIDTH, DebugView.HEIGHT);
            c.fillStyle = 'white';
            c.globalAlpha = 1.0;

            //draw blobs
            for (var i = 0; i < contours.length; i++) {
                if (contours[i].length > 8) {
                    c.save();
                    c.globalAlpha = 0.8;
                    c.strokeStyle = '#00ff00';
                    if (contours[i].hole) c.strokeStyle = '#ff0000';
                    c.beginPath();
                    c.moveTo(contours[i][0].x, DebugView.HEIGHT - contours[i][0].y);
                    for (var j = 1; j < contours[i].length; j++) {
                        nc = contours[i][j];
                        c.lineTo(nc.x, DebugView.HEIGHT - nc.y);
                    }
                    c.closePath();
                    c.stroke();

                    if (contours[i].edist) {
                        c.font = "8pt Arial";
                        c.fillStyle = 'white';
                        //c.fillText(parseInt(contours[i].edist),contours[i].centerX,DebugView.HEIGHT-contours[i].centerY);
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
            if (mainVideo) c.drawImage(mainVideo, 0, 0, DebugView.WIDTH, DebugView.HEIGHT);

            c.save();

            for (var i = 0; i < candidates.length; i++) {
                if (candidates[i].hasHole) c.fillStyle = 'green'; else c.fillStyle = 'blue';
                if (candidates[i].wasMatched) c.fillStyle = 'red';
                for (var j = 0; j < candidates[i].length; j++) {
                    c.fillRect(candidates[i][j].x, DebugView.HEIGHT - candidates[i][j].y, 4, 4);
                }

//                if (candidates[i].life) {
//                    c.font = "14pt Arial";
//                    c.fillStyle = 'white';
//                    c.fillText(candidates[i].life, 10, 15);
//                }
            }

            if (TrackingController.getInstance().foundHole) {

                c.fillStyle = '#00ffff';
                c.fillRect((TrackingController.getInstance().normalizedPosition.x - 0.5) * DebugView.WIDTH * 0.31 + DebugView.WIDTH * 0.66, 0, 1, DebugView.HEIGHT);
                c.fillRect(0, DebugView.HEIGHT - TrackingController.getInstance().normalizedPosition.y * DebugView.HEIGHT * 0.42 - DebugView.HEIGHT * 0.5, DebugView.WIDTH, 1);

            }

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
            if (mainVideo) c.drawImage(mainVideo, 0, 0, DebugView.WIDTH, DebugView.HEIGHT);

            c.save();
            c.fillStyle = 'yellow';
            c.fillRect(estimatedX - 3, DebugView.HEIGHT - estimatedY - 0.5, 6, 1);
            c.fillRect(estimatedX - 0.5, DebugView.HEIGHT - estimatedY - 3, 1, 6);
            c.restore();


            //update the 3d texture
            canvas.texture.needsUpdate = true;
        },

        updateCanvasWithMotion: function (name, mainVideo, estimatedX, estimatedY) {

            var canvas = this.allCanvas[name];

            if (!canvas) {
                console.error("Debug Error - Candidates Canvas " + name + " doesn't exist");
                return;
            }

            var c = canvas.c;

            //video background
            if (mainVideo) c.drawImage(mainVideo, 0, 0, DebugView.WIDTH, DebugView.HEIGHT);

            if (!c.motionX || isNaN(c.motionX)) c.motionX = 128;
            if (!c.motionY || isNaN(c.motionY)) c.motionY = 128;
            c.motionX = c.motionX * 0.6 + estimatedX * 0.4;
            c.motionY = c.motionY * 0.6 + estimatedY * 0.4;

            c.save();
            c.fillStyle = '#00ffff';
            c.fillRect(c.motionX - 3, DebugView.HEIGHT - c.motionY - 0.5, 6, 1);
            c.fillRect(c.motionX - 0.5, DebugView.HEIGHT - c.motionY - 3, 1, 6);
            c.restore();

            //update the 3d texture
            canvas.texture.needsUpdate = true;
        },

        renderPhone: function (name) {

            var fbo = this.allFbos[name];

            if (!fbo) {
                console.error("Debug Error - Fbo Canvas " + name + " doesn't exist");
                return;
            }

            fbo.render();

        },

        updatePhoneTranslationRotation: function (name, translation, rotation) {
            /*
             var fbo = this.allFbos[name];

             if (!fbo) {console.error("Debug Error - Fbo Canvas "+name+" doesn't exist"); return;}

             fbo.phone.useQuaternion = false;

             fbo.phone.rotation.x = -Math.asin(-rotation[1][2]);
             fbo.phone.rotation.y = -Math.atan2(rotation[0][2], rotation[2][2]);
             fbo.phone.rotation.z = -Math.atan2(rotation[1][0], rotation[1][1]) - Math.PI/2;

             fbo.phone.position.x = -translation[0];// + 0.5;
             fbo.phone.position.y = translation[1];// - 0.5;
             fbo.phone.position.z = translation[2];

             fbo.phoneEst.position.copy(fbo.phone.position);

             fbo.scene.remove(fbo.phoneEst);
             */

        },

        updatePhoneTranslationRotationEstimate: function (name, translation, rotation) {

            /*
             var fbo = this.allFbos[name];

             if (!fbo) {console.error("Debug Error - Fbo Canvas "+name+" doesn't exist"); return;}

             fbo.scene.add(fbo.phoneEst);
             fbo.phoneEst.useQuaternion = false;

             fbo.phoneEst.rotation.x = -Math.asin(-rotation[1][2]);
             fbo.phoneEst.rotation.y = -Math.atan2(rotation[0][2], rotation[2][2]);
             fbo.phoneEst.rotation.z = -Math.atan2(rotation[1][0], rotation[1][1]) - Math.PI/2;

             fbo.phoneEst.position.x = fbo.phoneEst.position.x*0.55 + -translation[0]*0.45;// + 0.5;
             fbo.phoneEst.position.y = fbo.phoneEst.position.y*0.55 + translation[1]*0.45;// - 0.5;
             fbo.phoneEst.position.z = fbo.phoneEst.position.z*0.7 + translation[2]*0.3;

             */

        },

        updatePhoneSmooth: function (name, position, rotation, foundHole, useEstimate) {

            var fbo = this.allFbos[name],
                gyroQuaternion = new THREE.Quaternion(-OrientationController.getInstance().worldQuaternion.x, OrientationController.getInstance().worldQuaternion.y, -OrientationController.getInstance().worldQuaternion.z, OrientationController.getInstance().worldQuaternion.w),
                smoothQuaternionRaw = InputController.getInstance().getQuaternionSmooth(),
                smoothQuaternion = new THREE.Quaternion(-smoothQuaternionRaw.x, smoothQuaternionRaw.y, -smoothQuaternionRaw.z, smoothQuaternionRaw.w);
               


                //offsetQuaternion = new THREE.Quaternion(0, 0, 0, 1),
                //phoneQuaternion = offsetQuaternion.multiply(gyroQuaternion);

            if (!fbo) {
                console.error("Debug Error - Fbo Canvas " + name + " doesn't exist");
                return;
            }

            if (useEstimate) fbo.phone.mat.color = new THREE.Color(0xff0000); else fbo.phone.mat.color = new THREE.Color(0x0000ff);
            if (foundHole) fbo.phone.mat.color = new THREE.Color(0x00ffff);

            fbo.phone.useQuaternion = true;
            //fbo.phone.quaternion = gyroQuaternion;
            fbo.phone.quaternion.copy(smoothQuaternion);

            fbo.phone.position.x = -position.x  * (1.0 / CameraController.getInstance().getRatio());
            fbo.phone.position.y = position.y;
            fbo.phone.position.z = position.z;

            fbo.render();
        }

    }
});

