varying mediump vec2 vUv;
varying mediump vec2 ratioUV;


uniform sampler2D tVideo;
uniform sampler2D tDrawing;
uniform sampler2D tRays;

uniform vec2 center;


void main() {
	// vec4 drawing = texture2D(tDrawing,vUv);
	// vec4 videoCol = texture2D(tVideo,vUv);
	// gl_FragColor  = videoCol +  drawing * min(pow(length(videoCol-drawing),1.0+drawingAdditive) * drawing.a, 1.0) * drawingAlpha;


	// // + texture2D(tDrawing,vUv)*drawingAdditive*drawing.a;


	vec4 drawing = texture2D(tDrawing,vUv);
	vec4 videoCol = texture2D(tVideo,vUv);
	vec4 raysCol = texture2D(tRays,vUv);

	mediump float dist = 1.0-length(ratioUV-center);
	mediump float mixv = (drawing.r * 0.5 + dist * 0.5);
 
	gl_FragColor = raysCol * mixv; //* (1.0-mixv);
	//videoCol * mixv + raysCol * 


}