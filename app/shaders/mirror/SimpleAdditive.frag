varying mediump vec2 vUv;
uniform sampler2D tVideo;
uniform sampler2D tAccum;
uniform sampler2D tMirrorKid;
uniform sampler2D tMask;
uniform mediump vec2 center;
uniform mediump vec2 lightPosition;
uniform mediump vec2 randomuv;
uniform mediump vec2 offset;
uniform mediump vec2 ratio;
uniform mediump vec4 globalColor;


#define BlendScreenf(base, blend) 		(1.0 - ((1.0 - base) * (1.0 - blend)))
#define BlendOverlayf(base, blend) 	(base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend)))
#define Blend(base, blend, funcf) 		vec3(funcf(base.r, blend.r), funcf(base.g, blend.g), funcf(base.b, blend.b))
#define BlendOverlay(base, blend) 		Blend(base, blend, BlendOverlayf)
#define BlendScreen(base, blend) 		Blend(base, blend, BlendScreenf)


void main() {
	//gl_FragColor = //vec4(texture2D(tAccum,vUv).rgb,1.0); //+vec4(accumCol.rgb*accumCol.a,1.0);
	vec4 accumCol = texture2D(tAccum, vUv);
	vec4 mirrorKidCol = texture2D(tMirrorKid, vUv);
	vec4 videoCol = texture2D(tVideo, vUv);
	mirrorKidCol.rgb*=mirrorKidCol.a;
	videoCol.rgb = BlendScreen(videoCol.rgb,mirrorKidCol.rgb);
	gl_FragColor =  videoCol * globalColor + accumCol*accumCol.a;
	
	//gl_FragColor.rgb = (gl_FragColor.rgb*1.5) * mirrorKidCol.rgb * mirrorKidCol.a + gl_FragColor.rgb * (1.0-mirrorKidCol.a);//mix(gl_FragColor.rgb, mirrorKidCol.rgb, mirrorKidCol.a) ;
}