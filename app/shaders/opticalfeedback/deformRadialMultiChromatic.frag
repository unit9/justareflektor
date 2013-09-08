varying mediump vec2 vUv;

uniform sampler2D tVideo;
uniform sampler2D tMask;
uniform mediump vec2 offset;
uniform mediump vec2 center;
uniform lowp float alpha;
uniform lowp float fade;



#define MAX_SAMPLES 7.0

vec3 alphacol(in vec4 col) {
	return col.rgb*col.a;
}

void main() {

	lowp float angle = atan(vUv.y-center.y,vUv.x-center.x);
	lowp vec2 dir = vec2(cos(angle),sin(angle));
	lowp float dist = distance(vUv,center);

	lowp float deformp = texture2D(tMask,vUv).r;


	float offsetpixelnum = offset.x*0.25+offset.y*0.25;
	lowp float defpc = abs(dist-(dist*(1.0-deformp*alpha)));
	float defnum =  max(min(ceil(defpc/offsetpixelnum),MAX_SAMPLES),1.0);


	mediump vec2 cuv = center+dir*dist*(1.0-deformp*alpha);
	mediump vec2 cuvadd = (cuv-vUv) / defnum;
	mediump vec4 col; 

	lowp float i=0.0;
	/*if (i<defnum) {
		col += texture2D(tVideo,cuv).rgb*vec3(1.0,1.0,1.0); 
		cuv -= cuvadd;
		i++;

		//red
		if (i<defnum) {
			col += texture2D(tVideo,cuv).rgb*vec3(alpha*3.0,0.0,0.0); 
			cuv -= cuvadd;
			i++;
			//yellow
			if (i<defnum) {
				col += texture2D(tVideo,cuv).rgb*vec3(0.5,0.5,0.0); 
				cuv -= cuvadd;
				i++;
				//green
				if (i<defnum) {
					col += texture2D(tVideo,cuv).rgb*vec3(0.0,alpha*3.0,0.0); 
					cuv -= cuvadd;
					i++;
					//teal
					if (i<defnum) {
						col += texture2D(tVideo,cuv).rgb*vec3(0.0,0.5,1.0); 
						cuv -= cuvadd;
						i++;
						//blue
						if (i<defnum) {
							col += texture2D(tVideo,cuv).rgb*vec3(0.0,0.0,alpha*3.0); 
							cuv -= cuvadd;
							i++;
						}
					}
				}
			}
		}
	}*/
	//if (i<defnum) {
		col += texture2D(tVideo,cuv)*vec4(1.0,1.0,1.0,1.0); 
		cuv -= cuvadd;
		i++;

		//red
		if (i<defnum) {
			col += texture2D(tVideo,cuv)*vec4(0.0,0.0,alpha*3.0,1.0); 
			cuv -= cuvadd;
			i++;
			//yellow
			if (i<defnum) {
				col += texture2D(tVideo,cuv)*vec4(0.0,0.5,1.0,1.0); 
				cuv -= cuvadd;
				i++;
				//green
				if (i<defnum) {
					col += texture2D(tVideo,cuv)*vec4(0.0,alpha*4.0,0.0,1.0); 
					cuv -= cuvadd;
					i++;
					//teal
					if (i<defnum) {
						col += texture2D(tVideo,cuv)*vec4(0.5,0.5,0.0,1.0); 
						cuv -= cuvadd;
						i++;
						//blue
						if (i<defnum) {
							col += texture2D(tVideo,cuv)*vec4(alpha*4.0,0.0,0.0,1.0); 
							cuv -= cuvadd;
							i++;
						}
					}
				}
			}
		}
	//}

	//col = col*(1.0)/max(defnum-1.0,1.0);


	gl_FragColor = vec4(col.rgb*fade,col.a);
}