varying mediump vec2 vUv;

uniform sampler2D tEdges;
uniform sampler2D tAccum;
uniform mediump float delta;

void main() {

	gl_FragColor = vec4(texture2D(tEdges,vUv).gba * delta + texture2D(tAccum,vUv).rgb * (1.0-delta), 1.0);
	
}