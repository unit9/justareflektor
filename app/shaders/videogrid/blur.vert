varying mediump vec2 vUv;
varying mediump vec2 uvLeft;
varying mediump vec2 uvRight;
varying mediump vec2 uvTop;
varying mediump vec2 uvBottom;

varying mediump vec2 uvTopLeft;
varying mediump vec2 uvTopRight;
varying mediump vec2 uvBottomLeft;

uniform mediump vec2 offset;


void main() {

	vUv = vec2(uv.x,1.0-uv.y);

	uvLeft = vUv+vec2(-offset.x,0.0);
	uvRight = vUv+vec2(offset.x,0.0);
	uvTop = vUv+vec2(0.0,-offset.y);
	uvBottom = vUv+vec2(0.0,offset.y);

	uvTopLeft = vUv+vec2(-offset.x,-offset.y);
	uvTopRight = vUv+vec2(offset.x,-offset.y);
	uvBottomLeft = vUv+vec2(-offset.x,offset.y);

	gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );
}