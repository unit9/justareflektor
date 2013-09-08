varying mediump vec2 vUv;
uniform sampler2D tCurrent;
uniform sampler2D tLast;
uniform sampler2D tAccum;
uniform lowp float minDiff;
uniform mediump float accumDelta;

void main() {

	lowp float accum = texture2D(tAccum,vUv).g;
	lowp float diff = abs(
		texture2D(tLast,vUv).r-
		texture2D(tCurrent,vUv).r);
	lowp float threshDiff = ((diff+accum) > minDiff) ? 1.0 : 0.0;
	if (accum > 1.0-accumDelta*2.0) threshDiff  = 0.0;
	gl_FragColor = vec4(threshDiff, max(min(diff+accum,1.0)*0.99 - accumDelta,0.0),0.0,1.0);

}