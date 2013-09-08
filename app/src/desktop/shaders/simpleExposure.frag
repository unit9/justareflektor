uniform sampler2D texture;
varying mediump vec2 vUv;

uniform mediump float exposure;
uniform mediump float offset;

const lowp vec4 zerov = vec4(0.0);
const lowp vec4 onev = vec4(1.0);

void main() {
	gl_FragColor = clamp((texture2D(texture,vUv)+offset)*exposure,zerov,onev);
}