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
	lowp float noise = rand(vUv*timep*10.0);
	mediump float vibrance = 1.0-texture2D(tDrawing,vUv).r;
	vibrance*=vibrance*noise;
	vec4 color = texture2D(tDiffuse,vUv);
    lowp float YPrime  = dot (color.rgb, kRGBToYPrime);
	lowp float average = YPrime; //(color.r + color.g + color.b) / 3.0;
	lowp float mx = max(color.r, max(color.g, color.b));
	lowp float amt = (mx - average) * (-vibrance * 100.0 * effectAlpha);
	color.rgb = mix(color.rgb, vec3(mx), amt);// + noise*vibrance;
	gl_FragColor = color;
}