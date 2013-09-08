varying mediump vec2 vUv;

uniform sampler2D tAccum;
uniform sampler2D tPalette;

uniform mediump vec2 center;
uniform mediump vec2 lightPosition;
uniform mediump vec2 offset;

uniform lowp float pass;
uniform lowp float effectAlpha;
uniform lowp float raysAlpha;
uniform lowp float raysRadius;

uniform mediump vec2 randomuv;

const mediump float PI = 3.14159265;
const mediump float TWOPI = 2.0*3.14159265;
const mediump float HALF_PI = 0.5*3.14159265;


void main() {

	//
	// Buffers
	//
	vec3 accumCol = texture2D(tAccum,vUv).rgb;

	//
	// Direction from UV to light
	//
	mediump vec2 dirToLight = normalize(vUv-lightPosition);
	mediump float distToLight = distance(vUv,lightPosition);


	mediump float angleToMirror = atan(dirToLight.y,dirToLight.x);
	mediump float rayBeam = mod(angleToMirror/PI + randomuv.x,1.0)*raysRadius;
	mediump vec3 colorRay = mix(texture2D(tPalette,vec2(rayBeam,0.0)).rgb,vec3(1.0),raysAlpha);


	//
	// Grab some mirror pixel radially and blur them
	//
	mediump vec2 cuvAdd = dirToLight * distToLight * pass * -0.2;
	mediump vec3 accumBlur =
		accumCol + 
		texture2D(tAccum,vUv + cuvAdd * 1.0).rgb + 
		texture2D(tAccum,vUv + cuvAdd * 2.0).rgb +
		texture2D(tAccum,vUv + cuvAdd * 3.0).rgb + 
		texture2D(tAccum,vUv + cuvAdd * 4.0).rgb;

	vec3 result = (accumBlur.rgb * colorRay * 0.5 * effectAlpha * pass)+accumCol; //result.a);

	gl_FragColor = vec4(result,1.0);
}