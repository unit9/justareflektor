#define BlendScreenf(base, blend) 		(1.0 - ((1.0 - base) * (1.0 - blend)))
#define BlendOverlayf(base, blend) 	(base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend)))
#define Blend(base, blend, funcf) 		vec3(funcf(base.r, blend.r), funcf(base.g, blend.g), funcf(base.b, blend.b))
#define BlendOverlay(base, blend) 		Blend(base, blend, BlendOverlayf)
#define BlendScreen(base, blend) 		Blend(base, blend, BlendScreenf)



varying mediump vec2 vUv;

uniform sampler2D tVideo;
uniform sampler2D tWebcam;
uniform sampler2D tDirection;
uniform sampler2D tGradient;

uniform mediump vec2 center;
uniform lowp float effectAlpha;
uniform lowp float webcamAlpha;
uniform mediump vec2 offset;
uniform mediump vec2 headCenter;
uniform mediump float foilRadius;
uniform mediump float foilDisplacement;


void main() {


	mediump vec3 shards = texture2D(tDirection,vUv).xyz;
	mediump vec2 dir = vec2(shards.g,shards.g) * 2.0 - 1.0; //shards.yz*2.0-1.0;
	lowp float mirrorMask = shards.r;

	vec2 lightdir = normalize(vec2(0.5)-center) + dir * 0.1;
	lightdir *= vec2(1.0,-1.0); //vec2(1.0-lightdir.x,lightdir.y);

	float lightDist = (0.75-distance((vUv-0.5)*vec2(1.5,1.0)+0.5,center) ) * 2.0;

	float angle = atan((1.0-headCenter.y)-vUv.y,(1.0-headCenter.x)-vUv.x) + dir.x*0.1 + center.y * 3.0 + center.x * 4.0;
	mediump vec3 foil = texture2D(tGradient, vec2( angle * foilRadius * 0.1591549430919, 0.0)).rgb;


	//overlay webcam
	mediump vec2 webcamuvScaled = (vUv-0.5)*8.0 + 0.5 - headCenter*2.5 + vec2(-0.5,-0.75);
	mediump vec2 webcamuv = (webcamuvScaled+dir*foilDisplacement*mirrorMask); //1.0-(vUv-0.5)*(1.0+dir*0.5)+0.5;
	mediump vec3 webcam = vec3(texture2D(tWebcam,webcamuv).rgb);

	foil *= effectAlpha;
	foil *= mirrorMask;

	foil = mix(foil, (BlendScreen(foil,webcam) * 1.0), webcamAlpha);
	
	gl_FragColor = vec4(foil, mirrorMask * lightDist * effectAlpha); //vec4(foil * lightDist, mirrorMask);

	//gl_FragColor = vec4(shards.g);
}

