
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
//varying mediump vec2 bottomRightTextureCoordinate;

//for older graphic cards, don't use more than 8 varyings and uniforms
#define bottomRightTextureCoordinate (textureCoordinate+offset)
#define topLeftTextureCoordinate (textureCoordinate-offset)


varying mediump vec2 textureCoordinateRatio;


uniform mediump vec2 center;
uniform mediump float drawingSize;
uniform mediump vec2 offset;
uniform mediump float accumulationpc;
uniform mediump float fade;


const mediump float onepx = 1.0/255.0;

void main() {

	lowp float bottomLeft = texture2D(tAccum, bottomLeftTextureCoordinate).r;
    lowp float topRight = texture2D(tAccum, topRightTextureCoordinate).r;
    lowp float topLeft = texture2D(tAccum, topLeftTextureCoordinate).r;
    lowp float bottomRight = texture2D(tAccum, bottomRightTextureCoordinate).r;
    lowp float left = texture2D(tAccum, leftTextureCoordinate).r;
    lowp float right = texture2D(tAccum, rightTextureCoordinate).r;
    lowp float bottom = texture2D(tAccum, bottomTextureCoordinate).r;
    lowp float top = texture2D(tAccum, topTextureCoordinate).r;

    mediump float centerDist = distance(textureCoordinateRatio,center);
    lowp float dist = max(drawingSize-centerDist,0.0) / drawingSize;

    float accum = bottomLeft*0.1
    			+ topRight*0.1
    			+ topLeft*0.1
    			+ bottomRight*0.1
    			+ left*0.15
    			+ right*0.15
    			+ bottom*0.15
    			+ top*0.15;

    accum = accum * 1.02 * accumulationpc + dist - onepx + fade;

    mediump vec2 currentDirection = mix(
        texture2D(tAccum,textureCoordinate).yz*2.0-1.0,
        normalize(textureCoordinateRatio-center),
        accum) * 0.5 + 0.5;

    gl_FragColor = vec4(accum,currentDirection.x,currentDirection.y,1.0);
}