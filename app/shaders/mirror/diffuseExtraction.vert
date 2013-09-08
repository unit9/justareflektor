uniform highp float maskRatio; //division of alpha | color ratio in the video. Should be 0.25 in most cases.
varying highp vec2 vUv;

void main() {
	vUv = vec2(uv.x*(1.0-maskRatio) + maskRatio,1.0-uv.y);
	gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );
}
