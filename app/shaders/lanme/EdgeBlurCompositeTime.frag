varying lowp vec2 vUv;


uniform sampler2D timeGradient;
uniform sampler2D tAccum;
uniform sampler2D tFrame;
uniform sampler2D tFrameNext;
uniform lowp float frameMin;
uniform lowp float frameMax;
uniform lowp float frameDiff;

void main() {

	float frameTime = texture2D(timeGradient,vUv).r;
	
	mediump vec4 accumColor = texture2D(tAccum,vUv);

	if (frameTime>frameMin && frameTime<=frameMax) {
		vec4 color = mix(texture2D(tFrame,vUv),texture2D(tFrameNext,vUv),(frameTime-frameMin)/frameDiff);
		gl_FragColor = mix(color,accumColor,1.0-frameTime);
	} else {
		gl_FragColor = accumColor;
	}

	/*mediump vec4 accumColor = texture2D(tAccum,vUv);
	if (frameTime<frameMin || frameTime>frameMax) {
		gl_FragColor = accumColor;
	} else {
		vec4 color = mix(texture2D(tFrame,vUv),texture2D(tFrameNext,vUv),(frameTime-frameMin)/frameDiff);
		gl_FragColor = mix(color,accumColor,1.0-frameTime);
		//gl_FragColor = vec4((frameTime-frameMin)/frameDiff);
	}*/
}
