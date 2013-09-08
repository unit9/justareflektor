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
	mediump vec3 drawing = 1.0-texture2D(tDrawing,vUv).rgb;
	//drawing.r *= effectAlpha;

	mediump vec2 dir = offset * normalize(drawing.yz * 2.0 - 1.0) * drawing.r;

	mediump vec4 ocol = texture2D(tDiffuse,vUv);
	mediump vec3 col = vec3(
		texture2D(tDiffuse,vUv+dir*0.0).r,
		texture2D(tDiffuse,vUv+dir*4.0*effectAlpha).g,
		texture2D(tDiffuse,vUv+dir*8.0*effectAlpha).b);
	col = mix(col,col+(col-ocol.rgb)*5.0*effectAlpha,drawing.r);
	ocol.rgb = mix(ocol.rgb,col.rgb,effectAlpha);
	gl_FragColor = vec4(col,1.0);
}