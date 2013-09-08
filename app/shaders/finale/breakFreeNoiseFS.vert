varying mediump vec2 vUv;
varying mediump vec2 uvBreakFree;
varying highp vec2 uvNoise;

uniform highp vec2 randomUV;
uniform mediump vec2 glitchScale;
uniform mediump float breakFreeSize;

const mediump vec2 noiseRatio = vec2(0.525,1.0);
const mediump vec2 videoRatio = vec2(1.0,0.525);
const mediump vec2 breakFreeRatio = vec2(595.0/981.0,1.0);


void main() {
	vUv = vec2(uv.x,1.0-uv.y);

	uvBreakFree = (vUv - 0.5) * breakFreeRatio * videoRatio * breakFreeSize + 0.5;

	uvNoise = (vUv - 0.5) * videoRatio * glitchScale + 0.5 + randomUV;

	gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );
}