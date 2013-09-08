varying highp vec2 vUv;
varying highp vec2 vUvNoise;
uniform lowp vec2 randomOffset;

void main() {
	vUv = vec2(uv.x,1.0-uv.y);
	vUvNoise = uv + randomOffset;
	gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );
}
