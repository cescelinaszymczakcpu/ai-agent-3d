"use client";

import React, { useMemo } from "react";
import * as THREE from "three";

export const ORB_CENTER_Y = 1.25;
export const ORB_RADIUS = 1.56;

export const HEAD_ANCHORS = Object.freeze({
  HEAD_TOP: {
    position: [0, ORB_CENTER_Y + ORB_RADIUS, 0],
    normal: [0, 1, 0],
  },
  FOREHEAD: {
    position: [0, ORB_CENTER_Y + ORB_RADIUS * 0.53, ORB_RADIUS * 0.84],
    normal: [0, 0.53, 0.84],
  },
  LEFT_SIDE: {
    position: [-ORB_RADIUS, ORB_CENTER_Y, 0],
    normal: [-1, 0, 0],
  },
  RIGHT_SIDE: {
    position: [ORB_RADIUS, ORB_CENTER_Y, 0],
    normal: [1, 0, 0],
  },
  FACE_CENTER: {
    position: [0, ORB_CENTER_Y, ORB_RADIUS],
    normal: [0, 0, 1],
  },
  CHIN: {
    position: [0, ORB_CENTER_Y - ORB_RADIUS * 0.76, ORB_RADIUS * 0.65],
    normal: [0, -0.76, 0.65],
  },
});

export const DEFAULT_ACCESSORY_TRANSFORM = Object.freeze({
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  offsetZ: 0,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  collisionRadius: 0.58,
});

export const BERET_PROFILE = Object.freeze({
  anchor: "HEAD_TOP",
  scale: 0.9,
  offsetX: 0.08,
  offsetY: -0.12,
  offsetZ: -0.015,
  rotationX: 0.035,
  rotationY: -0.04,
  rotationZ: -0.13,
  collisionRadius: 0.59,
  surfaceClearance: 0.018,
});

const HAIR_CLEARANCE = Object.freeze({
  none: 0.012,
  short: 0.05,
  elegant: 0.078,
  "reference-curl": 0.078,
  "long-wave": 0.115,
  swept: 0.06,
});

export function getHeadAnchor(name = "HEAD_TOP") {
  return HEAD_ANCHORS[name] || HEAD_ANCHORS.HEAD_TOP;
}

export function getHairClearance(style = "none") {
  return HAIR_CLEARANCE[style] ?? 0.07;
}

function buildBeretGeometry() {
  // Closed radial cross-section: outer shell -> crown -> inner shell -> lower edge.
  // Pivot stays at the lower contact ring (local y ~= 0).
  const profile = [
    [0.54, 0.0],
    [0.72, 0.05],
    [0.91, 0.13],
    [1.045, 0.27],
    [1.075, 0.39],
    [1.01, 0.51],
    [0.82, 0.6],
    [0.55, 0.655],
    [0.24, 0.67],
    [0.0, 0.635],
    [0.0, 0.535],
    [0.2, 0.56],
    [0.47, 0.525],
    [0.7, 0.455],
    [0.855, 0.35],
    [0.86, 0.235],
    [0.74, 0.13],
    [0.58, 0.065],
    [0.54, 0.0],
  ];

  const geometry = new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    96
  );

  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    const angle = Math.atan2(z, x);
    const top = THREE.MathUtils.clamp(y / 0.67, 0, 1);
    const crown = top * top * (3 - 2 * top);

    // Real beret character: flattened depth, uneven crown, soft side drop.
    z *= 0.88 + 0.035 * Math.cos(angle + 0.7);
    x *= 1 + crown * 0.055 * Math.cos(angle - 0.45);
    x += crown * 0.075;

    const rightDroop = Math.max(0, Math.cos(angle - 0.25));
    const rearLift = Math.max(0, -Math.sin(angle + 0.3));
    y -= crown * rightDroop * 0.07;
    y += crown * rearLift * 0.024;
    y += x * 0.018 - z * 0.012;

    pos.setXYZ(i, x, y, z);
  }

  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function buildStemGeometry() {
  const profile = [
    [0.0, 0],
    [0.05, 0.015],
    [0.055, 0.055],
    [0.036, 0.105],
    [0.0, 0.13],
  ];
  const g = new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    32
  );
  g.computeVertexNormals();
  return g;
}

function Material({ color = "#8E6CFF", mode = "iridescent", opacity = 0.82 }) {
  const modes = {
    glass: [0.94, 0.04, 0, 0.45],
    "frosted-glass": [0.62, 0.22, 0, 0.35],
    iridescent: [0.84, 0.055, 0.02, 1],
    holographic: [0.68, 0.08, 0.12, 1],
    "chrome-glass": [0.48, 0.07, 0.28, 0.78],
    pearlescent: [0.72, 0.12, 0.04, 0.62],
  };
  const m = modes[mode] || modes.iridescent;
  return (
    <meshPhysicalMaterial
      color={color}
      transparent
      opacity={opacity}
      transmission={m[0]}
      thickness={0.26}
      roughness={m[1]}
      metalness={m[2]}
      clearcoat={1}
      clearcoatRoughness={0.025}
      ior={1.46}
      iridescence={m[3]}
      envMapIntensity={1.7}
      emissive={color}
      emissiveIntensity={0.018}
    />
  );
}

function BeretLowerBand({ color, mode }) {
  const curve = useMemo(() => {
    const points = Array.from({ length: 72 }, (_, i) => {
      const a = (i / 72) * Math.PI * 2;
      return new THREE.Vector3(
        Math.cos(a) * 0.565,
        0.035 + Math.cos(a - 0.6) * 0.006,
        Math.sin(a) * 0.5
      );
    });
    return new THREE.CatmullRomCurve3(points, true, "centripetal");
  }, []);

  return (
    <mesh>
      <tubeGeometry args={[curve, 96, 0.026, 10, true]} />
      <Material color={color} mode={mode} opacity={0.88} />
    </mesh>
  );
}

export function PremiumBeret({ color = "#8E6CFF", mode = "iridescent" }) {
  const shell = useMemo(() => buildBeretGeometry(), []);
  const stem = useMemo(() => buildStemGeometry(), []);

  return (
    <group>
      <mesh geometry={shell}>
        <Material color={color} mode={mode} />
      </mesh>
      <BeretLowerBand color={color} mode={mode} />
      <mesh geometry={stem} position={[0.095, 0.585, -0.025]} rotation={[0.06, 0, -0.08]}>
        <Material color={color} mode={mode} opacity={0.9} />
      </mesh>
    </group>
  );
}

function collisionSamples(radius) {
  const rx = radius;
  const rz = radius * 0.885;
  return Array.from({ length: 20 }, (_, i) => {
    const a = (i / 20) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * rx, 0.035, Math.sin(a) * rz);
  });
}

function deepestOrbPenetration(position, rotation, scale, collisionRadius, clearance) {
  const q = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(rotation[0], rotation[1], rotation[2], "XYZ")
  );
  const orbCenter = new THREE.Vector3(0, ORB_CENTER_Y, 0);
  let deepest = 0;

  for (const sample of collisionSamples(collisionRadius)) {
    const world = sample.clone().multiplyScalar(scale).applyQuaternion(q).add(position);
    const required = ORB_RADIUS + clearance;
    const penetration = required - world.distanceTo(orbCenter);
    if (penetration > deepest) deepest = penetration;
  }

  return deepest;
}

export function resolveBeretPlacement(hairStyle = "none", hat = {}) {
  const anchor = getHeadAnchor(BERET_PROFILE.anchor);
  const scale = (hat.scale ?? 1) * BERET_PROFILE.scale;
  const collisionRadius = hat.collisionRadius ?? BERET_PROFILE.collisionRadius;
  const hairClearance = getHairClearance(hairStyle);

  const rotation = [
    BERET_PROFILE.rotationX + (hat.rotationX || 0),
    BERET_PROFILE.rotationY + (hat.rotationY ?? hat.rotation ?? 0),
    BERET_PROFILE.rotationZ + (hat.rotationZ || 0),
  ];

  const position = new THREE.Vector3(
    anchor.position[0] + BERET_PROFILE.offsetX + (hat.offsetX || 0),
    anchor.position[1] + BERET_PROFILE.offsetY + (hat.offsetY || 0) + (hat.height || 0),
    anchor.position[2] + BERET_PROFILE.offsetZ + (hat.offsetZ || 0)
  );

  const clearance = BERET_PROFILE.surfaceClearance + hairClearance;

  // Actual penetration guard: inspect lower contact ring against orb sphere and push up.
  for (let i = 0; i < 32; i += 1) {
    const penetration = deepestOrbPenetration(
      position,
      rotation,
      scale,
      collisionRadius,
      clearance
    );
    if (penetration <= 0.001) break;
    position.y += Math.min(0.04, penetration + 0.004);
  }

  return {
    position: [position.x, position.y, position.z],
    rotation,
    scale,
    collisionRadius,
  };
}
