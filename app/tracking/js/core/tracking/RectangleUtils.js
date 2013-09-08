//
//
//  A simple utility module for dealing with rectangles and polygons
//
//
(function(global) {
	global.RectangleUtils = {

		//
		//
		// Check if a point is inside a rect (for simple hole detection)
		//
		//
		getRect: function(pointList,TRACKING_SIZE,setProperties) {
			//
			//
			// find center and four sides of the hole
			//
			//
			var centerX = 0.0,
				centerY = 0.0,
				top = TRACKING_SIZE,
				bottom = 0,
				left = TRACKING_SIZE,
				right = 0,
				h = pointList,
				nump = pointList.length;

			//loop through the polygon to get bounding box info
			for (var j = 0; j<nump; j++) {
				centerX += h[j].x;
				centerY += h[j].y;
				top = Math.min(h[j].y,top);
				bottom = Math.max(h[j].y,bottom);
				left = Math.min(h[j].x,left);
				right = Math.max(h[j].x,right);
			}
			centerX = Math.floor(centerX/nump);
			centerY = Math.floor(centerY/nump);

			//return found properties
			if (setProperties) {
				h.centerX = centerX;
				h.centerY = centerY;
				h.top = top;
				h.bottom = bottom;
				h.left = left;
				h.right = right;
			}
			return {centerX:centerX,centerY:centerY,top:top,left:left,bottom:bottom,right:right}
		},


		//
		//
		// Check if a point is inside a rect (for simple hole detection)
		//
		//
		pointIsInsideRect: function(px,py,left,right,top,bottom) {
			return (
				px > left &&
				px < right &&
				py > top &&
				py < bottom
			)
		},


		//-------------------
		//
		// UTILITY function to re-shape the candidates to a square for posit
		// The video texture is scaled to a power of two square ratio for faster webgl pre-processing
		// But this results in a deformed ratio (instead of 4/3 were at 1/1)
		//
		//-------------------
		updateToSquare: function(candidates) {

			var centerX=0,centerY=0,a;
			//find center
			for (var i=0; i<4; ++i) {
				centerX +=  candidates[i].x;
				centerY +=  candidates[i].y;
			}
			centerX*=0.25;
			centerY*=0.25;

			//scaleX distance to center to account for tex
			for (var i=0; i<4; ++i) {
				a =  candidates[i].x - centerX;
				candidates[i].x = centerX + a * 1.25;
			}
		},

		//-------------------
		//
		// UTILITY function to calculate the area of the 4 candidates
		// find the area of a trapesoid (a+b) * h * 0.5
		//
		//-------------------
		calculateArea: function(candidates) {
			var distA,a,b,totalArea,height,baseA,baseB,centerAX,centerAY,centerBX,centerBY;

			//base A
			a = candidates[1].x - candidates[2].x;
			b = candidates[1].y - candidates[2].y;
			centerAX = candidates[2].x + a/2;
			centerAY = candidates[2].y + b/2;
			baseA = Math.sqrt(a*a + b*b);

			//base B
			a = candidates[0].x - candidates[3].x;
			b = candidates[0].y - candidates[3].y;
			centerBX = candidates[3].x + a/2;
			centerBY = candidates[3].y + b/2;
			baseB = Math.sqrt(a*a + b*b);

			//height
			a = centerAX-centerBX;
			b = centerAY-centerBY;
			height = Math.sqrt(a*a + b*b);

			//equation
			return ((baseA+baseB)*0.5*height);
		},



		//
		// Sort Candidates by their area
		//
		sortCandidatesByArea: function(a,b) {
			
		},

		//
		// ~~@TODO: Fix the sorting algorithm, and take into account the orientation of the phone
		//
		// Sort the four candidates by -X-Y value, in clockwise order
		// 1 - 2
		// 0 - 3
		//
		sortCandidates: function(candidates) {
			var sortedCandidatesX = [],sortedCandidatesY = [],
				newOrder = [],cidA,cidB,leftA,leftB;

			for (var i=0; i<4; i++) {
				candidates[i].sortId = i;
				sortedCandidatesX[i] = candidates[i];
				sortedCandidatesY[i] = candidates[i];
			}
			newOrder = candidates;

			sortedCandidatesX.sort(function(a,b) {
				if (a.x===b.x) return 0;
				return (a.x>b.x)?1:-1;
			});
			sortedCandidatesY.sort(function(a,b) {
				if (a.y===b.y) return 0;
				return (a.y>b.y)?1:-1;
			});

			//sort the sorted candidates according to their left/top position in the array
			//for (var i=0; i<4; i++) {
			for (var j=0; j<4; j++) {if (sortedCandidatesX[j].sortId===sortedCandidatesY[0].sortId) cidA = j;}
			for (var j=0; j<4; j++) {if (sortedCandidatesX[j].sortId===sortedCandidatesY[1].sortId) cidB = j;}
			newOrder[1] = sortedCandidatesY[ (cidA<=cidB)?0:1];
			newOrder[2] = sortedCandidatesY[ (cidA<=cidB)?1:0];

			for (var j=0; j<4; j++) {if (sortedCandidatesX[j].sortId===sortedCandidatesY[2].sortId) cidA = j;}
			for (var j=0; j<4; j++) {if (sortedCandidatesX[j].sortId===sortedCandidatesY[3].sortId) cidB = j;}
			newOrder[0] = sortedCandidatesY[ (cidA<=cidB)?2:3];
			newOrder[3] = sortedCandidatesY[ (cidA<=cidB)?3:2];

			return newOrder;
		},



		distanceBetweenCandidates: function(ca,cb) {
			var a,b,dist,averageDist = 0.0;

			//distance to four corners
			for (var i=0; i<4; i++) {
				a = ca[i].x - cb[i].x;
				b = ca[i].y - cb[i].y;
				dist = Math.sqrt(a*a + b*b);
				averageDist += dist;
			}

			//distance to center, weighted at 2:1
			a = ca.centerX - cb.centerX;
			b = ca.centerY - cb.centerY;
			dist = Math.sqrt(a*a + b*b);
			averageDist += dist*10.0;

			//distance to area, weighted as sqrt(areaA-areaB)
			a = Math.sqrt(global.RectangleUtils.calculateArea(ca));
			b = Math.sqrt(global.RectangleUtils.calculateArea(cb));
			dist = Math.abs(a-b);
			averageDist += dist*1.0;

			return averageDist/15.0;
		}
	};
})(this);