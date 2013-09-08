/*

@author Édouard Lanctôt
@version 0.1

A simple smoothing library to get global, easy to use smoothing.
Keeps track of last values and last update time to be framerate independent. (expects a 60fps update for now..)
Watch out: value names are global. If you're afraid of namespace collision, spawn a local version like this:
var smoother = new window.Smoothing();

*/
(function(global) {

	function Smoothing() {
		
		var tmp,currentTime,diff,ntDiff,lastDiff,deltaTime,deltaTimePc,
			FRAMERATE = (1000/60),
			MAX_PREDICTIONS = 0.5, //total time in seconds
			smoothValues = {};

		//add a value object for smoothing
		this.addValue = function(valueName,value) {
			smoothValues[valueName] = {
				lastTime:Date.now(),
				v:value,
				lastV:value
				lastDelta:1.0,
				numPredict:0
			};
			return smoothValues[valueName];
		}


		//smooth a value linearly
		this.smoothValueLinear = function(valueName,value,smoothingRatio) {
			smoothingRatio = smoothingRatio===undefined ? 0.5 : smoothingRatio;

			//get the smooth value
			tmp = smoothValues[valueName];
			if (!tmp) tmp = this.addValue(valueName,value);
			tmp.lastV = tmp.v;
			tmp.numPredict = 0;

			//Get time and delta time
			currentTime = Date.now();
			deltaTime =  Math.min((currentTime-tmp.lastTime) / FRAMERATE,1/smoothingRatio);
			tmp.lastTime = currentTime;
			tmp.lastDelta = deltaTime;

			//smooth the value
			diff = value-tmp.v;
			tmp.v += diff * smoothingRatio * deltaTime;

			return tmp.v;
		}


		//smooth a value quadratically
		this.smoothValueQuadratic = function(valueName,value,smoothingRatio,maxDifference) {
			smoothingRatio = smoothingRatio === undefined ? 0.5 : smoothingRatio;
			maxDifference = maxDifference === undefined ? 1.0 : maxDifference;


			//get the smooth value
			tmp = smoothValues[valueName];
			if (!tmp) tmp = this.addValue(valueName,value);
			tmp.lastV = tmp.v;
			tmp.numPredict = 0;

			//Get time and delta time
			currentTime = Date.now();
			deltaTime =  Math.min((currentTime-tmp.lastTime) / FRAMERATE,1/smoothingRatio);
			tmp.lastTime = currentTime;
			tmp.lastDelta = deltaTime;

			//smooth the value
			diff = value-tmp.v;
			if (Math.abs(diff)>maxDifference) diff = maxDifference * (diff>=0.0)?1.0:-1.0;
			ntDiff = (1.0 - diff/maxDifference) * smoothingRatio * deltaTime;

			tmp.v += diff/2*ntDiff*ntDiff;
			return tmp.v;
		}

		//smooth and predict the next position of the value based on the last few
		this.predictLinear = function(valueName,smoothingRatio,maxDifference) {
			//~~@TODO
			smoothingRatio = smoothingRatio === undefined ? 0.5 : smoothingRatio;
			maxDifference = maxDifference === undefined ? 1.0 : maxDifference;

			//get the smooth value
			tmp = smoothValues[valueName];
			if (!tmp) tmp = this.addValue(valueName,value);

			//Get time and delta time
			currentTime = Date.now();
			deltaTime =  Math.min((currentTime-tmp.lastTime) / FRAMERATE,1/smoothingRatio);
			tmp.numPredict += (currentTime-tmp.lastTime)/1000;
			tmp.lastTime = currentTime;

			//smooth the value linearly
			//stop predicting values after MAX_PREDICTIONS seconds of no new values
			//And quadratically slow down the prediction as time passes
			lastDiff = (tmp.v-tmp.lastV) / tmp.lastDelta;
			if (tmp.numPredict>=MAX_PREDICTIONS && !isNaN(lastDiff) && tmp.lastDelta>0) {
				tmp.lastV = tmp.v;
				deltaTime *= (MAX_PREDICTIONS-tmp.numPredict) * (MAX_PREDICTIONS-tmp.numPredict);
				tmp.v += lastDiff * deltaTime;
				tmp.lastDelta = deltaTime;
			}
			return tmp.v;
		}
	}
	global.Smoother = new Smoothing();
	global.Smoothing = Smoothing;
})(this)