uniform sampler2D texture;

varying highp vec2 vUv;

void main() {

	
	gl_FragColor = vec4(texture2D(texture,vUv).rgb, 1.0);


}