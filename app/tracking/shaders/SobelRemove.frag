


uniform sampler2D texture;
uniform sampler2D textureGreen;
uniform mediump vec2 offset;
uniform mediump float threshold;

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


void main() {


	lowp float y2xm2Intensity = texture2D(texture,y2xm2).r;
	lowp float y1xm2Intensity = texture2D(texture,y1xm2).r;
	lowp float y0xm2Intensity = texture2D(texture,y0xm2).r;
	lowp float ym1xm2Intensity = texture2D(texture,ym1xm2).r;
	lowp float ym2xm2Intensity = texture2D(texture,ym2xm2).r;

	lowp float y2xm1Intensity = texture2D(texture,y2xm1).r;
	lowp float y1xm1Intensity = texture2D(texture,y1xm1).r;
	lowp float y0xm1Intensity = texture2D(texture,y0xm1).r;
	lowp float ym1xm1Intensity = texture2D(texture,ym1xm1).r;
	lowp float ym2xm1Intensity = texture2D(texture,ym2xm1).r;

	lowp float y2x0Intensity = texture2D(texture,y2x0).r;
	lowp float y1x0Intensity = texture2D(texture,y1x0).r;
	lowp float y0x0Intensity = texture2D(texture,y0x0).r;
	lowp float ym1x0Intensity = texture2D(texture,ym1x0).r;
	lowp float ym2x0Intensity = texture2D(texture,ym2x0).r;

	lowp float y2x1Intensity = texture2D(texture,y2x1).r;
	lowp float y1x1Intensity = texture2D(texture,y1x1).r;
	lowp float y0x1Intensity = texture2D(texture,y0x1).r;
	lowp float ym1x1Intensity = texture2D(texture,ym1x1).r;
	lowp float ym2x1Intensity = texture2D(texture,ym2x1).r;

	lowp float y2x2Intensity = texture2D(texture,y2x2).r;
	lowp float y1x2Intensity = texture2D(texture,y1x2).r;
	lowp float y0x2Intensity = texture2D(texture,y0x2).r;
	lowp float ym1x2Intensity = texture2D(texture,ym1x2).r;
	lowp float ym2x2Intensity = texture2D(texture,ym2x2).r;


   	mediump float blur = 
   		1.0 * y2xm2Intensity
		+ 2.0 * y1xm2Intensity
		+ 3.0 * y0xm2Intensity
		+ 2.0 * ym1xm2Intensity
		+ 1.0 * ym2xm2Intensity

		+ 2.0 * y2xm1Intensity
		+ 3.0 * y1xm1Intensity
		+ 4.0 * y0xm1Intensity
		+ 3.0 * ym1xm1Intensity
		+ 2.0 * ym2xm1Intensity

		+ 3.0 * y2x0Intensity
		+ 4.0 * y1x0Intensity
		+ 5.0 * y0x0Intensity
		+ 4.0 * ym1x0Intensity
		+ 3.0 * ym2x0Intensity

		+ 2.0 * y2x1Intensity
		+ 3.0 * y1x1Intensity
		+ 4.0 * y0x1Intensity
		+ 3.0 * ym1x1Intensity
		+ 2.0 * ym2x1Intensity

		+ 1.0 * y2x2Intensity
		+ 2.0 * y1x2Intensity
		+ 3.0 * y0x2Intensity
		+ 2.0 * ym1x2Intensity
		+ 1.0 * ym2x2Intensity;

	blur /= 65.0;
	if (blur<threshold) blur = 0.0; else blur = 1.0;

    gl_FragColor = vec4( blur, texture2D(textureGreen,y0x0).r , 0.0 ,1.0);
}