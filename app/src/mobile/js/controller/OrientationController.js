/**
 * @author Maciej Zasada maciej@unit9.com
 * @copyright 2013 UNIT9 Ltd.
 * Date: 7/22/13
 * Time: 1:22 AM
 */

/*
 Internal classes.
 Source: three.js
 */
var Quaternion = function (x, y, z, w) {

    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this.w = (w !== undefined) ? w : 1;

};

Quaternion.prototype = {

    constructor: Quaternion,

    set: function (x, y, z, w) {

        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;

        return this;

    },

    copy: function (q) {

        this.x = q.x;
        this.y = q.y;
        this.z = q.z;
        this.w = q.w;

        return this;

    },

    setFromEuler: function (v, order) {

        // http://www.mathworks.com/matlabcentral/fileexchange/
        // 20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
        // content/SpinCalc.m

        var c1 = Math.cos(v.x / 2),
            c2 = Math.cos(v.y / 2),
            c3 = Math.cos(v.z / 2),
            s1 = Math.sin(v.x / 2),
            s2 = Math.sin(v.y / 2),
            s3 = Math.sin(v.z / 2);

        if (order === undefined || order === 'XYZ') {

            this.x = s1 * c2 * c3 + c1 * s2 * s3;
            this.y = c1 * s2 * c3 - s1 * c2 * s3;
            this.z = c1 * c2 * s3 + s1 * s2 * c3;
            this.w = c1 * c2 * c3 - s1 * s2 * s3;

        } else if (order === 'YXZ') {

            this.x = s1 * c2 * c3 + c1 * s2 * s3;
            this.y = c1 * s2 * c3 - s1 * c2 * s3;
            this.z = c1 * c2 * s3 - s1 * s2 * c3;
            this.w = c1 * c2 * c3 + s1 * s2 * s3;

        } else if (order === 'ZXY') {

            this.x = s1 * c2 * c3 - c1 * s2 * s3;
            this.y = c1 * s2 * c3 + s1 * c2 * s3;
            this.z = c1 * c2 * s3 + s1 * s2 * c3;
            this.w = c1 * c2 * c3 - s1 * s2 * s3;

        } else if (order === 'ZYX') {

            this.x = s1 * c2 * c3 - c1 * s2 * s3;
            this.y = c1 * s2 * c3 + s1 * c2 * s3;
            this.z = c1 * c2 * s3 - s1 * s2 * c3;
            this.w = c1 * c2 * c3 + s1 * s2 * s3;

        } else if (order === 'YZX') {

            this.x = s1 * c2 * c3 + c1 * s2 * s3;
            this.y = c1 * s2 * c3 + s1 * c2 * s3;
            this.z = c1 * c2 * s3 - s1 * s2 * c3;
            this.w = c1 * c2 * c3 - s1 * s2 * s3;

        } else if (order === 'XZY') {

            this.x = s1 * c2 * c3 - c1 * s2 * s3;
            this.y = c1 * s2 * c3 - s1 * c2 * s3;
            this.z = c1 * c2 * s3 + s1 * s2 * c3;
            this.w = c1 * c2 * c3 + s1 * s2 * s3;

        }

        return this;

    },

    setFromAxisAngle: function (axis, angle) {

        // from http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm
        // axis have to be normalized

        var halfAngle = angle / 2,
            s = Math.sin(halfAngle);

        this.x = axis.x * s;
        this.y = axis.y * s;
        this.z = axis.z * s;
        this.w = Math.cos(halfAngle);

        return this;

    },

    setFromRotationMatrix: function (m) {

        // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

        // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

        var te = m.elements,
            m11 = te[0],
            m12 = te[4],
            m13 = te[8],
            m21 = te[1],
            m22 = te[5],
            m23 = te[9],
            m31 = te[2],
            m32 = te[6],
            m33 = te[10],
            trace = m11 + m22 + m33,
            s;

        if (trace > 0) {

            s = 0.5 / Math.sqrt(trace + 1.0);

            this.w = 0.25 / s;
            this.x = (m32 - m23) * s;
            this.y = (m13 - m31) * s;
            this.z = (m21 - m12) * s;

        } else if (m11 > m22 && m11 > m33) {

            s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);

            this.w = (m32 - m23) / s;
            this.x = 0.25 * s;
            this.y = (m12 + m21) / s;
            this.z = (m13 + m31) / s;

        } else if (m22 > m33) {

            s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);

            this.w = (m13 - m31) / s;
            this.x = (m12 + m21) / s;
            this.y = 0.25 * s;
            this.z = (m23 + m32) / s;

        } else {

            s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);

            this.w = (m21 - m12) / s;
            this.x = (m13 + m31) / s;
            this.y = (m23 + m32) / s;
            this.z = 0.25 * s;

        }

        return this;

    },

    inverse: function () {

        this.conjugate().normalize();

        return this;

    },

    conjugate: function () {

        this.x *= -1;
        this.y *= -1;
        this.z *= -1;

        return this;

    },

    lengthSq: function () {

        return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;

    },

    length: function () {

        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);

    },

    normalize: function () {

        var l = this.length();

        if (l === 0) {

            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.w = 1;

        } else {

            l = 1 / l;

            this.x = this.x * l;
            this.y = this.y * l;
            this.z = this.z * l;
            this.w = this.w * l;

        }

        return this;

    },

    multiply: function (q, p) {

        if (p !== undefined) {

            console.warn('DEPRECATED: Quaternion\'s .multiply() now only accepts one argument. Use .multiplyQuaternions( a, b ) instead.');
            return this.multiplyQuaternions(q, p);

        }

        return this.multiplyQuaternions(this, q);

    },

    multiplyQuaternions: function (a, b) {

        // from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

        var qax = a.x, qay = a.y, qaz = a.z, qaw = a.w,
            qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;

        this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
        this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
        this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
        this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

        return this;

    },

    multiplyVector3: function (vector) {

        console.warn('DEPRECATED: Quaternion\'s .multiplyVector3() has been removed. Use is now vector.applyQuaternion( quaternion ) instead.');
        return vector.applyQuaternion(this);

    },

    slerp: function (qb, t) {

        // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/
        var x = this.x, y = this.y, z = this.z, w = this.w,
            cosHalfTheta = w * qb.w + x * qb.x + y * qb.y + z * qb.z,
            halfTheta = Math.acos(cosHalfTheta),
            sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta),
            ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta,
            ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

        if (cosHalfTheta < 0) {

            this.w = -qb.w;
            this.x = -qb.x;
            this.y = -qb.y;
            this.z = -qb.z;

            cosHalfTheta = -cosHalfTheta;

        } else {

            this.copy(qb);

        }

        if (cosHalfTheta >= 1.0) {

            this.w = w;
            this.x = x;
            this.y = y;
            this.z = z;

            return this;

        }

        if (Math.abs(sinHalfTheta) < 0.001) {

            this.w = 0.5 * (w + this.w);
            this.x = 0.5 * (x + this.x);
            this.y = 0.5 * (y + this.y);
            this.z = 0.5 * (z + this.z);

            return this;

        }

        this.w = (w * ratioA + this.w * ratioB);
        this.x = (x * ratioA + this.x * ratioB);
        this.y = (y * ratioA + this.y * ratioB);
        this.z = (z * ratioA + this.z * ratioB);

        return this;

    },

    equals: function (v) {

        return ((v.x === this.x) && (v.y === this.y) && (v.z === this.z) && (v.w === this.w));

    },

    clone: function () {

        return new Quaternion(this.x, this.y, this.z, this.w);

    }

};

Quaternion.slerp = function (qa, qb, qm, t) {

    return qm.copy(qa).slerp(qb, t);

};

/*
 * Vector3
 * @source: three.js
 */
var Vector3 = function (x, y, z) {

    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;

};

Vector3.prototype = {

    constructor: Vector3,

    set: function (x, y, z) {

        this.x = x;
        this.y = y;
        this.z = z;

        return this;

    },

    setX: function (x) {

        this.x = x;

        return this;

    },

    setY: function (y) {

        this.y = y;

        return this;

    },

    setZ: function (z) {

        this.z = z;

        return this;

    },

    setComponent: function (index, value) {

        switch (index) {

        case 0:
            this.x = value;
            break;
        case 1:
            this.y = value;
            break;
        case 2:
            this.z = value;
            break;
        default:
            throw new Error("index is out of range: " + index);

        }

    },

    getComponent: function (index) {

        switch (index) {

        case 0:
            return this.x;
        case 1:
            return this.y;
        case 2:
            return this.z;
        default:
            throw new Error("index is out of range: " + index);

        }

    },

    copy: function (v) {

        this.x = v.x;
        this.y = v.y;
        this.z = v.z;

        return this;

    },

    add: function (v, w) {

        if (w !== undefined) {

            console.warn('DEPRECATED: Vector3\'s .add() now only accepts one argument. Use .addVectors( a, b ) instead.');
            return this.addVectors(v, w);

        }

        this.x += v.x;
        this.y += v.y;
        this.z += v.z;

        return this;

    },

    addScalar: function (s) {

        this.x += s;
        this.y += s;
        this.z += s;

        return this;

    },

    addVectors: function (a, b) {

        this.x = a.x + b.x;
        this.y = a.y + b.y;
        this.z = a.z + b.z;

        return this;

    },

    sub: function (v, w) {

        if (w !== undefined) {

            console.warn('DEPRECATED: Vector3\'s .sub() now only accepts one argument. Use .subVectors( a, b ) instead.');
            return this.subVectors(v, w);

        }

        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;

        return this;

    },

    subVectors: function (a, b) {

        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;

        return this;

    },

    multiply: function (v, w) {

        if (w !== undefined) {

            console.warn('DEPRECATED: Vector3\'s .multiply() now only accepts one argument. Use .multiplyVectors( a, b ) instead.');
            return this.multiplyVectors(v, w);

        }

        this.x *= v.x;
        this.y *= v.y;
        this.z *= v.z;

        return this;

    },

    multiplyScalar: function (s) {

        this.x *= s;
        this.y *= s;
        this.z *= s;

        return this;

    },

    multiplyVectors: function (a, b) {

        this.x = a.x * b.x;
        this.y = a.y * b.y;
        this.z = a.z * b.z;

        return this;

    },

    applyMatrix3: function (m) {

        var x = this.x,
            y = this.y,
            z = this.z,
            e = m.elements;

        this.x = e[0] * x + e[3] * y + e[6] * z;
        this.y = e[1] * x + e[4] * y + e[7] * z;
        this.z = e[2] * x + e[5] * y + e[8] * z;

        return this;

    },

    applyMatrix4: function (m) {

        // input: Matrix4 affine matrix

        var x = this.x, y = this.y, z = this.z,
            e = m.elements;

        this.x = e[0] * x + e[4] * y + e[8] * z + e[12];
        this.y = e[1] * x + e[5] * y + e[9] * z + e[13];
        this.z = e[2] * x + e[6] * y + e[10] * z + e[14];

        return this;

    },

    applyProjection: function (m) {

        // input: Matrix4 projection matrix

        var x = this.x, y = this.y, z = this.z,
            e = m.elements,
            d = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]); // perspective divide

        this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * d;
        this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * d;
        this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * d;

        return this;

    },

    applyQuaternion: function (q) {

        var x = this.x,
            y = this.y,
            z = this.z,
            qx = q.x,
            qy = q.y,
            qz = q.z,
            qw = q.w,
            ix = qw * x + qy * z - qz * y,
            iy = qw * y + qz * x - qx * z,
            iz = qw * z + qx * y - qy * x,
            iw = -qx * x - qy * y - qz * z;

        // calculate result * inverse quat

        this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

        return this;

    },

    applyEuler: function (v, eulerOrder) {

        var quaternion = Vector3.__q1.setFromEuler(v, eulerOrder);

        this.applyQuaternion(quaternion);

        return this;

    },

    applyAxisAngle: function (axis, angle) {

        var quaternion = Vector3.__q1.setFromAxisAngle(axis, angle);

        this.applyQuaternion(quaternion);

        return this;

    },

    divide: function (v) {

        this.x /= v.x;
        this.y /= v.y;
        this.z /= v.z;

        return this;

    },

    divideScalar: function (s) {

        if (s !== 0) {

            this.x /= s;
            this.y /= s;
            this.z /= s;

        } else {

            this.x = 0;
            this.y = 0;
            this.z = 0;

        }

        return this;

    },

    min: function (v) {

        if (this.x > v.x) {

            this.x = v.x;

        }

        if (this.y > v.y) {

            this.y = v.y;

        }

        if (this.z > v.z) {

            this.z = v.z;

        }

        return this;

    },

    max: function (v) {

        if (this.x < v.x) {

            this.x = v.x;

        }

        if (this.y < v.y) {

            this.y = v.y;

        }

        if (this.z < v.z) {

            this.z = v.z;

        }

        return this;

    },

    clamp: function (min, max) {

        // This function assumes min < max, if this assumption isn't true it will not operate correctly

        if (this.x < min.x) {

            this.x = min.x;

        } else if (this.x > max.x) {

            this.x = max.x;

        }

        if (this.y < min.y) {

            this.y = min.y;

        } else if (this.y > max.y) {

            this.y = max.y;

        }

        if (this.z < min.z) {

            this.z = min.z;

        } else if (this.z > max.z) {

            this.z = max.z;

        }

        return this;

    },

    negate: function () {

        return this.multiplyScalar(-1);

    },

    dot: function (v) {

        return this.x * v.x + this.y * v.y + this.z * v.z;

    },

    lengthSq: function () {

        return this.x * this.x + this.y * this.y + this.z * this.z;

    },

    length: function () {

        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);

    },

    lengthManhattan: function () {

        return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);

    },

    normalize: function () {

        return this.divideScalar(this.length());

    },

    setLength: function (l) {

        var oldLength = this.length();

        if (oldLength !== 0 && l !== oldLength) {

            this.multiplyScalar(l / oldLength);
        }

        return this;

    },

    lerp: function (v, alpha) {

        this.x += (v.x - this.x) * alpha;
        this.y += (v.y - this.y) * alpha;
        this.z += (v.z - this.z) * alpha;

        return this;

    },

    cross: function (v, w) {

        if (w !== undefined) {

            console.warn('DEPRECATED: Vector3\'s .cross() now only accepts one argument. Use .crossVectors( a, b ) instead.');
            return this.crossVectors(v, w);

        }

        var x = this.x, y = this.y, z = this.z;

        this.x = y * v.z - z * v.y;
        this.y = z * v.x - x * v.z;
        this.z = x * v.y - y * v.x;

        return this;

    },

    crossVectors: function (a, b) {

        this.x = a.y * b.z - a.z * b.y;
        this.y = a.z * b.x - a.x * b.z;
        this.z = a.x * b.y - a.y * b.x;

        return this;

    },

    angleTo: function (v) {

        return Math.acos(this.dot(v) / this.length() / v.length());

    },

    distanceTo: function (v) {

        return Math.sqrt(this.distanceToSquared(v));

    },

    distanceToSquared: function (v) {

        var dx = this.x - v.x,
            dy = this.y - v.y,
            dz = this.z - v.z;

        return dx * dx + dy * dy + dz * dz;

    },

    getPositionFromMatrix: function (m) {

        this.x = m.elements[12];
        this.y = m.elements[13];
        this.z = m.elements[14];

        return this;

    },

    setEulerFromRotationMatrix: function (m, order) {

        // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

        // clamp, to handle numerical problems

        var te = m.elements,
            m11 = te[0],
            m12 = te[4],
            m13 = te[8],
            m21 = te[1],
            m22 = te[5],
            m23 = te[9],
            m31 = te[2],
            m32 = te[6],
            m33 = te[10];

        function clamp(x) {

            return Math.min(Math.max(x, -1), 1);

        }

        if (order === undefined || order === 'XYZ') {

            this.y = Math.asin(clamp(m13));

            if (Math.abs(m13) < 0.99999) {

                this.x = Math.atan2(-m23, m33);
                this.z = Math.atan2(-m12, m11);

            } else {

                this.x = Math.atan2(m32, m22);
                this.z = 0;

            }

        } else if (order === 'YXZ') {

            this.x = Math.asin(-clamp(m23));

            if (Math.abs(m23) < 0.99999) {

                this.y = Math.atan2(m13, m33);
                this.z = Math.atan2(m21, m22);

            } else {

                this.y = Math.atan2(-m31, m11);
                this.z = 0;

            }

        } else if (order === 'ZXY') {

            this.x = Math.asin(clamp(m32));

            if (Math.abs(m32) < 0.99999) {

                this.y = Math.atan2(-m31, m33);
                this.z = Math.atan2(-m12, m22);

            } else {

                this.y = 0;
                this.z = Math.atan2(m21, m11);

            }

        } else if (order === 'ZYX') {

            this.y = Math.asin(-clamp(m31));

            if (Math.abs(m31) < 0.99999) {

                this.x = Math.atan2(m32, m33);
                this.z = Math.atan2(m21, m11);

            } else {

                this.x = 0;
                this.z = Math.atan2(-m12, m22);

            }

        } else if (order === 'YZX') {

            this.z = Math.asin(clamp(m21));

            if (Math.abs(m21) < 0.99999) {

                this.x = Math.atan2(-m23, m22);
                this.y = Math.atan2(-m31, m11);

            } else {

                this.x = 0;
                this.y = Math.atan2(m13, m33);

            }

        } else if (order === 'XZY') {

            this.z = Math.asin(-clamp(m12));

            if (Math.abs(m12) < 0.99999) {

                this.x = Math.atan2(m32, m22);
                this.y = Math.atan2(m13, m11);

            } else {

                this.x = Math.atan2(-m23, m33);
                this.y = 0;

            }

        }

        return this;

    },

    setEulerFromQuaternion: function (q, order) {

        // q is assumed to be normalized

        // clamp, to handle numerical problems

        function clamp(x) {

            return Math.min(Math.max(x, -1), 1);

        }

        // http://www.mathworks.com/matlabcentral/fileexchange/20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/content/SpinCalc.m

        var sqx = q.x * q.x,
            sqy = q.y * q.y,
            sqz = q.z * q.z,
            sqw = q.w * q.w;

        if (order === undefined || order === 'XYZ') {

            this.x = Math.atan2(2 * (q.x * q.w - q.y * q.z), (sqw - sqx - sqy + sqz));
            this.y = Math.asin(clamp(2 * (q.x * q.z + q.y * q.w)));
            this.z = Math.atan2(2 * (q.z * q.w - q.x * q.y), (sqw + sqx - sqy - sqz));

        } else if (order === 'YXZ') {

            this.x = Math.asin(clamp(2 * (q.x * q.w - q.y * q.z)));
            this.y = Math.atan2(2 * (q.x * q.z + q.y * q.w), (sqw - sqx - sqy + sqz));
            this.z = Math.atan2(2 * (q.x * q.y + q.z * q.w), (sqw - sqx + sqy - sqz));

        } else if (order === 'ZXY') {

            this.x = Math.asin(clamp(2 * (q.x * q.w + q.y * q.z)));
            this.y = Math.atan2(2 * (q.y * q.w - q.z * q.x), (sqw - sqx - sqy + sqz));
            this.z = Math.atan2(2 * (q.z * q.w - q.x * q.y), (sqw - sqx + sqy - sqz));

        } else if (order === 'ZYX') {

            this.x = Math.atan2(2 * (q.x * q.w + q.z * q.y), (sqw - sqx - sqy + sqz));
            this.y = Math.asin(clamp(2 * (q.y * q.w - q.x * q.z)));
            this.z = Math.atan2(2 * (q.x * q.y + q.z * q.w), (sqw + sqx - sqy - sqz));

        } else if (order === 'YZX') {

            this.x = Math.atan2(2 * (q.x * q.w - q.z * q.y), (sqw - sqx + sqy - sqz));
            this.y = Math.atan2(2 * (q.y * q.w - q.x * q.z), (sqw + sqx - sqy - sqz));
            this.z = Math.asin(clamp(2 * (q.x * q.y + q.z * q.w)));

        } else if (order === 'XZY') {

            this.x = Math.atan2(2 * (q.x * q.w + q.y * q.z), (sqw - sqx + sqy - sqz));
            this.y = Math.atan2(2 * (q.x * q.z + q.y * q.w), (sqw + sqx - sqy - sqz));
            this.z = Math.asin(clamp(2 * (q.z * q.w - q.x * q.y)));

        }

        return this;

    },

    getScaleFromMatrix: function (m) {

        var sx = this.set(m.elements[0], m.elements[1], m.elements[2]).length(),
            sy = this.set(m.elements[4], m.elements[5], m.elements[6]).length(),
            sz = this.set(m.elements[8], m.elements[9], m.elements[10]).length();

        this.x = sx;
        this.y = sy;
        this.z = sz;

        return this;
    },

    equals: function (v) {

        return ((v.x === this.x) && (v.y === this.y) && (v.z === this.z));

    },

    clone: function () {

        return new Vector3(this.x, this.y, this.z);

    }

};

Vector3.__q1 = new Quaternion();


/*
 OrientationController
 */
var OrientationController = Class._extend(Class.SINGLETON, {

    _static: {

        EVENT_ORIENTATION_CHANGE: 'OrientationController_EVENT_ORIENTATION_CHANGE',
        EVENT_ACCELERATION_CHANGE: 'OrientationController_EVENT_ACCELERATION_CHANGE',
        EVENT_POSITION_CHANGE: 'OrientationController_EVENT_POSITION_CHANGE',

        TO_RADIANS: Math.PI / 180,
        GRAVITY: new Vector3(0, -9.8, 0),
        AXIS_X: new Vector3(-1, 0, 0),
        AXIS_Y: new Vector3(0, -1, 0),
        AXIS_Z: new Vector3(0, 0, -1),
        VELOCITY_DAMPING: 0.85,
        POSITION_DAMPING: 0.85,
        ACCELERATION_BUFFER_LENGTH: 4,
        MIN_ACCELERATION_TO_UPDATE_POSITION: 0.1

    },

    _public: {

        /* public */
        debug: {hSpeed: 0.0001, vSpeed: 0.0001},  // debug placeholder object

        localAccelerationIncludingGravity: {x: 0, y: 0, z: 0},
        localAccelerationIncludingGravityFiltered: {x: 0, y: 0, z: 0},
        localOrientation: {alpha: 0, beta: 0, gamma: 0},

        worldAcceleration: {x: 0, y: 0, z: 0},
        worldOrientation: {x: 0, y: 0, z: 0},
        worldQuaternion: {x: 0, y: 0, z: 0, w: 0},

        position: {x: 0, y: 0, z: 0},
        velocity: {x: 0, y: 0, z: 0},

        isVRelative: false,
        phoneOrientation: 0,
        hasGyroscope: 'false',
        hasAccelerometer: 'false',

        construct: function () {

            this._isAndroid = navigator.userAgent.toLowerCase().indexOf('android') !== -1;

        },

        start: function () {

            var self = this;

            if (window.DeviceOrientationEvent) {
                window.addEventListener('deviceorientation', function (e) {
                    self.onDeviceOrientationEvent(e);
                }, true);
            }

            if (window.DeviceMotionEvent) {
                window.addEventListener('devicemotion', function (e) {
                    self.onDeviceMotionEvent(e);
                    e.preventDefault();
                    e.stopPropagation();
                }, true);
            }

        },

        stop: function () {

            clearInterval(this._intervalId);

        },

        resetOrientation: function () {

            this.setOrientation(0, 0, 0);
            this.position.x = 0;
            this.position.y = 0;
            this.position.z = 0;

        },

        resetOrientationInverse: function () {

            this.setOrientation(-180, 0, 0);
            this.position.x = 0;
            this.position.y = 0;
            this.position.z = 0;

        },

        setOrientation: function (x, y, z) {

            this._worldOrientationOffset.x = -this._worldOrientation.x + x;
            this._worldOrientationOffset.y = y;
            this._worldOrientationOffset.z = -this._worldOrientation.z + z;

            this._hOffset = 0;
            this._vOffset = 0;
            this._vElasticity = 0;
            this._vElasticSpeed = 0;
            this._view.hLookAt = 0;
            this._view.vLookAt = 0;
            this._view.camRoll = 0;
            this._worldOrientation.x = 0;
            this._worldOrientation.y = 0;
            this._worldOrientation.z = 0;

            this._isSampleValid = false;
            this._firstSample = null;

        }

    },

    _private: {

        _isAndroid: false,
        _mobileStateBatch: null,
        _firstSample: null,
        _isSampleValid: false,
        _isCamRoll: true,
        _view: {hLookAt: 0, vLookAt: 0, camRoll: 0},
        _worldOrientation: {x: 0, y: 0, z: 0},
        _worldOrientationOffset: {x: 0, y: 0, z: 0},
        _hOffset: 0,
        _vOffset: 0,
        _vElasticity: 0,
        _vElasticSpeed: 0,
        _friction: 0.5,
        _localAcceleration: {x: 0, y: 0, z: 0},
        _localAccelerationBuffer: [],
        _localAccelerationBufferIndex: 0,
        _localAccelerationAverage: {x: 0, y: 0, z: 0},
        _lastWorldAcceleration: {x: 0, y: 0, z: 0},
        _lastLocalAcceleration: null,
        _lastAccelerationUpdateTime: -1,
        _isAccelerationSampleValid: false,

        _gravityX: 0,
        _gravityY: 0,
        _gravityZ: 0,

        wrapAngle: function (angle) {

            angle = angle % 360;
            return (angle <= 180) ? angle : (angle - 360);

        },

        wrapAngleRect: function (angle) {

            if (angle <= 90) {
                if (angle < 0) {
                    if (angle > -90) {
                        angle = -90 + (angle + 90);
                    } else {
                        angle = -((angle + 90) + 90);
                    }
                }
            } else {
                angle = 90 - (angle - 90);
            }

            return angle;

        },

        rotateEuler: function (euler) {

            var heading, bank, attitude,
                ch = Math.cos(euler.yaw),
                sh = Math.sin(euler.yaw),
                ca = Math.cos(euler.pitch),
                sa = Math.sin(euler.pitch),
                cb = Math.cos(euler.roll),
                sb = Math.sin(euler.roll),

                matrix = [
                    sh * sb - ch * sa * cb, -ch * ca, ch * sa * sb + sh * cb,
                    ca * cb, -sa, -ca * sb,
                    sh * sa * cb + ch * sb, sh * ca, -sh * sa * sb + ch * cb
                ];

            if (matrix[3] > 0.9999) {
                heading = Math.atan2(matrix[2], matrix[8]);
                attitude = Math.PI / 2;
                bank = 0;
            } else if (matrix[3] < -0.9999) {
                heading = Math.atan2(matrix[2], matrix[8]);
                attitude = -Math.PI / 2;
                bank = 0;
            } else {
                heading = Math.atan2(-matrix[6], matrix[0]);
                bank = Math.atan2(-matrix[5], matrix[4]);
                attitude = Math.asin(matrix[3]);
            }

            return {yaw: heading, pitch: attitude, roll: bank};

        },

        getWorldAcceleration: function (accelerationIncludingGravity) {

            var worldAcceleration = new Vector3(accelerationIncludingGravity.x, accelerationIncludingGravity.y, accelerationIncludingGravity.z);
            worldAcceleration.applyQuaternion(this.worldQuaternion);

            worldAcceleration.x -= OrientationController.GRAVITY.x;
            worldAcceleration.y -= OrientationController.GRAVITY.y;
            worldAcceleration.z -= OrientationController.GRAVITY.z;

            if (worldAcceleration.y === 9.81) {
                worldAcceleration.y = 0;
            }

            return worldAcceleration;

        },

        calculateAverageAcceleration: function () {

            var accelerationSample = {x: this.localAccelerationIncludingGravity.x, y: this.localAccelerationIncludingGravity.y, z: this.localAccelerationIncludingGravity.z},
                i;

            if (this._localAccelerationBuffer.length < OrientationController.ACCELERATION_BUFFER_LENGTH) {

                this._localAccelerationBuffer.push(accelerationSample);

            } else {

                this._isAccelerationSampleValid = true;
                this._localAccelerationBuffer[this._localAccelerationBufferIndex] = accelerationSample;

                this._localAccelerationAverage.x = 0;
                this._localAccelerationAverage.y = 0;
                this._localAccelerationAverage.z = 0;

                for (i = 0; i < OrientationController.ACCELERATION_BUFFER_LENGTH; i++) {

                    this._localAccelerationAverage.x += this._localAccelerationBuffer[i].x;
                    this._localAccelerationAverage.y += this._localAccelerationBuffer[i].y;
                    this._localAccelerationAverage.z += this._localAccelerationBuffer[i].z;

                }

                this._localAccelerationAverage.x /= OrientationController.ACCELERATION_BUFFER_LENGTH;
                this._localAccelerationAverage.y /= OrientationController.ACCELERATION_BUFFER_LENGTH;
                this._localAccelerationAverage.z /= OrientationController.ACCELERATION_BUFFER_LENGTH;

            }

            this._localAccelerationBufferIndex = (this._localAccelerationBufferIndex + 1) % OrientationController.ACCELERATION_BUFFER_LENGTH;

        },

        processPosition: function (dt) {

            var ax = this.worldAcceleration.x,
                ay = this.worldAcceleration.y,
                az = this.worldAcceleration.z,
                timeFactorVelocity = dt,
                timeFactorPosition = dt,
                vx,
                vy,
                vz;

            ay = ay === 9.8 ? 0 : ay;
            ax = Math.abs(ax) < OrientationController.MIN_ACCELERATION_TO_UPDATE_POSITION ? 0 : ax;
            ay = Math.abs(ay) < OrientationController.MIN_ACCELERATION_TO_UPDATE_POSITION ? 0 : ay;
            az = Math.abs(az) < OrientationController.MIN_ACCELERATION_TO_UPDATE_POSITION ? 0 : az;

            vx = this.velocity.x * OrientationController.VELOCITY_DAMPING + ax * timeFactorVelocity;
            vy = this.velocity.y * OrientationController.VELOCITY_DAMPING + ay * timeFactorVelocity;
            vz = this.velocity.z * OrientationController.VELOCITY_DAMPING + az * timeFactorVelocity;

            this.position.x = this.position.x * OrientationController.POSITION_DAMPING + (vx + this.velocity.x) * 0.5 * timeFactorPosition;
            this.position.y = this.position.y * OrientationController.POSITION_DAMPING + (vy + this.velocity.y) * 0.5 * timeFactorPosition;
            this.position.z = this.position.z * OrientationController.POSITION_DAMPING + (vz + this.velocity.z) * 0.5 * timeFactorPosition;

            this.velocity.x = vx;
            this.velocity.y = vy;
            this.velocity.z = vz;

        },

        processAcceleration: function () {

            if (this._lastLocalAcceleration) {

                this.localAccelerationIncludingGravityFiltered.x = this._lastLocalAcceleration.x + (this._localAccelerationAverage.x - this._lastLocalAcceleration.x) * 0.5;
                this.localAccelerationIncludingGravityFiltered.y = this._lastLocalAcceleration.y + (this._localAccelerationAverage.y - this._lastLocalAcceleration.y) * 0.5;
                this.localAccelerationIncludingGravityFiltered.z = this._lastLocalAcceleration.z + (this._localAccelerationAverage.z - this._lastLocalAcceleration.z) * 0.5;

            } else {

                this._lastLocalAcceleration = {x: 0, y: 0, z: 0};

            }

            this._lastLocalAcceleration.x = this._localAccelerationAverage.x;
            this._lastLocalAcceleration.y = this._localAccelerationAverage.y;
            this._lastLocalAcceleration.z = this._localAccelerationAverage.z;

            this._lastWorldAcceleration.x = this.worldAcceleration.x;
            this._lastWorldAcceleration.y = this.worldAcceleration.y;
            this._lastWorldAcceleration.z = this.worldAcceleration.z;

            this.worldAcceleration = this.getWorldAcceleration(this.localAccelerationIncludingGravityFiltered);
        },


        processOrientation: function (alpha, beta, gamma) {

            var orientation,
                deviceOrientation,
                yaw,
                pitch,
                altYaw,
                factor,
                hSpeed,
                vSpeed,
                quaternion;

            this.localOrientation.alpha = alpha;
            this.localOrientation.beta = beta;
            this.localOrientation.gamma = gamma;

            // Fix Android diff on YAW
            if (this._isAndroid) {
                alpha -= 180;
            }

            orientation = this.rotateEuler({yaw: alpha * OrientationController.TO_RADIANS, pitch: beta * OrientationController.TO_RADIANS, roll: gamma * OrientationController.TO_RADIANS});
            deviceOrientation = window.top ? window.top.orientation : window.orientation;
            yaw = this.wrapAngle(orientation.yaw / OrientationController.TO_RADIANS);
            pitch = orientation.pitch / OrientationController.TO_RADIANS;
            altYaw = yaw;

            hSpeed = this._view.hLookAt - this._worldOrientation.x;
            vSpeed = this._view.vLookAt - this._worldOrientation.y;

            this.debug.hSpeed = hSpeed;
            this.debug.vSpeed = vSpeed;

            if (!this._isSampleValid) {

                if (!this._firstSample) {

                    this._firstSample = orientation;

                } else {

                    if (orientation.yaw !== this._firstSample.yaw || orientation.pitch !== this._firstSample.pitch || orientation.roll !== this._firstSample.roll) {

                        this._firstSample = null;
                        this._isSampleValid = true;

                        if (this.isVRelative) {

                            this._vOffset = -pitch;

                        }
                    }
                }

                return;
            }

            // Set the device orientation
            this.phoneOrientation = deviceOrientation;

            if (this._isCamRoll) {
                this._view.camRoll = this.wrapAngle(180 - orientation.roll / OrientationController.TO_RADIANS);
            }

            if (Math.abs(pitch) > 90) {

                altYaw = alpha;

                switch (deviceOrientation) {

                case 0:
                    if (pitch > 0) {
                        altYaw += 180;
                    }
                    break;

                case 90:
                    altYaw += 90;
                    break;

                case -90:
                    altYaw += -90;
                    break;

                case 180:
                    if (pitch < 0) {
                        altYaw += 180;
                    }
                    break;

                }

                altYaw = this.wrapAngle(altYaw);

                if (Math.abs(altYaw - yaw) > 180) {
                    altYaw += (altYaw < yaw) ? 360 : -360;
                }

                factor = Math.min(1, (Math.abs(pitch) - 70) / 10);
                yaw = yaw * (1 - factor) + altYaw * factor;

                this._view.camRoll *= (1 - factor);
            }

            this._hOffset += hSpeed;
            this._vOffset += vSpeed;

            if (Math.abs(pitch + this._vOffset) > 90) {
                this._vOffset = (pitch + this._vOffset > 0) ? (90 - pitch) : (-90 - pitch);
            }

            this._view.hLookAt = this.wrapAngle(-yaw - 180 + this._hOffset);
            this._view.vLookAt = Math.max(Math.min((pitch + this._vOffset), 90), -90);

            if (Math.abs(this._worldOrientation.x - this._view.hLookAt) > 180) {
                this._worldOrientation.x += (this._view.hLookAt > this._worldOrientation.x) ? 360 : -360;
            }

            this._view.hLookAt = (1 - this._friction) * this._view.hLookAt + this._friction * this._worldOrientation.x;
            this._view.vLookAt = (1 - this._friction) * this._view.vLookAt + this._friction * this._worldOrientation.y;

            if (Math.abs(this._view.camRoll - this._worldOrientation.z) > 180) {
                this._worldOrientation.z += (this._view.camRoll > this._worldOrientation.z) ? 360 : -360;
            }

            this._view.camRoll = (1 - this._friction) * this._view.camRoll + this._friction * this._worldOrientation.z;

            this._worldOrientation.x = this.wrapAngle(this._view.hLookAt);
            this._worldOrientation.y = this._view.vLookAt;
            this._worldOrientation.z = this.wrapAngle(this._view.camRoll);

            if (this._vOffset !== 0 && this._vElasticity > 0) {

                if (this._vSpeed === 0) {

                    if (this._vElasticity === 1) {

                        this._vOffset = 0;
                        this._vElasticSpeed = 0;

                    } else {

                        this._vElasticSpeed = 1 - ((1 - this._vElasticSpeed) * this._touchfriction);
                        this._vOffset *= 1 - (Math.pow(this._vElasticity, 2) * this._vElasticSpeed);

                        if (Math.abs(this._vOffset) < 0.1) {
                            this._vOffset = 0;
                            this._vElasticSpeed = 0;
                        }

                    }

                } else {

                    this._vElasticSpeed = 0;

                }
            }

            this.worldOrientation.x = this._worldOrientation.x + this._worldOrientationOffset.x;
            this.worldOrientation.y = this._worldOrientation.y + this._worldOrientationOffset.y;
            this.worldOrientation.z = this._worldOrientation.z + this._worldOrientationOffset.z;

            quaternion = new Quaternion();
            quaternion.setFromAxisAngle(OrientationController.AXIS_Y, this.worldOrientation.x * OrientationController.TO_RADIANS);
            quaternion.multiply(new Quaternion().setFromAxisAngle(OrientationController.AXIS_X, this.worldOrientation.y * OrientationController.TO_RADIANS));
            quaternion.multiply(new Quaternion().setFromAxisAngle(OrientationController.AXIS_Z, this.worldOrientation.z * OrientationController.TO_RADIANS));

            this.worldQuaternion.x = quaternion.x;
            this.worldQuaternion.y = quaternion.y;
            this.worldQuaternion.z = quaternion.z;
            this.worldQuaternion.w = quaternion.w;

        },

        onDeviceMotionEvent: function (e) {

            var currentTime;

            this.localAccelerationIncludingGravity.x = e.accelerationIncludingGravity.x;
            this.localAccelerationIncludingGravity.y = e.accelerationIncludingGravity.y;
            this.localAccelerationIncludingGravity.z = e.accelerationIncludingGravity.z;

            this.calculateAverageAcceleration();
            this.events.trigger(OrientationController.EVENT_ACCELERATION_CHANGE);

            currentTime = new Date().getTime();

            if (this._isAccelerationSampleValid) {

                this.processAcceleration();
                this.processPosition((new Date().getTime() - this._lastAccelerationUpdateTime) * 0.001);
                this.events.trigger(OrientationController.EVENT_POSITION_CHANGE);

            }

            this._lastAccelerationUpdateTime = currentTime;
        },

        onDeviceOrientationEvent: function (e) {

            if (this.hasGyroscope) {
                this.processOrientation(e.alpha, e.beta, e.gamma);
            }

            this.events.trigger(OrientationController.EVENT_ORIENTATION_CHANGE);

        }

    }

});
