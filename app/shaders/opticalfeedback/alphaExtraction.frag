uniform sampler2D texture;
varying highp vec2 uvAlpha;
varying highp vec2 uvColor;


const mediump vec3  rgb2luma = vec3(0.299,0.587,0.114);
//vec3(0.3333,0.3333,0.3333);


void main() {
	//get color
	vec4 col = texture2D(texture,uvColor);

	//get alpha
	vec4 alpha = texture2D(texture,uvAlpha);
	
	//reconstruct
	gl_FragColor = vec4(col.rgb,alpha.r);
}