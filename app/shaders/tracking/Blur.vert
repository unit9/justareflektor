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

	ym1xm1 = uv+offset*vec2(-1.0,-1.0);
	ym1x0 = uv+offset*vec2(0.0,-1.0);
	ym1x1 = uv+offset*vec2(1.0,-1.0);

	y0xm1 = uv+offset*vec2(-1.0,0.0);
	y0x0 = uv+offset*vec2(0.0,0.0);
	y0x1 = uv+offset*vec2(1.0,0.0);

	y1xm1 = uv+offset*vec2(-1.0,1.0);
	y1x0 = uv+offset*vec2(0.0,1.0);
	y1x1 = uv+offset*vec2(1.0,1.0);

	gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );

}