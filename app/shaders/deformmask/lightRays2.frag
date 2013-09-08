varying mediump vec2 vUv;

uniform sampler2D tVideo;
uniform sampler2D tAccum;
uniform sampler2D tDrawing;

uniform mediump float pass;
uniform mediump float alpha;
const mediump float raysExp = 1.5;
uniform mediump float drawingAdditive;
uniform mediump vec2 offset;
uniform mediump vec2 center;
uniform mediump vec2 randomUV;
uniform mediump float noiseOffset;

const lowp vec2 ratio = vec2(0.525, 1.0);

mediump float rand( mediump vec2 co ){
    return fract( sin( dot( co.xy ,vec2( 12.9898,78.233 ) ) ) * 43758.5453 );
}

void main() {
	mediump vec2 centervec = ( (vUv-0.5)*ratio+0.5-center);
	mediump vec2 dir = normalize(centervec);

	mediump vec3 drawing = texture2D(tDrawing,vUv).rgb;
	mediump vec3 videoCol = texture2D(tVideo,vUv).rgb;
	mediump vec4 result = vec4(0.0,0.0,0.0,1.0);


	// first pass
	if (pass<=0.0) {
		result = vec4(videoCol*drawing.r,1.0);

	} else {
		//get direction
		mediump vec2 dirToLight = normalize(vUv-center);
		mediump float distToLight = distance(vUv,center);


		//
		// blur pixels
		//
		//mediump vec2 cuvAdd = dirToLight*distToLight*0.2*1.0/pass;
		mediump vec2 cuvAdd = (drawing.gb * 2.0 - 1.0) * (1.0-drawing.r) * distToLight * ratio * 1.0/pass * (1.0 + rand(vUv+randomUV)*noiseOffset);

		mediump vec2 cuv = vUv;
		for (int i=0; i<5; i++) {
			if (cuv.x>0.0 && cuv.y>0.0 && cuv.y<1.0 && cuv.x<1.0) result += texture2D(tAccum,cuv);
			cuv -= cuvAdd;
		}
		result *= 0.2; //*alpha*(1.0/pass) + vec4(videoCol,1.0) * drawing.r * drawingAdditive;

		float blend =  mix(max(1.0-pow(distToLight,raysExp)*(5.0*alpha),0.0), drawing.r, drawingAdditive);

		gl_FragColor.rgb = mix(result.rgb, videoCol, blend );

	}


	gl_FragColor = result;

}