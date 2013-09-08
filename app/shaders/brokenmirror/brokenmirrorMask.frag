varying mediump vec2 vUv;
varying mediump vec2 vUvScreen;

uniform sampler2D tVideo;
uniform sampler2D tMask;

void main() {
	
	gl_FragColor = (texture2D(tVideo,vUvScreen) * vec4(texture2D(tMask,vUv).r)); //texture2D(tVideo,vUvScreen) * 
	
}