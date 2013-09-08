varying mediump vec2 vUv;

uniform sampler2D tLines;

uniform mediump vec2 center;
uniform mediump vec2 randomUV;
uniform mediump float blurAmount;

#define NUM_SAMPLES 5
#define NUM_SAMPLES_UV 0.2
#define NUM_SAMPLES_DIVIDE 0.5

void main() {	
	
	mediump float lines = 0.0; //texture2D(tLines,vUv).r;
	
	mediump vec2 dir = normalize(center-vUv);
	mediump float distToCenter = distance(vUv,center) * 0.5;
	mediump vec2 uvAdd = dir * distToCenter * NUM_SAMPLES_UV;
	mediump vec2 cuv = vUv;

	for (int i = 0; i < NUM_SAMPLES; i++) {
		lines += texture2D(tLines,cuv).r;
		cuv += uvAdd;
	}

	//lines *= NUM_SAMPLES_DIVIDE;

	lines *= 0.2-distToCenter;

	gl_FragColor = vec4(vec3(lines),1.0);
}