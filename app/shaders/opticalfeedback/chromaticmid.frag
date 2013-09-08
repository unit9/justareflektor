varying mediump vec2 vUv;

uniform sampler2D tVideo;
uniform sampler2D tMask;
uniform mediump vec2 offset;
uniform mediump vec2 center;
uniform lowp float alpha;


void main() {

	float angle = atan(center.y-vUv.y,center.x-vUv.x);
	vec2 dir = vec2(cos(angle),sin(angle));
	float off = texture2D(tMask,vUv).r*alpha*20.0+1.0;
	vec4 ocol = texture2D(tVideo,vUv);
	vec3 col = vec3(
		texture2D(tVideo,vUv+dir*offset*off*0.0).r,
		texture2D(tVideo,vUv+dir*offset*off*1.0).g,
		texture2D(tVideo,vUv+dir*offset*off*2.0).b);

	gl_FragColor = vec4(col,ocol.a);
}