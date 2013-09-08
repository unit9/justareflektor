varying mediump vec2 vUv;

uniform sampler2D tVideo;
uniform sampler2D tMask;
uniform mediump vec2 offset;
uniform mediump vec2 center;
uniform lowp float alpha;


void main() {

	float angle = atan(center.y-vUv.y,center.x-vUv.x);
	vec2 dir = vec2(cos(angle),sin(angle));
	vec4 ocol = texture2D(tVideo,vUv);
	vec3 col = vec3(
		texture2D(tVideo,vUv+dir*offset*0.0).r,
		texture2D(tVideo,vUv+dir*offset*10.0*alpha).g*1.2,
		texture2D(tVideo,vUv+dir*offset*20.0*alpha).b)*1.2;
	col = mix(ocol.rgb,col,alpha);
	gl_FragColor = vec4(col,ocol.a);
}