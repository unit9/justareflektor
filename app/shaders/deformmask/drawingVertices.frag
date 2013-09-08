varying mediump vec2 vUv;
uniform sampler2D tVideo;
uniform sampler2D tAccum;

uniform mediump float drawingSize;
uniform mediump float drawingOpacity;

uniform mediump vec2 center;
uniform mediump vec2 randomUV;
uniform lowp float noiseAlpha;
uniform lowp float luminanceSnapping;
uniform mediump float accumSpeed;

uniform mediump vec3 nearestVerticeA;
uniform mediump vec3 nearestVerticeB;
uniform mediump vec3 nearestVerticeC;
uniform mediump vec3 nearestVerticeD;
uniform mediump vec3 nearestVerticeE;

const lowp vec2 ratio = vec2(1.0, 0.525);
const mediump vec3 rgb2luma = vec3(0.299,0.587,0.114);
const mediump float PI = 3.14159265;

mediump float rand( mediump vec2 co ){
    return fract( sin( dot( co.xy ,vec2( 12.9898,78.233 ) ) ) * 43758.5453 );
}


//#define ratioUV (vUv-0.5)*ratio+0.5
#define ratioUV vUv


mediump float distToVector(vec3 nearestVertice,vec2 centervec,float distToCenter) {
	
	//vec2 centervec = (  (ratioUV-center) ) ;
	//float distToCenter = max( (drawingSize - length(centervec)) / drawingSize, 0.0);
	//centervec = normalize(centervec);

	vec2 vvec = (  (ratioUV-nearestVertice.xy) );
	float distToVec = max( (drawingSize - length(vvec)) / drawingSize, 0.0);
	vvec = normalize(vvec);

	vec2 cvec = (  (center-nearestVertice.xy) ) ;
	float distcvec = max( (drawingSize - length(cvec)) / drawingSize, 0.0);
	cvec = normalize(cvec);

	float angleDiff = 0.5-length(vvec-cvec);
	return max(distToVec * angleDiff, 0.0);
}


void main() {


	float totalDist = 0.0;

	vec2 centervec = (  (ratioUV-center) ) ;
	float distToCenter = max( (drawingSize - length(centervec)) / drawingSize, 0.0);
	centervec = normalize(centervec);
	/*
	vec2 vvec = (  (ratioUV-nearestVerticeA.xy) );
	float distToVec = max( (drawingSize - length(vvec)) / drawingSize, 0.0);
	vvec = normalize(vvec);

	vec2 cvec = (  (center-nearestVerticeA.xy) ) ;
	float distcvec = max( (drawingSize - length(cvec)) / drawingSize, 0.0);
	cvec = normalize(cvec);

	totalDist = distToVec * (1.0-length(centervec-cvec));*/

	if (distToCenter > 0.0) {
		totalDist += distToVector(nearestVerticeA,centervec,distToCenter);
		totalDist += distToVector(nearestVerticeB,centervec,distToCenter);
		totalDist += distToVector(nearestVerticeC,centervec,distToCenter);
		totalDist += distToVector(nearestVerticeD,centervec,distToCenter);
		totalDist += distToVector(nearestVerticeE,centervec,distToCenter);

	}
	


/*	vec2 centervec = (  (ratioUV-nearestVerticeA.xy) - (center-nearestVerticeA.xy));
	totalDist += max( (drawingSize - length(centervec)) / drawingSize, 0.0);



	centervec = ( ratioUV-nearestVerticeB.xy);
	totalDist += max( (drawingSize - length(centervec)) / drawingSize, 0.0);

	centervec = ( ratioUV-nearestVerticeC.xy);
	totalDist += max( (drawingSize - length(centervec)) / drawingSize, 0.0);

	centervec = ( ratioUV-nearestVerticeD.xy);
	totalDist += max( (drawingSize - length(centervec)) / drawingSize, 0.0);

	centervec = ( ratioUV-nearestVerticeE.xy);
	totalDist += max( (drawingSize - length(centervec)) / drawingSize, 0.0);
*/

	gl_FragColor = vec4(vec3(totalDist),1.0);

}