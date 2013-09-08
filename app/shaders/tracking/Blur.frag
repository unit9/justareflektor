uniform sampler2D texture;
uniform mediump vec2 offset;

varying lowp vec2 y0xm1;
varying lowp vec2 y0x0;
varying lowp vec2 y0x1;

varying lowp vec2 y1xm1;
varying lowp vec2 y1x0;
varying lowp vec2 y1x1;

varying lowp vec2 ym1xm1;
varying lowp vec2 ym1x0;
varying lowp vec2 ym1x1;

void main() {

	lowp vec3 y1xm1Intensity = texture2D(texture,y1xm1).rgb;
	lowp vec3 y0xm1Intensity = texture2D(texture,y0xm1).rgb;
	lowp vec3 ym1xm1Intensity = texture2D(texture,ym1xm1).rgb;

	lowp vec3 y1x0Intensity = texture2D(texture,y1x0).rgb;
	lowp vec3 y0x0Intensity = texture2D(texture,y0x0).rgb;
	lowp vec3 ym1x0Intensity = texture2D(texture,ym1x0).rgb;

	lowp vec3 y1x1Intensity = texture2D(texture,y0x0+offset).rgb;
	lowp vec3 y0x1Intensity = texture2D(texture,y0x1).rgb;
	lowp vec3 ym1x1Intensity = texture2D(texture,ym1x1).rgb;

	mediump vec3 mag = 
		1.0 * y1xm1Intensity + 
		1.0 * y0xm1Intensity +
		1.0 * ym1xm1Intensity +

		1.0 * y1x0Intensity +
		2.0 * y0x0Intensity + 
		1.0 * ym1x0Intensity +

		1.0 * y1x1Intensity +
		1.0 * y0x1Intensity +
		1.0 * ym1x1Intensity;

	mag /= 10.0;

	gl_FragColor = vec4(mag,1.0);
}