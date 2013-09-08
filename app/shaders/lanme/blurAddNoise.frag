varying mediump vec2 vUv;
uniform sampler2D tDiffuse;
uniform sampler2D tDrawing;

uniform mediump vec2 center;
uniform mediump vec2 ratio;
uniform mediump vec2 offset;
uniform mediump vec2 randomUV;

uniform mediump float effectAlpha;
uniform mediump float drawingSize;
uniform mediump float timep;
const mediump vec3 rgb2luma = vec3 (0.299, 0.587, 0.114);

lowp float rand( vec2 co ){
    return fract( sin( dot( co.xy ,vec2( 12.9898,78.233 ) ) ) * 43758.5453 );
}

void main() {
	//vibrance
	lowp float noise = rand(vUv+randomUV);
	mediump float drawing = 1.0-texture2D(tDrawing,vUv).r;
	
	mediump vec4 color = texture2D(tDiffuse,vUv);
	mediump vec2 off = offset * 1.5 * effectAlpha * drawing * noise;
	mediump vec4 blurColor = 
		color + 
		texture2D(tDiffuse,vUv+vec2(-off.x,-off.y)) + 
		texture2D(tDiffuse,vUv+vec2(off.x,-off.y)) + 
		texture2D(tDiffuse,vUv+vec2(-off.x,off.y)) + 
		texture2D(tDiffuse,vUv+vec2(off.x,off.y));

	color = mix(color,blurColor * ( noise + (1.0-noise) * (1.0-effectAlpha) * (1.0-drawing)) ,effectAlpha);



	gl_FragColor = color;
}