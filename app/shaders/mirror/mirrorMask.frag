uniform sampler2D texture;
varying highp vec2 vUv;

uniform lowp float mirrorThreshold;
uniform mediump vec2 offset;

void main() {
	if (vUv.x >= 0.25 || vUv.x<= 0.0) discard;
	vec3 col = texture2D(texture,vUv).rgb;

	col.b =
		col.b * 0.2 + 
		texture2D(texture,vUv+vec2(offset.x,offset.y)).b * 0.2 +
		texture2D(texture,vUv+vec2(-offset.x,-offset.y)).b * 0.2 +
		texture2D(texture,vUv+vec2(-offset.x,offset.y)).b * 0.2 +
		texture2D(texture,vUv+vec2(offset.x,-offset.y)).b * 0.2;



	gl_FragColor = vec4(
			col.g,
			col.b,
			0.0,
			//cos(col.b*6.0)*0.5+0.5,
			//sin(col.b*6.0)*0.5+0.5,
			col.r-col.g-col.b);

/*
	//mirrorkid
	if (col.r <= mirrorThreshold) {
		gl_FragColor = vec4(
			col.b,
			col.g,
			0.0,
			0.0);
	
	//mirror hand
	} else {
		gl_FragColor = vec4(
			0.0,
			0.0,
			col.b,
			col.g);
	}
*/
}