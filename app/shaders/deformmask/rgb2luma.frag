const mediump vec3 rgb2luma = vec3(0.299,0.587,0.114);

varying mediump vec2 vUv;

uniform sampler2D tDiffuse;

void main() {
	gl_FragColor = vec4(
		vec3(dot(texture2D(tDiffuse,vUv).rgb,rgb2luma))
	,1.0);
}