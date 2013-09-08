/**
 *
 * @author Édouard Lanctôt-Benoit
 * Brute force merge two timeline objects
 *
*/
(function(global) {

	
	var TimelineMerge = function(source,diff) {

		for (var timelineId=0; timelineId<diff.length; timelineId++) {

			var diffSequence = diff[timelineId];
			var sourceSequence;
			for (var i=0; i<source.length; i++) {
				if (source[i].id===diffSequence.id) {
					sourceSequence = source[i];
				}
			}

			//modify existing sequence
			if (sourceSequence) {

				//merge settings
				for (var option in diffSequence.settings) {
					sourceSequence.settings[option] = diffSequence.settings[option];
				}

				//merge transitions
				if (diffSequence.transitions) {
					for (var i=0; i<diffSequence.transitions.length; i++) {
						var transitionDiff = diffSequence.transitions[i];
						var transitionSource = undefined;
						var transitionSourceId = -1;
						for (var j=0; j<sourceSequence.transitions.length; j++) {
							if (sourceSequence.transitions[j].name===transitionDiff.name) {
								transitionSource = sourceSequence.transitions[j];
								transitionSourceId = j;
							}
						}

						if (transitionSource!==undefined) { //replace transition
							sourceSequence.transitions[transitionSourceId] = transitionDiff;
						} else {
							sourceSequence.transitions.push(transitionDiff); //add new transition
						}
					}
				}

				//merge settings range
				for (var option in diffSequence.settingsRange) {
					sourceSequence.settingsRange[option] = diffSequence.settingsRange[option];
				}

				//merge other properties
				for (var prop in diffSequence) {
					if (typeof diffSequence[prop] === "string" || typeof diffSequence[prop] === "number") {
						sourceSequence[prop] = diffSequence[prop];
					}
				}

			} else { //add new sequence
				source.push(diffSequence)
			}
		}
	}

	if (typeof exports !== 'undefined') {
		exports.TimelineMerge = TimelineMerge;
	}
	global.TimelineMerge = TimelineMerge;

})(this);