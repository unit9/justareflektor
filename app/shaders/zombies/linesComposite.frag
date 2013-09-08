varying mediump vec2 vUv;

uniform sampler2D tVideo;
uniform sampler2D tLines;
uniform mediump vec2 noiseuv;


void main() {
	gl_FragColor = texture2D(tVideo,vec2(vUv.x,vUv.y)) + texture2D(tLines,vec2(vUv.x,1.0-vUv.y));

}