varying mediump vec2 vUv;

uniform lowp float drawingAdditive;
uniform lowp float drawingAlpha;
uniform sampler2D tVideo;
uniform sampler2D tDrawing;

void main() {
	
	vec4 drawing = texture2D(tDrawing,vUv);
	vec4 videoCol = texture2D(tVideo,vUv);
	gl_FragColor  = videoCol +  drawing * min(pow(length(videoCol-drawing),1.0+drawingAdditive) * drawing.a, 1.0) * drawingAlpha;

}