varying mediump vec2 vUv;
varying mediump vec2 uvBreakFree;
varying highp vec2 uvNoise;

uniform sampler2D tVideo;
uniform sampler2D tBreakFree;
uniform sampler2D tNoise;

uniform mediump float noiseAlpha;
uniform mediump float breakFreeAlpha;
uniform mediump float blackAndWhite;

uniform mediump float screenAlpha;
uniform mediump float darkenAlpha;
uniform mediump float exposureMultiply;
uniform mediump float exposureOffset;

uniform mediump float minBlack;
uniform mediump float maxWhite;


// #define BlendDarkenf(base, blend) 		min(blend, base)
// #define BlendScreenf(base, blend) 		(1.0 - ((1.0 - base) * (1.0 - blend)))
// #define Blend(base, blend, funcf) 		vec3(funcf(base.r, blend.r), funcf(base.g, blend.g), funcf(base.b, blend.b))
// #define BlendDarken				BlendDarkenf
// #define BlendScreen(base, blend) 		Blend(base, blend, BlendScreenf)


const mediump vec3 rgb2luma = vec3(0.299,0.587,0.114);

void main() {

	mediump vec3 videoCol = texture2D(tVideo,vUv).rgb;

	mediump vec4 breakFreeCol = texture2D(tBreakFree, uvBreakFree);

	mediump vec3 noise = texture2D(tNoise, uvNoise).rgb;


	mediump float videobw = clamp(dot(videoCol,rgb2luma) * exposureMultiply - exposureOffset, minBlack, maxWhite);
	mediump vec3 screenNoise = (1.0 - ((1.0 - videobw) * (1.0 - noise)));
	mediump vec3 darkenNoise = min(vec3(videobw)+noise,noise);

	videoCol = mix(videoCol,vec3(videobw),min(noiseAlpha*1.25,1.0) );
	//gl_FragColor = vec4( mix(videoCol, vec3(1.0-videobw)*noise + (1.0-videobw)*darkenNoise*darkenAlpha +  noise * screenAlpha * 2.0 , noiseAlpha) + (breakFreeCol.rgb+noise*noiseAlpha) * breakFreeCol.a * breakFreeAlpha , 1.0); //min(max(videoCol + noise,vec4(0.0,0.0,0.0,1.0)),vec4(1.0,1.0,1.0,1.0)) ;
	gl_FragColor = vec4( mix(videoCol, screenNoise*screenAlpha + darkenNoise*darkenAlpha, noiseAlpha) + (breakFreeCol.rgb+noise*noiseAlpha) * breakFreeCol.a * breakFreeAlpha , 1.0);
}