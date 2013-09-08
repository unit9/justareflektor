varying mediump vec2 vUv;

uniform sampler2D tVideo;
uniform sampler2D tLines;
uniform sampler2D tLinesBlur;
uniform sampler2D tLinesBlur2;

uniform mediump vec2 center;
uniform mediump vec2 randomUV;

uniform mediump float blurDistance;
uniform mediump float blurDistance2;

mediump float rand( mediump vec2 co ){
    return fract( sin( dot( co.xy ,vec2( 12.9898,78.233 ) ) ) * 43758.5453 );
}

void main() {

	mediump float dist = distance(vUv,center);
	mediump float distBlurA = max(blurDistance-dist,0.0);
	mediump float distBlurB = max(blurDistance2-dist,0.0);



	mediump float noise = rand(vUv + randomUV);
	mediump float line = texture2D(tLines,vUv).r;
	mediump float neon = texture2D(tLinesBlur,vUv).r*distBlurA + texture2D(tLinesBlur2,vUv).r*distBlurB;

	line = line + neon  - noise * (1.0-neon);

	gl_FragColor = texture2D(tVideo,vec2(vUv.x,1.0-vUv.y)) + vec4( max(line,0.0) );

}