uniform sampler2D texture;
varying mediump vec2 vUv;
//varying highp vec2 uvAlpha;
//varying highp vec2 uvColor;

void main() {
	//get color
	//vec4 col = texture2D(texture,uvColor);
	//gl_FragColor = vec4(col.rgb,1.0);
	gl_FragColor = vec4(texture2D(texture,vUv).rgb,1.0);
}