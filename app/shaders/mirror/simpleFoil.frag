varying mediump vec2 vUv;
varying mediump float randomp;

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
	mediump vec2 dir = vec2(shards.g,shards.g) * 2.0 - 1.0;

	//get foil
	mediump vec2 lightdir = normalize(vec2(0.5)-center) + dir * 0.1 * vec2(1.0,-1.0);
	mediump float lightDist = (0.75-distance((vUv-0.5)*vec2(1.5,1.0)+0.5,center) ) * 2.0;
	mediump float angle = atan((1.0-headCenter.y)-vUv.y,(1.0-headCenter.x)-vUv.x) + dir.x*0.1 + center.y * 3.0 + center.x * 4.0;
	mediump vec3 foil = (texture2D(tGradient, vec2( angle * foilRadius * 0.1591549431, 0.0)).rgb  * effectAlpha * shards.r);

	gl_FragColor = vec4(foil, shards.r * lightDist * effectAlpha); //vec4(foil * lightDist, mirrorMask);

}

