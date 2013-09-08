uniform sampler2D texture;
uniform mediump vec2 offset;
uniform mediump float hardEdgeThreshold;

varying lowp vec2 y0xm1;
varying lowp vec2 y0x0;
varying lowp vec2 y0x1;

varying lowp vec2 y1xm1;
varying lowp vec2 y1x0;
varying lowp vec2 y1x1;

varying lowp vec2 ym1xm1;
varying lowp vec2 ym1x0;
varying lowp vec2 ym1x1;

const mediump vec3 whiteBalance = vec3(0.7,1.15,1.15);


void main() {

	lowp vec3 y1xm1Intensity = texture2D(texture,y1xm1).rgb*10.0;
	lowp vec3 y0xm1Intensity = texture2D(texture,y0xm1).rgb*10.0;
	lowp vec3 ym1xm1Intensity = texture2D(texture,ym1xm1).rgb*10.0;

	lowp vec3 y1x0Intensity = texture2D(texture,y1x0).rgb*10.0;
	lowp vec3 y0x0Intensity = texture2D(texture,y1x0).rgb*10.0;
	lowp vec3 ym1x0Intensity = texture2D(texture,ym1x0).rgb*10.0;

	lowp vec3 y1x1Intensity = texture2D(texture,y0x0+offset).rgb*10.0;
	lowp vec3 y0x1Intensity = texture2D(texture,y0x1).rgb*10.0;
	lowp vec3 ym1x1Intensity = texture2D(texture,ym1x1).rgb*10.0;

   	mediump vec3 h = 

		+ 1.0 * y1xm1Intensity
		+ 2.0 * y0xm1Intensity
		+ 1.0 * ym1xm1Intensity

		- 1.0 * y1x1Intensity
		- 2.0 * y0x1Intensity
		- 1.0 * ym1x1Intensity;

	mediump vec3 v = 
		+ 1.0 * y1xm1Intensity
		- 1.0 * ym1xm1Intensity

		+ 2.0 * y1x0Intensity
		- 2.0 * ym1x0Intensity

		+ 1.0 * y1x1Intensity
		- 1.0 * ym1x1Intensity;

	mediump vec3 mag = vec3(length(vec2(h.x,v.x)), length(vec2(h.y,v.y)),length(vec2(h.z,v.z)));

    gl_FragColor = vec4( (dot(mag,whiteBalance)<=hardEdgeThreshold) ? 1.0 : 0.0, 0.0 , 0.0 , 1.0);
    
}