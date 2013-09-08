uniform sampler2D tDiffuse;
uniform sampler2D tMask;
uniform mediump vec2 center;
uniform mediump vec2 parallaxCenter;

varying mediump vec2 uvMask;
varying mediump vec2 uvDiffuse;


varying mediump vec2 dirAngle;

uniform mediump float maskFadePower;
uniform mediump float maskFade;
uniform mediump float maskLens;
uniform mediump float maskLensSides;
uniform mediump vec2 offset;


#define Blend(base, blend, funcf) 		vec3(funcf(base.r, blend.r), funcf(base.g, blend.g), funcf(base.b, blend.b))
#define BlendOverlayf(base, blend) 	(base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend)))
#define BlendOverlay(base, blend) 		Blend(base, blend, BlendOverlayf)


uniform mediump float maskTextureOpacity;
uniform mediump float maskDistort;
uniform mediump float maskDistortBlur;
uniform mediump float maskSpill;


void main() {


	vec4 mask = texture2D(tMask,uvMask);

	//lowp float angle = atan(dirAngle.y-0.5,dirAngle.x-0.5);
	lowp float dist = distance(uvMask,vec2(0.5));
	mediump vec2 dir = normalize(dirAngle-0.5); //vec2(cos(angle),sin(angle));
	//gl_FragColor = vec4(dir.x,dir.y,distToCenter,1.0);
	

	//gl_FragColor = vec4(dirToCenter.x,dirToCenter.y,distToCenter,1.0);
	vec4 colCenter = texture2D(tDiffuse,uvDiffuse);

	vec4 maskedCol = texture2D(tDiffuse,
		(uvDiffuse - dir*dist) + offset * dir * maskLensSides * (mask.r)   + dir * pow(dist,maskLens) * (1.0+maskDistort*dot(colCenter.rgb,vec3(0.3)))
	);
	maskedCol = mix(maskedCol,colCenter,maskDistortBlur);

	//side fade && mask texture
	maskedCol.a *= (1.0-maskTextureOpacity*(1.0-mask.r)) * (1.0-mask.r); // - pow(dist*2.0,maskFadePower)*maskFade;//  *   mask.r; //(1.0-maskTextureOpacity*mask.r);;
	
	//maskedCol.a -= maskTextureOpacity*mask.r;


	if (maskedCol.a<1.0 && uvDiffuse.y>0.0 && uvDiffuse.y<1.0) {
		maskedCol.a += maskSpill*min(length(maskedCol.rgb),1.0);
	}
	
	gl_FragColor = maskedCol;

/*
	if (uvDiffuse.x>=1.0) gl_FragColor = vec4(1.0,0.0,0.0,1.0);
	if (uvDiffuse.y>=1.0) gl_FragColor = vec4(1.0,1.0,0.0,1.0);
	if (uvDiffuse.x<=0.0) gl_FragColor = vec4(0.0,0.0,1.0,1.0);
	if (uvDiffuse.y<=0.0) gl_FragColor = vec4(0.0,1.0,1.0,1.0);
*/
}