uniform sampler2D texture;
uniform sampler2D tEdges;
varying highp vec2 vUv;

// const mediump  vec4  kRGBToYPrime = vec4 (0.299, 0.587, 0.114, 0.0);
const mediump  vec3  kRGBToYPrime = vec3 (0.35, 0.35, 0.35); //vec4 (0.1,0.65,0.25, 0.0);
const mediump  vec3  kRGBToI     = vec3 (0.595716, -0.274453, -0.321263);
const mediump  vec3  kRGBToQ     = vec3 (0.211456, -0.522591, 0.31135);

uniform mediump float minLuminosity;
uniform mediump float targetHue;
uniform mediump float minChroma;
uniform mediump float hueRange;


const mediump float PI = 3.14159265;
const mediump float TWOPI = 2.0*3.14159265;
const mediump float HALF_PI = 0.5*3.14159265;

uniform mediump vec3 whiteChannel;
const mediump vec3 whiteBalance = vec3(0.299, 0.587, 0.114);

void main() {

	if (texture2D(tEdges,vUv).r<1.0) discard;

	mediump vec3 col = texture2D(texture,vUv).rgb; //*normalize(whiteBalance);
	mediump float Y = dot(col,kRGBToYPrime);
	mediump float I = dot(col,kRGBToI);
	mediump float Q = dot(col,kRGBToQ);


	//vec3 colsat = col;
	//float minx = min(min(col.r,col.g),col.b);
	//float maxx = max(max(col.r,col.g),col.b);
	//float saturation = (maxx-minx) / (2.0 - maxx - minx);
	//length((col-minx)/maxx);
	//sqrt(col.r*col.r + col.g*col.g + col.b*col.b);

	col = vec3(
		Y,
		atan (Q, I)/TWOPI + 0.5, //hue
		sqrt (I * I + Q * Q) //chroma
		//saturation
	);
    if (Y>=0.98) {col.rgb = vec3(1.0,0.0,0.0);}
    else if (Y<=minLuminosity || col.b<(minChroma-minChroma*smoothstep(0.92,0.98,Y))) {discard;} //col.g > maxHue ||
    else {
    	float diff;
		if (col.g>0.75 && targetHue<0.25) diff = abs(targetHue-(col.g-1.0));
    	else if (col.g<0.25 && targetHue>0.75) diff = abs(targetHue-(col.g+1.0));
    	else diff = abs(targetHue-col.g);
    	if (diff > hueRange) discard;
    }
    if (col.r>0.0) col.r = 1.0;
    gl_FragColor = vec4(col,1.0);
}