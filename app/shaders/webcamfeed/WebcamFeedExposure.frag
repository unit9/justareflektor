varying mediump vec2 vUv;

uniform sampler2D tWebcam;

uniform lowp float exposure;
uniform lowp float offset;
uniform lowp float noiseAlpha;
uniform mediump vec2 randomUV;


const lowp vec3 rgb2luma = vec3(0.299,0.587,0.114);

mediump float rand( mediump vec2 co ){
    return fract( sin( dot( co.xy ,vec2( 12.9898,78.233 ) ) ) * 43758.5453 );
}


void main() {
	
	/*mediump vec4 col = texture2D(tWebcam, vUv);
	mediump float noise = 1.0 + rand(randomUV+vUv)*noiseAlpha - noiseAlpha*0.5;
	col.rgb = vec3(  (dot(col.rgb,rgb2luma) + offset) * exposure * noise );
	gl_FragColor = col;*/

	gl_FragColor = vec4(vec3(  (dot(texture2D(tWebcam, vUv).rgb,rgb2luma) + offset) * exposure * (1.0 + rand(randomUV+vUv)*noiseAlpha - noiseAlpha*0.5) ),1.0);

}