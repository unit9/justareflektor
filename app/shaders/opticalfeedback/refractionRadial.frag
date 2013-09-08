varying mediump vec2 vUv;

uniform sampler2D tVideo;

uniform mediump float dist;
uniform mediump vec2 center;
uniform lowp float alpha;
uniform lowp float chrominanceA;
uniform lowp float chrominanceB;
uniform lowp float fade;


const lowp float TWO_PI = 6.283185;
#define NUM_SAMPLES 6.0

vec3 alphaCol(in vec4 col) {
	return col.rgb*col.a;
}

lowp vec3 refractAngle(inout float angle, in float angleincr, in vec3 chroma) {
	angle += angleincr;
	return alphaCol(texture2D(tVideo,vUv + vec2(cos(angle),sin(angle)) * dist)) * chroma;
}

void main() {

	lowp float angle = atan(center.y-0.5,center.x-0.5); //atan(vUv.y-center.y,vUv.x-center.x);

	mediump vec4 videoCol = texture2D(tVideo,vUv);
	
	lowp float angleincr = TWO_PI / (NUM_SAMPLES + 1.0);

	mediump vec3 col =
		refractAngle(angle, angleincr, vec3(1.0, chrominanceA, chrominanceA)) +
		refractAngle(angle, angleincr, vec3(chrominanceB, chrominanceB, chrominanceA)) +
		refractAngle(angle, angleincr, vec3(chrominanceA, 1.0, chrominanceA)) +
		refractAngle(angle, angleincr, vec3(chrominanceA, chrominanceB, chrominanceB)) +
		refractAngle(angle, angleincr, vec3(chrominanceA, chrominanceA, 1.0)) +
		refractAngle(angle, angleincr, vec3(chrominanceB, chrominanceA, chrominanceB));

		vec4 add = (vec4(col,1.0)*alpha*videoCol.a)*fade;
		add *= videoCol.a;
	gl_FragColor = videoCol + add;
}