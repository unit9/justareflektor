//Blending Operations
#define BlendScreenf(base, blend) 		(1.0 - ((1.0 - base) * (1.0 - blend)))
#define BlendOverlayf(base, blend) 	(base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend)))
#define Blend(base, blend, funcf) 		vec3(funcf(base.r, blend.r), funcf(base.g, blend.g), funcf(base.b, blend.b))
#define BlendOverlay(base, blend) 		Blend(base, blend, BlendOverlayf)
#define BlendScreen(base, blend) 		Blend(base, blend, BlendScreenf)
#define BlendMultiply(base, blend) 		(base * blend)
#define BlendSubstract(base, blend) 	max(base + blend - vec3(1.0), vec3(0.0))



varying highp vec2 vUv;
varying highp vec2 vUvNoise;

uniform sampler2D tDiffuse;
uniform sampler2D tNoise;

uniform int blending;
uniform lowp float noiseAlpha;


void main() {
	mediump vec4 video = texture2D(tDiffuse,vUv);
	mediump vec3 col = video.rgb * video.a;
	mediump vec3 noise = texture2D(tNoise, vUvNoise).rgb;


	//todo -> move to separate shaders, or at least #define one BlendNoise()
	if (blending == 0) { //overlay
		noise = BlendOverlay(col, noise);
	} else if (blending == 1) { //screen
		noise = BlendScreen(col, noise);
	} else if (blending == 2) { //multiply
		noise = col * noise;
	} else if (blending == 3) { //add
		noise += col;
	} else if (blending == 4) { //sub
		noise = col-noise;
	} else if (blending == 5) { //divide
		noise = col / noise;
	} else if (blending == 6) { //pow
		noise = pow(col,1.0+noise);
	}
	col = mix(col,noise,noiseAlpha);

	gl_FragColor = vec4(col, 1.0);
}