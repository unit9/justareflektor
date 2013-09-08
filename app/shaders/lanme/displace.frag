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
const mediump vec3  kRGBToYPrime = vec3 (0.299, 0.587, 0.114);

lowp float rand( vec2 co ){
    return fract( sin( dot( co.xy ,vec2( 12.9898,78.233 ) ) ) * 43758.5453 );
}

void main() {
	lowp float noise = rand(vUv+randomUV);
	mediump float drawing = 1.0-texture2D(tDrawing,vUv).r;

	mediump float dist = distance(vUv,center);
	mediump float wave = sin(drawing*30.0*effectAlpha - timep*0.25*effectAlpha);
	mediump vec2 dir = normalize(vUv-center);

	mediump vec4 color = texture2D(tDiffuse,vUv + drawing*offset*5.0*wave*dir);

	gl_FragColor = color;
}