varying mediump vec2 vUv;
varying mediump vec2 ratioUV;

uniform sampler2D tVideo;
uniform sampler2D tReveal;
uniform sampler2D tDrawing;
uniform sampler2D tAccum;
uniform sampler2D tBlob;

uniform mediump vec2 offset;
uniform mediump vec2 center;
uniform mediump float drawingSize;
uniform mediump float blobScale;
uniform mediump float accumSpeed;
uniform mediump float pass;


void main() {

	mediump vec4 blurDirections = texture2D(tReveal,vUv);
	mediump vec4 blurDrawing = texture2D(tDrawing,vUv);


	//mediump vec2 dir = blurDirections.yz * 2.0 - 1.0;

	//blurDrawing.yz * 2.0 - 1.0; //blurDirections.yz * 2.0 - 1.0; //normalize(ratioUV-center); //mix(blurDirections.yz * 2.0 - 1.0, blurDrawing.yz * 2.0 - 1.0, 0.0);
	mediump vec2 dir = blurDrawing.yz * 2.0 - 1.0 + (blurDirections.yz*2.0-1.0) * blurDirections.a*0.25;
	float dist = (blurDirections.a) + length(ratioUV-center); //blurDirections.r; //

	mediump vec2 cuv = vUv;
	mediump vec2 cuvadd = dir * dist * -0.05 * (1.0/pass); // * 1.0/pass;
	mediump vec4 result = vec4(0.0);

	for (int i = 0; i< 3; i++) {
		result += texture2D(tAccum,cuv)*2.0; // * texture2D(tDrawing,cuv).r;
		cuv += cuvadd;
	}
	result *= (0.5-length(vUv-0.5),0.0)*0.1 + (dist) * (1.0/pass) * 1.0;


	gl_FragColor = vec4(texture2D(tVideo,vUv).rgb*(1.0-blurDirections.r)*blurDirections.r+result.rgb*blurDrawing.r+blurDirections.a*0.2+blurDirections.r*0.1,1.0);
	if (pass>=4.0) gl_FragColor.rgb -= vec3(blurDirections.a);

	// float dist = 1.0/pass * texture2D(tAccum,vUv).r; //texture2D(tAccum,vUv).r*3.0;

	// float result = 
	// 	texture2D(tAccum,vUv + dist * offset * vec2(-0.75,-0.75)).r +
	// 	texture2D(tAccum,vUv + dist * offset * vec2(0.0,-1.0)).r +
	// 	texture2D(tAccum,vUv + dist * offset * vec2(0.75,-0.75)).r +
	// 	texture2D(tAccum,vUv + dist * offset * vec2(-1.0,0.0)).r +
	// 	texture2D(tAccum,vUv + dist * offset * vec2(1.0,0.0)).r +
	// 	texture2D(tAccum,vUv + dist * offset * vec2(-0.75,0.75)).r +
	// 	texture2D(tAccum,vUv + dist * offset * vec2(0.0,1.0)).r +
	// 	texture2D(tAccum,vUv + dist * offset * vec2(0.75,0.75)).r;

	// gl_FragColor = vec4(vec3(result * 0.5),1.0);



}