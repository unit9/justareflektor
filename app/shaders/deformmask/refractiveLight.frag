varying mediump vec2 vUv;

uniform sampler2D tVideo;
uniform sampler2D tAccum;
uniform sampler2D tDrawing;

uniform mediump float pass;
uniform mediump float alpha;
uniform mediump float drawingAdditive;
uniform mediump vec2 offset;
uniform mediump vec2 center;
uniform mediump vec2 randomUV;
uniform mediump float noiseOffset;

const lowp vec2 ratio = vec2(0.525, 1.0);
#define NUM_SAMPLES 6.0

mediump float rand( mediump vec2 co ){
    return fract( sin( dot( co.xy ,vec2( 12.9898,78.233 ) ) ) * 43758.5453 );
}

void main() {
	mediump vec2 centervec = ( (vUv-0.5)*ratio+0.5-center);
	mediump vec2 dir = normalize(centervec);

	mediump vec3 col = vec3(0.0,0.0,0.0); //texture2D(tVideo,vUv).rgb;
	mediump vec3 drawing = texture2D(tDrawing,vUv).rgb;

	vec2 off = (drawing.gb * 2.0 - 1.0) * (1.0-drawing.r) * ratio * (1.0 - length(centervec)) * pass * (1.0 + rand(vUv+randomUV)*noiseOffset);
	vec2 cuv = vUv;
	vec2 cuvadd = off * (1.0 / NUM_SAMPLES);

	float i=0.0;
	col += texture2D(tVideo,cuv).rgb*vec3(1.0,1.0,1.0); 
	cuv -= cuvadd;
	i++;
	if (i<NUM_SAMPLES) {
		col += texture2D(tVideo,cuv).rgb;
		cuv -= cuvadd; 
		i++;
		if (i<NUM_SAMPLES) {
			col += texture2D(tVideo,cuv).rgb;
			cuv -= cuvadd; 
			i++;
			if (i<NUM_SAMPLES) {
				col += texture2D(tVideo,cuv).rgb;
				cuv -= cuvadd; 
				i++;
				if (i<NUM_SAMPLES) {
					col += texture2D(tVideo,cuv).rgb;
					cuv -= cuvadd;
					i++;
					if (i<NUM_SAMPLES) {
						col += texture2D(tVideo,cuv).rgb;
						cuv -= cuvadd;
						i++;
					}
				}
			}
		}
	}

	col *= alpha + drawing.r;

	vec3 accum = texture2D(tAccum,vUv).rgb;
	float accums = length(accum);
	gl_FragColor = vec4(drawing.r*drawingAdditive + col *pass + accum * accums,1.0);
}