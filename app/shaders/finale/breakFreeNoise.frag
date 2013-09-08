varying mediump vec2 vUv;
varying mediump vec2 uvBreakFree;
varying highp vec2 uvNoise;

uniform sampler2D tVideo;
uniform sampler2D tBreakFree;
uniform sampler2D tNoise;

uniform mediump float noiseAlpha;
uniform mediump float breakFreeAlpha;
uniform mediump float blackAndWhite;

const mediump vec3 rgb2luma = vec3(0.299,0.587,0.114);

void main() {

	mediump vec3 videoCol = texture2D(tVideo,vUv).rgb;

	mediump vec4 breakFreeCol = texture2D(tBreakFree, uvBreakFree);

	mediump vec3 noise = texture2D(tNoise, uvNoise).rgb;

	videoCol = mix(videoCol, clamp(vec3(dot(videoCol*3.0-0.8,rgb2luma)),0.0,1.0),blackAndWhite);

	gl_FragColor = vec4( mix(videoCol, videoCol*0.25+noise*2.0, noiseAlpha) + (breakFreeCol.rgb+noise*noiseAlpha) * breakFreeCol.a * breakFreeAlpha , 1.0); //min(max(videoCol + noise,vec4(0.0,0.0,0.0,1.0)),vec4(1.0,1.0,1.0,1.0)) ;

}