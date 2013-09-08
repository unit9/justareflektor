uniform highp float maskRatio; //division of alpha | color ratio in the video. Should be 0.25 in most cases.
uniform highp float maskScale;
uniform highp float maskOffset;
varying highp vec2 vUv;

void main() {
	float uvx = (uv.x) * maskRatio * (maskScale/maskRatio) +maskOffset;
	vUv = vec2(uvx,1.0-uv.y);

	//vec2( clamp(( (uv.x) * maskRatio)*(maskScale/maskRatio) ,0.0,maskRatio)    ,1.0-uv.y);
	gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );
}
