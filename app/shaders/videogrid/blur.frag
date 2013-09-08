varying mediump vec2 vUv;

varying mediump vec2 uvLeft;
varying mediump vec2 uvRight;
varying mediump vec2 uvTop;
varying mediump vec2 uvBottom;

varying mediump vec2 uvTopLeft;
varying mediump vec2 uvTopRight;
varying mediump vec2 uvBottomLeft;

//use a maxiumum of 8 varyings for compatibility
#define uvBottomRight (vUv+offset)

uniform mediump vec2 offset;

uniform sampler2D tDiffuse;
uniform sampler2D tAccum;
uniform lowp float accumpc;

void main() {

	gl_FragColor =
		texture2D(tAccum,vUv) + accumpc + 
		(texture2D(tDiffuse,vUv) * 4.0+
		
		(texture2D(tDiffuse,uvLeft) +
		texture2D(tDiffuse,uvRight) +
		texture2D(tDiffuse,uvTop) +
		texture2D(tDiffuse,uvBottom)) +

		texture2D(tDiffuse,uvTopLeft) * 2.0+
		texture2D(tDiffuse,uvTopRight) * 2.0+
		texture2D(tDiffuse,uvBottomRight) * 2.0+
		texture2D(tDiffuse,uvBottomLeft) * 2.0
		) * 0.0625;

	gl_FragColor.a = 1.0;
}