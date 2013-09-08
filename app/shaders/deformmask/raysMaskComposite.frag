varying mediump vec2 vUv;
varying mediump vec2 ratioUV;

uniform sampler2D tVideo;
uniform sampler2D tRays;
uniform sampler2D tDrawing;
uniform sampler2D tFeedback;

uniform mediump vec2 center;
uniform mediump float drawingSize;
uniform mediump float maskDistance;

const mediump vec3 rgb2luma = vec3(0.299,0.587,0.114);

void main() {

	//buffers
	mediump vec4 videoCol = texture2D(tVideo,vUv);
	mediump vec4 raysCol = texture2D(tRays,vUv);
	mediump vec4 drawingCol = texture2D(tDrawing,vUv);
	mediump vec4 feedbackCol = texture2D(tFeedback,vUv);

	mediump float luminance = dot(videoCol.rgb,rgb2luma);
	mediump float maskLuminance = dot(raysCol.rgb,rgb2luma);
	mediump float feedbackLuminance = dot(feedbackCol.rgb,rgb2luma);

	float diff = abs(maskLuminance-luminance);
	// float diffRays = abs(maskLuminance-feedbackLuminance);
	float diff2 = pow(abs(maskLuminance),2.0);

	// float dist = pow(length(center-ratioUV)/drawingSize,3.0);

	// //gl_FragColor = vec4(raysCol.rgb * (1.0+vec3( clamp(diff,0.0,1.0))),1.0);
	// gl_FragColor = vec4(   (feedbackCol.rgb*feedbackLuminance +  raysCol.rgb) * (1.0-vec3(clamp(diff2*dist,0.0,1.0))),1.0);



	//gl_FragColor = vec4(raysCol.rgb,1.0);

	mediump float dist = diff + (1.0-drawingCol.r); //length(center-ratioUV)/drawingSize; //10.0 * (drawingSize - length(center-ratioUV))/drawingSize;
	mediump float dist2 = pow(dist,2.0+diff2+diff);

	mediump float raysMaskDiff = abs(dist2-dist);

	//result
	//float mixv = clamp((1.0-dist2),0.0,1.0) * dist2 + raysMaskDiff;
	float mixv = clamp(dist2 ,0.0,1.0);
	vec3 finalCol = mix(feedbackCol.rgb,raysCol.rgb ,mixv);
	gl_FragColor = vec4(mix(finalCol,feedbackCol.rgb*(1.0-mixv),mixv),1.0);//vec4(mix(feedbackCol.rgb,raysCol.rgb,mixv),1.0);
	//gl_FragColor.rgb = mix(gl_FragColor.rgb,raysCol,drawingCol.r)
	gl_FragColor = vec4(raysCol.rgb * clamp(drawingCol.r*1.1-0.05,0.0,1.0),1.0);
	//gl_FragColor = vec4(feedbackCol.rgb,1.0);
}