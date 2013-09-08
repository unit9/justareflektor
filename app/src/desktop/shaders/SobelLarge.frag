


uniform sampler2D texture;
uniform mediump vec2 offset;
uniform mediump float hardEdgeThreshold;

varying lowp vec2 y2xm2;
varying lowp vec2 y1xm2;
varying lowp vec2 y0xm2;
varying lowp vec2 ym1xm2;
varying lowp vec2 ym2xm2;

varying lowp vec2 y2xm1;
varying lowp vec2 y1xm1;
varying lowp vec2 y0xm1;
varying lowp vec2 ym1xm1;
varying lowp vec2 ym2xm1;

varying lowp vec2 y2x0;
varying lowp vec2 y1x0;
varying lowp vec2 y0x0;
varying lowp vec2 ym1x0;
varying lowp vec2 ym2x0;

varying lowp vec2 y2x1;
varying lowp vec2 y1x1;
varying lowp vec2 y0x1;
varying lowp vec2 ym1x1;
varying lowp vec2 ym2x1;

varying lowp vec2 y2x2;
varying lowp vec2 y1x2;
varying lowp vec2 y0x2;
varying lowp vec2 ym1x2;
varying lowp vec2 ym2x2;



const float PI = 3.14159265358979323846264;
const float TWOPI = 2.0*3.14159265358979323846264;
const float HALF_PI = 0.5*3.14159265358979323846264;

const mediump vec3 addAngle = vec3(1.0);
const mediump vec3 whiteBalance = vec3(0.7,1.15,1.15);

void main() {

	lowp vec3 y2xm2Intensity = texture2D(texture,y2xm2).rgb;
	lowp vec3 y1xm2Intensity = texture2D(texture,y1xm2).rgb;
	lowp vec3 y0xm2Intensity = texture2D(texture,y0xm2).rgb;
	lowp vec3 ym1xm2Intensity = texture2D(texture,ym1xm2).rgb;
	lowp vec3 ym2xm2Intensity = texture2D(texture,ym2xm2).rgb;

	lowp vec3 y2xm1Intensity = texture2D(texture,y2xm1).rgb;
	lowp vec3 y1xm1Intensity = texture2D(texture,y1xm1).rgb;
	lowp vec3 y0xm1Intensity = texture2D(texture,y0xm1).rgb;
	lowp vec3 ym1xm1Intensity = texture2D(texture,ym1xm1).rgb;
	lowp vec3 ym2xm1Intensity = texture2D(texture,ym2xm1).rgb;

	lowp vec3 y2x0Intensity = texture2D(texture,y2x0).rgb;
	lowp vec3 y1x0Intensity = texture2D(texture,y1x0).rgb;
	lowp vec3 y0x0Intensity = texture2D(texture,y0x0).rgb;
	lowp vec3 ym1x0Intensity = texture2D(texture,ym1x0).rgb;
	lowp vec3 ym2x0Intensity = texture2D(texture,ym2x0).rgb;

	lowp vec3 y2x1Intensity = texture2D(texture,y2x1).rgb;
	lowp vec3 y1x1Intensity = texture2D(texture,y1x1).rgb;
	lowp vec3 y0x1Intensity = texture2D(texture,y0x1).rgb;
	lowp vec3 ym1x1Intensity = texture2D(texture,ym1x1).rgb;
	lowp vec3 ym2x1Intensity = texture2D(texture,ym2x1).rgb;

	lowp vec3 y2x2Intensity = texture2D(texture,y2x2).rgb;
	lowp vec3 y1x2Intensity = texture2D(texture,y1x2).rgb;
	lowp vec3 y0x2Intensity = texture2D(texture,y0x2).rgb;
	lowp vec3 ym1x2Intensity = texture2D(texture,ym1x2).rgb;
	lowp vec3 ym2x2Intensity = texture2D(texture,ym2x2).rgb;


   	mediump vec3 h = 
   		2.0 * y2xm2Intensity
		+ 3.0 * y1xm2Intensity
		+ 4.0 * y0xm2Intensity
		+ 3.0 * ym1xm2Intensity
		+ 2.0 * ym2xm2Intensity

		+ 1.0 * y2xm1Intensity
		+ 2.0 * y1xm1Intensity
		+ 3.0 * y0xm1Intensity
		+ 2.0 * ym1xm1Intensity
		+ 1.0 * ym2xm1Intensity

		//+ 0.0 * y2x0Intensity
		//+ 0.0 * y1x0Intensity
		//+ 0.0 * y0x0Intensity
		//+ 0.0 * ym1x0Intensity
		//+ 0.0 * ym2x0Intensity

		- 1.0 * y2x1Intensity
		- 2.0 * y1x1Intensity
		- 3.0 * y0x1Intensity
		- 2.0 * ym1x1Intensity
		- 1.0 * ym2x1Intensity

		- 2.0 * y2x2Intensity
		- 3.0 * y1x2Intensity
		- 4.0 * y0x2Intensity
		- 3.0 * ym1x2Intensity
		- 2.0 * ym2x2Intensity;

	mediump vec3 v = 
   		2.0 * y2xm2Intensity
		+ 1.0 * y1xm2Intensity
		//+ 0.0 * y0xm2Intensity
		- 1.0 * ym1xm2Intensity
		- 2.0 * ym2xm2Intensity

		+ 3.0 * y2xm1Intensity
		+ 2.0 * y1xm1Intensity
		//+ 0.0 * y0xm1Intensity
		- 2.0 * ym1xm1Intensity
		- 3.0 * ym2xm1Intensity

		+ 4.0 * y2x0Intensity
		+ 3.0 * y1x0Intensity
		//+ 0.0 * y0x0Intensity
		- 3.0 * ym1x0Intensity
		- 4.0 * ym2x0Intensity

		+ 3.0 * y2x1Intensity
		+ 2.0 * y1x1Intensity
		//- 0.0 * y0x1Intensity
		- 2.0 * ym1x1Intensity
		- 3.0 * ym2x1Intensity

		+ 2.0 * y2x2Intensity
		+ 1.0 * y1x2Intensity
		//- 0.0 * y0x2Intensity
		- 1.0 * ym1x2Intensity
		- 2.0 * ym2x2Intensity;



	vec3 mag = vec3(length(vec2(h.x,v.x)), length(vec2(h.y,v.y)),length(vec2(h.z,v.z)));

	/*mag = vec3(
		mag.x>threshold ? 1.0 : 0.0,
		mag.y>threshold ? 1.0 : 0.0,
		mag.z>threshold ? 1.0 : 0.0
	);*/
	//if (length(mag) >= 3.0) mag = vec3(0.0); else mag = vec3(1.0);
	//if (dot(mag,addAngle) >= 3.0) mag = vec3(0.0); else mag = vec3(1.0);
    //gl_FragColor = vec4(mag,1.0);

    //vec3 heh = vec3(length(y0x0Intensity-ym1x0Intensity-y1x0Intensity));
    lowp float hardEdge = (dot(mag,whiteBalance)<=hardEdgeThreshold) ? 0.0 : 1.0;
    //mag = normalize(mag);
    lowp float maxedge = 1.0-max(max(mag.x,mag.y),mag.z);
    //lowp float minedge = min(min(mag.x,mag.y),mag.z);
    //lowp float softEdge = (maxedge-minedge)-0.5; //1.0-max((maxedge-minedge)*0.025-0.01,0.0)*200.0;


    gl_FragColor = vec4( 1.0-hardEdge, 0.0 , 0.0 ,1.0);
}