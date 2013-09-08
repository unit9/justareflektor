uniform mediump vec2 center;
uniform mediump vec2 parallaxCenter;
uniform mediump float parallaxScale;

uniform mediump float maskScale;
uniform mediump vec2 maskMatrixA;
uniform mediump vec2 maskMatrixB;

uniform mediump vec2 ratio;

varying mediump vec2 uvDiffuse;
varying mediump vec2 uvMask;


varying mediump vec2 dirAngle;



void main() {
	uvMask = (vec2(uv.x,1.0-uv.y)-vec2(0.5)+center)*maskScale*ratio*mat2(maskMatrixA.x,maskMatrixA.y,maskMatrixB.x,maskMatrixB.y)+vec2(0.5);
	uvDiffuse = (vec2(uv.x,1.0-uv.y)-vec2(0.5))*parallaxScale+parallaxCenter+vec2(0.5)*parallaxScale;
	
	dirAngle = (vec2(uv.x,1.0-uv.y)-vec2(0.5)+center)*ratio+vec2(0.5);
	//float angle = atan(dirAngle.y-0.5,dirAngle.x-0.5);
	//dirToCenter = vec2(cos(angle),sin(angle));

	gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );
}