uniform sampler2D texture;
uniform sampler2D videoTexture;

uniform mediump vec2 offset;
uniform lowp float blurA;
uniform lowp float blurB;
uniform lowp float blurC;
uniform lowp float blurD;

uniform lowp float off;

varying highp vec2 vUv;

const lowp vec2 left = vec2(-1.0,0.0);
const lowp vec2 right = vec2(1.0,0.0);
const lowp vec2 top = vec2(0.0,-1.0);
const lowp vec2 bottom = vec2(0.0,1.0);

const lowp vec2 topLeft = vec2(-1.0,1.0);
const lowp vec2 topRight = vec2(1.0,1.0);
const lowp vec2 bottomLeft = vec2(-1.0,-1.0);
const lowp vec2 bottomRight = vec2(1.0,-1.0);


void main() {

	//if (length(gl_FragColor<0.2)) {
		gl_FragColor = texture2D(videoTexture,vUv) + 
			texture2D(texture,vUv+offset*left)*blurA +
			texture2D(texture,vUv+offset*right)*blurB +
			texture2D(texture,vUv+offset*top)*blurC +
			texture2D(texture,vUv+offset*bottom)*blurD +
			off;
	gl_FragColor.rgb = clamp(gl_FragColor.rgb,vec3(0.0),vec3(1.0+off));
	//}
}