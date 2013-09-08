//@author huwb / http://huwbowles.com/
 //God-rays (crepuscular rays)
 //References:
 //Sousa2008 - Crysis Next Gen Effects, GDC2008, http://www.crytek.com/sites/default/files/GDC08_SousaT_CrysisEffects.ppt

#define TAPS_PER_PASS 6.0

varying mediump vec2 vUv;

uniform sampler2D tVideo;
uniform sampler2D tDrawing;
uniform sampler2D tAccum;

uniform mediump vec2 offset;
uniform mediump vec2 center;
uniform mediump vec2 randomUV;
uniform mediump vec2 rotation;


uniform lowp float alpha;
uniform lowp float raysExp;
uniform lowp float drawingAdditive;
uniform mediump float noiseOffset;
uniform mediump float fStepSize;

const mediump vec2 ratio = vec2(1.0,0.525);
const mediump vec2 ratiov = vec2(1.904761,1.0);


void main() {

  mediump vec2 delta = (center - vUv);

  mediump vec2 rotatedDelta = vec2(delta.x * rotation.x - delta.y*rotation.y, delta.x*rotation.y + delta.y*rotation.x); //spin effect

  mediump float dist = length( delta * ratiov );
  mediump vec2 stepv = (fStepSize * (rotatedDelta) / dist);

  mediump vec2 uv = vUv.xy;
  mediump vec3 col = vec3(0.0);
  for ( float i = 0.0; i < TAPS_PER_PASS; i += 1.0 ) {

    col += ( dot(center-uv,center-vUv.xy) >= 0.0 ? ( texture2D( tAccum, uv ).rgb ) : vec3(0.0));
    uv += stepv;

  }

  gl_FragColor = vec4( col / TAPS_PER_PASS * 2.0, 1.0 );

  float blend =  max(1.0-pow(dist/2.0,raysExp)*(TAPS_PER_PASS*alpha),0.0);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, texture2D( tVideo, vUv ).rgb, blend );

}