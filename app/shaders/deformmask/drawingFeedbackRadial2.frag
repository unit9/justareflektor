varying mediump vec2 vUv;
varying mediump vec2 ratioUV;
varying mediump float randomp;

uniform sampler2D tVideo;
uniform sampler2D tDrawing;
uniform sampler2D tAccum;

//drawing
uniform mediump vec2 center;
uniform mediump float accumSpeed;
uniform mediump float drawingSize;
uniform mediump float drawingOpacity;
uniform mediump float drawingDiffExp;
uniform mediump float centerFadeSize;


//random noise ray
uniform float rayRadius;
uniform lowp float noiseAlpha;
uniform mediump vec2 randomUV;

const lowp vec2 ratio = vec2(1.0, 0.525);
const mediump vec3 rgb2luma = vec3(0.299,0.587,0.114);
const mediump float PI = 3.14159265;
mediump float rand( mediump vec2 co ){
    return fract( sin( dot( co.xy ,vec2( 12.9898,78.233 ) ) ) * 43758.5453 );
}


#define NUM_SAMPLES 3
#define NUM_SAMPLESF 3.0
#define NUM_SAMPLES_INV 0.3333
#define MIN_COLOR_RESOLUTION 0.0039063


void main() {

	//buffers
	mediump vec4 drawing = texture2D(tDrawing, vUv);
	mediump vec3 videoCol = texture2D(tVideo,vUv).rgb;

	//drawing parameters
	mediump float dist = length(ratioUV-center);
	mediump float luma = drawingSize * dist * dist * pow(length(videoCol*drawing.r),drawingDiffExp);

	//get deform direction
	mediump vec2 dir = drawing.gb*2.0-1.0;
	mediump float angle = (dir.x-dir.y);//floor(mod(atan(dir.y,dir.x)/PI + randomUV.x,1.0) * rayRadius) / rayRadius;
	mediump float noise = abs(rand(vec2(angle,randomUV.y)));; //texture2D(tNoise,vec2(angle,randomUV.y)).r * noiseAlpha;

	//
	// assign a direction / dist to each pixel based on current distance / direction
	// move each frame with distance
	//
	float speed = accumSpeed + length(videoCol)*0.1;
	mediump vec2 stepuv = dir * luma * (noise*noiseAlpha + (1.0-noiseAlpha));
	mediump vec3 result = 
		videoCol * drawingOpacity * drawing.r +
		texture2D(tAccum,vUv-stepuv*0.333).rgb * texture2D(tDrawing, vUv-stepuv*0.333).r * speed + 
		texture2D(tAccum,vUv-stepuv*0.666).rgb * texture2D(tDrawing, vUv-stepuv*0.666).r * speed + 
		texture2D(tAccum,vUv-stepuv*0.999).rgb * texture2D(tDrawing, vUv-stepuv*0.999).r * speed;
	result -= MIN_COLOR_RESOLUTION*3.0; //should be in multiplication, must retry
	result *= 0.3333 + luma;

	// mediump vec3 result = videoCol * drawingOpacity * drawing.r;
	// result += texture2D(tAccum,vUv-stepuv*0.333).rgb* texture2D(tDrawing, vUv-stepuv*0.333).r*accumSpeed-MIN_COLOR_RESOLUTION;
	// result += texture2D(tAccum,vUv-stepuv*0.666).rgb* texture2D(tDrawing, vUv-stepuv*0.6666).r*accumSpeed-MIN_COLOR_RESOLUTION;
	// result += texture2D(tAccum,vUv-stepuv*0.999).rgb* texture2D(tDrawing, vUv-stepuv*0.9999).r*accumSpeed-MIN_COLOR_RESOLUTION;
	// //result += texture2D(tAccum,vUv-stepuv).rgb* texture2D(tDrawing, vUv-stepuv).r-MIN_COLOR_RESOLUTION;

	gl_FragColor = vec4(result,1.0);

}