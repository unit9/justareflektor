uniform sampler2D texture;
varying highp vec2 uvAlpha;
varying highp vec2 uvColor;


void main() {
	gl_FragColor = texture2D(texture,uvAlpha).yzxx;
}