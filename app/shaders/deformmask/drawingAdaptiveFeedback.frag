varying mediump vec2 vUv;
uniform sampler2D tVideo;
uniform sampler2D tAccum;

uniform mediump float drawingSize;
uniform mediump float drawingOpacity;

uniform mediump vec2 center;
uniform mediump vec2 randomUV;
uniform lowp float noiseAlpha;
uniform lowp float luminanceSnapping;
uniform mediump float accumSpeed;



const lowp vec2 ratio = vec2(1.0, 0.525);

mediump float rand( mediump vec2 co ){
    return fract( sin( dot( co.xy ,vec2( 12.9898,78.233 ) ) ) * 43758.5453 );
}
const mediump vec3 rgb2luma = vec3(0.299,0.587,0.114);

const mediump float PI = 3.14159265;


void main() {

	mediump vec2 centervec = ( (vUv-0.5)*ratio+0.5-center);
	mediump float dist = max( (drawingSize - length(centervec)) / drawingSize, 0.0);
	mediump float angle = atan(vUv.y-center.y,vUv.x-center.x);
	mediump float rayBeam = angle; //floor(mod(angle/PI + randomUV.x,1.0) * 100.0) / 100.0;
	mediump float noise = abs(rand(vec2(rayBeam,randomUV.y)));
	//noise += (1.0-noise) * (1.0-dist);


	mediump vec2 currentUV = vUv;
	mediump vec2 stepuv = (normalize(vUv-center) * length(vUv-center) * 0.333) * noise;

	mediump vec3 result = texture2D(tVideo,vUv).rgb;
		stepuv *= length(result) * 3.0;

	for (int i=0; i < 3; i++) {
		result += texture2D(tAccum,currentUV).rgb;
		currentUV -= stepuv;
	}
	result *= accumSpeed * 0.333; // * (noise * noiseAlpha + (1.0-noiseAlpha));

	gl_FragColor = vec4(result,length(result-texture2D(tVideo,vUv).rgb)*dist*drawingOpacity);



}