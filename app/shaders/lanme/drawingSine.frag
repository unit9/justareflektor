
uniform sampler2D tDiffuse;
uniform sampler2D tAccum;

varying mediump vec2 textureCoordinate;
varying mediump vec2 leftTextureCoordinate;
varying mediump vec2 rightTextureCoordinate;
 
varying mediump vec2 topTextureCoordinate;
varying mediump vec2 topLeftTextureCoordinate;
varying mediump vec2 topRightTextureCoordinate;
 
varying mediump vec2 bottomTextureCoordinate;
varying mediump vec2 bottomLeftTextureCoordinate;
varying mediump vec2 bottomRightTextureCoordinate;


uniform mediump vec2 center;
uniform mediump float drawingSize;
uniform mediump vec2 offset;
uniform mediump vec2 ratio;
uniform mediump float accumulationpc;
uniform mediump float timep;

const mediump float onepx = 1.0/255.0;

void main() {

	lowp vec3 bottomLeft = texture2D(tAccum, bottomLeftTextureCoordinate).rgb;
    lowp vec3 topRight = texture2D(tAccum, topRightTextureCoordinate).rgb;
    lowp vec3 topLeft = texture2D(tAccum, topLeftTextureCoordinate).rgb;
    lowp vec3 bottomRight = texture2D(tAccum, bottomRightTextureCoordinate).rgb;
    lowp vec3 left = texture2D(tAccum, leftTextureCoordinate).rgb;
    lowp vec3 right = texture2D(tAccum, rightTextureCoordinate).rgb;
    lowp vec3 bottom = texture2D(tAccum, bottomTextureCoordinate).rgb;
    lowp vec3 top = texture2D(tAccum, topTextureCoordinate).rgb;

    mediump float centerDist = distance((textureCoordinate-0.5)*ratio,(center-0.5));
    lowp float dist = (drawingSize-centerDist) / drawingSize;

    float accum = bottomLeft.r*0.1
    			+ topRight.r*0.1
    			+ topLeft.r*0.1
    			+ bottomRight.r*0.1
    			+ left.r*0.15
    			+ right.r*0.15
    			+ bottom.r*0.15
    			+ top.r*0.15;

    accum*=1.02;

    dist = max(sin(pow(dist,2.0)*30.0+timep),0.0)*max(dist,0.0);

    gl_FragColor = vec4(dist+accum*accumulationpc-onepx);
   // gl_FragColor = vec4(accumulationpc*1000.0);
}