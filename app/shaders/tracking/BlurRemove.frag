uniform sampler2D texture;
uniform sampler2D tDiffDirection;
uniform mediump vec2 offset;
uniform mediump float threshold;

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

	mediump vec3 center = texture2D(texture,y0x0).rgb;

   	mediump float blur = 
			texture2D(texture,y1xm1).r +
			texture2D(texture,ym1xm1).r + 
			texture2D(texture,y0x0+offset).r + 
			texture2D(texture,ym1x1).r + 

			2.0 * texture2D(texture,y0xm1).r + 
			2.0 * texture2D(texture,y0x1).r + 
			2.0 * texture2D(texture,ym1x0).r + 
			2.0 * texture2D(texture,y1x0).r + 

			3.0 * center.r;

	blur /= 15.0;
	if (blur<threshold) blur = 0.0; else blur = 1.0;

	vec2 diffDir = texture2D(tDiffDirection,y0x0).xy;

    gl_FragColor = vec4( blur, center.y , diffDir.x, diffDir.y);
}