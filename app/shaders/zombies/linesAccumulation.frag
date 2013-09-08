varying mediump vec2 vUv;

uniform sampler2D tLines;
uniform sampler2D tAccum;

uniform mediump vec2 center;
uniform mediump vec2 offset;
uniform mediump float accumDistance;
uniform mediump float accumSpeed;

const mediump float onev = (1.01/256.0);

void main() {

	mediump float dist = max(accumDistance-distance(vUv,center),0.0);

	mediump float accum = texture2D(tAccum,vUv).r;
		// texture2D(tAccum,vUv).r * 0.4 +
		// (texture2D(tAccum,vUv+vec2(1.0,0.0)*offset).r +
		// texture2D(tAccum,vUv+vec2(0.0,1.0)*offset).r +
		// texture2D(tAccum,vUv+vec2(-1.0,0.0)*offset).r +
		// texture2D(tAccum,vUv+vec2(0.0,-1.0)*offset).r) * 0.15;

	if (dist > 0.0) {
		accum += texture2D(tLines,vUv).r * dist + dist * 50.0;
	}

	gl_FragColor = vec4( vec3(accum*accumSpeed - onev),1.0);
}