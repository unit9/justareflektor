varying mediump vec2 vUv;
varying mediump vec2 ratioUV;

uniform sampler2D tVideo;
uniform sampler2D tDrawing;
uniform sampler2D tAccum;
uniform sampler2D tBlob;

uniform mediump vec2 offset;
uniform mediump vec2 center;
uniform mediump float drawingSize;
uniform mediump float blobScale;
uniform mediump float accumSpeed;
uniform mediump float exposure;


void main() {


	//the blob
	mediump vec2 centerInv = center * -2.0 + 1.0;
	centerInv = centerInv*0.5 + 0.5;
	mediump vec2 blobUV = (ratioUV - 0.5 ) * blobScale + center;
	mediump float blobCol = 1.0-texture2D(tBlob,blobUV).r;

	//the buffers
	mediump vec3 videoCol = texture2D(tVideo,vUv).rgb;
	mediump vec3 drawingCol = texture2D(tDrawing,vUv).rgb;
	mediump vec3 accumCol = texture2D(tAccum,vUv).rgb;

	mediump float dist = drawingCol.r; // * clamp((drawingSize*0.5 - length(ratioUV-centerInv)) / drawingSize*2.0,0.0,1.0);
	mediump vec2 dir = drawingCol.gb * 2.0 - 1.0;//normalize(center-ratioUV);



	//
	// video edges
	//
	mediump vec2 edge = vec2(
		(texture2D(tVideo,vUv+offset*vec2(-1.0,-0.75)).r +
		texture2D(tVideo,vUv+offset*vec2(-1.25,0.0)).r +
		texture2D(tVideo,vUv+offset*vec2(-1,0.75)).r)*-1.0 +

		(texture2D(tVideo,vUv+offset*vec2(1.0,-0.75)).r +
		texture2D(tVideo,vUv+offset*vec2(1.25,0.0)).r +
		texture2D(tVideo,vUv+offset*vec2(1.0,0.75)).r),

		(texture2D(tVideo,vUv+offset*vec2(-1.0,-1.0)).r +
		texture2D(tVideo,vUv+offset*vec2(0.0,-1.25)).r +
		texture2D(tVideo,vUv+offset*vec2(0.0,-1.0)).r)*-1.0 +

		(texture2D(tVideo,vUv+offset*vec2(-0.75,1.0)).r +
		texture2D(tVideo,vUv+offset*vec2(-1.0,1.0)).r +
		texture2D(tVideo,vUv+offset*vec2(-0.75,1.0)).r));

	mediump vec2 edgeDir = normalize(edge)*0.5 + 0.5;
	mediump float edgePow = length(edge);



	//
	// Blur it
	//


	gl_FragColor =  vec4( pow(length(videoCol)*drawingCol.r,3.0),edgeDir.x,edgeDir.y,edgePow); //videoCol * accumCol*exposure + videoCol,(dist*0.4+accumCol)); //vec4(videoCol ,dist*0.4+accumCol); //0.05*length(dist*videoCol)+dist*0.01+accumCol); //vec4(videoCol * dist * vec3(1.0+accumCol), accumCol + 0.25 * (blobCol+dist) * (1.0-length(videoCol))); // vec4(vec3(1.0-blobCol.a),0.0);
	//gl_FragColor.rgb *= dist;
	//gl_FragColor.rgb *= gl_FragColor.a;
}