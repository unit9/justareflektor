varying mediump vec2 vUv;
uniform sampler2D tDiffuse;
uniform sampler2D tDrawing;

uniform mediump vec2 center;
uniform mediump vec2 ratio;
uniform mediump vec2 offset;

uniform mediump float effectAlpha;
uniform mediump float drawingSize;
uniform mediump float timep;
const mediump vec3  kRGBToYPrime = vec3 (0.299, 0.587, 0.114);

lowp float rand( vec2 co ){
    return fract( sin( dot( co.xy ,vec2( 12.9898,78.233 ) ) ) * 43758.5453 );
}

void main() {
	//vibrance
	mediump float exposure = 1.0-texture2D(tDrawing,vUv).r;
	vec4 color = texture2D(tDiffuse,vUv);
	color.rgb *= 1.0 + exposure*effectAlpha;
	gl_FragColor = color;
}