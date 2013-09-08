//#define BLENDING true

//Blending Operations
#define BlendScreenf(base, blend) 		(1.0 - ((1.0 - base) * (1.0 - blend)))
#define BlendOverlayf(base, blend) 	(base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend)))

#define BlendMultiplyAddf(base, blend) 	(base < blend ? (base+blend) : base*blend)
#define BlendAddSubf(base, blend) 	(base < blend ? (base+blend) : base-blend)
#define BlendAddSubOverlayf(base, blend) 	(base < 0.5 ? (base+(1.0-blend)) : base+blend)
#define BlendAddSubOverlayInvf(base, blend) 	(base < 0.5 ? (base+blend) : (base-blend))


#define Blend(base, blend, funcf) 		vec3(funcf(base.r, blend.r), funcf(base.g, blend.g), funcf(base.b, blend.b))
#define BlendOverlay(base, blend) 		Blend(base, blend, BlendOverlayf)
#define BlendScreen(base, blend) 		Blend(base, blend, BlendScreenf)
#define BlendAddSub(base, blend) 		Blend(base, blend, BlendAddSubf)
#define BlendMultiplyAdd(base, blend) 		Blend(base, blend, BlendMultiplyAddf)
#define BlendAddSubOverlay(base, blend) 		Blend(base, blend, BlendAddSubOverlayf)
#define BlendAddSubOverlayInv(base, blend) 		Blend(base, blend, BlendAddSubOverlayInvf)

#define BlendMultiply(base, blend) 		(base * blend)
#define BlendSubstract(base, blend) 	max(base + blend - vec3(1.0), vec3(0.0))



varying highp vec2 vUv;
varying highp vec2 vUvNoise;
varying highp vec2 vUvSides;

uniform sampler2D tDiffuse;
uniform sampler2D tNoise;
uniform sampler2D tFlare;

//noise
uniform int blending;
uniform lowp float noiseAlpha;


//global effect
uniform lowp float exposure;
uniform lowp float saturation;


//side flare GUI
uniform lowp float sideFlareAlpha;
uniform mediump vec2 sidesSize;
uniform mediump vec2 sidesSizeInverse;


void main() {
	mediump vec4 video = texture2D(tDiffuse,vUv);
	mediump vec3 col = video.rgb * video.a * exposure;
	mediump vec3 noise = texture2D(tNoise, vUvNoise).rgb;

	col = mix(vec3(0.5),col,saturation);

	//todo -> move to separate shaders, or at least #define one BlendNoise()
	// #ifdef BLENDING
	// if (blending == 0) {
	// 	noise = col;
	// } else if (blending == 1) { //overlay
	// 	noise = BlendOverlay(col, noise);
	// } else if (blending == 2) { //screen
	// 	noise = BlendScreen(col, noise);
	// } else if (blending == 3) { //multiply
	// 	noise = col * noise;
	// } else if (blending == 4) { //add
	// 	noise += col;
	// } else if (blending == 5) { //sub
	// 	noise = col-noise;
	// } else if (blending == 6) { //divide
	// 	noise = col / noise;
	// } else if (blending == 7) { //pow
	// 	noise = pow(col,1.0+noise);
	// } else if (blending == 8) { //custom multiply
	// 	noise = BlendMultiplyAdd(col, noise);
	// } else if (blending == 9) { //custom add and sub
	// 	noise = BlendAddSub(col, noise);
	// } else if (blending == 10) { //custom add and sub
	// 	noise = BlendAddSubOverlay(col, noise);
	// } else if (blending == 11) { //custom add and sub
	// 	noise = BlendAddSubOverlayInv(col, noise);
	// }
	// #else
		noise = col-noise;
	//#endif

	col = mix(col,noise,noiseAlpha);

	//sides interface
	if ((vUv.x < sidesSize.x || vUv.x > sidesSizeInverse.x|| vUv.y < sidesSize.y || vUv.y > sidesSizeInverse.y) &&
		(vUvSides.x > 0.0 && vUvSides.x < 1.0 && vUvSides.y > 0.0 && vUvSides.y < 1.0)) {
		col += texture2D(tFlare, vUvSides).a * sideFlareAlpha;
	}
	


	gl_FragColor = vec4(col, 1.0);
}