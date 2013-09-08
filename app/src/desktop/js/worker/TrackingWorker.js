/**

 Javascript standalone worker that performs CV operations

 Takes an ArrayBuffer pre-processed input
 Outputs the most valid white candidate for said input

 */
this.TrackingWorker = new (function (global) {

    //worker constants
    var self = this,
        IS_WEB_WORKER = !global.window,
        DEBUG_MODE = true,
        MODEL_SIZE = 50.8,
        MAX_AVERAGE_DISTANCE_FOR_MATCHING = 35.0,
        Y_MATCH_DISTANCE_RATIO = 1.0,
        MIN_LIFE = 3,
        GOOD_CANDIDATE_PERSISTENCE = 6,
        EPSILON = 0.04,
        MAX_ESTIMATED_CENTER_DIST = 35,
        MAX_ESTIMATED_LIFE = 24,
        MAX_NO_HOLE_LIFE = 100,
        TRACKING_SIZE = 256,
        RETURN_CONTOURS = false,
        WEBCAM_RATIO = 640/480,
        WEBCAM_RATIO_INV = 480/640,
        //WEBCAM_RATIO = 1280/720,
        //WEBCAM_RATIO_INV = 720/1280,

        SIDE_TOUCH_RANGE = 4,

        HUE_RANDOM_SAMPLING = 15,

        BACKGROUND_CANDIDATES_MIN_LIFE = 12,
        BACKGROUND_CANDIDATES_PERMANENT_LIFE_BEFORE_PHONE = 80,
        BACKGROUND_CANDIDATES_MAX_DISTANCE_PIXELS = 6;


    //import dependencies
    if (!global.window && global.importScripts) {
        global.importScripts('../../js/worker/lib/svd.js');
        global.importScripts('../../js/worker/lib/cv.js');
        global.importScripts('../../js/worker/lib/posit1.js');
        global.importScripts('../../js/worker/lib/aruco.js');
        global.importScripts('../../js/worker/lib/jsfeat.min.js');
        global.importScripts('RectangleUtils.js');
        console = {log: function () {
        }};
        DEBUG_MODE = false;
    }


    //
    // Worker Variables
    //
    var aruco = new AR.Detector();
    posit = new POS.Posit(MODEL_SIZE, TRACKING_SIZE),
        finalCandidate = [
            {x: 0.25, y: 0.75},
            {x: 0.25, y: 0.25},
            {x: 0.75, y: 0.25},
            {x: 0.75, y: 0.75}
        ],

        //keep track of good candidates
        lastGoodCandidate = null,
        lastGoodCandidateWasTouchingSide = false,
        lastGoodCandidateLife = 0,
        numFramesSinceLastGoodCandidate = 0,

        phoneConnectionStarted = true,
        estimatedX = 0,
        estimatedY = 0,
        averageMotionX = 0,
        averageMotionY = 0,
        estimatedLife = 0,
        noHoleLife = 0,
        colorBlob = 0,
        colorHalo = 0,
        holeRatio = 0,
        backgroundCandidates = [];

    //
    //
    // Append extra functions to the CV.js library
    //
    //
    CV.dstArray = new Uint8Array(66564); //66305);
    CV.ChannelOffset = 0;
    CV.binaryBorder = function (imageSrc, dst) {
        var src = imageSrc.data, height = TRACKING_SIZE, width = TRACKING_SIZE, posSrc = 0, posDst = 0, i, j;
        //posDst = width + 2;

        posSrc += CV.ChannelOffset;


        for (j = 0; j < width+2; ++ j){
            dst[posDst ++] = 0;
          }
        

       i = height-1;
        while (i--) {
            dst[posDst++] = 0;
            j = width;
            while (j--) {
                posSrc += 4;
                dst[posDst++] = src[posSrc];
            }
            posDst++;
        }

        while (posDst< 66564) {
            dst[posDst ++] = 0;
        }


        for (j = 0; j < width; ++ j){
            dst[ (j*256 + 257)*4] = 0;
        }


        return dst;

    };


    //
    // Update the findCandidates option to add contour info
    //
    AR.Detector.prototype.findCandidates = function (contours, minSize, epsilon, minLength) {
        var candidates = [], len = contours.length, contour, poly, i;

        this.polys = [];

        for (i = 0; i < len; ++i) {
            contour = contours[i];

            if (contour.length >= minSize) {
                poly = CV.approxPolyDP(contour, contour.length * epsilon);
                poly.contour = contour;
                contour.poly = poly;

                this.polys.push(poly);

                if ((4 === poly.length) && ( CV.isContourConvex(poly) )) {

                    if (CV.minEdgeLength(poly) >= minLength) {
                        candidates.push(poly);
                    }
                }
            }
        }

        return candidates;
    };

    //add a webgl function upon the tracking library
    AR.Detector.prototype.detectFromWebglBuffer = function (buffer, channelOffset, TRACKING_SIZE, epsilon, requireHoles) {
        var TM4 = TRACKING_SIZE - 3;

        //full threshold image
        this.thres.data = buffer;
        this.thres.width = TRACKING_SIZE;
        this.thres.height = TRACKING_SIZE;

        //find contours
        CV.ChannelOffset = channelOffset;
        //this.binary = CV.dstArray;
        this.contours = CV.findContours(this.thres, this.binary);
        this.holes = [];



        //find square candidates
        this.candidates = this.findCandidates(this.contours, 15, epsilon, 8, 2.0); //minSize, epsilon, minLength,minRatio
        return this.candidates;
    }


    //
    //
    // Peform blob detection on the received buffer
    //
    //
    this.performTracking = function (buff) {
        var candidates = aruco.detectFromWebglBuffer(buff, 0 /*channel offset*/, TRACKING_SIZE, EPSILON, true),
            goodCandidates = [],
            pose,
            foundHole = false,
            estimatedPose,
            valid = false,
            touchingSide = lastGoodCandidateWasTouchingSide,
            distance, c, h, cx, cy, tx, ty; //temp vars


        //sort corners
        for (var i = 0; i < candidates.length; i++) {
            candidates[i] = global.RectangleUtils.sortCandidates(candidates[i]);
        }


        //
        // Remove background candidates
        //
        for (var i=0; i<backgroundCandidates.length; i++) {

            var foundBackground = false;
            c = backgroundCandidates[i];

            //check if background candidate is near a candidate of this frame
            for (var j=0; j<aruco.contours.length; j++) {
                h = aruco.contours[j].poly;
                if (h) {
                    global.RectangleUtils.sortPolygon(h);

                    if (h.length == c.corners.length) {
                        distance = global.RectangleUtils.distanceBetweenPolygons(c.corners, h);
                        if (distance <= BACKGROUND_CANDIDATES_MAX_DISTANCE_PIXELS) {
                            h.contour.isBackground = true;
                            h.isBackground = true;
                            h.permanentBackground = c.permanent;
                            foundBackground = true;
                            c.corners = h;
                            j=aruco.contours.length;
                        }
                    }
                }

            }

            //add life
            if (foundBackground) {
                c.life = Math.max(c.life+1,0);
                c.maxLife = Math.max(c.maxLife,c.life);
                if (!phoneConnectionStarted && c.life >= BACKGROUND_CANDIDATES_PERMANENT_LIFE_BEFORE_PHONE) {
                    c.permanent = true;
                }

            } else {
            //remove life and kill
                c.life = Math.min(c.life-1,0);
                if (!c.permanent && c.life < -c.maxLife) {
                    backgroundCandidates.splice(i,1);
                    i--;
                }
            }
        }

        //
        // Find the bounding box of all contours
        //
        for (var i = 0; i < aruco.contours.length; i++) {
            global.RectangleUtils.getRect(aruco.contours[i], TRACKING_SIZE, true);
        }


        //
        //cross-check if it fits any candidate
        //
        for (var i = 0; i < candidates.length; i++) {
            c = candidates[i];
            if (!c.permanentBackground) {
                global.RectangleUtils.getRect(c, TRACKING_SIZE, true);

                //
                // Cross Check all holes
                //
                for (var j = 0; j < aruco.contours.length; j++) {
                    h = aruco.contours[j];
                    if (
                        h !== c.contour &&

                            //confirm valid perimeter ratio
                            h.length < c.contour.length &&
                            (h.length > 50 || h.length / c.contour.length > 0.15) &&

                            //each bounding box contains the other's center
                            global.RectangleUtils.pointIsInsideRect(h.centerX, h.centerY, c.left, c.right, c.top, c.bottom) &&
                            global.RectangleUtils.pointIsInsideRect(c.centerX, c.centerY, h.left, h.right, h.top, h.bottom)

                        ) { c.hasHole = true; c.hole = h; }
                }


                if (c.hasHole) {
                    goodCandidates.push(c);
                    foundHole = true;
                }
            }
        }


        //
        //
        // If there are no good (hole-containing) candidates match them to similar good blobs from last frames
        // Blobs must be valid for at least 2-3 frames before being considered as valid phone markers
        //
        //
        if (lastGoodCandidate && candidates.length > 0 && goodCandidates.length == 0) {

            var nearestCandidate = null;
            var nearestDistance = 0.0;
            for (var i = 0; i < candidates.length; i++) {
                if (!candidates[i].isBackground) {
                    distance = global.RectangleUtils.distanceBetweenCandidates(candidates[i], lastGoodCandidate, Y_MATCH_DISTANCE_RATIO);
                    if (!nearestCandidate || distance < nearestDistance) {
                        nearestCandidate = candidates[i];
                        nearestDistance = distance;
                    }
                }
            }

            //get distance
            var area = global.RectangleUtils.calculateArea(lastGoodCandidate);
            var maxDistance = MAX_AVERAGE_DISTANCE_FOR_MATCHING * Math.min(Math.max(Math.sqrt(area) / 20, 1.0), 6.0);
            if (nearestCandidate && nearestDistance < maxDistance) {
                console.log('Matched: ', nearestDistance + ' / ' + maxDistance);
                nearestCandidate.wasMatched = true;
                goodCandidates.push(nearestCandidate);
                noHoleLife++;
            } else {
                console.log('Not Matched. Nearest Dist:' + nearestDistance + ' / ' + maxDistance);
            }
        }
        if (goodCandidates.length > 0) {
            noHoleLife = 0;
        }


        //
        //
        // If there are neither good hole-containing candidates or near square-ish candidates
        // Try to estimate the position based on the nearest blob
        //
        //
        if (lastGoodCandidate && goodCandidates.length == 0 && !lastGoodCandidateWasTouchingSide) {
            estimatedLife++;

            //pick a center to match
            if (estimatedLife > 1) {
                cx = estimatedX;
                cy = estimatedY;
            } else {
                cx = lastGoodCandidate.centerX;
                cy = lastGoodCandidate.centerY;
            }

            //look for similar center
            var nearestBlob = null;
            var nearestBlobDistance = MAX_ESTIMATED_CENTER_DIST;
            for (var i = 0; i < aruco.contours.length; i++) {
                if (!aruco.contours[i].isBackground) {
                    if (aruco.contours[i].length > 15) {
                        var a = cx - aruco.contours[i].centerX;
                        var b = cy - aruco.contours[i].centerY;

                        var dist = Math.sqrt(a * a + b * b)
                        if (dist < nearestBlobDistance) {
                            nearestBlobDistance = dist;
                            nearestBlob = aruco.contours[i];
                        }
                        aruco.contours[i].edist = dist;
                    }
                }
            }

            //pick the nearest blob
            if (nearestBlob) {
                estimatedLife++;
                estimatedX = nearestBlob.centerX;
                estimatedY = nearestBlob.centerY;
            }


            //
            // Estimate motion based on the current direction / magnitude
            //
            var averageX = 0.0;
            var averageY = 0.0;
            var motionMidX = 0;
            var motionMidY = 0;
            var averageMag = 0.0;
            var numMotion = 1;
            var t  = 0;

            var rectTop = 0; //Math.max( Math.round(cy - 100) ,0);
            var rectBottom = 256; //Math.min(Math.round(cy + 100) ,256);
            var rectLeft = 0; //Math.max(Math.round(cx - 100) ,0);
            var rectRight = 256; //Math.min(Math.round(cx + 100) ,256);

            for (var y = rectTop; y < rectBottom; y++) {
                for (var x = rectLeft; x < rectRight; x++) {
                    t = (y * 256 + x) * 4;
                    if (buff[t+2] > 0 || buff[t+3] > 0) {
                        averageX += buff[t+2] / 256 * 2.0 -1.0;
                        averageY += buff[t+3] / 256 * 2.0 -1.0;
                        motionMidX += x;
                        motionMidY += y;
                        numMotion++;
                    }
                }
            }
            averageX  = averageX / numMotion;
            averageY  = averageY / numMotion;
            motionMidX = motionMidX / numMotion;
            motionMidY = motionMidY / numMotion;
            averageMotionX = averageX * 0.5 + averageMotionX * 0.5;
            averageMotionY = averageY * 0.5 + averageMotionY * 0.5;
            averageMag = Math.min(Math.max( (numMotion /  1500) , 0.0), 1.0); //averageMag / numMotion;
            
            var midpc = Math.min(numMotion / 100,1.0);
            motionMidX = motionMidX * midpc + cx * (1.0 - midpc);
            motionMidY = motionMidY * midpc + cy * (1.0 - midpc);

            //mix estimated motion with last frame position, center of motion and shader-based directional analysis of motion
            estimatedX = cx * 0.4 + estimatedX * 0.3 + motionMidX * 0.3 + averageMotionX * 30 * averageMag;
            estimatedY = cy * 0.4 + estimatedY * 0.3 + motionMidY * 0.3 - averageMotionY * 50 * averageMag;
            if (averageMag>0.05) estimatedLife++;

            noHoleLife++;

        } else {
            averageMotionX = 0;
            averageMotionY = 0;
            estimatedLife = 0;
        }

        //
        //
        // If there are more than one valid candidate....
        // Shouldn't be happenning but pick the nearest
        //
        //
        if (goodCandidates.length > 1 && lastGoodCandidate) {
            var nearestDistance = 0.0, nearestCandidate;
            for (var i = 0; i < goodCandidates.length; i++) {
                distance = global.RectangleUtils.distanceBetweenCandidates(goodCandidates[i], lastGoodCandidate, Y_MATCH_DISTANCE_RATIO);
                if (!nearestCandidate || distance < nearestDistance) {
                    nearestCandidate = goodCandidates[i];
                    nearestDistance = distance;
                }
            }
            if (nearestCandidate) {
                goodCandidates = [nearestCandidate];
            }
        }

        //
        // Perform Posit Estimation on the good candidate
        //
        if (goodCandidates.length > 0) {
            var candidate = global.RectangleUtils.sortCandidates(goodCandidates[0]);

            //update the final candidate
            var avgDist = 0.0;
            for (var i = 0; i < 4; i++) {
                finalCandidate[i].x = (candidate[i].x - TRACKING_SIZE / 2) * WEBCAM_RATIO;
                finalCandidate[i].y = candidate[i].y - TRACKING_SIZE / 2;
            }

            //unstretch
            //global.RectangleUtils.updateToSquare(finalCandidate);

            //posit analysis
            try {
                pose = posit.pose(finalCandidate);
            } catch (er) {
            }
            if (pose) {
                //pose.bestTranslation[0] *= 480/640;

                valid = true;
                numFramesSinceLastGoodCandidate = 0;
                lastGoodCandidateLife = Math.max(lastGoodCandidateLife + 1, 0);
                goodCandidates[0].life = lastGoodCandidateLife;
                lastGoodCandidate = candidate;
            }

            //
            //
            // Try a posit based on the estimated position
            //
            //
        } else if (lastGoodCandidate && estimatedLife > 0) {
            
            for (var i = 0; i < 4; i++) {
                tx = lastGoodCandidate[i].x - lastGoodCandidate.centerX;
                ty = lastGoodCandidate[i].y - lastGoodCandidate.centerY;
                finalCandidate[i].x = (estimatedX + tx - TRACKING_SIZE / 2) * WEBCAM_RATIO;
                finalCandidate[i].y = (estimatedY + ty) - TRACKING_SIZE / 2;
            }
            try {
                estimatedPose = posit.pose(finalCandidate);
            } catch (er) {
            }
            if (estimatedPose) {
                estimatedPose.bestTranslation[0] *= WEBCAM_RATIO_INV;
            }

        }


        //increment life of not-found candidates
        if (!valid) {
            if (numFramesSinceLastGoodCandidate >= GOOD_CANDIDATE_PERSISTENCE && (estimatedLife <= 0 || estimatedLife > MAX_ESTIMATED_LIFE || noHoleLife > MAX_NO_HOLE_LIFE)) lastGoodCandidate = null;
            numFramesSinceLastGoodCandidate++;
            lastGoodCandidateLife = 0;
        }

        valid = (valid && lastGoodCandidateLife >= MIN_LIFE);
        if (estimatedLife > MAX_ESTIMATED_LIFE || valid) estimatedLife = 0;


         //get colorfulness of the blob
         if (foundHole && lastGoodCandidateLife>4) {
            var lastColorBlob = colorBlob;
            colorBlob = 0;
            c = lastGoodCandidate.contour;
            cx = lastGoodCandidate.centerX;
            cy = lastGoodCandidate.centerY;
            for (var i = 0; i < HUE_RANDOM_SAMPLING; i++) {
                var randomPoint = c[Math.floor(Math.random()*c.length)];
                tx = Math.round(randomPoint.x + (cx-randomPoint.x) * 0.3);
                ty = Math.round(randomPoint.y + (cy-randomPoint.y) * 0.3);
                if (buff[(ty*TRACKING_SIZE + tx)*4 + 1]) {
                    colorBlob++;
                }
            }
            colorBlob /= HUE_RANDOM_SAMPLING;
            colorBlob = lastColorBlob * 0.5 + colorBlob * 0.5;
        }
        

        //get halo around blob
         if (foundHole && lastGoodCandidateLife>4) {
            var lastColorHalo = colorHalo;
            colorHalo = 0;
            c = lastGoodCandidate.contour;
            cx = lastGoodCandidate.centerX;
            cy = lastGoodCandidate.centerY;
            for (var i = 0; i < HUE_RANDOM_SAMPLING; i++) {
                var randomPoint = c[Math.floor(Math.random()*c.length)];
                var dirx = (cx-randomPoint.x) < 0 ? -1 : 1;
                var diry = (cy-randomPoint.y) < 0 ? -1 : 1;
                tx = Math.round(randomPoint.x - dirx * 7); //- (cx-randomPoint.x) * 0.05
                ty = Math.round(randomPoint.y - diry * 7); //- (cy-randomPoint.y) * 0.05
                var tr = (ty*TRACKING_SIZE + tx)*4 + 1;
                if (tr > 0 && tr < buff.length) {
                    if (buff[tr]) {
                        colorHalo++;
                    }
                } else {
                    i--;
                }
                
            }
            colorHalo /= HUE_RANDOM_SAMPLING;
            colorHalo = lastColorHalo * 0.5 + colorHalo * 0.5;



            //
            // add background candidates to ignore next frame
            //
            if (foundHole && lastGoodCandidateLife > 4) {
                for (var i=0; i<aruco.contours.length; i++) {
                    if (aruco.contours[i].length > 10 && aruco.contours[i].poly && !aruco.contours[i].isBackground && aruco.contours[i] !== lastGoodCandidate.contour) {
                        backgroundCandidates.push({
                            corners:aruco.contours[i].poly,
                            life: 0,
                            maxLife: BACKGROUND_CANDIDATES_MIN_LIFE,
                            permanent: false
                        });
                    }
                }
            }
        }


        //
        // Check if candidate is touching side
        //
        if (lastGoodCandidate && lastGoodCandidate.contour) {
            lastGoodCandidateWasTouchingSide = false;
            c = lastGoodCandidate.contour;
            for (var i=0; i<c.length; i++) {
                h = c[i];
                if (h.x <= SIDE_TOUCH_RANGE || h.x >= TRACKING_SIZE-SIDE_TOUCH_RANGE || h.y <= SIDE_TOUCH_RANGE || h.y >= TRACKING_SIZE-SIDE_TOUCH_RANGE) {
                    lastGoodCandidateWasTouchingSide = true;
                    i = c.length;
                }
            }
        }

        if (foundHole && lastGoodCandidate && lastGoodCandidate.hole && lastGoodCandidate.contour) this.holeRatio = (lastGoodCandidate.hole.length / lastGoodCandidate.contour.length);

        //
        // Return the tracked data
        //
        if (DEBUG_MODE) {
            return {
                "candidates": candidates,
                "contours": aruco.contours,
                "life": lastGoodCandidateLife,
                "lastLife": numFramesSinceLastGoodCandidate,
                "valid": valid,
                "pose": pose,

                "foundHole": foundHole,
                "holeRatio" : (foundHole) ? this.holeRatio : 0.0,
                "useEstimate": (estimatedLife > 0),
                "estimatedX": estimatedX,
                "estimatedY": estimatedY,
                "estimatedPose": estimatedPose,
                "colorBlob": colorBlob,
                "colorHalo": colorHalo,
                "isTouchingSide": lastGoodCandidateWasTouchingSide
                //"binary": aruco.binary
                //'motionX': motionMidX,
                //'motionY': motionMidY,
                //"motionContours": motionContours
            }
        }
        return {
            "life": lastGoodCandidateLife,
            "lastLife": numFramesSinceLastGoodCandidate,
            "valid": valid,
            "pose": pose,
            
            "holeRatio" : (foundHole && lastGoodCandidate && lastGoodCandidate.hole && lastGoodCandidate.contour) ? (lastGoodCandidate.hole.length / lastGoodCandidate.contour.length) : 0.0,

            "foundHole": foundHole,
            "useEstimate": (estimatedLife > 0),
            "estimatedX": estimatedX,
            "estimatedY": estimatedY,
            "estimatedPose": estimatedPose,
            "colorBlob": colorBlob,
            "colorHalo": colorHalo,
            "touchingSide": lastGoodCandidateWasTouchingSide,
            "candidates": (RETURN_CONTOURS) ? candidates: undefined,
            "contours": (RETURN_CONTOURS) ? aruco.contours : undefined
            //'motionX': motionMidX,
            //'motionY': motionMidY
        }
    }


    //
    //
    //
    function handleActionMessages(data) {
        console.log("worker action message",data.action,data);
        switch (data.action) {
            case 'setReturnContours':
                RETURN_CONTOURS = data.returnContours;
                break;

            case 'setWebcamRatio':
                WEBCAM_RATIO = data.width / data.height;
                WEBCAM_RATIO_INV = data.height / data.width;
                console.log('Setting webcam ratio:'+WEBCAM_RATIO);
                break;
        }
    }


    //
    //
    // Add event listeners and callback interfaces
    //
    //
    if (IS_WEB_WORKER) {
        global.addEventListener('message', function (e) {
            if (e.data && e.data.action!==undefined) {
                handleActionMessages(e.data);
                return;
            }
            var result = self.performTracking(e.data);
            global.postMessage(result);
        }, false);
    } else {
        //fake event listener for new data
        this.listeners = {};
        this.addEventListener = function (type, callback, bubbles) {
            self.listeners[type] = self.listeners[type] || [];
            self.listeners[type].push(callback);
        };
        this.postMessage = function (data, buff) {
            if (data && data.action!==undefined) {
                handleActionMessages(data);
                return;
            }

            var result = self.performTracking(data);
            if (self.listeners['message']) {
                for (var i = 0; i < self.listeners['message'].length; i++) {
                    self.listeners['message'][i]({data: result});
                }
            }
        }
    }
})(this);
