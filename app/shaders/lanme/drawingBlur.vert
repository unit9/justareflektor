varying mediump vec2 textureCoordinate;
varying mediump vec2 leftTextureCoordinate;
varying mediump vec2 rightTextureCoordinate;
 
varying mediump vec2 topTextureCoordinate;
varying mediump vec2 topLeftTextureCoordinate;
varying mediump vec2 topRightTextureCoordinate;
 
varying mediump vec2 bottomTextureCoordinate;
varying mediump vec2 bottomLeftTextureCoordinate;
varying mediump vec2 bottomRightTextureCoordinate;

uniform mediump vec2 offset;
uniform mediump vec2 center;

void main() {
     textureCoordinate = vec2(uv.x,1.0-uv.y);

     leftTextureCoordinate = textureCoordinate+offset*vec2(-1.0,0.0);
     rightTextureCoordinate = textureCoordinate+offset*vec2(1.0,0.0);

     topTextureCoordinate = textureCoordinate+offset*vec2(0.0,-1.0);
     topLeftTextureCoordinate = textureCoordinate+offset*vec2(-1.0,-1.0);
     topRightTextureCoordinate = textureCoordinate+offset*vec2(1.0,-1.0);
      
     bottomTextureCoordinate = textureCoordinate+offset*vec2(0.0,1.0);
     bottomLeftTextureCoordinate = textureCoordinate+offset*vec2(-1.0,1.0);
     bottomRightTextureCoordinate = textureCoordinate+offset*vec2(1.0,1.0);

     gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );
}