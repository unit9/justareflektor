uniform highp float alphaRatio; //division of alpha | color ratio in the video. Should be 0.25 in most cases.
uniform highp float pixelFix;


varying highp vec2 uvAlpha;
varying highp vec2 uvColor;

void main() {
	uvAlpha = vec2(uv.x*alphaRatio+pixelFix,1.0-uv.y+pixelFix);
	uvColor = vec2(uv.x*(1.0-alphaRatio) + alphaRatio+pixelFix,1.0-uv.y+pixelFix);
	gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );
}
