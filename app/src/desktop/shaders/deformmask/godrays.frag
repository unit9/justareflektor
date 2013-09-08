//@author huwb / http://huwbowles.com/
 //God-rays (crepuscular rays)
 //References:
 //Sousa2008 - Crysis Next Gen Effects, GDC2008, http://www.crytek.com/sites/default/files/GDC08_SousaT_CrysisEffects.ppt

#define TAPS_PER_PASS 6.0

varying mediump vec2 vUv;

uniform sampler2D tVideo;
uniform sampler2D tMask;
uniform sampler2D backBuffer;
uniform mediump vec2 offset;
uniform mediump vec2 center;
uniform lowp float alpha;
uniform float fStepSize;
uniform bool flipx;

const mediump vec2 ratio = vec2(1280.0/720.0,1.0);

void main() {
	vec2 ruv = vec2(vUv.x,1.0-vUv.y);

	vec2 delta = center - ruv;
	//delta *= ratio; //((flipx==true)?vec2(-1.0,1.0):vec2(1.0));
	float dist = length( delta );
	//delta.y = 1.0-delta.y;

	vec2 stepv = fStepSize * delta / dist;
	//stepv *= alpha;// * texture2D(tMask,vUv).r;

	float iters = dist/fStepSize;

	vec2 uv = ruv; //((flipx==true)?vec2(1.0-vUv.x,vUv.y):vUv); //vec2(vUv.x,1.0-vUv.y);
	vec3 col = vec3(0.0);

	for ( float i = 0.0; i < TAPS_PER_PASS; i += 1.0 ) {

		col += ( i <= iters && uv.y < 1.0 ? texture2D( backBuffer, uv ).rgb / (0.2+dist) : vec3(0.0) );
		uv += stepv;

	}

	gl_FragColor = vec4( col/TAPS_PER_PASS*0.8, 1.0 );

	float blend = max(1.0-pow(length(delta),1.5)*(6.0*alpha),0.0);
	
	gl_FragColor.rgb = mix(gl_FragColor.rgb, texture2D( tVideo, ruv ).rgb, blend );

}