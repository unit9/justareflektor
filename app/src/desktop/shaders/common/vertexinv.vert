varying mediump vec2 vUv;
uniform bool inv;

void main() {
	if (!inv) vUv = uv; else vUv = vec2(uv.x,uv.y);
	gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );
}