uniform sampler2D texture;
uniform sampler2D tLastFrame;
uniform sampler2D tFrameDiff;
uniform mediump vec2 offset;

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

	if (texture2D(tFrameDiff,y0x0).r > 0.0) {

		lowp vec3 lastFrame = texture2D(tLastFrame,y0x0).rgb;

		lowp vec3 y2xm2Intensity = abs(lastFrame-texture2D(texture,y2xm2).rgb);
		lowp vec3 y1xm2Intensity = abs(lastFrame-texture2D(texture,y1xm2).rgb);
		lowp vec3 y0xm2Intensity = abs(lastFrame-texture2D(texture,y0xm2).rgb);
		lowp vec3 ym1xm2Intensity = abs(lastFrame-texture2D(texture,ym1xm2).rgb);
		lowp vec3 ym2xm2Intensity = abs(lastFrame-texture2D(texture,ym2xm2).rgb);

		lowp vec3 y2xm1Intensity = abs(lastFrame-texture2D(texture,y2xm1).rgb);
		lowp vec3 y1xm1Intensity = abs(lastFrame-texture2D(texture,y1xm1).rgb);
		lowp vec3 y0xm1Intensity = abs(lastFrame-texture2D(texture,y0xm1).rgb);
		lowp vec3 ym1xm1Intensity = abs(lastFrame-texture2D(texture,ym1xm1).rgb);
		lowp vec3 ym2xm1Intensity = abs(lastFrame-texture2D(texture,ym2xm1).rgb);

		lowp vec3 y2x0Intensity = abs(lastFrame-texture2D(texture,y2x0).rgb);
		lowp vec3 y1x0Intensity = abs(lastFrame-texture2D(texture,y1x0).rgb);
		lowp vec3 y0x0Intensity = abs(lastFrame-texture2D(texture,y0x0).rgb);
		lowp vec3 ym1x0Intensity = abs(lastFrame-texture2D(texture,ym1x0).rgb);
		lowp vec3 ym2x0Intensity = abs(lastFrame-texture2D(texture,ym2x0).rgb);

		lowp vec3 y2x1Intensity = abs(lastFrame-texture2D(texture,y2x1).rgb);
		lowp vec3 y1x1Intensity = abs(lastFrame-texture2D(texture,y1x1).rgb);
		lowp vec3 y0x1Intensity = abs(lastFrame-texture2D(texture,y0x1).rgb);
		lowp vec3 ym1x1Intensity = abs(lastFrame-texture2D(texture,ym1x1).rgb);
		lowp vec3 ym2x1Intensity = abs(lastFrame-texture2D(texture,ym2x1).rgb);

		lowp vec3 y2x2Intensity = abs(lastFrame-texture2D(texture,y2x2).rgb);
		lowp vec3 y1x2Intensity = abs(lastFrame-texture2D(texture,y1x2).rgb);
		lowp vec3 y0x2Intensity = abs(lastFrame-texture2D(texture,y0x2).rgb);
		lowp vec3 ym1x2Intensity = abs(lastFrame-texture2D(texture,ym1x2).rgb);
		lowp vec3 ym2x2Intensity = abs(lastFrame-texture2D(texture,ym2x2).rgb);


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



		mediump vec3 mag = vec3(length(vec2(h.x,v.x)), length(vec2(h.y,v.y)),length(vec2(h.z,v.z)));

		mediump float magnitude = length(mag);
		mediump vec2 rDir = normalize(vec2(h.x,v.x)); 
		mediump vec2 gDir = normalize(vec2(h.y,v.y)); 
		mediump vec2 bDir = normalize(vec2(h.z,v.z)); 
		mediump vec2 avgdir = max(normalize( (rDir + gDir + bDir) / 3.0) * 0.5 + 0.5,0.01);

	    gl_FragColor = vec4( avgdir.x, avgdir.y, magnitude ,1.0); //length(mag)

    } else {

    	gl_FragColor = vec4(0.0,0.0,0.0,1.0);

    }
}