varying mediump vec2 vUv;

uniform sampler2D tVideo;
uniform sampler2D tLines;
uniform sampler2D tBlurA;
uniform sampler2D tBlurB;
uniform lowp vec4 neonColor;
uniform lowp float fade;

uniform highp vec2 noiseuv;


float rand(vec2 co)
{
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}



#define BlendOverlayf(base, blend) 	(base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend)))

void main() {
	float noise = 0.5 + 0.5*rand(noiseuv+vUv);
	vec4 neon = texture2D(tBlurA,vUv) + texture2D(tBlurB,vUv);
	lowp float linea = dot(texture2D(tLines,vUv).rgb,vec3(1.0));
	linea *= linea*linea*fade;


	vec4 lineValue = linea * linea * vec4(1.0);
	vec4 blurValue = texture2D(tBlurA,vUv) + texture2D(tBlurB,vUv);
	vec4 videoValue = texture2D(tVideo,vUv);
	lineValue = ((lineValue+blurValue)*noise)*1.5 - 0.5;


	gl_FragColor = videoValue + max(lineValue,0.0)*fade;
			//neon * neon.a;


		//vec4(1.0,1.0,1.0,1.0),
		//texture2D(tBlurB,vUv).r);
		// + 
		//(texture2D(tBlurA,vUv) + 
		//texture2D(tBlurB,vUv)) * neonColor;
}