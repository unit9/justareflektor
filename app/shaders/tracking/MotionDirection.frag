uniform sampler2D texture;
uniform sampler2D tFrameDiff;
uniform sampler2D tLastFrame;
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

	if (texture2D(tFrameDiff,y0x0).r > 0.0) {

		lowp vec3 lastFrame = texture2D(tLastFrame,y0x0).rgb;

		lowp vec3 y1xm1Intensity = abs(lastFrame-texture2D(texture,y1xm1).rgb);
		lowp vec3 y0xm1Intensity = abs(lastFrame-texture2D(texture,y0xm1).rgb);
		lowp vec3 ym1xm1Intensity = abs(lastFrame-texture2D(texture,y0x0-offset).rgb);

		lowp vec3 y1x0Intensity = abs(lastFrame-texture2D(texture,y1x0).rgb);
		lowp vec3 y0x0Intensity = abs(lastFrame-texture2D(texture,y0x0).rgb);
		lowp vec3 ym1x0Intensity = abs(lastFrame-texture2D(texture,ym1x0).rgb);

		lowp vec3 y1x1Intensity = abs(lastFrame-texture2D(texture,y1x1).rgb);
		lowp vec3 y0x1Intensity = abs(lastFrame-texture2D(texture,y0x1).rgb);
		lowp vec3 ym1x1Intensity = abs(lastFrame-texture2D(texture,ym1x1).rgb);

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