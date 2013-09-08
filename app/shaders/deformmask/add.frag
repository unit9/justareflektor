varying mediump vec2 vUv;
uniform sampler2D tVideo;
uniform sampler2D tDrawing;
uniform sampler2D tRays;

uniform lowp float videoAlpha;
uniform lowp float drawingAlpha;
uniform lowp float raysAlpha;

void main() {

	vec4 drawing = texture2D(tDrawing,vUv);
	drawing.rgb *= drawing.a;
	gl_FragColor = texture2D(tVideo,vUv)*videoAlpha + drawing*drawingAlpha + texture2D(tRays,vUv)*raysAlpha;

}