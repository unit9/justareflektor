
varying mediump vec2 vUv;

uniform sampler2D tFlare;
uniform sampler2D tAccum;

uniform mediump float pass;
uniform mediump vec2 center;
uniform mediump vec2 offset;

const mediump vec2 ratio = vec2(1.0,0.525);


void main() {

	mediump vec2 ratioUV = (vUv-0.5)*ratio + 0.5;
	float angle = atan(center.y-ratioUV.y,center.x-ratioUV.x);
	mediump vec2 dir = vec2(cos(angle),sin(angle)) * offset;

	mediump float accum = texture2D(tFlare,vUv).r 
		+ texture2D(tFlare,vUv + dir).r * 1.0
		+ texture2D(tFlare,vUv + dir * 2.0).r * 1.0
		+ texture2D(tFlare,vUv + dir * 3.0).r * 0.9
		+ texture2D(tFlare,vUv + dir * 4.0).r * 0.8
		+ texture2D(tFlare,vUv + dir * 5.0).r * 0.7
		+ texture2D(tFlare,vUv + dir * 6.0).r * 0.6
		+ texture2D(tFlare,vUv + dir * 7.0).r * 0.5;
		//+ texture2D(tFlare,vUv + dir * 8.0).r * 1.0;
	gl_FragColor = vec4(accum);

}


/*

varying mediump vec2 vUv;

uniform sampler2D tVideo;
uniform sampler2D tFlare;
uniform sampler2D tAccum;

uniform mediump float pass;
uniform mediump vec2 center;
uniform mediump vec2 offset;


void main() {

	mediump vec2 dir = normalize(vUv-center) * offset;

	mediump vec3 accum = texture2D(tAccum,vUv + dir).rgb * pass;
	gl_FragColor = vec4(accum);

}

*/