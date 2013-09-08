varying mediump vec2 vUv;
varying mediump vec2 webcamUvBase;
varying highp vec2 vReflectUv;
varying highp vec2 glitchUv;

uniform sampler2D tWebcam;
uniform sampler2D tDiffuse;
uniform sampler2D tMask;
uniform sampler2D tEdges;
uniform sampler2D tGlitch;

uniform mediump vec4 globalColor;

uniform mediump vec2 center;
uniform mediump vec2 offset;
uniform mediump vec2 maxOffset;

uniform mediump float maxScale;
uniform mediump float chromaticAberration;
uniform mediump float perspective;
uniform mediump float edgesDiffraction;
uniform mediump float dustOpacity;
uniform mediump float glitchOpacity;
uniform mediump float blackAndWhite;
uniform mediump float glitchOpacityFade;

const mediump vec3 rgb2luma = vec3(0.299,0.587,0.114);


void main() {

	vec4 diffuseColor = texture2D(tDiffuse,vUv);
	vec4 maskColor = texture2D(tMask,vUv);
	vec4 edges = texture2D(tEdges,vUv);
	vec3 glitch = texture2D(tGlitch,glitchUv).rgb; //mod(vUv+uvRandom,vec2(1.0))


	//discard
	if (maskColor.a<=0.01) {

		gl_FragColor = diffuseColor;

	} else {
		//draw webcam

		vec2 webcamUv = (webcamUvBase-0.5)*(1.0+maskColor.r*maxScale)+0.5 + maxOffset*maskColor.gb;
		//webcamUv = vReflectUv;

		mediump vec3 insideMirrorCol = vec3(
			texture2D(tWebcam,webcamUv+chromaticAberration*offset*1.0).r,
			texture2D(tWebcam,webcamUv+chromaticAberration*offset*1.5).g,
			texture2D(tWebcam,webcamUv+chromaticAberration*offset*2.0).b);
		insideMirrorCol = mix(insideMirrorCol, clamp(vec3(dot(insideMirrorCol*3.0-0.8,rgb2luma)),0.0,1.0),blackAndWhite);
		
		insideMirrorCol = mix(insideMirrorCol,insideMirrorCol*glitch,glitchOpacityFade);
		mediump vec3 screenNoise = (1.0 - ((1.0 - insideMirrorCol.rgb) * (1.0 - glitch)));
		mediump vec3 darkenNoise = min(insideMirrorCol.rgb+glitch,glitch);
		insideMirrorCol = mix(insideMirrorCol,glitch*0.5 + screenNoise*1.0 + darkenNoise*0.5,glitchOpacity);
		//insideMirrorCol = mix(insideMirrorCol.rgb, dot(insideMirrorCol,rgb2luma)*0.25+glitch*2.0, glitchOpacity); //glitch
		gl_FragColor = diffuseColor + vec4(insideMirrorCol * maskColor.a,1.0);
	}

	if (edges.r>0.0) gl_FragColor += edgesDiffraction*edges.r*texture2D(tWebcam,vUv);
	gl_FragColor *= globalColor;
	gl_FragColor += (globalColor-1.0) + edges.g * dustOpacity;
}