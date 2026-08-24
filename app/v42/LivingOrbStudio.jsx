"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";

const TWO_PI = Math.PI * 2;

const STATE_IDS = { idle: 0, listening: 1, thinking: 2, speaking: 3, success: 4, warning: 5, error: 6 };
const EFFECT_IDS = { pulse: 0, wave: 1, ripple: 2, spiral: 3, particles: 4, ring: 5, liquid: 6, plasma: 7, aurora: 8, neural: 9, cosmic: 10, minimal: 11 };

const EMOTIONS = {
  neutral: { a: "#32E8FF", b: "#3677FF", c: "#A15CFF", d: "#FF70CF", glow: 1.0, energySpeed: 1.0, breathSpeed: 1.0 },
  happy: { a: "#4DF2FF", b: "#39DCCB", c: "#FF71D7", d: "#FFC08E", glow: 1.18, energySpeed: 1.15, breathSpeed: 1.05 },
  excited: { a: "#00F6FF", b: "#5A62FF", c: "#D942FF", d: "#FF3FB7", glow: 1.30, energySpeed: 1.34, breathSpeed: 1.14 },
  calm: { a: "#72EEE5", b: "#6EB9FF", c: "#AF9EFF", d: "#E0B4FF", glow: 0.85, energySpeed: 0.72, breathSpeed: 0.82 },
  caring: { a: "#5DE7FF", b: "#AFA0FF", c: "#FF91C6", d: "#FFBEA0", glow: 1.02, energySpeed: 0.82, breathSpeed: 0.90 },
  sad: { a: "#356CAE", b: "#414BA0", c: "#745AA6", d: "#588DC1", glow: 0.68, energySpeed: 0.62, breathSpeed: 0.78 },
  curious: { a: "#3EEFFF", b: "#516CFF", c: "#A74FFF", d: "#D968FF", glow: 1.08, energySpeed: 1.12, breathSpeed: 1.0 },
  surprised: { a: "#A7FAFF", b: "#63CFFF", c: "#C36CFF", d: "#FFFFFF", glow: 1.30, energySpeed: 1.28, breathSpeed: 1.08 },
  warning: { a: "#FFBF4D", b: "#FF8257", c: "#CC58FF", d: "#FF5FA6", glow: 1.16, energySpeed: 1.05, breathSpeed: 1.0 },
  error: { a: "#FF4FA5", b: "#A738FF", c: "#FF4868", d: "#704CFF", glow: 1.18, energySpeed: 1.20, breathSpeed: 1.02 },
};

const STATE_BEHAVIOR = {
  idle: { speed: 1.0, glow: 1.0 }, listening: { speed: 1.10, glow: 1.07 }, thinking: { speed: 1.32, glow: 1.08 },
  speaking: { speed: 1.16, glow: 1.12 }, success: { speed: 1.18, glow: 1.20 }, warning: { speed: 1.12, glow: 1.14 }, error: { speed: 1.32, glow: 1.18 },
};

const ANIMATION_PRESETS = {
  "Soft Pulse": { effect: "pulse", speed: 0.58, intensity: 0.60, amplitude: 0.45, glow: 0.75, opacity: 0.72, audioReactive: true, microphoneReactive: true },
  "Liquid Wave": { effect: "liquid", speed: 0.72, intensity: 0.78, amplitude: 0.62, glow: 0.92, opacity: 0.74, audioReactive: true, microphoneReactive: true },
  Aurora: { effect: "aurora", speed: 0.48, intensity: 0.88, amplitude: 0.52, glow: 1.0, opacity: 0.76, audioReactive: true, microphoneReactive: true },
  Spiral: { effect: "spiral", speed: 0.75, intensity: 0.82, amplitude: 0.62, glow: 0.90, opacity: 0.74, audioReactive: true, microphoneReactive: true },
  Plasma: { effect: "plasma", speed: 0.95, intensity: 0.92, amplitude: 0.72, glow: 1.0, opacity: 0.75, audioReactive: true, microphoneReactive: true },
  "Energy Ring": { effect: "ring", speed: 0.82, intensity: 0.74, amplitude: 0.65, glow: 0.92, opacity: 0.70, audioReactive: true, microphoneReactive: true },
  "Breathing Light": { effect: "pulse", speed: 0.42, intensity: 0.52, amplitude: 0.34, glow: 0.76, opacity: 0.66, audioReactive: true, microphoneReactive: false },
  Ripple: { effect: "ripple", speed: 0.76, intensity: 0.76, amplitude: 0.70, glow: 0.88, opacity: 0.72, audioReactive: true, microphoneReactive: true },
  "Neural Flow": { effect: "neural", speed: 0.64, intensity: 0.82, amplitude: 0.54, glow: 0.98, opacity: 0.75, audioReactive: true, microphoneReactive: true },
  Cosmic: { effect: "cosmic", speed: 0.38, intensity: 0.88, amplitude: 0.46, glow: 1.0, opacity: 0.75, audioReactive: true, microphoneReactive: true },
  Minimal: { effect: "minimal", speed: 0.28, intensity: 0.42, amplitude: 0.25, glow: 0.62, opacity: 0.62, audioReactive: true, microphoneReactive: false },
  "Calm Medical": { effect: "aurora", speed: 0.30, intensity: 0.55, amplitude: 0.32, glow: 0.72, opacity: 0.68, audioReactive: true, microphoneReactive: true },
};

const DEFAULT_CONFIG = {
  variant: "female",
  orb: { useEmotionColors: true, primaryColor: "#36E7FF", secondaryColor: "#596EFF", accentColor: "#C45EFF", fourthColor: "#FF76C7", transmission: 0.96, roughness: 0.055, clearcoat: 1, clearcoatRoughness: 0.025, ior: 1.46, thickness: 0.72, iridescence: 1, glassOpacity: 0.34, internalOpacity: 0.74, breathing: true, breathPeriod: 5.0, breathAmount: 0.013, internalEnergy: true },
  eyes: { enabled: true, style: "reference", size: 1.0, spacing: 1.0, irisColor: "#805CFF", pupilColor: "#050615", eyelashes: true },
  mouth: { enabled: true, style: "soft-smile", lipSync: false },
  hair: { enabled: true, style: "elegant-light-curl", primaryColor: "#8C65FF", secondaryColor: "#E46FFF", accentColor: "#68E9FF", opacity: 0.78 },
  mustache: { enabled: true, style: "reference-curled", primaryColor: "#7F5EFF", accentColor: "#D86FFF" },
  beard: { enabled: false, style: "chin-glow", primaryColor: "#795EFF" },
  body: { armThickness: 1.0, legThickness: 1.0, handScale: 1.0 },
  animation: { preset: "Aurora", effect: "aurora", speed: 0.48, intensity: 0.88, amplitude: 0.52, glow: 1.0, opacity: 0.76, audioReactive: true, microphoneReactive: true },
};

function clamp01(value) { return Math.max(0, Math.min(1, value)); }
function randomRange(min, max) { return min + Math.random() * (max - min); }
function mergeConfig(userConfig = {}) {
  return {
    ...DEFAULT_CONFIG, ...userConfig,
    orb: { ...DEFAULT_CONFIG.orb, ...(userConfig.orb || {}) }, eyes: { ...DEFAULT_CONFIG.eyes, ...(userConfig.eyes || {}) },
    mouth: { ...DEFAULT_CONFIG.mouth, ...(userConfig.mouth || {}) }, hair: { ...DEFAULT_CONFIG.hair, ...(userConfig.hair || {}) },
    mustache: { ...DEFAULT_CONFIG.mustache, ...(userConfig.mustache || {}) }, beard: { ...DEFAULT_CONFIG.beard, ...(userConfig.beard || {}) },
    body: { ...DEFAULT_CONFIG.body, ...(userConfig.body || {}) }, animation: { ...DEFAULT_CONFIG.animation, ...(userConfig.animation || {}) },
  };
}
function mixColor(a, b, amount) { return new THREE.Color(a).lerp(new THREE.Color(b), clamp01(amount)); }

function useMicrophoneLevel(enabled) {
  const [level, setLevel] = useState(0); const [error, setError] = useState("");
  useEffect(() => {
    if (!enabled) { setLevel(0); setError(""); return; }
    let stream = null, audioContext = null, analyser = null, source = null, animationFrame = 0, cancelled = false;
    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false }); if (cancelled) return;
        audioContext = new (window.AudioContext || window.webkitAudioContext)(); analyser = audioContext.createAnalyser(); analyser.fftSize = 1024; analyser.smoothingTimeConstant = 0.82;
        source = audioContext.createMediaStreamSource(stream); source.connect(analyser); const data = new Uint8Array(analyser.fftSize);
        const loop = () => { analyser.getByteTimeDomainData(data); let sum = 0; for (let i = 0; i < data.length; i++) { const centered = (data[i] - 128) / 128; sum += centered * centered; }
          const rms = Math.sqrt(sum / data.length); const normalized = clamp01(rms * 5.5); setLevel((previous) => THREE.MathUtils.lerp(previous, normalized, 0.28)); animationFrame = requestAnimationFrame(loop); };
        loop();
      } catch (e) { setError(e?.message || "Nie udało się uruchomić mikrofonu."); }
    }
    start();
    return () => { cancelled = true; cancelAnimationFrame(animationFrame); if (source) { try { source.disconnect(); } catch {} } if (stream) stream.getTracks().forEach((track) => track.stop()); if (audioContext) audioContext.close().catch(() => {}); };
  }, [enabled]);
  return { level, error };
}

function useDemoVoiceLevel(active) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) { setValue(0); return; }
    let frame = 0; const start = performance.now();
    function loop(now) { const t = (now - start) / 1000; const speechEnvelope = 0.35 + Math.sin(t * 5.2) * 0.15 + Math.sin(t * 11.4) * 0.10 + Math.sin(t * 23.0) * 0.04; const phrase = 0.55 + Math.sin(t * 1.35) * 0.35; const level = clamp01(speechEnvelope * Math.max(0.15, phrase)); setValue(level); frame = requestAnimationFrame(loop); }
    frame = requestAnimationFrame(loop); return () => cancelAnimationFrame(frame);
  }, [active]);
  return value;
}

const ENERGY_VERTEX_SHADER = `
precision highp float;
uniform float uTime;
uniform float uBreath;
uniform float uAmplitude;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vWorldPosition;
void main(){
  vec3 p=position;
  float organicA=sin(p.x*2.7+p.y*1.8+uTime*0.55);
  float organicB=sin(p.z*3.2-p.x*1.5+uTime*0.37);
  float deformation=(organicA+organicB)*0.5;
  float breathingDeformation=(0.005+uBreath*0.010)*uAmplitude;
  p += normal*deformation*breathingDeformation;
  vPosition=p;
  vNormal=normalize(normalMatrix*normal);
  vec4 world=modelMatrix*vec4(p,1.0);
  vWorldPosition=world.xyz;
  gl_Position=projectionMatrix*viewMatrix*world;
}`;

const ENERGY_FRAGMENT_SHADER = `
precision highp float;
uniform float uTime; uniform float uAudio; uniform float uBreath; uniform float uGlow; uniform float uIntensity; uniform float uOpacity;
uniform int uEffect; uniform int uState;
uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uColorC; uniform vec3 uColorD;
varying vec3 vPosition; varying vec3 vNormal; varying vec3 vWorldPosition;
float hash(vec3 p){ p=fract(p*0.3183099+vec3(0.11,0.17,0.23)); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise3(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f); float n000=hash(i+vec3(0,0,0)); float n100=hash(i+vec3(1,0,0)); float n010=hash(i+vec3(0,1,0)); float n110=hash(i+vec3(1,1,0)); float n001=hash(i+vec3(0,0,1)); float n101=hash(i+vec3(1,0,1)); float n011=hash(i+vec3(0,1,1)); float n111=hash(i+vec3(1,1,1)); float nx00=mix(n000,n100,f.x); float nx10=mix(n010,n110,f.x); float nx01=mix(n001,n101,f.x); float nx11=mix(n011,n111,f.x); float nxy0=mix(nx00,nx10,f.y); float nxy1=mix(nx01,nx11,f.y); return mix(nxy0,nxy1,f.z); }
float fbm(vec3 p){ float value=0.0; float amplitude=0.5; for(int i=0;i<5;i++){ value+=noise3(p)*amplitude; p*=2.03; amplitude*=0.5; } return value; }
float effectField(vec3 p,float n1,float n2){ float t=uTime; float radius=length(p.xy); float angle=atan(p.y,p.x); float field=n1;
  if(uEffect==0){ field=0.5+0.5*sin(t*1.6+radius*5.0); }
  else if(uEffect==1){ field=0.5+0.5*sin(p.y*5.5+p.x*1.5+t*1.8); }
  else if(uEffect==2){ field=0.5+0.5*sin(radius*12.0-t*3.2); }
  else if(uEffect==3){ field=0.5+0.5*sin(angle*4.0+radius*9.0-t*2.0); }
  else if(uEffect==4){ field=smoothstep(0.72,0.96,n2); }
  else if(uEffect==5){ float target=0.55+sin(t*1.1)*0.15; field=1.0-smoothstep(0.04,0.18,abs(radius-target)); }
  else if(uEffect==6){ field=mix(n1,n2,0.55); }
  else if(uEffect==7){ field=0.5+0.25*sin(p.x*5.0+t*2.1)+0.25*sin(p.y*6.0-t*1.8); }
  else if(uEffect==8){ float curtain=0.5+0.5*sin(p.y*3.0+n1*5.0+t*0.8); field=mix(n1,curtain,0.50); }
  else if(uEffect==9){ float neural=abs(sin(n1*12.0+p.y*4.0-t)); field=pow(neural,4.0); }
  else if(uEffect==10){ float stars=smoothstep(0.89,0.99,n2); field=n1*0.65+stars*0.65; }
  else { field=0.40+n1*0.25; }
  return clamp(field,0.0,1.25);
}
void main(){ vec3 p=vPosition*1.30; float t=uTime*0.55; p.x+=sin(t+p.y*1.75)*0.18; p.y+=cos(t*0.72+p.x*1.40)*0.16; p.z+=sin(t*0.58+p.x+p.y)*0.14;
  float n1=fbm(p+vec3(t*0.20,0.0,0.0)); float n2=fbm(p*1.45-vec3(0.0,t*0.18,t*0.06)); float field=effectField(p,n1,n2);
  float firstMix=smoothstep(0.12,0.82,n1); vec3 colorAB=mix(uColorA,uColorB,firstMix); vec3 colorCD=mix(uColorC,uColorD,smoothstep(0.22,0.86,n2)); vec3 color=mix(colorAB,colorCD,field*0.62);
  float radial=length(vPosition); float centerLight=1.0-smoothstep(0.15,1.65,radial); float breathLight=uBreath*0.18; float voice=uAudio*(0.42+field*0.85); float stateBoost=0.0;
  if(uState==1) stateBoost=0.07; else if(uState==2) stateBoost=0.08+0.06*sin(uTime*1.8+radial*6.0); else if(uState==3) stateBoost=voice*0.60; else if(uState==4) stateBoost=0.20; else if(uState==5) stateBoost=0.10+0.04*sin(uTime*2.0); else if(uState==6) stateBoost=0.10+noise3(p*8.0+uTime)*0.12;
  float intensity=(0.40+centerLight*0.30+field*0.46+breathLight+voice+stateBoost)*uIntensity*uGlow; color*=intensity; float alpha=(0.46+n1*0.17+field*0.12)*uOpacity; gl_FragColor=vec4(color,clamp(alpha,0.10,0.92)); }
`;

function GlassTube({ points, radius = 0.04, color = "#8CDFFF", opacity = 0.80, tubularSegments = 64, radialSegments = 10 }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map(([x,y,z=0]) => new THREE.Vector3(x,y,z))), [points]);
  return <mesh><tubeGeometry args={[curve,tubularSegments,radius,radialSegments,false]}/><meshPhysicalMaterial color={color} transparent opacity={opacity} transmission={0.74} thickness={0.20} roughness={0.055} metalness={0.04} clearcoat={1} clearcoatRoughness={0.025} ior={1.45} iridescence={0.85} envMapIntensity={1.9}/></mesh>;
}

function Finger({ index, points, color }) { const ref=useRef(); useFrame((state)=>{ if(ref.current) ref.current.rotation.z=Math.sin(state.clock.elapsedTime*0.72+index*0.91)*0.018; }); return <group ref={ref}><GlassTube points={points} radius={0.014} color={color} tubularSegments={18} radialSegments={6} opacity={0.76}/></group>; }

function GlassHand({ position, rotation=[0,0,0], mirror=false, scale=1 }) {
  const ref=useRef(); const sign=mirror?-1:1; useFrame((state)=>{ if(ref.current) ref.current.rotation.z=rotation[2]+Math.sin(state.clock.elapsedTime*0.55)*0.018; });
  return <group ref={ref} position={position} rotation={rotation} scale={scale}>
    <mesh scale={[0.13,0.18,0.07]}><sphereGeometry args={[1,28,28]}/><meshPhysicalMaterial color="#A4EFFF" transparent opacity={0.70} transmission={0.80} roughness={0.055} clearcoat={1} clearcoatRoughness={0.02} ior={1.45} iridescence={0.70}/></mesh>
    {[{x:.03,len:.27,bend:.025},{x:.065,len:.30,bend:.040},{x:.095,len:.28,bend:.055},{x:.118,len:.23,bend:.065}].map((f,index)=><Finger key={index} index={index} color="#8EE8FF" points={[[f.x*sign,-.08,0],[(f.x+f.bend)*sign,-.18,0],[(f.x+f.bend*1.5)*sign,-f.len,0]]}/>)}
    <Finger index={7} color="#D17FFF" points={[[ -.04*sign,-.03,0],[-.15*sign,-.10,0],[-.23*sign,-.18,0]]}/>
  </group>;
}

function Eye({ x, config, female }) {
  const scale=config.size, style=config.style; if(!config.enabled) return null;
  if(style==="minimal") return <group position={[x,.30,0]} scale={scale}><mesh><sphereGeometry args={[.19,32,32]}/><meshPhysicalMaterial color={config.irisColor} emissive={config.irisColor} emissiveIntensity={.55} roughness={.08} clearcoat={1}/></mesh><mesh position={[0,0,.18]}><sphereGeometry args={[.075,24,24]}/><meshBasicMaterial color={config.pupilColor}/></mesh></group>;
  const eyeWidth=style==="large"?.47:style==="futuristic"?.39:.42; const eyeHeight=style==="large"?.38:.34;
  return <group position={[x,.30,0]} scale={scale}>
    <mesh scale={[eyeWidth,eyeHeight,.15]}><sphereGeometry args={[1,48,48]}/><meshPhysicalMaterial color="#F9FBFF" roughness={.10} clearcoat={1} clearcoatRoughness={.02} transmission={.06}/></mesh>
    <mesh position={[0,0,.16]}><sphereGeometry args={[style==="large"?.245:.22,42,42]}/><meshPhysicalMaterial color={config.irisColor} emissive={config.irisColor} emissiveIntensity={.28} roughness={.04} clearcoat={1} clearcoatRoughness={.015} iridescence={.45}/></mesh>
    <mesh position={[0,0,.345]}><sphereGeometry args={[.098,30,30]}/><meshStandardMaterial color={config.pupilColor} roughness={.12}/></mesh>
    <mesh position={[-.065,.085,.415]}><sphereGeometry args={[.047,18,18]}/><meshBasicMaterial color="#FFFFFF"/></mesh>
    <mesh position={[.055,-.005,.42]}><sphereGeometry args={[.018,14,14]}/><meshBasicMaterial color="#86EFFF"/></mesh>
    {female&&config.eyelashes&&[-2,-1,0,1,2].map((index)=>{const lx=index*.085; return <GlassTube key={index} radius={.006} color="#C68BFF" opacity={.90} tubularSegments={10} radialSegments={5} points={[[lx,.29,.09],[lx*1.06,.39+Math.abs(index)*.006,.10]]}/>;})}
  </group>;
}

function Face({ variant, config }) {
  const eyeContainer=useRef(); const nextBlink=useRef(randomRange(3,7)); const blinkClock=useRef(0);
  useFrame((state,delta)=>{ if(!eyeContainer.current) return; blinkClock.current+=delta; const t=blinkClock.current; let blink=1; if(t>nextBlink.current){ const phase=t-nextBlink.current; if(phase<.09) blink=1-phase/.09*.94; else if(phase<.19) blink=.06; else if(phase<.34) blink=.06+(phase-.19)/.15*.94; else { blinkClock.current=0; nextBlink.current=randomRange(3,7); blink=1; } }
    eyeContainer.current.scale.y=THREE.MathUtils.lerp(eyeContainer.current.scale.y,blink,.58); eyeContainer.current.rotation.y=Math.sin(state.clock.elapsedTime*.37)*.018; eyeContainer.current.rotation.x=Math.sin(state.clock.elapsedTime*.23)*.008; });
  const female=variant==="female"; const spacing=.48*config.eyes.spacing;
  return <group position={[0,1.25,1.36]}><group ref={eyeContainer}><Eye x={-spacing} female={female} config={config.eyes}/><Eye x={spacing} female={female} config={config.eyes}/></group>
    {config.eyes.enabled&&config.eyes.style!=="minimal"&&<><GlassTube radius={.013} color="#C38AFF" opacity={.78} points={[[ -.78,.69,.08],[-.52,.76,.10],[-.27,.70,.08]]}/><GlassTube radius={.013} color="#C38AFF" opacity={.78} points={[[.27,.70,.08],[.52,.76,.10],[.78,.69,.08]]}/></>}
    {config.mouth.enabled&&<GlassTube radius={config.mouth.style==="minimal"?.014:.022} color="#FF9ACC" opacity={.88} tubularSegments={28} points={[[ -.25,-.30,.15],[0,-.39,.19],[.25,-.30,.15]]}/>}</group>;
}

function FemaleHair({ config }) {
  const ref=useRef(); useFrame((state)=>{ if(ref.current){ const t=state.clock.elapsedTime; ref.current.rotation.z=Math.sin(t*.28)*.012; ref.current.rotation.y=Math.sin(t*.22)*.018; }}); if(!config.enabled||config.style==="none") return null;
  const a=config.primaryColor,b=config.secondaryColor,c=config.accentColor,opacity=config.opacity;
  if(config.style==="short") return <group ref={ref} position={[0,1.25,0]}><GlassTube radius={.085} color={a} opacity={opacity} points={[[ -1.10,.95,.10],[-.55,1.46,.18],[.10,1.58,.16],[.75,1.30,.10]]}/><GlassTube radius={.055} color={c} opacity={opacity} points={[[ -.55,1.40,.22],[-.18,1.64,.25],[.28,1.55,.18]]}/></group>;
  if(config.style==="long-wave") return <group ref={ref} position={[0,1.25,0]}><GlassTube radius={.080} color={a} opacity={opacity} points={[[ -1.10,1.02,.10],[-.62,1.57,.13],[.05,1.73,.10],[.76,1.48,.05],[1.14,.92,.03],[1.22,.30,.03]]}/><GlassTube radius={.060} color={b} opacity={opacity} points={[[ -.62,1.45,.18],[0,1.58,.20],[.62,1.25,.13],[.98,.72,.10]]}/><GlassTube radius={.043} color={c} opacity={opacity} points={[[.86,1.24,.13],[1.32,1.05,.10],[1.48,.65,.05],[1.36,.28,.02]]}/></group>;
  if(config.style==="bun-light") return <group ref={ref} position={[0,1.25,0]}><GlassTube radius={.075} color={a} opacity={opacity} points={[[ -1,1,.08],[-.48,1.46,.13],[.18,1.54,.12],[.76,1.20,.08]]}/><mesh position={[.72,1.58,-.04]} scale={[.40,.40,.22]}><sphereGeometry args={[1,36,36]}/><meshPhysicalMaterial color={b} transparent opacity={.68} transmission={.72} roughness={.055} clearcoat={1} iridescence={.8}/></mesh><GlassTube radius={.038} color={c} opacity={opacity} points={[[.72,1.83,0],[1.02,1.96,0],[1.13,1.80,0],[1,1.67,0]]}/></group>;
  if(config.style==="contour") return <group ref={ref} position={[0,1.25,0]}><GlassTube radius={.035} color={a} opacity={.86} points={[[ -1.28,.80,.03],[-1,1.28,.05],[-.40,1.65,.08],[.30,1.65,.07],[.98,1.27,.04],[1.28,.78,.03]]}/></group>;
  return <group ref={ref} position={[0,1.25,0]}><GlassTube radius={.085} color={a} opacity={opacity} points={[[ -.92,.98,.10],[-.62,1.37,.14],[-.20,1.62,.16],[.24,1.78,.12],[.73,1.90,.05],[1.16,1.80,0],[1.39,1.53,0],[1.43,1.22,.03]]}/><GlassTube radius={.060} color={b} opacity={opacity} points={[[ -.68,1.21,.19],[-.24,1.51,.23],[.24,1.62,.20],[.70,1.48,.13]]}/><GlassTube radius={.056} color={c} opacity={opacity} points={[[1.35,1.27,.04],[1.54,1.22,.05],[1.62,1.37,.05],[1.57,1.52,.05],[1.42,1.56,.05],[1.33,1.47,.05],[1.36,1.37,.05]]}/><GlassTube radius={.043} color="#FF91C8" opacity={.65} points={[[ -.52,1.33,.25],[-.08,1.58,.27],[.40,1.63,.22],[.84,1.46,.14]]}/></group>;
}

function MaleHair({ config }) { const ref=useRef(); useFrame((state)=>{if(ref.current) ref.current.rotation.z=Math.sin(state.clock.elapsedTime*.24)*.008;}); if(!config.enabled||config.style==="none") return null; return <group ref={ref} position={[0,1.25,0]}><GlassTube radius={.065} color={config.primaryColor} opacity={config.opacity} points={[[ -.95,1.10,.08],[-.42,1.50,.14],[.25,1.57,.10],[.95,1.25,.05]]}/></group>; }

function Mustache({ config }) { if(!config.enabled) return null; const style=config.style; const radius=style==="slim"?.050:style==="classic"?.063:.073; const curl=style==="slim"?.18:style==="classic"?.29:.43; return <group position={[0,1.03,1.47]}><GlassTube radius={radius} color={config.primaryColor} opacity={.86} points={[[0,0,0],[-.28,-.03,0],[-.58,-.04,0],[-.89,.07,0],[-1.14,.20,0],[-1.20,curl,0],[-1.10,curl+.10,0]]}/><GlassTube radius={radius} color={config.primaryColor} opacity={.86} points={[[0,0,0],[.28,-.03,0],[.58,-.04,0],[.89,.07,0],[1.14,.20,0],[1.20,curl,0],[1.10,curl+.10,0]]}/><GlassTube radius={.021} color={config.accentColor} opacity={.82} points={[[ -.03,.035,.035],[-.48,.025,.035],[-.90,.18,.035],[-1.08,curl+.04,.035]]}/><GlassTube radius={.021} color="#69E6FF" opacity={.78} points={[[.03,.035,.035],[.48,.025,.035],[.90,.18,.035],[1.08,curl+.04,.035]]}/></group>; }

function Beard({ config }) { if(!config.enabled) return null; if(config.style==="short") return <group position={[0,1.25,1.45]}><GlassTube radius={.035} color={config.primaryColor} opacity={.65} points={[[ -.42,-.47,0],[0,-.68,0],[.42,-.47,0]]}/></group>; return <group position={[0,1.25,1.44]}><GlassTube radius={.045} color={config.primaryColor} opacity={.68} points={[[ -.55,-.42,0],[-.32,-.72,0],[0,-.83,0],[.32,-.72,0],[.55,-.42,0]]}/></group>; }

function Arms({ variant, config }) {
  const group=useRef(); useFrame((state)=>{if(group.current) group.current.rotation.y=Math.sin(state.clock.elapsedTime*.31)*.006;}); const thickness=.042*config.body.armThickness; const handScale=config.body.handScale;
  const leftPts=variant==="male"?[[ -1.45,1.47,0],[-1.80,1.23,0],[-2.06,1.52,0],[-2.18,1.88,0]]:[[ -1.45,1.42,0],[-1.80,1.15,0],[-2.05,1.53,0],[-2.17,1.91,0]];
  const rightPts=variant==="male"?[[1.45,1.43,0],[1.86,1.14,0],[1.66,.76,0],[1.37,.58,0]]:[[1.45,1.42,0],[1.78,1.08,0],[1.99,.64,0],[2.07,.32,0]];
  return <group ref={group}><GlassTube radius={thickness} color="#71E4FF" points={leftPts}/><GlassHand position={variant==="male"?[-2.20,1.98,0]:[-2.20,2.02,0]} rotation={[0,0,-1.0]} scale={handScale}/><GlassTube radius={thickness} color="#AA73FF" points={rightPts}/><GlassHand position={variant==="male"?[1.33,.53,0]:[2.10,.22,0]} rotation={[0,0,variant==="male"?-.30:.34]} mirror scale={handScale}/></group>;
}

function Legs({ config }) { const radius=.046*config.body.legThickness; return <group><GlassTube radius={radius} color="#83E6FF" points={[[ -.25,-.17,0],[-.25,-.86,0],[-.22,-1.67,0],[-.19,-2.46,0]]}/><GlassTube radius={radius} color="#B183FF" points={[[.25,-.17,0],[.25,-.86,0],[.22,-1.67,0],[.19,-2.46,0]]}/><mesh position={[-.29,-2.53,.17]} scale={[.30,.10,.39]} rotation={[0,-.10,0]}><sphereGeometry args={[1,36,36]}/><meshPhysicalMaterial color="#86E8FF" transparent opacity={.78} transmission={.62} roughness={.045} clearcoat={1} clearcoatRoughness={.02} iridescence={.65}/></mesh><mesh position={[.29,-2.53,.17]} scale={[.30,.10,.39]} rotation={[0,.10,0]}><sphereGeometry args={[1,36,36]}/><meshPhysicalMaterial color="#AE7FFF" transparent opacity={.78} transmission={.62} roughness={.045} clearcoat={1} clearcoatRoughness={.02} iridescence={.65}/></mesh></group>; }

function OrbBody({ config, emotion, emotionIntensity, state, audioLevel }) {
  const orbGroup=useRef(), energyMaterial=useRef(), glassMaterial=useRef(); const emotionData=EMOTIONS[emotion]||EMOTIONS.neutral; const neutral=EMOTIONS.neutral;
  const palette=useMemo(()=>{ if(!config.orb.useEmotionColors) return {a:new THREE.Color(config.orb.primaryColor),b:new THREE.Color(config.orb.secondaryColor),c:new THREE.Color(config.orb.accentColor),d:new THREE.Color(config.orb.fourthColor)}; return {a:mixColor(neutral.a,emotionData.a,emotionIntensity),b:mixColor(neutral.b,emotionData.b,emotionIntensity),c:mixColor(neutral.c,emotionData.c,emotionIntensity),d:mixColor(neutral.d,emotionData.d,emotionIntensity)}; },[config.orb.useEmotionColors,config.orb.primaryColor,config.orb.secondaryColor,config.orb.accentColor,config.orb.fourthColor,emotion,emotionIntensity]);
  const uniforms=useMemo(()=>({uTime:{value:0},uAudio:{value:0},uBreath:{value:0},uGlow:{value:1},uIntensity:{value:1},uOpacity:{value:config.orb.internalOpacity},uAmplitude:{value:config.animation.amplitude},uEffect:{value:EFFECT_IDS[config.animation.effect]??8},uState:{value:STATE_IDS[state]??0},uColorA:{value:palette.a.clone()},uColorB:{value:palette.b.clone()},uColorC:{value:palette.c.clone()},uColorD:{value:palette.d.clone()}}),[]);
  useFrame((frameState,delta)=>{ const time=frameState.clock.elapsedTime; const emotionSpeed=emotionData.energySpeed; const emotionBreath=emotionData.breathSpeed; const stateBehavior=STATE_BEHAVIOR[state]||STATE_BEHAVIOR.idle; const period=Math.max(2.5,config.orb.breathPeriod); const phase=time*(TWO_PI/period)*emotionBreath; const rawBreath=.5+.5*Math.sin(phase-Math.PI/2); const secondary=Math.sin(time*.47)*.18; const breath=clamp01(rawBreath+secondary*.05); const amount=config.orb.breathing?config.orb.breathAmount:0;
    if(orbGroup.current) orbGroup.current.scale.set(1+amount*(.75+breath*.35),1+amount*(.60+breath*.48),1+amount*(.72+breath*.38)); if(!energyMaterial.current) return; const animation=config.animation; const effectiveAudio=animation.audioReactive?(state==="speaking"?audioLevel:(state==="listening"&&animation.microphoneReactive?audioLevel*.48:0)):0; const targetGlow=emotionData.glow*stateBehavior.glow*animation.glow*(1+breath*.08);
    const u=energyMaterial.current.uniforms; u.uTime.value=time*animation.speed*emotionSpeed*stateBehavior.speed; u.uAudio.value=THREE.MathUtils.lerp(u.uAudio.value,effectiveAudio,Math.min(1,delta*8)); u.uBreath.value=THREE.MathUtils.lerp(u.uBreath.value,breath,Math.min(1,delta*5)); u.uGlow.value=THREE.MathUtils.lerp(u.uGlow.value,targetGlow,Math.min(1,delta*2.2)); u.uIntensity.value=THREE.MathUtils.lerp(u.uIntensity.value,animation.intensity,Math.min(1,delta*2.5)); u.uOpacity.value=THREE.MathUtils.lerp(u.uOpacity.value,animation.opacity,Math.min(1,delta*3)); u.uAmplitude.value=THREE.MathUtils.lerp(u.uAmplitude.value,animation.amplitude,Math.min(1,delta*3)); u.uEffect.value=EFFECT_IDS[animation.effect]??8; u.uState.value=STATE_IDS[state]??0; const cs=Math.min(1,delta*1.8); u.uColorA.value.lerp(palette.a,cs); u.uColorB.value.lerp(palette.b,cs); u.uColorC.value.lerp(palette.c,cs); u.uColorD.value.lerp(palette.d,cs);
    if(glassMaterial.current){glassMaterial.current.emissive.copy(palette.a); glassMaterial.current.emissiveIntensity=.035+breath*.025+effectiveAudio*.06;}
  });
  return <group ref={orbGroup} position={[0,1.25,0]}><mesh scale={.955}><sphereGeometry args={[1.50,96,96]}/><shaderMaterial ref={energyMaterial} vertexShader={ENERGY_VERTEX_SHADER} fragmentShader={ENERGY_FRAGMENT_SHADER} uniforms={uniforms} transparent depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending}/></mesh><mesh scale={[.67,.67,.67]}><sphereGeometry args={[1.20,64,64]}/><meshBasicMaterial color="#5FE7FF" transparent opacity={.055} blending={THREE.AdditiveBlending} depthWrite={false}/></mesh><mesh><sphereGeometry args={[1.56,96,96]}/><meshPhysicalMaterial ref={glassMaterial} color="#D7FAFF" emissive="#4BDFFF" emissiveIntensity={.035} transparent opacity={config.orb.glassOpacity} transmission={config.orb.transmission} thickness={config.orb.thickness} roughness={config.orb.roughness} metalness={0} clearcoat={config.orb.clearcoat} clearcoatRoughness={config.orb.clearcoatRoughness} ior={config.orb.ior} iridescence={config.orb.iridescence} iridescenceIOR={1.30} envMapIntensity={1.85} attenuationDistance={3.2} attenuationColor="#6ADFFF"/></mesh></group>;
}

function CharacterModel({ config, emotion, emotionIntensity, state, audioLevel }) { const root=useRef(); useFrame((frameState)=>{if(root.current){const t=frameState.clock.elapsedTime; root.current.position.y=Math.sin(t*.58)*.018; root.current.rotation.z=Math.sin(t*.29)*.007; root.current.rotation.y=Math.sin(t*.22)*.015;}}); const variant=config.variant; return <group ref={root}><OrbBody config={config} emotion={emotion} emotionIntensity={emotionIntensity} state={state} audioLevel={audioLevel}/><Face variant={variant} config={config}/>{variant==="female"&&<FemaleHair config={config.hair}/>} {variant==="male"&&<><MaleHair config={config.hair}/><Mustache config={config.mustache}/><Beard config={config.beard}/></>} {variant!=="neutral"&&<><Arms variant={variant} config={config}/><Legs config={config}/></>}</group>; }

function StudioEnvironment(){ return <><ambientLight intensity={.32}/><directionalLight position={[-4,5,5]} color="#65EAFF" intensity={4.2}/><directionalLight position={[4,3,2]} color="#D66AFF" intensity={3.5}/><pointLight position={[0,-2,4]} color="#FF86C2" intensity={10} distance={9}/><pointLight position={[-1.2,4.6,3.5]} color="#FFFFFF" intensity={5.5} distance={9}/><pointLight position={[3.8,1.9,-1.5]} color="#FF9B73" intensity={6} distance={10}/><Environment resolution={256}><group><Lightformer form="rect" intensity={4} color="#DDFBFF" position={[-4,4,4]} scale={[4,1,1]}/><Lightformer form="rect" intensity={3} color="#60E8FF" position={[-5,0,2]} rotation={[0,Math.PI/2,0]} scale={[5,1,1]}/><Lightformer form="rect" intensity={3} color="#DE6CFF" position={[5,1,2]} rotation={[0,-Math.PI/2,0]} scale={[5,1,1]}/><Lightformer form="rect" intensity={2} color="#FF9D83" position={[2,-3,3]} scale={[2.5,1,1]}/></group></Environment></>; }

function OrbScene({ config, emotion, emotionIntensity, state, audioLevel, enableOrbit=true }) { return <><color attach="background" args={["#030713"]}/><fog attach="fog" args={["#030713",11,18]}/><StudioEnvironment/><CharacterModel config={config} emotion={emotion} emotionIntensity={emotionIntensity} state={state} audioLevel={audioLevel}/><ContactShadows position={[0,-2.64,0]} scale={7} opacity={.28} blur={2.5} far={5}/>{enableOrbit&&<OrbitControls target={[0,.25,0]} enablePan={false} enableDamping dampingFactor={.08} minDistance={6.4} maxDistance={10} minPolarAngle={Math.PI*.34} maxPolarAngle={Math.PI*.68}/>}</>; }

export function LivingOrbCharacter({ config:userConfig={}, emotion="neutral", emotionIntensity=1, state="idle", audioLevel=0, enableOrbit=false, style={}, className="" }) { const config=useMemo(()=>mergeConfig(userConfig),[userConfig]); return <div className={className} style={{width:"100%",height:"100%",minHeight:600,background:"#030713",overflow:"hidden",...style}}><Canvas dpr={[1,1.65]} camera={{position:[0,.20,8.4],fov:38,near:.1,far:50}} gl={{antialias:true,alpha:false,powerPreference:"high-performance"}}><OrbScene config={config} emotion={emotion} emotionIntensity={emotionIntensity} state={state} audioLevel={clamp01(audioLevel)} enableOrbit={enableOrbit}/></Canvas></div>; }

const panelStyle={position:"absolute",top:14,right:14,zIndex:20,width:"min(390px, calc(100vw - 28px))",maxHeight:"calc(100vh - 28px)",overflowY:"auto",padding:16,borderRadius:22,background:"rgba(6, 11, 26, 0.87)",backdropFilter:"blur(18px)",border:"1px solid rgba(155, 205, 255, 0.18)",boxShadow:"0 20px 70px rgba(0,0,0,.42)",color:"#EEF7FF",fontFamily:"system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"};
const sectionStyle={marginBottom:18,paddingBottom:16,borderBottom:"1px solid rgba(255,255,255,.08)"}; const labelStyle={display:"block",fontSize:12,opacity:.72,marginBottom:6}; const selectStyle={width:"100%",padding:"9px 10px",borderRadius:10,background:"rgba(255,255,255,.06)",color:"#FFFFFF",border:"1px solid rgba(255,255,255,.12)",outline:"none"};
function Button({children,active,onClick}){return <button onClick={onClick} style={{padding:"8px 11px",borderRadius:999,border:active?"1px solid rgba(85,225,255,.9)":"1px solid rgba(255,255,255,.12)",background:active?"rgba(50,210,255,.14)":"rgba(255,255,255,.05)",color:"#F5FBFF",fontSize:12,cursor:"pointer"}}>{children}</button>}
function Slider({label,value,min,max,step,onChange}){return <div style={{marginBottom:11}}><div style={{display:"flex",justifyContent:"space-between",gap:12,fontSize:12}}><span style={{opacity:.74}}>{label}</span><span>{Number(value).toFixed(2)}</span></div><input type="range" min={min} max={max} step={step} value={value} onChange={(event)=>onChange(Number(event.target.value))} style={{width:"100%"}}/></div>}

export default function LivingOrbStudio(){
  const [config,setConfig]=useState(mergeConfig()); const [emotion,setEmotion]=useState("neutral"); const [emotionIntensity,setEmotionIntensity]=useState(.85); const [state,setState]=useState("idle"); const [microphoneEnabled,setMicrophoneEnabled]=useState(false); const [demoVoice,setDemoVoice]=useState(false); const [panelOpen,setPanelOpen]=useState(true); const [customPresets,setCustomPresets]=useState({});
  const microphone=useMicrophoneLevel(microphoneEnabled); const demoLevel=useDemoVoiceLevel(demoVoice); const audioLevel=microphoneEnabled?microphone.level:demoVoice?demoLevel:0;
  useEffect(()=>{try{const saved=localStorage.getItem("living-orb-custom-presets"); if(saved) setCustomPresets(JSON.parse(saved));}catch{}},[]);
  const updateSection=useCallback((section,changes)=>setConfig((previous)=>({...previous,[section]:{...previous[section],...changes}})),[]);
  const setVariant=useCallback((variant)=>setConfig((previous)=>{const next={...previous,variant}; if(variant==="female") next.hair={...next.hair,enabled:true,style:next.hair.style==="none"?"elegant-light-curl":next.hair.style}; return next;}),[]);
  const applyAnimationPreset=useCallback((name)=>{const preset=ANIMATION_PRESETS[name]||customPresets[name]; if(preset) updateSection("animation",{...preset,preset:name});},[customPresets,updateSection]);
  const saveCurrentPreset=useCallback(()=>{if(typeof window==="undefined")return; const name=window.prompt("Nazwa własnego presetu animacji:"); if(!name?.trim()) return; const clean=name.trim(); const preset={effect:config.animation.effect,speed:config.animation.speed,intensity:config.animation.intensity,amplitude:config.animation.amplitude,glow:config.animation.glow,opacity:config.animation.opacity,audioReactive:config.animation.audioReactive,microphoneReactive:config.animation.microphoneReactive}; const next={...customPresets,[clean]:preset}; setCustomPresets(next); try{localStorage.setItem("living-orb-custom-presets",JSON.stringify(next));}catch{} updateSection("animation",{...preset,preset:clean});},[config.animation,customPresets,updateSection]);
  const runVoiceTest=useCallback(()=>{setDemoVoice(true);setState("speaking");window.setTimeout(()=>{setDemoVoice(false);setState("idle");},5200);},[]);
  const allPresetNames=useMemo(()=>[...Object.keys(ANIMATION_PRESETS),...Object.keys(customPresets)],[customPresets]);
  return <div style={{width:"100%",height:"100dvh",minHeight:650,position:"relative",overflow:"hidden",background:"#030713"}}>
    <Canvas dpr={[1,1.65]} camera={{position:[0,.20,8.4],fov:38,near:.1,far:50}} gl={{antialias:true,alpha:false,powerPreference:"high-performance"}}><OrbScene config={config} emotion={emotion} emotionIntensity={emotionIntensity} state={state} audioLevel={audioLevel} enableOrbit/></Canvas>
    <button onClick={()=>setPanelOpen(v=>!v)} style={{position:"absolute",left:16,top:16,zIndex:30,width:48,height:48,borderRadius:"50%",border:"1px solid rgba(255,255,255,.16)",background:"rgba(5,10,22,.80)",color:"#FFFFFF",fontSize:20,cursor:"pointer"}}>{panelOpen?"×":"☰"}</button>
    {panelOpen&&<div style={panelStyle}>
      <div style={{fontSize:19,fontWeight:800,marginBottom:4}}>Living Orb Creator</div><div style={{fontSize:12,lineHeight:1.5,opacity:.62,marginBottom:18}}>Glass • Breath • Voice • Emotion • Character</div>
      <div style={sectionStyle}><strong>POSTAĆ</strong><div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:10}}><Button active={config.variant==="female"} onClick={()=>setVariant("female")}>Female</Button><Button active={config.variant==="male"} onClick={()=>setVariant("male")}>Male</Button><Button active={config.variant==="neutral"} onClick={()=>setVariant("neutral")}>Neutral Orb</Button></div></div>
      <div style={sectionStyle}><strong>STAN</strong><div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>{["idle","listening","thinking","speaking","success","warning","error"].map((name)=><Button key={name} active={state===name} onClick={()=>setState(name)}>{name.toUpperCase()}</Button>)}</div></div>
      <div style={sectionStyle}><strong>EMOCJA / KOLOR</strong><div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10,marginBottom:12}}>{Object.keys(EMOTIONS).map((name)=><Button key={name} active={emotion===name} onClick={()=>setEmotion(name)}>{name.toUpperCase()}</Button>)}</div><Slider label="Emotion intensity" value={emotionIntensity} min={0} max={1} step={.01} onChange={setEmotionIntensity}/><label style={{display:"flex",gap:8,alignItems:"center",fontSize:12}}><input type="checkbox" checked={config.orb.useEmotionColors} onChange={(e)=>updateSection("orb",{useEmotionColors:e.target.checked})}/>Kolory sterowane emocją</label></div>
      {!config.orb.useEmotionColors&&<div style={sectionStyle}><strong>WŁASNE KOLORY</strong>{[["primaryColor","Primary"],["secondaryColor","Secondary"],["accentColor","Accent"],["fourthColor","Fourth"]].map(([key,label])=><label key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:12,marginTop:9}}>{label}<input type="color" value={config.orb[key]} onChange={(e)=>updateSection("orb",{[key]:e.target.value})}/></label>)}</div>}
      <div style={sectionStyle}><strong>ORB / GLASS</strong><Slider label="Transmission" value={config.orb.transmission} min={.4} max={1} step={.01} onChange={(v)=>updateSection("orb",{transmission:v})}/><Slider label="Roughness" value={config.orb.roughness} min={0} max={.35} step={.005} onChange={(v)=>updateSection("orb",{roughness:v})}/><Slider label="Glass opacity" value={config.orb.glassOpacity} min={.05} max={.8} step={.01} onChange={(v)=>updateSection("orb",{glassOpacity:v})}/><Slider label="Glass thickness" value={config.orb.thickness} min={.1} max={2} step={.02} onChange={(v)=>updateSection("orb",{thickness:v})}/><Slider label="Iridescence" value={config.orb.iridescence} min={0} max={1} step={.01} onChange={(v)=>updateSection("orb",{iridescence:v})}/><Slider label="Breath period" value={config.orb.breathPeriod} min={3.5} max={7} step={.1} onChange={(v)=>updateSection("orb",{breathPeriod:v})}/><Slider label="Breath amount" value={config.orb.breathAmount} min={0} max={.035} step={.001} onChange={(v)=>updateSection("orb",{breathAmount:v})}/></div>
      <div style={sectionStyle}><strong>OCZY</strong><label style={{display:"flex",gap:8,marginTop:10,fontSize:12}}><input type="checkbox" checked={config.eyes.enabled} onChange={(e)=>updateSection("eyes",{enabled:e.target.checked})}/>Oczy ON/OFF</label><label style={labelStyle}>Styl oczu</label><select style={selectStyle} value={config.eyes.style} onChange={(e)=>updateSection("eyes",{style:e.target.value})}><option value="reference">Reference</option><option value="large">Large</option><option value="minimal">Minimal</option><option value="futuristic">Futuristic</option></select><Slider label="Eye size" value={config.eyes.size} min={.65} max={1.35} step={.02} onChange={(v)=>updateSection("eyes",{size:v})}/><Slider label="Eye spacing" value={config.eyes.spacing} min={.75} max={1.3} step={.02} onChange={(v)=>updateSection("eyes",{spacing:v})}/><label style={{display:"flex",justifyContent:"space-between",marginTop:10,fontSize:12}}>Iris<input type="color" value={config.eyes.irisColor} onChange={(e)=>updateSection("eyes",{irisColor:e.target.value})}/></label></div>
      {config.variant!=="neutral"&&<div style={sectionStyle}><strong>FRYZURA</strong><label style={{display:"flex",gap:8,marginTop:10,fontSize:12}}><input type="checkbox" checked={config.hair.enabled} onChange={(e)=>updateSection("hair",{enabled:e.target.checked})}/>Hair ON/OFF</label><label style={labelStyle}>Styl</label><select style={selectStyle} value={config.hair.style} onChange={(e)=>updateSection("hair",{style:e.target.value})}>{config.variant==="female"?<><option value="elegant-light-curl">Elegant Light Curl</option><option value="short">Short</option><option value="long-wave">Long Wave</option><option value="bun-light">Bun Light</option><option value="contour">Light Contour</option><option value="none">None</option></>:<><option value="short">Swept Light</option><option value="none">No Hair</option></>}</select><label style={{display:"flex",justifyContent:"space-between",marginTop:10,fontSize:12}}>Hair primary<input type="color" value={config.hair.primaryColor} onChange={(e)=>updateSection("hair",{primaryColor:e.target.value})}/></label></div>}
      {config.variant==="male"&&<div style={sectionStyle}><strong>WĄS / BRODA</strong><label style={{display:"flex",gap:8,marginTop:10,fontSize:12}}><input type="checkbox" checked={config.mustache.enabled} onChange={(e)=>updateSection("mustache",{enabled:e.target.checked})}/>Wąs</label><select style={{...selectStyle,marginTop:8}} value={config.mustache.style} onChange={(e)=>updateSection("mustache",{style:e.target.value})}><option value="reference-curled">Reference Curled</option><option value="classic">Classic</option><option value="slim">Slim</option></select><label style={{display:"flex",gap:8,marginTop:10,fontSize:12}}><input type="checkbox" checked={config.beard.enabled} onChange={(e)=>updateSection("beard",{enabled:e.target.checked})}/>Broda</label><select style={{...selectStyle,marginTop:8}} value={config.beard.style} onChange={(e)=>updateSection("beard",{style:e.target.value})}><option value="chin-glow">Chin Glow</option><option value="short">Short</option></select></div>}
      <div style={sectionStyle}><strong>ANIMACJA ORBA</strong><label style={{...labelStyle,marginTop:10}}>Preset</label><select value={config.animation.preset} style={selectStyle} onChange={(e)=>applyAnimationPreset(e.target.value)}>{allPresetNames.map((name)=><option key={name} value={name}>{name}</option>)}</select><label style={{...labelStyle,marginTop:10}}>Base effect</label><select value={config.animation.effect} style={selectStyle} onChange={(e)=>updateSection("animation",{effect:e.target.value,preset:"Custom"})}>{Object.keys(EFFECT_IDS).map((name)=><option key={name} value={name}>{name}</option>)}</select><Slider label="Speed" value={config.animation.speed} min={.1} max={2} step={.02} onChange={(v)=>updateSection("animation",{speed:v,preset:"Custom"})}/><Slider label="Intensity" value={config.animation.intensity} min={.1} max={1.6} step={.02} onChange={(v)=>updateSection("animation",{intensity:v,preset:"Custom"})}/><Slider label="Amplitude" value={config.animation.amplitude} min={0} max={1.5} step={.02} onChange={(v)=>updateSection("animation",{amplitude:v,preset:"Custom"})}/><Slider label="Glow" value={config.animation.glow} min={.2} max={1.8} step={.02} onChange={(v)=>updateSection("animation",{glow:v,preset:"Custom"})}/><Slider label="Energy opacity" value={config.animation.opacity} min={.15} max={1} step={.01} onChange={(v)=>updateSection("animation",{opacity:v,preset:"Custom"})}/><label style={{display:"flex",gap:8,marginTop:8,fontSize:12}}><input type="checkbox" checked={config.animation.audioReactive} onChange={(e)=>updateSection("animation",{audioReactive:e.target.checked})}/>Audio reactive</label><label style={{display:"flex",gap:8,marginTop:8,fontSize:12}}><input type="checkbox" checked={config.animation.microphoneReactive} onChange={(e)=>updateSection("animation",{microphoneReactive:e.target.checked})}/>Microphone reactive</label><button onClick={saveCurrentPreset} style={{width:"100%",marginTop:12,padding:"9px",borderRadius:10,border:"1px solid rgba(255,255,255,.14)",background:"rgba(255,255,255,.07)",color:"white",cursor:"pointer"}}>Zapisz własny preset</button></div>
      <div style={sectionStyle}><strong>VOICE ORB</strong><div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:10}}><Button active={demoVoice} onClick={runVoiceTest}>TEST VOICE</Button><Button active={microphoneEnabled} onClick={()=>{setMicrophoneEnabled(v=>!v);if(!microphoneEnabled)setState("listening");}}>MIC REACTIVE</Button></div><div style={{marginTop:12}}><div style={{fontSize:11,opacity:.65}}>Audio level</div><div style={{height:6,marginTop:5,borderRadius:99,background:"rgba(255,255,255,.08)",overflow:"hidden"}}><div style={{height:"100%",width:`${Math.round(audioLevel*100)}%`,background:"linear-gradient(90deg,#4DEBFF,#8A66FF,#FF6FD0)",transition:"width 60ms linear"}}/></div></div>{microphone.error&&<div style={{color:"#FF90A8",fontSize:11,marginTop:8}}>{microphone.error}</div>}</div>
      <div style={{fontSize:11,opacity:.52,lineHeight:1.55}}>W produkcji zamiast TEST VOICE podaj do komponentu rzeczywisty poziom audio 0–1 z Twojego strumienia OpenAI / Web Audio.</div>
    </div>}
  </div>;
}
