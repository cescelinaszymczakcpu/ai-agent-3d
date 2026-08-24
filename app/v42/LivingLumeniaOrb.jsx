"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
} from "@react-three/drei";

const EMOTIONS = {
  neutral: { colors: ["#24E7FF", "#2867FF", "#A347FF", "#FF43C4"], glow: 1.0, flowSpeed: 1.0, breathSpeed: 1.0 },
  happy: { colors: ["#2CF4FF", "#39DCC8", "#FF57CC", "#FFB47E"], glow: 1.15, flowSpeed: 1.12, breathSpeed: 1.04 },
  caring: { colors: ["#54E8F4", "#637CFF", "#C477FF", "#FF8EAE"], glow: 1.02, flowSpeed: 0.82, breathSpeed: 0.90 },
  calm: { colors: ["#65EAD9", "#63B8FF", "#9C8FFF", "#DDA4FF"], glow: 0.88, flowSpeed: 0.70, breathSpeed: 0.84 },
  curious: { colors: ["#35F0FF", "#406CFF", "#A34DFF", "#DC58FF"], glow: 1.08, flowSpeed: 1.16, breathSpeed: 1.0 },
  excited: { colors: ["#00F6FF", "#425DFF", "#CD38FF", "#FF35A9"], glow: 1.25, flowSpeed: 1.30, breathSpeed: 1.10 },
  sad: { colors: ["#367AAE", "#3859B8", "#6550A8", "#835B9D"], glow: 0.72, flowSpeed: 0.62, breathSpeed: 0.80 },
  surprised: { colors: ["#A8FAFF", "#46BDFF", "#B855FF", "#FF75DF"], glow: 1.27, flowSpeed: 1.30, breathSpeed: 1.08 },
  warning: { colors: ["#FFBF44", "#FF7A4A", "#C454FF", "#FF568D"], glow: 1.14, flowSpeed: 1.05, breathSpeed: 1.0 },
  error: { colors: ["#FF419C", "#9E3DFF", "#FF486A", "#694AFF"], glow: 1.17, flowSpeed: 1.20, breathSpeed: 1.0 },
};

const STATE_IDS = { idle: 0, listening: 1, thinking: 2, speaking: 3, success: 4, warning: 5, error: 6 };
const STATE_SPEED = { idle: 1.0, listening: 1.08, thinking: 1.25, speaking: 1.12, success: 1.14, warning: 1.08, error: 1.22 };

function smootherStep01(value) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function getLumeniaBreath(time, period = 5.2) {
  const cycle = (time % period) / period;
  let breath = 0;
  if (cycle < 0.34) {
    breath = smootherStep01(cycle / 0.34);
  } else if (cycle < 0.40) {
    breath = 1;
  } else if (cycle < 0.88) {
    const p = (cycle - 0.40) / (0.88 - 0.40);
    breath = 1 - smootherStep01(p);
  } else {
    const p = (cycle - 0.88) / 0.12;
    breath = Math.sin(p * Math.PI) * 0.018;
  }
  const organicMicroLife = Math.sin(time * 0.63) * 0.014 + Math.sin(time * 0.29 + 1.4) * 0.009;
  return THREE.MathUtils.clamp(breath + organicMicroLife, 0, 1);
}

const ENERGY_VERTEX_SHADER = `
precision highp float;
uniform float uTime;
uniform float uBreath;
varying vec3 vPosition;
varying vec3 vNormal;
void main() {
  vec3 p = position;
  float waveA = sin(position.y * 3.1 + position.x * 1.7 + uTime * 0.34);
  float waveB = sin(position.z * 3.7 - position.y * 1.4 + uTime * 0.27);
  float microDeform = (waveA + waveB) * 0.0035 * (0.35 + uBreath);
  p += normal * microDeform;
  vPosition = p;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const ENERGY_FRAGMENT_SHADER = `
precision highp float;
uniform float uTime;
uniform float uAudio;
uniform float uBreath;
uniform float uGlow;
uniform float uColorFlowSpeed;
uniform float uFlowIntensity;
uniform int uState;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform vec3 uColorD;
varying vec3 vPosition;
varying vec3 vNormal;

float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash31(i + vec3(0,0,0));
  float b = hash31(i + vec3(1,0,0));
  float c = hash31(i + vec3(0,1,0));
  float d = hash31(i + vec3(1,1,0));
  float e = hash31(i + vec3(0,0,1));
  float f1 = hash31(i + vec3(1,0,1));
  float g = hash31(i + vec3(0,1,1));
  float h = hash31(i + vec3(1,1,1));
  float x1 = mix(a, b, f.x);
  float x2 = mix(c, d, f.x);
  float x3 = mix(e, f1, f.x);
  float x4 = mix(g, h, f.x);
  float y1 = mix(x1, x2, f.y);
  float y2 = mix(x3, x4, f.y);
  return mix(y1, y2, f.z);
}

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += noise3(p) * amplitude;
    p *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}

float blob(vec3 p, vec3 center, float radius) {
  float d = length(p - center);
  return 1.0 - smoothstep(radius * 0.20, radius, d);
}

vec3 paletteWheel(float phase) {
  float p = fract(phase);
  float segment = p * 4.0;
  if (segment < 1.0) {
    float t = smoothstep(0.0, 1.0, segment);
    return mix(uColorA, uColorB, t);
  } else if (segment < 2.0) {
    float t = smoothstep(0.0, 1.0, segment - 1.0);
    return mix(uColorB, uColorC, t);
  } else if (segment < 3.0) {
    float t = smoothstep(0.0, 1.0, segment - 2.0);
    return mix(uColorC, uColorD, t);
  }
  float t = smoothstep(0.0, 1.0, segment - 3.0);
  return mix(uColorD, uColorA, t);
}

void main() {
  float time = uTime;
  vec3 p = vPosition;
  float colorClock = time * uColorFlowSpeed;

  vec3 centerA = vec3(-0.58 + sin(time * 0.31) * 0.38, 0.43 + cos(time * 0.27) * 0.32, 0.12 + sin(time * 0.19) * 0.17);
  vec3 centerB = vec3(0.52 + cos(time * 0.24 + 1.7) * 0.34, 0.33 + sin(time * 0.29 + 0.6) * 0.38, -0.10 + cos(time * 0.17) * 0.16);
  vec3 centerC = vec3(-0.28 + sin(time * 0.22 + 2.4) * 0.45, -0.52 + cos(time * 0.26 + 0.8) * 0.30, 0.15 + sin(time * 0.23) * 0.18);
  vec3 centerD = vec3(0.53 + cos(time * 0.27 + 3.5) * 0.32, -0.32 + sin(time * 0.21 + 2.5) * 0.36, 0.11 + cos(time * 0.20) * 0.16);

  float breathingRadius = 1.03 + uBreath * 0.19;
  float noiseA = fbm(p * 1.42 + vec3(time * 0.085, 0, 0));
  float noiseB = fbm(p * 1.56 + vec3(0, time * 0.073, 0));
  float noiseC = fbm(p * 1.38 + vec3(0, 0, time * 0.081));
  float noiseD = fbm(p * 1.49 + vec3(-time * 0.062, time * 0.051, 0));

  float fieldA = blob(p, centerA, breathingRadius) * (0.57 + noiseA * 0.66);
  float fieldB = blob(p, centerB, breathingRadius) * (0.57 + noiseB * 0.66);
  float fieldC = blob(p, centerC, breathingRadius) * (0.57 + noiseC * 0.66);
  float fieldD = blob(p, centerD, breathingRadius) * (0.57 + noiseD * 0.66);

  fieldA *= 0.80 + 0.28 * sin(p.y * 3.6 + noiseA * 4.0 - time * 0.58);
  fieldB *= 0.80 + 0.26 * sin(p.x * 4.2 - noiseB * 3.8 + time * 0.47);
  fieldC *= 0.80 + 0.28 * sin(p.y * 4.0 + p.x * 1.5 + time * 0.52);
  fieldD *= 0.80 + 0.26 * sin(p.x * 3.7 - p.y * 1.4 - time * 0.49);

  vec3 colorA = paletteWheel(colorClock + 0.00);
  vec3 colorB = paletteWheel(colorClock + 0.25);
  vec3 colorC = paletteWheel(colorClock + 0.50);
  vec3 colorD = paletteWheel(colorClock + 0.75);

  if (uState == 2) {
    float angle = atan(p.y, p.x);
    float spiral = 0.5 + 0.5 * sin(angle * 4.0 + length(p.xy) * 8.0 - time * 1.65);
    fieldB += spiral * 0.11;
    fieldC += spiral * 0.16;
  }

  if (uState == 1) {
    float inward = 1.0 - smoothstep(0.15, 1.45, length(p));
    fieldA += inward * uAudio * 0.15;
    fieldB += inward * uAudio * 0.10;
  }

  if (uState == 3) {
    float ripple = 0.5 + 0.5 * sin(length(p) * 12.0 - time * 3.5);
    fieldA += ripple * uAudio * 0.18;
    fieldB += ripple * uAudio * 0.14;
    fieldC += ripple * uAudio * 0.20;
    fieldD += ripple * uAudio * 0.23;
  }

  float wA = pow(max(fieldA, 0.0), 1.45);
  float wB = pow(max(fieldB, 0.0), 1.45);
  float wC = pow(max(fieldC, 0.0), 1.45);
  float wD = pow(max(fieldD, 0.0), 1.45);
  float total = wA + wB + wC + wD + 0.0001;
  vec3 livingColor = (colorA * wA + colorB * wB + colorC * wC + colorD * wD) / total;
  float strongest = max(max(wA, wB), max(wC, wD));
  float brightness = 0.64 + strongest * 0.78 + uBreath * 0.12 + uAudio * 0.24;
  livingColor *= brightness * uGlow * uFlowIntensity;
  float pearl = 1.0 - smoothstep(0.05, 1.00, length(p));
  livingColor += vec3(0.86, 0.94, 1.0) * pearl * 0.035;
  float alpha = 0.25 + strongest * 0.47 + uBreath * 0.035;
  gl_FragColor = vec4(livingColor, clamp(alpha, 0.08, 0.79));
}
`;

function GlassTube({ points, radius = 0.04, color = "#85DFFF", opacity = 0.78 }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map(([x, y, z = 0]) => new THREE.Vector3(x, y, z))), [points]);
  return (
    <mesh>
      <tubeGeometry args={[curve, 64, radius, 10, false]} />
      <meshPhysicalMaterial color={color} transparent opacity={opacity} transmission={0.76} thickness={0.18} roughness={0.055} metalness={0} clearcoat={1} clearcoatRoughness={0.02} ior={1.45} iridescence={0.75} envMapIntensity={1.8} />
    </mesh>
  );
}

function Eye({ x, female = true }) {
  return (
    <group position={[x, 1.56, 1.40]}>
      <mesh scale={[0.41, 0.34, 0.15]}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshPhysicalMaterial color="#FCFCFF" roughness={0.08} clearcoat={1} transmission={0.05} />
      </mesh>
      <mesh position={[0, 0, 0.16]}>
        <sphereGeometry args={[0.215, 40, 40]} />
        <meshPhysicalMaterial color="#825BFF" emissive="#6540E8" emissiveIntensity={0.25} roughness={0.035} clearcoat={1} iridescence={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.345]}>
        <sphereGeometry args={[0.095, 30, 30]} />
        <meshBasicMaterial color="#050616" />
      </mesh>
      <mesh position={[-0.066, 0.082, 0.41]}>
        <sphereGeometry args={[0.044, 18, 18]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      {female && [-2, -1, 0, 1, 2].map((index) => (
        <GlassTube key={index} radius={0.006} color="#CB91FF" opacity={0.9} points={[[index * 0.073, 0.28, 0.07], [index * 0.078, 0.38, 0.08]]} />
      ))}
    </group>
  );
}

function Face({ variant, showMustache }) {
  const eyes = useRef();
  const nextBlink = useRef(3 + Math.random() * 4);
  const timer = useRef(0);
  useFrame((state, delta) => {
    if (!eyes.current) return;
    timer.current += delta;
    let blink = 1;
    if (timer.current > nextBlink.current) {
      const phase = timer.current - nextBlink.current;
      if (phase < 0.10) blink = 1 - (phase / 0.10) * 0.94;
      else if (phase < 0.18) blink = 0.06;
      else if (phase < 0.32) blink = 0.06 + ((phase - 0.18) / 0.14) * 0.94;
      else { timer.current = 0; nextBlink.current = 3 + Math.random() * 4; }
    }
    eyes.current.scale.y = THREE.MathUtils.lerp(eyes.current.scale.y, blink, 0.6);
    eyes.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.31) * 0.015;
  });
  return (
    <>
      <group ref={eyes}><Eye x={-0.49} female={variant === "female"} /><Eye x={0.49} female={variant === "female"} /></group>
      <GlassTube radius={0.013} color="#C18AFF" points={[[-0.77, 1.98, 1.40], [-0.52, 2.05, 1.45], [-0.28, 1.99, 1.42]]} />
      <GlassTube radius={0.013} color="#C18AFF" points={[[0.28, 1.99, 1.42], [0.52, 2.05, 1.45], [0.77, 1.98, 1.40]]} />
      <GlassTube radius={0.019} color="#FF91CA" points={[[-0.23, 0.91, 1.48], [0, 0.82, 1.53], [0.23, 0.91, 1.48]]} />
      {variant === "male" && showMustache && <Mustache />}
    </>
  );
}

function FemaleHair() {
  const group = useRef();
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.z = Math.sin(t * 0.25) * 0.010;
    group.current.rotation.y = Math.sin(t * 0.18) * 0.014;
  });
  return (
    <group ref={group} position={[0, 1.25, 0]}>
      <GlassTube radius={0.080} color="#8664FF" points={[[-0.90, 0.98, 0.10], [-0.55, 1.42, 0.14], [-0.08, 1.69, 0.16], [0.40, 1.82, 0.10], [0.88, 1.86, 0.04], [1.28, 1.64, 0.02], [1.43, 1.32, 0.03]]} />
      <GlassTube radius={0.054} color="#DD6CFF" opacity={0.70} points={[[-0.62, 1.26, 0.19], [-0.17, 1.56, 0.22], [0.30, 1.59, 0.18], [0.72, 1.41, 0.12]]} />
      <GlassTube radius={0.050} color="#66E8FF" points={[[1.35, 1.30, 0.04], [1.56, 1.25, 0.04], [1.64, 1.41, 0.04], [1.57, 1.55, 0.04], [1.42, 1.58, 0.04], [1.34, 1.48, 0.04], [1.38, 1.39, 0.04]]} />
    </group>
  );
}

function Mustache() {
  return (
    <group position={[0, 1.05, 1.48]}>
      <GlassTube radius={0.069} color="#7B59FF" points={[[0,0,0],[-0.30,-0.02,0],[-0.62,-0.03,0],[-0.93,0.08,0],[-1.16,0.23,0],[-1.20,0.39,0],[-1.10,0.47,0]]} />
      <GlassTube radius={0.069} color="#7B59FF" points={[[0,0,0],[0.30,-0.02,0],[0.62,-0.03,0],[0.93,0.08,0],[1.16,0.23,0],[1.20,0.39,0],[1.10,0.47,0]]} />
      <GlassTube radius={0.020} color="#E272FF" points={[[-0.03,0.03,0.03],[-0.47,0.03,0.03],[-0.91,0.17,0.03],[-1.08,0.36,0.03]]} />
      <GlassTube radius={0.020} color="#62E8FF" points={[[0.03,0.03,0.03],[0.47,0.03,0.03],[0.91,0.17,0.03],[1.08,0.36,0.03]]} />
    </group>
  );
}

function Hand({ position, mirror = false }) {
  const sign = mirror ? -1 : 1;
  return (
    <group position={position}>
      <mesh scale={[0.12, 0.17, 0.065]}>
        <sphereGeometry args={[1, 28, 28]} />
        <meshPhysicalMaterial color="#9EEFFF" transparent opacity={0.70} transmission={0.76} roughness={0.05} clearcoat={1} iridescence={0.6} />
      </mesh>
      {[0,1,2,3].map((index) => {
        const x = 0.025 + index * 0.028;
        return <GlassTube key={index} radius={0.013} color="#8FEAFF" points={[[x * sign,-0.08,0],[(x + 0.015 * index) * sign,-0.18,0],[(x + 0.02 * index) * sign,-0.27 + index * 0.012,0]]} />;
      })}
      <GlassTube radius={0.014} color="#CE7BFF" points={[[ -0.04 * sign,-0.03,0],[-0.14 * sign,-0.10,0],[-0.22 * sign,-0.17,0]]} />
    </group>
  );
}

function Limbs({ variant }) {
  return (
    <>
      <GlassTube radius={0.041} color="#70E7FF" points={[[-1.45,1.42,0],[-1.80,1.15,0],[-2.05,1.52,0],[-2.17,1.90,0]]} />
      <Hand position={[-2.19,2.00,0]} />
      <GlassTube radius={0.041} color="#AD78FF" points={variant === "male" ? [[1.45,1.42,0],[1.82,1.12,0],[1.63,0.74,0],[1.38,0.57,0]] : [[1.45,1.42,0],[1.78,1.08,0],[1.98,0.61,0],[2.06,0.31,0]]} />
      <Hand position={variant === "male" ? [1.34,0.52,0] : [2.09,0.22,0]} mirror />
      <GlassTube radius={0.045} color="#83E7FF" points={[[-0.24,-0.16,0],[-0.24,-0.88,0],[-0.21,-1.67,0],[-0.18,-2.43,0]]} />
      <GlassTube radius={0.045} color="#AE80FF" points={[[0.24,-0.16,0],[0.24,-0.88,0],[0.21,-1.67,0],[0.18,-2.43,0]]} />
      <mesh position={[-0.28,-2.50,0.16]} scale={[0.29,0.10,0.38]}><sphereGeometry args={[1,32,32]} /><meshPhysicalMaterial color="#83E8FF" transparent opacity={0.76} transmission={0.60} roughness={0.04} clearcoat={1} iridescence={0.6} /></mesh>
      <mesh position={[0.28,-2.50,0.16]} scale={[0.29,0.10,0.38]}><sphereGeometry args={[1,32,32]} /><meshPhysicalMaterial color="#AE7EFF" transparent opacity={0.76} transmission={0.60} roughness={0.04} clearcoat={1} iridescence={0.6} /></mesh>
    </>
  );
}

function OrbBody({ emotion, emotionIntensity, state, audioLevel, colorFlowSpeed }) {
  const root = useRef();
  const shell = useRef();
  const energy = useRef();
  const halo = useRef();
  const core = useRef();
  const shader = useRef();
  const shellMaterial = useRef();
  const emotionData = EMOTIONS[emotion] || EMOTIONS.neutral;
  const neutral = EMOTIONS.neutral;
  const targets = useMemo(() => neutral.colors.map((neutralColor, index) => new THREE.Color(neutralColor).lerp(new THREE.Color(emotionData.colors[index]), emotionIntensity)), [emotion, emotionIntensity]);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uAudio: { value: 0 }, uBreath: { value: 0 }, uGlow: { value: 1 }, uColorFlowSpeed: { value: colorFlowSpeed }, uFlowIntensity: { value: 1.0 }, uState: { value: 0 },
    uColorA: { value: new THREE.Color(neutral.colors[0]) }, uColorB: { value: new THREE.Color(neutral.colors[1]) }, uColorC: { value: new THREE.Color(neutral.colors[2]) }, uColorD: { value: new THREE.Color(neutral.colors[3]) },
  }), []);

  useFrame((frameState, delta) => {
    const t = frameState.clock.elapsedTime;
    const breathing = getLumeniaBreath(t * emotionData.breathSpeed, 5.2);
    if (shell.current) { const amount = 1 + breathing * 0.016; shell.current.scale.set(amount * 1.001, amount * 1.003, amount); }
    if (energy.current) energy.current.scale.setScalar(1 + breathing * 0.035);
    if (core.current) core.current.scale.setScalar(1 + breathing * 0.065);
    if (halo.current) halo.current.scale.setScalar(1 + breathing * 0.050);
    if (root.current) { root.current.position.y = 1.25 + breathing * 0.012; root.current.rotation.z = Math.sin(t * 0.22) * 0.0035; }
    if (!shader.current) return;
    const stateSpeed = STATE_SPEED[state] || 1;
    const u = shader.current.uniforms;
    u.uTime.value = t * emotionData.flowSpeed * stateSpeed;
    const targetAudio = state === "speaking" ? audioLevel : state === "listening" ? audioLevel * 0.42 : 0;
    u.uAudio.value = THREE.MathUtils.lerp(u.uAudio.value, targetAudio, Math.min(1, delta * 8));
    u.uBreath.value = THREE.MathUtils.lerp(u.uBreath.value, breathing, Math.min(1, delta * 6));
    u.uGlow.value = THREE.MathUtils.lerp(u.uGlow.value, emotionData.glow, Math.min(1, delta * 2));
    u.uColorFlowSpeed.value = THREE.MathUtils.lerp(u.uColorFlowSpeed.value, colorFlowSpeed, Math.min(1, delta * 1.5));
    u.uFlowIntensity.value = state === "speaking" ? 1.06 + audioLevel * 0.15 : 1.0;
    u.uState.value = STATE_IDS[state] ?? 0;
    const transition = Math.min(1, delta * 1.15);
    u.uColorA.value.lerp(targets[0], transition);
    u.uColorB.value.lerp(targets[1], transition);
    u.uColorC.value.lerp(targets[2], transition);
    u.uColorD.value.lerp(targets[3], transition);
    if (shellMaterial.current) shellMaterial.current.emissiveIntensity = 0.012 + breathing * 0.010 + audioLevel * 0.012;
  });

  return (
    <group ref={root} position={[0,1.25,0]}>
      <mesh ref={energy} scale={0.955} renderOrder={1}>
        <sphereGeometry args={[1.49,80,80]} />
        <shaderMaterial ref={shader} vertexShader={ENERGY_VERTEX_SHADER} fragmentShader={ENERGY_FRAGMENT_SHADER} uniforms={uniforms} transparent depthWrite={false} side={THREE.DoubleSide} blending={THREE.NormalBlending} />
      </mesh>
      <mesh ref={core} scale={0.58} renderOrder={0}><sphereGeometry args={[1.16,48,48]} /><meshBasicMaterial color="#F5FBFF" transparent opacity={0.018} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <mesh ref={shell} renderOrder={2}>
        <sphereGeometry args={[1.56,80,80]} />
        <meshPhysicalMaterial ref={shellMaterial} color="#F8FCFF" emissive="#FFFFFF" emissiveIntensity={0.012} transparent opacity={0.25} transmission={0.96} thickness={0.68} roughness={0.045} metalness={0} clearcoat={1} clearcoatRoughness={0.018} ior={1.46} iridescence={0.86} iridescenceIOR={1.30} envMapIntensity={1.75} attenuationColor="#FFFFFF" attenuationDistance={4.5} depthWrite={false} />
      </mesh>
      <mesh ref={halo} scale={1.025} renderOrder={0}><sphereGeometry args={[1.56,48,48]} /><meshBasicMaterial color="#957CFF" transparent opacity={0.018} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
    </group>
  );
}

function Character({ variant, emotion, emotionIntensity, state, audioLevel, colorFlowSpeed, showMustache }) {
  const root = useRef();
  useFrame((state) => {
    if (!root.current) return;
    const t = state.clock.elapsedTime;
    root.current.position.y = Math.sin(t * 0.55) * 0.012;
    root.current.rotation.y = Math.sin(t * 0.20) * 0.012;
    root.current.rotation.z = Math.sin(t * 0.27) * 0.005;
  });
  return (
    <group ref={root}>
      <OrbBody emotion={emotion} emotionIntensity={emotionIntensity} state={state} audioLevel={audioLevel} colorFlowSpeed={colorFlowSpeed} />
      <Face variant={variant} showMustache={showMustache} />
      {variant === "female" && <FemaleHair />}
      <Limbs variant={variant} />
    </group>
  );
}

function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.22} />
      <directionalLight position={[-4,5,5]} color="#D8F9FF" intensity={2.6} />
      <directionalLight position={[4,2,2]} color="#DFA4FF" intensity={1.8} />
      <pointLight position={[0,-2,4]} color="#FF93C7" intensity={4} distance={10} />
      <Environment resolution={256}>
        <group>
          <Lightformer form="rect" color="#F4FCFF" intensity={3.5} position={[-4,4,4]} scale={[4,1,1]} />
          <Lightformer form="rect" color="#63E7FF" intensity={1.8} position={[-5,0,2]} rotation={[0,Math.PI/2,0]} scale={[4,1,1]} />
          <Lightformer form="rect" color="#D96DFF" intensity={1.8} position={[5,1,2]} rotation={[0,-Math.PI/2,0]} scale={[4,1,1]} />
        </group>
      </Environment>
    </>
  );
}

function Scene(props) {
  return (
    <>
      <color attach="background" args={["#020611"]} />
      <StudioLights />
      <Character {...props} />
      <ContactShadows position={[0,-2.61,0]} scale={7} opacity={0.25} blur={2.5} far={5} />
      <OrbitControls target={[0,0.22,0]} enablePan={false} enableDamping dampingFactor={0.08} minDistance={6.6} maxDistance={10} />
    </>
  );
}

export default function LivingLumeniaOrb({
  variant = "female",
  emotion = "neutral",
  emotionIntensity = 0.85,
  state = "idle",
  audioLevel = 0,
  showMustache = true,
  colorFlowSpeed = 0.060,
  style = {},
}) {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: 650, background: "#020611", overflow: "hidden", ...style }}>
      <Canvas
        dpr={[1,1.5]}
        camera={{ position: [0,0.2,8.4], fov: 38, near: 0.1, far: 40 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.22;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <Scene
          variant={variant}
          emotion={emotion}
          emotionIntensity={THREE.MathUtils.clamp(emotionIntensity,0,1)}
          state={state}
          audioLevel={THREE.MathUtils.clamp(audioLevel,0,1)}
          showMustache={showMustache}
          colorFlowSpeed={colorFlowSpeed}
        />
      </Canvas>
    </div>
  );
}
