varying mediump vec2 vUv;
uniform sampler2D tVideo;
uniform sampler2D tAccum;

uniform mediump float drawingSize;
uniform mediump float drawingOpacity;

uniform mediump vec2 center;
uniform mediump vec2 randomUV;
uniform lowp float noiseAlpha;
uniform lowp float luminanceSnapping;
uniform mediump float accumSpeed;



const lowp vec2 ratio = vec2(1.0, 0.525);

mediump float rand( mediump vec2 co ){
    return fract( sin( dot( co.xy ,vec2( 12.9898,78.233 ) ) ) * 43758.5453 );
}



void main() {
	mediump vec2 centervec = ( (vUv-0.5)*ratio+0.5-center);
	mediump float dist = max( (drawingSize - length(centervec)) / drawingSize, 0.0);
	mediump vec2 dir = normalize(centervec);
	mediump float luma = texture2D(tVideo, vUv).r;
	mediump vec3 accum = texture2D(tAccum,vUv).rgb;

	dir = normalize( mix(dir,accum.gb,accum.r*accumSpeed*luma) ) * 0.5 + 0.5;

	mediump float result =
		luma * dist * luminanceSnapping * drawingOpacity +
		dist * drawingOpacity * (rand(randomUV+vUv) * noiseAlpha + (1.0-noiseAlpha)) +
		accum.r * accumSpeed;
	gl_FragColor = vec4(result,dir.x,dir.y,1.0);
	//gl_FragColor = vec4(result);
}