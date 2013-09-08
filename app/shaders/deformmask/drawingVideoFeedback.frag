varying mediump vec2 vUv;
uniform sampler2D tVideo;
uniform sampler2D tAccum;

uniform mediump float drawingSize;
uniform mediump float drawingOpacity;

uniform mediump vec2 offset;
uniform mediump vec2 center;
uniform mediump vec2 randomUV;
uniform lowp float noiseAlpha;
uniform lowp float noiseOffset;
uniform lowp float luminanceSnapping;
uniform mediump float accumSpeed;

const lowp vec2 ratio = vec2(1.0, 0.525);
const mediump float TWO_PI = 6.283185;
mediump float rand( mediump vec2 co ){
    return fract( sin( dot( co.xy ,vec2( 12.9898,78.233 ) ) ) * 43758.5453 );
}

#define minByteResolution 0.0039063

void main() {

	mediump vec2 centervec = ( (vUv-0.5)*ratio+0.5-center);
	mediump float dist = max( (drawingSize - length(centervec)) / drawingSize, 0.0);
	mediump vec2 dir = normalize(centervec);
	mediump vec3 luma = texture2D(tVideo, vUv).rgb;
	mediump vec4 accum = texture2D(tAccum,vUv);

	accum.rgb *= 0.5;
	accum.rgb += texture2D(tAccum,vUv - dir * offset * luminanceSnapping).rgb * 0.5;

	accum.rgb = accum.rgb * accumSpeed + luma * dist * drawingOpacity * (1.0 - rand(randomUV+dir)*noiseAlpha);

	gl_FragColor = vec4(accum.rgb - minByteResolution,1.0); //dir.x*0.5+0.5,dir.y*0.5+0.5,1.0);

}