varying mediump vec2 vUv;
varying mediump vec2 webcamUvBase;
varying mediump vec2 glitchUv;


uniform mediump float perspective;

uniform mediump vec2 rotation;
uniform mediump float rotationPerspective;
//varying highp vec3 vNormal;
//varying highp vec4 vVertex;
varying highp vec3 vReflect;
varying highp vec2 vReflectUv;

const float refractionRatio = 1.0;
uniform mediump float parallax;

#define ratio 0.525

uniform mediump vec2 uvRatio;
uniform mediump vec2 uvOffset;
uniform mediump vec2 uvRandom;
uniform mediump float uvScale;
uniform mediump float glitchScale;

void main() {
	


	vUv = vec2(uv.x,(uv.y-0.5)*ratio +0.5);
	glitchUv = (vUv-0.5) * glitchScale +0.5 + uvRandom;


	//vNormal = normal*normalMatrix;
	vec4 vVertex = vec4( position, 1.0 ) * modelViewMatrix;

	vec3 L = normalize(cameraPosition - vVertex.xyz);   
	vec3 R = normalize(reflect(-L,normal*normalMatrix));
	webcamUvBase = (R.xy/R.z) * uvRatio + 0.5;



	gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );

	webcamUvBase = mix(uv,webcamUvBase,parallax); //(gl_Position.xy/gl_Position.w);
	webcamUvBase = vec2( mix((webcamUvBase.x-0.5)*perspective + 0.5, webcamUvBase.x, webcamUvBase.y), webcamUvBase.y);
	webcamUvBase = (webcamUvBase - 0.5) * uvScale + 0.5 + uvOffset;

	//vReflectUv = (gl_Position.xy/gl_Position.w)+0.5;
}