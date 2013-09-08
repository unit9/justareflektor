varying mediump vec2 vUv;

uniform sampler2D tVideo;
uniform sampler2D tAccum;
uniform sampler2D tPalette;
uniform sampler2D tMask;
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

float rand( vec2 co ){
    return fract( sin( dot( co.xy ,vec2( 12.9898,78.233 ) ) ) * 43758.5453 );
}


void main() {

	//
	// Buffers
	//
	vec4 videoCol = texture2D(tVideo,vUv);
	vec4 accumCol = texture2D(tAccum,vUv);
	float mask = texture2D(tMask,vUv).a;
	vec4 result = vec4(0.0);

	// first pass
	if (pass<=0.0) {
		result = vec4(videoCol.rgb*mask,1.0);

	} else {
		//
		// Direction from UV to mirror
		//
		//mediump vec2 dirToMirror = normalize(vUv-center);
		//mediump float distToMirror = distance(vUv,center);

		//
		// Direction from UV to light
		//
		mediump vec2 dirToLight = normalize(vUv-lightPosition);
		mediump float distToLight = distance(vUv,lightPosition);


		mediump float angleToMirror = atan(dirToLight.y,dirToLight.x);
		mediump float rayBeam = mod(angleToMirror/PI + randomuv.x,1.0)*raysRadius;


		//add
		//float mirrorNormal = dot(uvToLight,uvToMirror);
		//result = vec4(mirrorNormal,0.0,0.0,1.0);
		//distToMirror*=min(,1.0);
		//result = videoCol; // - 0.5*abs(rand(vec2(rayBeam,randomuv.y))+2.0)*min(mirrorNormal*(distToLight*(1.0-distToMirror)*1.0),0.5);

		//
		// Grab some mirror pixel and blur them
		//
		mediump vec2 cuvAdd = dirToLight*distToLight*0.2*1.0/pass;
		mediump vec2 cuv = vUv;
		for (int i=0; i<5; i++) {
			if (cuv.x>0.0 && cuv.y>0.0 && cuv.y<1.0 && cuv.x<1.0) result += texture2D(tAccum,cuv);
			cuv -= cuvAdd;
		}
		result *= 0.5*effectAlpha*(1.0/pass);

		vec3 colorRay = mix(texture2D(tPalette,vec2(rayBeam,0.0)).rgb,vec3(1.0),raysAlpha);

		result = vec4(vec3(result.rgb) * colorRay,1.0)+accumCol; //result.a);

		//
		// 
		//
		result = vec4(result.rgb,1.0);
	}
	
	//result.a = 1.0-mask.x;
	gl_FragColor = result;
}