varying mediump vec2 vUv;
varying mediump float randomp;

uniform sampler2D tVideo;
uniform sampler2D tAccum;
uniform sampler2D tPalette;
uniform sampler2D tMask;

uniform mediump vec2 center;
uniform mediump vec2 lightPosition;
uniform mediump vec2 offset;
uniform mediump vec2 randomuv;

uniform lowp float effectAlpha;
uniform lowp float raysAlpha;
uniform lowp float raysRadius;
uniform lowp float finalAlpha;

uniform lowp float pass;
uniform lowp float FINAL_PASS;

uniform mediump float maskOffset;

const mediump float PI = 3.14159265;
const mediump float TWOPI = 2.0*3.14159265;
const mediump float HALF_PI = 0.5*3.14159265;

float rand( vec2 co ){
    return fract( sin( dot( co.xy ,vec2( 12.9898,78.233 ) ) ) * 43758.5453 );
}

void main() {

	//
	// Buffers
	//
	vec3 videoCol = texture2D(tVideo,vUv).rgb;
	vec3 accumCol = texture2D(tAccum,vUv).rgb;

	//
	// Direction from UV to light
	//
	mediump vec2 dirToLight = normalize(vUv-lightPosition);
	mediump float distToLight = distance(vUv,lightPosition);

	mediump float angleToMirror = atan(dirToLight.y,dirToLight.x);
	mediump float rayBeam = mod(angleToMirror/PI + randomp,1.0)*raysRadius;
	mediump vec3 rayPalette = texture2D(tPalette,vec2(rayBeam,0)).rgb;
	mediump vec3 colorRay = mix(rayPalette,vec3(1.0),raysAlpha);

	//
	// Grab some mirror pixel and blur them
	//
	mediump vec2 cuvAdd = dirToLight * distToLight * pass * -0.2;
	mediump vec3 accumBlur =
		texture2D(tAccum,vUv + cuvAdd * 0.0).rgb + 
		texture2D(tAccum,vUv + cuvAdd * 1.0).rgb + 
		texture2D(tAccum,vUv + cuvAdd * 2.0).rgb +
		texture2D(tAccum,vUv + cuvAdd * 3.0).rgb + 
		texture2D(tAccum,vUv + cuvAdd * 4.0).rgb;


	//composite
	accumBlur *= 0.5*effectAlpha*(pass);
	vec3 result = vec3(accumBlur*colorRay)+accumCol; //result.a);

	//mediump vec3 result = (accumBlur * 0.5 * effectAlpha * pass * colorRay); // * 2.0;
	if (pass <= FINAL_PASS) {
		result = videoCol + result * finalAlpha;
	}
	gl_FragColor = vec4(result,1.0);

}