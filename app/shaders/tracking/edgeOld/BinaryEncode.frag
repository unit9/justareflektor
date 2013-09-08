uniform sampler2D texture;
varying mediump vec2 vUv;

void main() {

	mediump vec2 uv = vec2(mod(vUv.x-vUv.y,1.0),vUv.y);
	gl_FragColor = vec4(texture2D(texture, uv).r > 0.0 ? 1.0 : 0.0);

}