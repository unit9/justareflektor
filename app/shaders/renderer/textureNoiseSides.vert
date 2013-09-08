varying highp vec2 vUv;
varying highp vec2 vUvNoise;
varying highp vec2 vUvSides;
uniform lowp vec2 randomOffset;

uniform mediump float sideFlareSize;
uniform mediump vec2 sideFlarePosition;




void main() {
	vUv = vec2(uv.x,1.0-uv.y);

	vUvSides = (vUv - sideFlarePosition) * sideFlareSize * vec2(1.0,0.525) + 0.5;
		
	vUvNoise = (uv-0.5)*vec2(1.9047619047619,1.0) + 0.5 + randomOffset;
	gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );
}