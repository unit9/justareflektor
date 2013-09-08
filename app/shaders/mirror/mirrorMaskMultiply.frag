varying mediump vec2 vUv;

uniform sampler2D tVideo;
uniform sampler2D tMask;
uniform mediump vec4 maskAlpha;

void main() {

	gl_FragColor = vec4(texture2D(tVideo,vUv).rgb * dot(texture2D(tMask,vUv),maskAlpha),1.0);

}