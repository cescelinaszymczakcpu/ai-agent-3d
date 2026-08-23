'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useMemo, useRef } from 'react';

export const hairStyles=['elegant-curl'];
export const eyeStyles=['cinematic'];
export const mustacheStyles=['classic'];
export const voicePresets=['liquid-wave','aurora','calm-medical'];

export const presets={
  femaleAurora:{name:'Female Aurora',gender:'female',primary:'#24dfff',secondary:'#755cff',accent:'#ff6fcf',opacity:.72,glow:.82,glass:.98,limbWidth:.45,armLength:1,legLength:1.18,eyes:true,eyeStyle:'cinematic',eyeColor:'#8a6cff',eyeSize:1,hair:true,hairStyle:'elegant-curl',hairColor:'#9b70ff',mustache:false,mustacheStyle:'classic',mustacheColor:'#7b63ff',beard:false,mouth:true,voicePreset:'liquid-wave'},
  maleAzure:{name:'Male Azure',gender:'male',primary:'#24dfff',secondary:'#755cff',accent:'#ff6fcf',opacity:.72,glow:.82,glass:.98,limbWidth:.45,armLength:1,legLength:1.18,eyes:true,eyeStyle:'cinematic',eyeColor:'#7a70ff',eyeSize:1,hair:false,hairStyle:'elegant-curl',hairColor:'#8a64ff',mustache:true,mustacheStyle:'classic',mustacheColor:'#7b63ff',beard:false,mouth:true,voicePreset:'liquid-wave'},
  maleNoMustache:{name:'Male No Mustache',gender:'male',primary:'#24dfff',secondary:'#755cff',accent:'#ff6fcf',opacity:.72,glow:.82,glass:.98,limbWidth:.45,armLength:1,legLength:1.18,eyes:true,eyeStyle:'cinematic',eyeColor:'#7a70ff',eyeSize:1,hair:false,hairStyle:'elegant-curl',hairColor:'#8a64ff',mustache:false,mustacheStyle:'classic',mustacheColor:'#7b63ff',beard:false,mouth:true,voicePreset:'liquid-wave'},
  neutral:{name:'Neutral Orb',gender:'neutral',primary:'#24dfff',secondary:'#755cff',accent:'#ff6fcf',opacity:.72,glow:.82,glass:.98,limbWidth:.45,armLength:1,legLength:1.18,eyes:false,eyeStyle:'cinematic',eyeColor:'#ffffff',eyeSize:1,hair:false,hairStyle:'elegant-curl',hairColor:'#ffffff',mustache:false,mustacheStyle:'classic',mustacheColor:'#ffffff',beard:false,mouth:false,voicePreset:'liquid-wave'}
};

const V = p => new THREE.Vector3(...p);
function Tube({points,radius,color,opacity=.9}){
  const geometry=useMemo(()=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(V)),96,radius,16,false),[points,radius]);
  return <mesh geometry={geometry}><meshPhysicalMaterial color={color} transparent opacity={opacity} roughness={0.035} metalness={0.18} transmission={0.62} thickness={0.34} ior={1.44} clearcoat={1} clearcoatRoughness={0.015} envMapIntensity={1.8} emissive={color} emissiveIntensity={0.05}/></mesh>;
}

function Fingers({side,at,color}){
  return <group position={at} scale={[side,1,1]}>
    <mesh scale={[.075,.11,.045]}><sphereGeometry args={[1,28,20]}/><meshPhysicalMaterial color={color} transparent opacity={.88} roughness={.04} transmission={.55} clearcoat={1}/></mesh>
    {[-.05,-.016,.02,.055].map((x,i)=><mesh key={i} position={[x,-.12-i*.006,.005]} rotation={[0,0,(i-1.5)*.10]}><capsuleGeometry args={[.009,.13-i*.008,6,10]}/><meshPhysicalMaterial color={color} transparent opacity={.9} roughness={.04} transmission={.52} clearcoat={1}/></mesh>)}
    <mesh position={[-.085,-.035,.008]} rotation={[0,0,-.55]}><capsuleGeometry args={[.01,.09,6,10]}/><meshPhysicalMaterial color={color} transparent opacity={.9} roughness={.04} transmission={.52} clearcoat={1}/></mesh>
  </group>;
}

function Arm({side,config}){
  const ref=useRef(); const s=side; const r=.026*(config.limbWidth/.45);
  const pts=[[s*.92,.02,.02],[s*1.05,-.16,.03],[s*1.14,-.42,.05],[s*1.24,-.69,.08],[s*1.32,-.88,.10]];
  useFrame(({clock})=>{if(ref.current){const t=clock.elapsedTime;ref.current.rotation.z=s*(.012*Math.sin(t*.47)+.005*Math.sin(t*.19));}});
  return <group ref={ref}><Tube points={pts} radius={r} color={config.secondary}/><Fingers side={s} at={pts[pts.length-1]} color={config.secondary}/></group>;
}

function Foot({side,at,config}){
  return <group position={at}>
    <mesh position={[side*.035,-.03,.14]} scale={[.115,.055,.25]}><sphereGeometry args={[1,36,24]}/><meshPhysicalMaterial color={config.secondary} transparent opacity={.9} roughness={.035} metalness={.14} transmission={.5} clearcoat={1}/></mesh>
    <mesh position={[0,-.13,-.02]} scale={[.035,.16,.035]}><capsuleGeometry args={[1,1,6,10]}/><meshPhysicalMaterial color={config.accent} transparent opacity={.72} roughness={.04} transmission={.45}/></mesh>
  </group>;
}

function Leg({side,config}){
  const ref=useRef(); const s=side; const L=config.legLength||1.18; const r=.024*(config.limbWidth/.45);
  const pts=[[s*.28,-.80,.02],[s*.29,-1.23*L,.03],[s*.26,-1.68*L,.05],[s*.23,-2.05*L,.08],[s*.21,-2.34*L,.11]];
  useFrame(({clock})=>{if(ref.current){const t=clock.elapsedTime;ref.current.rotation.z=s*.004*Math.sin(t*.33+s);}});
  return <group ref={ref}><Tube points={pts} radius={r} color={config.primary}/><Foot side={s} at={pts[pts.length-1]} config={config}/></group>;
}

function Eye({side,config,blinkRef}){
  const g=useRef(), iris=useRef(); const s=side;
  useFrame(({clock})=>{const t=clock.elapsedTime;if(g.current)g.current.scale.y=Math.max(.06,blinkRef.current);if(iris.current){iris.current.position.x=.012*Math.sin(t*.31+s);iris.current.position.y=.006*Math.sin(t*.23+s);}});
  return <group ref={g} position={[s*.34,.12,.88]} rotation={[0,-s*.035,0]}>
    <mesh scale={[1.18,.78,.55]}><sphereGeometry args={[.22,64,48]}/><meshPhysicalMaterial color="#f8f7ff" roughness={.025} clearcoat={1} clearcoatRoughness={.01} transmission={.035}/></mesh>
    <group ref={iris}>
      <mesh position={[0,0,.145]} scale={[1.03,.98,.42]}><sphereGeometry args={[.145,56,42]}/><meshPhysicalMaterial color={config.eyeColor} roughness={.02} clearcoat={1} metalness={.08} emissive={config.eyeColor} emissiveIntensity={.12}/></mesh>
      <mesh position={[0,0,.208]}><sphereGeometry args={[.067,40,30]}/><meshPhysicalMaterial color="#100b27" roughness={.04} clearcoat={1}/></mesh>
      <mesh position={[-.045,.05,.254]}><sphereGeometry args={[.026,24,18]}/><meshBasicMaterial color="#ffffff"/></mesh>
      <mesh position={[.03,-.012,.248]}><sphereGeometry args={[.011,18,14]}/><meshBasicMaterial color="#c8f8ff"/></mesh>
    </group>
    {config.gender==='female' && <group position={[0,.17,.07]}>{[-.10,-.05,.0,.05,.10].map((x,i)=><mesh key={i} position={[x,0,0]} rotation={[0,0,(i-2)*.10]}><capsuleGeometry args={[.005,.073+Math.abs(i-2)*.009,5,8]}/><meshStandardMaterial color="#dac8ff" emissive="#916cff" emissiveIntensity={.22}/></mesh>)}</group>}
  </group>;
}

function Hair({config}){
  if(!config.hair) return null; const ref=useRef();
  useFrame(({clock})=>{if(ref.current){const t=clock.elapsedTime;ref.current.rotation.z=.009*Math.sin(t*.25);ref.current.rotation.y=.012*Math.sin(t*.19);}});
  const a=[[-.44,.70,.48],[-.34,.95,.52],[-.08,1.14,.48],[.25,1.20,.37],[.55,1.07,.23],[.72,.84,.12],[.76,.58,.04],[.67,.40,.03],[.51,.33,.09]];
  const b=[[-.28,.82,.52],[-.05,1.03,.50],[.24,1.07,.41],[.48,.92,.30],[.60,.69,.17],[.57,.49,.10]];
  const c=[[.38,.70,.32],[.56,.89,.26],[.72,.97,.18],[.86,.87,.10],[.88,.68,.05],[.77,.56,.03]];
  return <group ref={ref}><Tube points={a} radius={.072} color={config.hairColor}/><Tube points={b} radius={.043} color={config.accent} opacity={.82}/><Tube points={c} radius={.035} color={config.primary} opacity={.78}/></group>;
}

function Mustache({config}){
  if(!config.mustache) return null; const c=config.mustacheColor;
  const l=[[-.02,-.18,.94],[-.18,-.14,.96],[-.39,-.15,.93],[-.58,-.09,.84],[-.72,.02,.72],[-.73,.12,.64]];
  const r=l.map(([x,y,z])=>[-x,y,z]);
  return <group><Tube points={l} radius={.065} color={c}/><Tube points={r} radius={.065} color={c}/></group>;
}

function Orb({config,state,audioLevel}){
  const orb=useRef(), innerA=useRef(), innerB=useRef(), voice=useRef();
  const blink=useRef(1), blinkState=useRef({next:3+Math.random()*4,until:0,double:false});
  useFrame(({clock},delta)=>{
    const t=clock.elapsedTime;
    const phase=(Math.sin((t/5.05)*Math.PI*2)+1)/2;
    const breathe=1+phase*.015;
    if(orb.current){orb.current.scale.set(breathe,breathe*(1+.0018*phase),breathe);orb.current.rotation.z=THREE.MathUtils.degToRad(.45*Math.sin(t*.18));}
    if(innerA.current){innerA.current.rotation.y=t*.055;innerA.current.rotation.z=t*.018;innerA.current.scale.setScalar(.82+.018*phase);innerA.current.material.emissiveIntensity=.30+.12*phase;}
    if(innerB.current){innerB.current.rotation.y=-t*.042;innerB.current.scale.setScalar(.72+.014*(1-phase));innerB.current.material.emissiveIntensity=.24+.10*phase;}
    const amp=Math.max(.03,Math.min(1,audioLevel||0));
    const active=state==='speaking'||state==='listening'||state==='thinking';
    if(voice.current){voice.current.visible=active;voice.current.scale.setScalar(.40+(state==='speaking'?amp*.20:.05)+.018*Math.sin(t*2.2));voice.current.rotation.x=t*.32;voice.current.rotation.y=t*.47;voice.current.material.emissiveIntensity=.35+(state==='speaking'?amp*1.5:.25);}
    const b=blinkState.current;if(t>b.next){b.until=t+.13;b.next=t+3+Math.random()*4;b.double=Math.random()<.14;}
    let target=t<b.until?.06:1;if(b.double&&t>b.until+.14&&t<b.until+.27)target=.06;blink.current=THREE.MathUtils.damp(blink.current,target,30,delta);
  });
  return <group ref={orb}>
    <mesh><sphereGeometry args={[.92,128,128]}/><MeshTransmissionMaterial color={config.primary} samples={10} resolution={512} transmission={.96} roughness={.015} thickness={1.15} ior={1.38} chromaticAberration={.12} anisotropy={.35} distortion={.10} distortionScale={.15} temporalDistortion={.05} clearcoat={1} clearcoatRoughness={.012} attenuationColor={config.secondary} attenuationDistance={1.4}/></mesh>
    <mesh ref={innerA} scale={.82} position={[-.10,.05,-.04]}><sphereGeometry args={[.78,72,72]}/><meshPhysicalMaterial color={config.primary} transparent opacity={.12} roughness={.18} transmission={.35} emissive={config.primary} emissiveIntensity={.3}/></mesh>
    <mesh ref={innerB} scale={.72} position={[.16,-.08,.02]}><sphereGeometry args={[.70,72,72]}/><meshPhysicalMaterial color={config.secondary} transparent opacity={.13} roughness={.16} transmission={.32} emissive={config.accent} emissiveIntensity={.24}/></mesh>
    <mesh ref={voice}><torusKnotGeometry args={[.28,.028,180,24,2,3]}/><meshPhysicalMaterial color={config.accent} transparent opacity={.24} roughness={.06} transmission={.30} emissive={config.accent} emissiveIntensity={.5}/></mesh>
    <pointLight position={[-.22,.08,.12]} color={config.primary} intensity={3.8} distance={2.2}/><pointLight position={[.24,-.10,.08]} color={config.accent} intensity={3.2} distance={2}/>
    {config.eyes&&<><Eye side={-1} config={config} blinkRef={blink}/><Eye side={1} config={config} blinkRef={blink}/></>}
    {config.mouth&&<mesh position={[0,-.30,.87]} scale={[.14,.035,.025]}><sphereGeometry args={[1,36,24]}/><meshPhysicalMaterial color="#f7b8dc" roughness={.035} clearcoat={1} transparent opacity={.62} emissive="#ff78c8" emissiveIntensity={.09}/></mesh>}
    <Hair config={config}/><Mustache config={config}/>
  </group>;
}

function Character({config,state,audioLevel}){
  const root=useRef();
  useFrame(({clock})=>{if(root.current){const t=clock.elapsedTime;root.current.rotation.z=THREE.MathUtils.degToRad(.22*Math.sin(t*.14));root.current.rotation.y=.012*Math.sin(t*.11);}});
  return <group ref={root} position={[0,.76,0]}><Orb config={config} state={state} audioLevel={audioLevel}/><Arm side={-1} config={config}/><Arm side={1} config={config}/><Leg side={-1} config={config}/><Leg side={1} config={config}/></group>;
}

function Scene({config,state,audioLevel}){
  return <>
    <ambientLight intensity={.18}/><directionalLight position={[0,3,5]} intensity={2.2} color="#e6fbff"/><pointLight position={[-3.8,1.6,2.8]} intensity={34} distance={9} color="#19dcff"/><pointLight position={[3.8,1.3,2.4]} intensity={30} distance={9} color="#b252ff"/><pointLight position={[0,-2.4,2.1]} intensity={20} distance={7} color="#ff6da8"/>
    <Environment resolution={256}><Lightformer intensity={3.5} color="#dffcff" position={[-4,3,3]} scale={[4,1,1]}/><Lightformer intensity={3} color="#7e5cff" position={[4,1,2]} scale={[3,2,1]}/><Lightformer intensity={2.2} color="#ff7ba8" position={[0,-3,2]} scale={[5,1,1]}/></Environment>
    <Character config={config} state={state} audioLevel={audioLevel}/><ContactShadows position={[0,-2.62,0]} opacity={.24} scale={5.5} blur={2.8} far={4}/>
  </>;
}

export function LivingOrb({config,state='idle',audioLevel=.12}){
  return <div className="livingOrbCanvas" aria-label="Living Orb 3D"><Canvas camera={{position:[0,.05,5.7],fov:35}} dpr={[1,2]} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}}><Scene config={config} state={state} audioLevel={audioLevel}/></Canvas></div>;
}
