varying mediump vec2 vUv;
varying mediump vec2 ratioUV;

uniform sampler2D tAccum;

uniform mediump float drawingSize;
uniform mediump float drawingOpacity;

uniform mediump vec2 center;
uniform mediump float accumSpeed;



const lowp vec2 ratio = vec2(1.0, 0.525);

void main() {
	mediump vec3 accum = texture2D(tAccum,vUv).rgb;

	//get center direction and  accumulation
	mediump vec2 centerVec = ( ratioUV - center );
	mediump float dist = max( (drawingSize - length(centerVec)) / drawingSize, 0.0);
	centerVec = normalize(mix(accum.gb*2.0-1.0, normalize(centerVec),  accum.r)) * 0.5 + 0.5;

	//result
	gl_FragColor = vec4(
		dist * drawingOpacity + accum.r * accumSpeed,
		centerVec.x,
		centerVec.y,
	1.0);
}