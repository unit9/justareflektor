/*
 *
 * Simple Memory and object creation Optimisation for THREE.js:
 * Global Vector3 Pooling
 * Disposed vectors should be added to the global pool for blazing fast vec3 creation
 *
*/
THREE.Vector3.pool = [];
THREE.Vector3.create = function(x,y,z) {
	if (THREE.Vector3.pool.length===0) return new THREE.Vector3(x,y,z);
	return pool.pop().set(x,y,z);
};
THREE.Vector3.createEmpty = function() {
	if (THREE.Vector3.pool.length===0) return new THREE.Vector3();
	return pool.pop().set(0,0,0);
};
THREE.Vector3.dispose = function(v) {
	if (pool.length > 100) return;
	pool.push(v);
};

//override the clone method
THREE.Vector3.prototype.clone = function() {
	return THREE.Vector3.create( this.x, this.y, this.z );
}