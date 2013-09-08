/**
 *
 * @author Édouard Lanctôt < edouardlb@gmail.com >
 *
*/
function GridPoint(src,id) {

        var LOADED_MESH_FLIP = new THREE.Vector3( 1, -1, 1 );

    	this.id = id;
    	this.trackingId = src.id;
    	this.frameOffset = 0;
    	this.trackingPoint = src;
    	this.lastVertice = new THREE.Vector3();
    	this.lastBaseVertice = new THREE.Vector3();
    	this.latestBaseVertice = new THREE.Vector3();
    	this.latestVertice = new THREE.Vector3();
    	this.vertice = new THREE.Vector3(); //.multiply(LOADED_MESH_SCALE).add(LOADED_MESH_OFFSET);
    	this.currentMotion = new THREE.Vector3();
    	this.currentMotionB = new THREE.Vector3();
    	this.numConnectedVertices = 0;
    	this.connectedVerticesIds = [];
    	this.isNear = false;
        this.isFollowed = false;

    	this.currentMouseDistance = 0.0;
    	this.connectedVerticesDistance = [];

    	this.colorSourceByConnectedPoint = {};
    	this.colorTargetByConnectedPoint = {};

    	this.vertexSourceByConnectedPoint = {};
    	this.vertexTargetByConnectedPoint = {};

    	this.isActive = function(frame) {
    		var f = frame+this.frameOffset;
    		return (this.trackingPoint.startFrame<=f && this.trackingPoint.endFrame>=f && this.trackingPoint.positions[f]);
    	};
    	this.getPositionFromCenter = function(frame,SCALEBASE,OFFSETBASE,SCALE,OFFSET,center,centerpc) {
    		//if (!this.trackingPoint.positions[frame]) return this.vertice;
    		this.vertice.set(
				this.trackingPoint.positions[frame].x,
				this.trackingPoint.positions[frame].y,
				0.0
			).multiply(SCALEBASE).add(OFFSETBASE).multiply(LOADED_MESH_FLIP);

    		this.vertice.applyMatrix4(new THREE.Matrix4().makeTranslation(-center.x,-center.y,0.0));
			this.vertice.applyMatrix4(new THREE.Matrix4().makeScale(options.followSize,options.followSize,1.0));
			this.vertice.applyMatrix4(new THREE.Matrix4().makeTranslation(center.x,center.y,0.0));

			//var np = gridPoints[i].getPosition(currentFrame+2,LOADED_MESH_SCALE_BASE,LOADED_MESH_OFFSET_BASE);
			//var np = gridPoints[i].getPosition(currentFrame,LOADED_MESH_SCALE,LOADED_MESH_OFFSET);

			//var x = this.trackingPoint.positions[frame].x
			//var y = this.trackingPoint.positions[frame].y;

			//if (options.scaleFromCenter)  {
			//this.vertice.x = this.vertice.x-(this.vertice.x-(x*SCALE.x + OFFSET.x))*centerpc;
			//this.vertice.y = this.vertice.y-(this.vertice.y-(-y*SCALE.y - OFFSET.y))*centerpc;
			return this.vertice;
    	};
    	this.getMotionCentered = function() {
    		return this.latestVertice.clone().sub(this.lastVertice);
    	};
    	this.getMotionCenteredBase = function() {
    		return this.latestBaseVertice.clone().sub(this.lastBaseVertice);
    	};
    	this.getPosition = function(frame,SCALE,OFFSET) {
    		var f = frame+this.frameOffset;
    		if (!this.trackingPoint.positions[f]) return this.vertice;
    		this.vertice.set(
				this.trackingPoint.positions[f].x,
				this.trackingPoint.positions[f].y,
				0.0
			).multiply(SCALE).add(OFFSET).multiply(LOADED_MESH_FLIP);
			return this.vertice;
    	};
    	this.getMotion = function(frame,SCALE,OFFSET,lastFrame,LASTSCALE,LASTOFFSET) {
    		var f = frame+this.frameOffset;
    		var lf = lastFrame+this.frameOffset;
    		if (!this.trackingPoint.positions[f] || !this.trackingPoint.positions[lf]) return this.currentMotion.set(0,0,0);
    		this.currentMotion.set(
				this.trackingPoint.positions[f].x,
				this.trackingPoint.positions[f].y,
				0.0
			).multiply(SCALE).add(OFFSET).multiply(LOADED_MESH_FLIP);
    		this.currentMotionB.set(
				this.trackingPoint.positions[lf].x,
				this.trackingPoint.positions[lf].y,
				0.0
			).multiply(LASTSCALE).add(LASTOFFSET).multiply(LOADED_MESH_FLIP);
			return this.currentMotionB.sub(this.currentMotion)
    	};
    	this.getConnectionIds = function (frame) {
    		var f = frame+this.frameOffset;
    		if (!this.trackingPoint.connections || !this.trackingPoint.connections[f]) return [];
    		return this.trackingPoint.connections[f];
    	};
	}