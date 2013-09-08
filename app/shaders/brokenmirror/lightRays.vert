varying mediump vec2 vUv;
varying mediump float randomp;  //because some older system require samplers to use a straight varying
uniform mediump vec2 randomuv;


void main() {
	vUv = vec2(uv.x,1.0-uv.y);
	randomp = randomuv.x;
	gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );
}