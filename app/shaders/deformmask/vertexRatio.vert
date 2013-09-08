varying mediump vec2 vUv;
varying mediump vec2 ratioUV;

const lowp vec2 ratio = vec2(1.0, 0.525);

void main() {
	vUv = vec2(uv.x, 1.0 - uv.y);
	ratioUV = (vUv - 0.5) * ratio + 0.5;
	gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );
}