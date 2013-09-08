varying vec2 vUv;
uniform mediump vec2 randomUV;
uniform mediump float lineNoise;
uniform mediump float opacity;

mediump float rand( mediump vec2 co ){
    return fract( sin( dot( co.xy ,vec2( 12.9898,78.233 ) ) ) * 43758.5453 );
}

void main() {
	

	float side = 1.0 - max(0.5-vUv.x,0.0) * 2.0 - max(vUv.x-0.5,0.0) * 2.0;

	side = side * side;

	float noise = side * rand(randomUV+vUv) * 2.0 - 1.0;
	side = side + noise * lineNoise;


	gl_FragColor = vec4(
		side,
		side,
		side,
		opacity
	);

}