varying mediump vec2 vUv;

#define NUM_SAMPLES 10

uniform sampler2D tVideo;
uniform sampler2D tDrawing;
uniform sampler2D tAccum;

uniform mediump vec2 offset;
uniform mediump vec2 center;
uniform mediump vec2 randomUV;

uniform lowp float alpha;
uniform lowp float raysExp;
uniform lowp float noiseOffset;
uniform lowp float raysAccumulation;


const mediump vec2 ratio = vec2(1.0,0.525);
mediump float rand( mediump vec2 co ){
    return fract( sin( dot( co.xy ,vec2( 12.9898,78.233 ) ) ) * 43758.5453 );
}

void main() {

	mediump vec3 videoCol = texture2D(tVideo,vUv).rgb;
	mediump vec3 drawingCol = texture2D(tDrawing,vUv).rgb;
	mediump vec3 accumCol = texture2D(tAccum,vUv).rgb;
	mediump vec3 result;

 
	mediump vec2 ratioUV = (vec2(vUv.x,vUv.y)-0.5)*ratio + 0.5; //~~move to vertex shader
	mediump vec2 currentUV = vUv;
	mediump vec2 uvStep = distance(ratioUV, center) * normalize(center-ratioUV) * 0.1 * (1.0-drawingCol.r) * (1.0 + rand(vUv+randomUV)*noiseOffset - noiseOffset*0.5);

	for (int i=0; i < NUM_SAMPLES; i++) {
		//result += texture2D(tVideo,currentUV).rgb:
		result += texture2D(tVideo,currentUV).rgb;
		currentUV += uvStep;
	}
	result *= 0.05*alpha;

	result += accumCol * raysAccumulation;

	gl_FragColor = vec4(result,1.0);
}