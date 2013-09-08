varying mediump vec2 vUv;
varying mediump vec2 vUvScreen;

#define ratio 0.525

void main() {
	
	vUv = vec2(uv.x,(uv.y-0.5)*ratio +0.5);
	
	gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );

	vUvScreen = (gl_Position.xy/gl_Position.z) * 0.5 + 0.5;

}