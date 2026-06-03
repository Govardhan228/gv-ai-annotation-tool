/**
 * Utility: 3D Cuboid Operations
 * Helper functions for 3D cuboid manipulation, transformation, and rendering
 */

import { Cuboid3D, Vector3D, Quaternion, CuboidOperationContext, AXIS } from '../types/cuboid-3d';

export class Cuboid3DUtils {
  /**
   * Create identity quaternion
   */
  static identityQuaternion(): Quaternion {
    return { x: 0, y: 0, z: 0, w: 1 };
  }

  /**
   * Create quaternion from Euler angles (in radians)
   */
  static quatFromEuler(roll: number, pitch: number, yaw: number): Quaternion {
    const cy = Math.cos(yaw * 0.5);
    const sy = Math.sin(yaw * 0.5);
    const cp = Math.cos(pitch * 0.5);
    const sp = Math.sin(pitch * 0.5);
    const cr = Math.cos(roll * 0.5);
    const sr = Math.sin(roll * 0.5);

    return {
      w: cr * cp * cy + sr * sp * sy,
      x: sr * cp * cy - cr * sp * sy,
      y: cr * sp * cy + sr * cp * sy,
      z: cr * cp * sy - sr * sp * cy,
    };
  }

  /**
   * Convert quaternion to Euler angles (in radians)
   */
  static quatToEuler(q: Quaternion): { roll: number; pitch: number; yaw: number } {
    const sqw = q.w * q.w;
    const sqx = q.x * q.x;
    const sqy = q.y * q.y;
    const sqz = q.z * q.z;
    const unit = sqx + sqy + sqz + sqw;
    const test = q.x * q.y + q.z * q.w;

    let roll, pitch, yaw;

    if (test > 0.499 * unit) {
      yaw = 2 * Math.atan2(q.x, q.w);
      pitch = Math.PI / 2;
      roll = 0;
    } else if (test < -0.499 * unit) {
      yaw = -2 * Math.atan2(q.x, q.w);
      pitch = -Math.PI / 2;
      roll = 0;
    } else {
      yaw = Math.atan2(2 * q.y * q.w - 2 * q.x * q.z, sqx - sqy - sqz + sqw);
      pitch = Math.asin(2 * test / unit);
      roll = Math.atan2(2 * q.x * q.w - 2 * q.y * q.z, -sqx + sqy - sqz + sqw);
    }

    return { roll, pitch, yaw };
  }

  /**
   * Multiply two quaternions
   */
  static quatMultiply(q1: Quaternion, q2: Quaternion): Quaternion {
    return {
      w: q1.w * q2.w - q1.x * q2.x - q1.y * q2.y - q1.z * q2.z,
      x: q1.w * q2.x + q1.x * q2.w + q1.y * q2.z - q1.z * q2.y,
      y: q1.w * q2.y - q1.x * q2.z + q1.y * q2.w + q1.z * q2.x,
      z: q1.w * q2.z + q1.x * q2.y - q1.y * q2.x + q1.z * q2.w,
    };
  }

  /**
   * Rotate a vector using a quaternion
   */
  static rotateVector(v: Vector3D, q: Quaternion): Vector3D {
    const qv = { x: q.x, y: q.y, z: q.z, w: 0 };
    const qConj = { x: -q.x, y: -q.y, z: -q.z, w: q.w };

    const vRot = this.quatMultiply(this.quatMultiply(q, qv), qConj);
    return { x: vRot.x, y: vRot.y, z: vRot.z };
  }

  /**
   * Get all 8 vertices of a cuboid
   */
  static getVertices(cuboid: Cuboid3D): Vector3D[] {
    const { width, height, depth } = cuboid.dimensions;
    const w = width / 2;
    const h = height / 2;
    const d = depth / 2;

    const localVertices: Vector3D[] = [
      { x: -w, y: -h, z: -d },
      { x: w, y: -h, z: -d },
      { x: w, y: h, z: -d },
      { x: -w, y: h, z: -d },
      { x: -w, y: -h, z: d },
      { x: w, y: -h, z: d },
      { x: w, y: h, z: d },
      { x: -w, y: h, z: d },
    ];

    // Apply scale
    localVertices.forEach((v) => {
      v.x *= cuboid.scale.x;
      v.y *= cuboid.scale.y;
      v.z *= cuboid.scale.z;
    });

    // Apply rotation
    localVertices.forEach((v, i) => {
      localVertices[i] = this.rotateVector(v, cuboid.rotation);
    });

    // Apply translation
    return localVertices.map((v) => ({
      x: v.x + cuboid.position.x,
      y: v.y + cuboid.position.y,
      z: v.z + cuboid.position.z,
    }));
  }

  /**
   * Get edges of cuboid (pairs of vertex indices)
   */
  static getEdges(): Array<[number, number]> {
    return [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ];
  }

  /**
   * Project 3D point to 2D screen space (simplified perspective)
   */
  static project3DTo2D(point: Vector3D, fov: number = 45, distance: number = 5): { x: number; y: number } {
    const scale = fov / (distance + point.z);
    return {
      x: point.x * scale,
      y: point.y * scale,
    };
  }

  /**
   * Calculate bounding box of cuboid
   */
  static getBoundingBox(cuboid: Cuboid3D): { min: Vector3D; max: Vector3D } {
    const vertices = this.getVertices(cuboid);

    return {
      min: {
        x: Math.min(...vertices.map((v) => v.x)),
        y: Math.min(...vertices.map((v) => v.y)),
        z: Math.min(...vertices.map((v) => v.z)),
      },
      max: {
        x: Math.max(...vertices.map((v) => v.x)),
        y: Math.max(...vertices.map((v) => v.y)),
        z: Math.max(...vertices.map((v) => v.z)),
      },
    };
  }

  /**
   * Rotate cuboid around axis
   */
  static rotateAroundAxis(cuboid: Cuboid3D, axis: Vector3D, angle: number): Cuboid3D {
    const axisNorm = this.normalize(axis);
    const halfAngle = angle / 2;
    const sin = Math.sin(halfAngle);

    const rotQuat: Quaternion = {
      x: axisNorm.x * sin,
      y: axisNorm.y * sin,
      z: axisNorm.z * sin,
      w: Math.cos(halfAngle),
    };

    return {
      ...cuboid,
      rotation: this.quatMultiply(cuboid.rotation, rotQuat),
    };
  }

  /**
   * Scale cuboid
   */
  static scale(cuboid: Cuboid3D, factors: { x?: number; y?: number; z?: number }): Cuboid3D {
    return {
      ...cuboid,
      scale: {
        x: cuboid.scale.x * (factors.x ?? 1),
        y: cuboid.scale.y * (factors.y ?? 1),
        z: cuboid.scale.z * (factors.z ?? 1),
      },
    };
  }

  /**
   * Translate cuboid
   */
  static translate(cuboid: Cuboid3D, delta: Vector3D): Cuboid3D {
    return {
      ...cuboid,
      position: {
        x: cuboid.position.x + delta.x,
        y: cuboid.position.y + delta.y,
        z: cuboid.position.z + delta.z,
      },
    };
  }

  /**
   * Normalize vector
   */
  static normalize(v: Vector3D): Vector3D {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (len === 0) return { x: 0, y: 0, z: 0 };
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  }

  /**
   * Dot product of two vectors
   */
  static dot(v1: Vector3D, v2: Vector3D): number {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  }

  /**
   * Cross product of two vectors
   */
  static cross(v1: Vector3D, v2: Vector3D): Vector3D {
    return {
      x: v1.y * v2.z - v1.z * v2.y,
      y: v1.z * v2.x - v1.x * v2.z,
      z: v1.x * v2.y - v1.y * v2.x,
    };
  }

  /**
   * Distance between two 3D points
   */
  static distance(p1: Vector3D, p2: Vector3D): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

export default Cuboid3DUtils;
