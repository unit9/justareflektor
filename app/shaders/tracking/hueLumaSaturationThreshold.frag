uniform sampler2D texture;
uniform sampler2D tEdges;
varying highp vec2 vUv;

// const mediump  vec4  kRGBToYPrime = vec4 (0.299, 0.587, 0.114, 0.0);
const mediump  vec3  kRGBToYPrime = vec3 (0.2, 0.4, 0.4); //vec4 (0.1,0.65,0.25, 0.0);
const mediump  vec3  kRGBToI     = vec3 (0.595716, -0.274453, -0.321263);
const mediump  vec3  kRGBToQ     = vec3 (0.211456, -0.522591, 0.31135);

const mediump vec3 whiteBalance = vec3(0.299, 0.587, 0.114);
const mediump float PI = 3.14159265;
const mediump float TWO_PI = 6.2831853;


uniform mediump float minLuminosity;
uniform mediump float targetHue;
uniform mediump float minChroma;
uniform mediump float hueRange;

uniform mediump vec3 whiteChannel;


void main() {
    vec4 result =  vec4(0.0);

	if (texture2D(tEdges,vUv).r>=0.5) {

    	mediump vec3 col = texture2D(texture,vUv).rgb; //*normalize(whiteBalance);
    	mediump float Y = dot(col,kRGBToYPrime);
    	mediump float I = dot(col,kRGBToI);
    	mediump float Q = dot(col,kRGBToQ);

    	mediump float chroma = sqrt (I * I + Q * Q);
    	mediump float hue = atan (Q, I)/ 6.28319 + 0.5;

        if (Y>=0.98) {
        	result = vec4(1.0,0.0,0.0,1.0); 
        } else if (Y<=minLuminosity || chroma<(minChroma-minChroma*smoothstep(0.92,0.98,Y))) {
        	//result = vec4(0.0);
        } else if ((hue>0.75 ? abs(targetHue-hue+1.0) : abs(targetHue-hue)) > hueRange) {
            //result = vec4(0.0);
        } else {
            result = vec4(Y,hue,chroma,1.0); 
        }


    }
    gl_FragColor = result;
}