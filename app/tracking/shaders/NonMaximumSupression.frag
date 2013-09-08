uniform sampler2D texture;
 
 varying mediump vec2 textureCoordinate;
 varying mediump vec2 leftTextureCoordinate;
 varying mediump vec2 rightTextureCoordinate;
 
 varying mediump vec2 topTextureCoordinate;
 varying mediump vec2 topLeftTextureCoordinate;
 varying mediump vec2 topRightTextureCoordinate;
 
 varying mediump vec2 bottomTextureCoordinate;
 varying mediump vec2 bottomLeftTextureCoordinate;
 varying mediump vec2 bottomRightTextureCoordinate;
 
 void main()
 {
     lowp float bottomColor = texture2D(texture, bottomTextureCoordinate).r;
     lowp float bottomLeftColor = texture2D(texture, bottomLeftTextureCoordinate).r;
     lowp float bottomRightColor = texture2D(texture, bottomRightTextureCoordinate).r;
     lowp vec4 centerColor = texture2D(texture, textureCoordinate);
     lowp float leftColor = texture2D(texture, leftTextureCoordinate).r;
     lowp float rightColor = texture2D(texture, rightTextureCoordinate).r;
     lowp float topColor = texture2D(texture, topTextureCoordinate).r;
     lowp float topRightColor = texture2D(texture, topRightTextureCoordinate).r;
     lowp float topLeftColor = texture2D(texture, topLeftTextureCoordinate).r;
     
     // Use a tiebreaker for pixels to the left and immediately above this one
     lowp float multiplier = 1.0 - step(centerColor.r, topColor);
     multiplier = multiplier * 1.0 - step(centerColor.r, topLeftColor);
     multiplier = multiplier * 1.0 - step(centerColor.r, leftColor);
     multiplier = multiplier * 1.0 - step(centerColor.r, bottomLeftColor);
     
     lowp float maxValue = max(centerColor.r, bottomColor);
     maxValue = max(maxValue, bottomRightColor);
     maxValue = max(maxValue, rightColor);
     maxValue = max(maxValue, topRightColor);
     
     gl_FragColor = vec4((centerColor.rgb * step(maxValue, centerColor.r) * multiplier), 1.0);
 }