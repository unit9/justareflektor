varying mediump vec2 vUv;
uniform sampler2D tDiffuse;
uniform sampler2D tDrawing;
uniform sampler2D tVideo;

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
	mediump float drawing = 1.0-texture2D(tDrawing,vUv).r;
	lowp float noise = rand(vUv+randomUV)*drawing;
	vec4 color = texture2D(tDiffuse,vUv);
	vec4 actualColor = texture2D(tVideo,vec2(vUv.x,1.0-vUv.y));
	color.rgb = mix(color.rgb, abs(color.rgb-actualColor.rgb), drawing);
	gl_FragColor = color;
}