varying mediump vec2 vUv;
varying mediump vec2 ratioUV;

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
	
	//get raw angle and distance
	mediump vec4 accum = texture2D(tAccum,vUv);
	mediump vec4 drawing = texture2D(tDrawing, vUv);
	mediump vec2 dir = drawing.gb*2.0-1.0;
	mediump float dist = length(ratioUV-center);

	mediump float angle = atan(dir.y,dir.x);//floor(mod(atan(dir.y,dir.x)/PI + randomUV.x,1.0) * rayRadius) / rayRadius;
	mediump float noise = abs(rand(vec2(angle,randomUV.y)));


	mediump vec3 videoCol = texture2D(tVideo,vUv).rgb;
	mediump float luma = pow(length(videoCol*drawing.r),drawingDiffExp);

	mediump vec3 result = videoCol * drawingOpacity * drawing.r;

	//result += 

	vec2 stepuv = dir * dist * luma * drawingSize * (noise*noiseAlpha + (1.0-noiseAlpha)); 

	result += texture2D(tAccum,vUv-stepuv*0.333).rgb* texture2D(tDrawing, vUv-stepuv*0.333).r*accumSpeed-MIN_COLOR_RESOLUTION;
	result += texture2D(tAccum,vUv-stepuv*0.666).rgb* texture2D(tDrawing, vUv-stepuv*0.6666).r*accumSpeed-MIN_COLOR_RESOLUTION;
	result += texture2D(tAccum,vUv-stepuv*0.999).rgb* texture2D(tDrawing, vUv-stepuv*0.9999).r*accumSpeed-MIN_COLOR_RESOLUTION;
	//result += texture2D(tAccum,vUv-stepuv).rgb* texture2D(tDrawing, vUv-stepuv).r-MIN_COLOR_RESOLUTION;

	result *= 0.3333;

	//
	// assign a direction / dist to each pixel based on current distance / direction
	// move each frame with distance
	//
	gl_FragColor = vec4(result,min((dist*dist)/centerFadeSize,1.0));
	//gl_FragColor =  vec4(accum.r * accumSpeed - MIN_COLOR_RESOLUTION + luma * drawingOpacity);


}