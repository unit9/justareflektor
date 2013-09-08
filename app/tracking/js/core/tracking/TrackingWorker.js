/**

 Javascript standalone worker that performs CV operations

 Takes an ArrayBuffer pre-processed input
 Outputs the most valid white candidate for said input

*/
this.TrackingWorker = new (function(global) {

	//worker constants
	var self = this,
		IS_WEB_WORKER = !global.window,
		DEBUG_MODE = !IS_WEB_WORKER,
		MODEL_SIZE = 50.8,
		MAX_AVERAGE_DISTANCE_FOR_MATCHING = 40.0,
		MIN_LIFE = 3,
		GOOD_CANDIDATE_PERSISTENCE = 6,
		EPSILON = 0.1,
		MAX_ESTIMATED_CENTER_DIST = 45,
		MAX_ESTIMATED_LIFE = 45,
		TRACKING_SIZE = 256;

	//import dependencies
	if (!global.window && global.importScripts) {
		global.importScripts('/tracking/js/lib/svd.js');
		global.importScripts('/tracking/js/lib/cv.js');
		global.importScripts('/tracking/js/lib/posit1.js');
		global.importScripts('/tracking/js/lib/aruco.js');
		global.importScripts('/tracking/js/lib/jsfeat.min.js');
		global.importScripts('RectangleUtils.js');
		console = {log:function(){}};
		DEBUG_MODE = false;
	}


	//
	// Worker Variables
	//
	var aruco = new AR.Detector();
		posit = new POS.Posit(MODEL_SIZE, TRACKING_SIZE),
		finalCandidate = [{x:0.25,y:0.75},{x:0.25,y:0.25},{x:0.75,y:0.25},{x:0.75,y:0.75}],

		//keep track of good candidates
		lastGoodCandidate = null,
		lastGoodCandidateLife = 0,
		numFramesSinceLastGoodCandidate = 0,

		estimatedX = 0,
		estimatedY = 0,
		estimatedLife = 0;


	//
	//
	// Append extra functions to the CV.js library
	//
	//
	CV.dstArray = new Uint8Array(66564); //66305);
	CV.ChannelOffset = 0;
	CV.binaryBorder = function(imageSrc, dst){
		var src = imageSrc.data, height = TRACKING_SIZE, width = TRACKING_SIZE,posSrc = 0, posDst = 0, i, j;
		posDst = width+2;

		posSrc+= CV.ChannelOffset;

		i = height;
		while(i -- > 0){
			dst[posDst ++] = 0;
			j = width;
			while(j --){
				posSrc+=4;
				dst[posDst++] = src[posSrc];
			}
			posDst ++;
		}
		return dst;
	};


	//
	// Update the findCandidates option to add contour info
	//
	AR.Detector.prototype.findCandidates = function(contours, minSize, epsilon, minLength){
  		var candidates = [], len = contours.length, contour, poly, i;

	  this.polys = [];
	  
	  for (i = 0; i < len; ++ i){
	    contour = contours[i];

	    if (contour.length >= minSize){
	      poly = CV.approxPolyDP(contour, contour.length * epsilon);
	      poly.contour = contour;

	      this.polys.push(poly);

	      if ( (4 === poly.length) && ( CV.isContourConvex(poly) ) ){

	        if ( CV.minEdgeLength(poly) >= minLength){
	          candidates.push(poly);
	        }
	      }
	    }
	  }

	  return candidates;
	};

	//add a webgl function upon the tracking library
	AR.Detector.prototype.detectFromWebglBuffer = function(buffer,channelOffset,TRACKING_SIZE,epsilon,requireHoles){
		var TM4 = TRACKING_SIZE-3;;

		//full threshold image
		this.thres.data = buffer;
		this.thres.width = TRACKING_SIZE;
		this.thres.height = TRACKING_SIZE;

		//find contours
		CV.ChannelOffset = channelOffset;
		//this.binary = CV.dstArray;
		this.contours = CV.findContours(this.thres, this.binary);
		this.holes = [];


		
		//remove contours that touch edge and remove holes
		for (var i=0; i<this.contours.length; i++) {
			c = this.contours[i];
			c.hasHole = false;
			cn = c.length;
			if (cn<4 || cn>=1000) {
				this.contours.splice(i,1);
				i--;
			} else {
				var sidev = 0;
				for (var j=0; j<cn; j++) {
					if (c[j].x<3 || c[j].x>TM4 || c[j].j<3 || c[j].y>TM4) {
						sidev++;
						if (sidev>35) {
							j=cn;
							this.contours.splice(i,1);
							i--;
						}
					}
				}
			}
			
		}
		

		//find square candidates
		this.candidates = this.findCandidates(this.contours, 15, epsilon, 8, 2.0); //minSize, epsilon, minLength,minRatio
		return this.candidates;
	}



	//
	//
	// Peform blob detection on the received buffer
	//
	//
	this.performTracking = function(buff) {
		var candidates  = aruco.detectFromWebglBuffer(buff,0 /*channel offset*/,TRACKING_SIZE,EPSILON,true),
			goodCandidates = [],
			pose,
			foundHole = false,
			estimatedPose,
			valid = false;

		
		//
		// Find the bounding box of all contours
		//
		for (var i=0; i<aruco.contours.length; i++) {
			global.RectangleUtils.getRect(aruco.contours[i],TRACKING_SIZE,true);
		}


		//
		//cross-check if it fits any candidate
		//
		for (var i=0; i<candidates.length; i++) {
			candidates[i] = global.RectangleUtils.sortCandidates(candidates[i]);
			var c = candidates[i];
			global.RectangleUtils.getRect(c,TRACKING_SIZE,true);

			//
			// Cross Check all holes
			//
			for (var j=0; j<aruco.contours.length; j++) {
				var h = aruco.contours[j];
				if (
					h !== c.contour &&

					//confirm valid perimeter ratio
					h.length < c.contour.length &&
					(h.length > 50 || h.length / c.contour.length > 0.15) && 

					//each bounding box contains the other's center
					global.RectangleUtils.pointIsInsideRect(h.centerX,h.centerY,c.left,c.right,c.top,c.bottom) && 
					global.RectangleUtils.pointIsInsideRect(c.centerX,c.centerY,h.left,h.right,h.top,h.bottom)
					/*(
					) || (
						h.top > c.top &&
						h.bottom < c.bottom && 
						h.left > c.left &&
						h.right < c.right
					)*/
			
				) c.hasHole = true;
			}


			if (c.hasHole) {
				goodCandidates.push(c);
				foundHole = true;
			}
		}


		//
		//
		// If there are no good (hole-containing) candidates match them to similar good blobs from last frames
		// Blobs must be valid for at least 2-3 frames before being considered as valid phone markers
		//
		//
		if (lastGoodCandidate && candidates.length>0 && goodCandidates.length==0) {

			var nearestCandidate = null;
			var nearestDistance = 0.0;
			for (var i=0; i<candidates.length; i++) {
				var distance = global.RectangleUtils.distanceBetweenCandidates(candidates[i],lastGoodCandidate);
				if (!nearestCandidate || distance<nearestDistance) {
					nearestCandidate = candidates[i];
					nearestDistance = distance;
				}
			}

			//get distance
			var area = global.RectangleUtils.calculateArea(lastGoodCandidate);
			var maxDistance = MAX_AVERAGE_DISTANCE_FOR_MATCHING * Math.min(Math.max(Math.sqrt(area)/20,1.0),6.0);
			if (nearestDistance < maxDistance) {
				console.log('Matched: ',nearestDistance+' / '+maxDistance);
				nearestCandidate.wasMatched = true;
				goodCandidates.push(nearestCandidate);
			} else {
				console.log('Not Matched. Nearest Dist:'+nearestDistance+' / '+maxDistance);
			}
		}



		//
		//
		// If there are neither good hole-containing candidates or near square-ish candidates
		// Try to estimate the position based on the nearest blob
		//
		//
		if (lastGoodCandidate && goodCandidates.length==0) {
			estimatedLife++;

			//pick a center to match
			var cx,cy;
			if (estimatedLife>1) {
				cx = estimatedX;
				cy = estimatedY;
			} else {
				cx = lastGoodCandidate.centerX;
				cy = lastGoodCandidate.centerY;
			}

			//look for similar center
			var nearestBlob = null;
			var nearestBlobDistance = MAX_ESTIMATED_CENTER_DIST;
			for (var i=0; i<aruco.contours.length; i++) {
				var a = cx - aruco.contours[i].centerX;
				var b = cy - aruco.contours[i].centerY;
				
				var dist = Math.sqrt(a*a+b*b)
				if (dist<nearestBlobDistance) {
					nearestBlobDistance = dist;
					nearestBlob = aruco.contours[i];
				}
				aruco.contours[i].edist = dist;
			}

			//pick the nearest blob
			if (nearestBlob) {
				estimatedLife++;
				estimatedX = nearestBlob.centerX;
				estimatedY = nearestBlob.centerY;
			}
		} else {
			estimatedLife = 0;
		}



		//
		//
		// If there are more than one valid candidate....
		// Shouldn't be happenning but pick the nearest
		//
		//
		if (goodCandidates.length>1 && lastGoodCandidate) {
			var nearestDistance = 0.0, nearestCandidate;
			for (var i=0; i<goodCandidates.length; i++) {
				var distance = global.RectangleUtils.distanceBetweenCandidates(goodCandidates[i],lastGoodCandidate);
				if (!nearestCandidate || distance<nearestDistance) {
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
		if (goodCandidates.length>0) {
			var candidate = global.RectangleUtils.sortCandidates(goodCandidates[0]);

			//update the final candidate
			var avgDist = 0.0;
			for (var i=0; i<4; i++) {
				finalCandidate[i].x = (candidate[i].x-TRACKING_SIZE/2)*640/480;
				finalCandidate[i].y = candidate[i].y-TRACKING_SIZE/2;
			}

			//unstretch
			//global.RectangleUtils.updateToSquare(finalCandidate);

			//posit analysis
			try { pose = posit.pose(finalCandidate); } catch (er) {}
			if (pose) {
				//pose.bestTranslation[0] *= 480/640;

				valid = true;
				numFramesSinceLastGoodCandidate = 0;
				lastGoodCandidateLife = Math.max(lastGoodCandidateLife+1,0);
				goodCandidates[0].life = lastGoodCandidateLife;
				lastGoodCandidate = candidate;
			}

		//
		//
		// Try a posit based on the estimated position
		//
		//
		} else if (lastGoodCandidate && estimatedLife>0) {
			var tx,ty;
			for (var i=0; i<4; i++) {
				tx = lastGoodCandidate[i].x - lastGoodCandidate.centerX;
				ty = lastGoodCandidate[i].y - lastGoodCandidate.centerY;
				finalCandidate[i].x = (estimatedX + tx-TRACKING_SIZE/2)*640/480;
				finalCandidate[i].y = (estimatedY + ty)-TRACKING_SIZE/2;
			}
			try { estimatedPose = posit.pose(finalCandidate); } catch (er) {}
			if (estimatedPose) {
				estimatedPose.bestTranslation[0] *= 480/640;
			}

		}


		//
		// get motion mid
		//
		var motionMidX = 0,
			motionMidY = 0,
			motionNum = 0;

		//if (lastGoodCandidate) {
			for (var y=0; y<262144; y+=1024) {
				for (var x=1; x<1025; x+=4) {
					if (buff[y+x]) {
						motionNum++;
						motionMidX+=x;
						motionMidY+=y;}
				}
			}
			if (motionNum>0) {
				motionMidX = motionMidX/motionNum;
				motionMidY = motionMidY/motionNum;
			}
		//}
		

		
		//increment life of not-found candidates
		if (!valid) {
			if (numFramesSinceLastGoodCandidate>=GOOD_CANDIDATE_PERSISTENCE && (estimatedLife<=0 || estimatedLife>MAX_ESTIMATED_LIFE)) lastGoodCandidate = null;
			numFramesSinceLastGoodCandidate++;
			lastGoodCandidateLife = 0;
		}

		valid = (valid && lastGoodCandidateLife>=MIN_LIFE);
		if (estimatedLife>MAX_ESTIMATED_LIFE || valid) estimatedLife = 0;



		var motionContours;
		/*CV.ChannelOffset = 1; 
		var motionContours = CV.findContours(aruco.thres, aruco.binary);
		for (var i=0; i<motionContours.length ;i++) {
			if (motionContours[i].length<10 || motionContours[i].length>=1000 ) {motionContours.splice(i,1); i--;}
		}
		CV.ChannelOffset = 0;*/

		//
		// Return the tracked data
		//
		if (DEBUG_MODE) {
			return {
				"candidates":candidates,
				"contours":aruco.contours,
				"life":lastGoodCandidateLife,
				"lastLife":numFramesSinceLastGoodCandidate,
				"valid":valid,
				"pose":pose,

				"foundHole":foundHole,
				"useEstimate":(estimatedLife>0),
				"estimatedX":estimatedX,
				"estimatedY":estimatedY,
				"estimatedPose":estimatedPose,
				'motionX':motionMidX,
				'motionY':motionMidY,
				"motionContours":motionContours
			}
		}
		return {
			"life":lastGoodCandidateLife,
			"lastLife":numFramesSinceLastGoodCandidate,
			"valid":valid,
			"pose":pose,

			"foundHole":foundHole,
			"useEstimate":(estimatedLife>0),
			"estimatedX":estimatedX,
			"estimatedY":estimatedY,
			"estimatedPose":estimatedPose,
			'motionX':motionMidX,
			'motionY':motionMidY
		}
	}





	//
	//
	// Add event listeners and callback interfaces
	//
	//
	if (IS_WEB_WORKER) {
		global.addEventListener('message', function(e) {
		  var result = self.performTracking(e.data);
		  global.postMessage(result);
		}, false);
	} else {
		//fake event listener for new data
		this.listeners = {};
		this.addEventListener = function(type,callback,bubbles) {
		  self.listeners[type] = self.listeners[type] || [];
		  self.listeners[type].push(callback);
		};
		this.postMessage = function(data,buff) {
			var result = self.performTracking(data);
			if (self.listeners['message']) {
				for (var i=0; i<self.listeners['message'].length; i++) {
					self.listeners['message'][i]({data:result});
				}
			}
		}
	}
})(this);