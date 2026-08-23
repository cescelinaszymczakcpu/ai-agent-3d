'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { useMemo, useRef } from 'react';

export const hairStyles=['elegant-curl','short-wave','long-wave','light-bun','none'];
export const eyeStyles=['cinematic','soft','minimal','light-only','none'];
export const mustacheStyles=['classic','wide-curl','soft-curl'];
export const voicePresets=['liquid-wave','aurora','ripple','energy-ring','neural-flow','calm-medical'];

export const presets={
  femaleAurora:{name:'Female Aurora',gender:'female',primary:'#21d9ff',secondary:'#805cff',accent:'#ff68ce',opacity:.76,glow:.72,glass:.9,limbWidth:.68,armLength:1,legLength:1,eyes:true,eyeStyle:'cinematic',eyeColor:'#8b6cff',eyeSize:1,hair:true,hairStyle:'elegant-curl',hairColor:'#9b6cff',mustache:false,mustacheStyle:'classic',mustacheColor:'#785cff',beard:false,mouth:true,voicePreset:'liquid-wave'},
  maleAzure:{name:'Male Azure',gender:'male',primary:'#16d9ff',secondary:'#625cff',accent:'#ff71ba',opacity:.76,glow:.72,glass:.9,limbWidth:.68,armLength:1,legLength:1,eyes:true,eyeStyle:'cinematic',eyeColor:'#6f7dff',eyeSize:1,hair:false,hairStyle:'none',hairColor:'#6a6cff',mustache:true,mustacheStyle:'wide-curl',mustacheColor:'#765cff',beard:false,mouth:true,voicePreset:'liquid-wave'},
  maleNoMustache:{name:'Male No Mustache',gender:'male',primary:'#18cfff',secondary:'#7f61ff',accent:'#f47ccb',opacity:.78,glow:.68,glass:.92,limbWidth:.64,armLength:1,legLength:1,eyes:true,eyeStyle:'soft',eyeColor:'#7a73ff',eyeSize:1,hair:false,hairStyle:'none',hairColor:'#765cff',mustache:false,mustacheStyle:'classic',mustacheColor:'#765cff',beard:false,mouth:true,voicePreset:'aurora'},
  neutral:{name:'Neutral Orb',gender:'neutral',primary:'#39e8ff',secondary:'#836cff',accent:'#ff80da',opacity:.8,glow:.65,glass:.95,limbWidth:.62,armLength:1,legLength:1,eyes:false,eyeStyle:'none',eyeColor:'#ffffff',eyeSize:1,hair:false,hairStyle:'none',hairColor:'#ffffff',mustache:false,mustacheStyle:'classic',mustacheColor:'#ffffff',beard:false,mouth:false,voicePreset:'neural-flow'}
};

function glassMaterial(color, opacity=.85, roughness=.08, metalness=.12, transmission=.7){
  return {color,transparent:true,opacity,roughness,metalness,transmission,thickness:1.8,ior:1.42,clearcoat:1,clearcoatRoughness:.04,envMapIntensity:1.2};
}

function Tube({points,radius=.035,color='#8b6cff',opacity=.86}){
  const geometry=useMemo(()=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),64,radius,10,false),[points,radius]);
  return <mesh geometry={geometry}><meshPhysicalMaterial {...glassMaterial(color,opacity,.1,.22,.55)} emissive={color} emissiveIntensity={.12}/></mesh>;
}

function Limb({side=1,kind='arm',config}){
  const isArm=kind==='arm';
  const s=side;
  const r=.055*config.limbWidth;
  const legL=config.legLength||1;
  const pts=isArm
    ? [[s*1.02,.15,0],[s*1.26,-.18,0],[s*1.35,-.62,0],[s*1.48,-.92,.02]]
    : [[s*.34,-.93,0],[s*.35,-1.35*legL,0],[s*.31,-1.92*legL,.02],[s*.29,-2.28*legL,.12]];
  const ref=useRef();
  useFrame(({clock})=>{
    if(!ref.current)return;
    const t=clock.elapsedTime;
    ref.current.rotation.z=isArm ? s*.025*Math.sin(t*.72+s) : s*.012*Math.sin(t*.55+s);
    ref.current.position.y=(isArm ? .012 : .008)*Math.sin(t*.82+s);
  });
  return <group ref={ref}>
    <Tube points={pts} radius={r} color={config.secondary} opacity={.82}/>
    {isArm ? <Hand side={s} config={config}/> : <Foot side={s} config={config}/>} 
  </group>;
}

function Hand({side,config}){
  const x=side*1.49;
  const y=-.94;
  const palm=useRef();
  useFrame(({clock})=>{if(palm.current)palm.current.rotation.z=side*.18+Math.sin(clock.elapsedTime*1.1+side)*.035});
  return <group ref={palm} position={[x,y,.02]} scale={[side,1,1]}>
    <mesh scale={[.11,.16,.065]}><sphereGeometry args={[1,20,16]}/><meshPhysicalMaterial {...glassMaterial(config.secondary,.86,.09,.18,.52)} emissive={config.accent} emissiveIntensity={.08}/></mesh>
    {[0,.045,.09,.135].map((d,i)=><mesh key={i} position={[.07+d*.22,-.14-d*.12,0]} rotation={[0,0,-.32+i*.08]}><capsuleGeometry args={[.014,.16-i*.012,6,10]}/><meshPhysicalMaterial {...glassMaterial(config.secondary,.82,.1,.2,.5)}/></mesh>)}
  </group>;
}

function Foot({side,config}){
  return <group position={[side*.31,-2.31*(config.legLength||1),.12]}>
    <mesh position={[side*.04,-.02,.08]} rotation={[0,0,side*.03]} scale={[.18,.08,.34]}><sphereGeometry args={[1,24,18]}/><meshPhysicalMaterial {...glassMaterial(config.secondary,.9,.08,.25,.5)} emissive={config.accent} emissiveIntensity={.06}/></mesh>
  </group>;
}

function Eye({side,config,blinkRef}){
  const g=useRef();
  const s=side; const size=config.eyeSize||1;
  useFrame(()=>{if(g.current)g.current.scale.set(size,size*Math.max(.06,blinkRef.current),size)});
  return <group ref={g} position={[s*.39,.15,.87]}>
    <mesh><sphereGeometry args={[.23,40,32]}/><meshPhysicalMaterial color="#f4f7ff" roughness={.08} clearcoat={1} transmission={.06}/></mesh>
    <mesh position={[0,0,.205]}><sphereGeometry args={[.135,36,30]}/><meshPhysicalMaterial color={config.eyeColor||'#7f6cff'} roughness={.08} clearcoat={1} metalness={.15} emissive={config.eyeColor||'#7f6cff'} emissiveIntensity={.18}/></mesh>
    <mesh position={[0,0,.315]}><sphereGeometry args={[.066,32,24]}/><meshStandardMaterial color="#090716" roughness={.16}/></mesh>
    <mesh position={[-.035,.055,.36]}><sphereGeometry args={[.026,20,16]}/><meshBasicMaterial color="#ffffff"/></mesh>
    {config.gender==='female' && <group position={[0,.22,.1]}>{[-.11,-.045,.025,.09].map((x,i)=><mesh key={i} position={[x,0,0]} rotation={[0,0,-.22+x]}><capsuleGeometry args={[.008,.09,4,8]}/><meshStandardMaterial color="#dcbcff" emissive="#8a63ff" emissiveIntensity={.3}/></mesh>)}</group>}
  </group>;
}

function Hair({config}){
  if(!config.hair || config.hairStyle==='none') return null;
  const ref=useRef();
  useFrame(({clock})=>{if(ref.current){ref.current.rotation.z=.02*Math.sin(clock.elapsedTime*.47);ref.current.rotation.y=.025*Math.sin(clock.elapsedTime*.33)}});
  const curl=[[-.36,.82,.46],[-.14,1.08,.38],[.18,1.18,.3],[.42,1.09,.2],[.62,.88,.08],[.55,.65,-.02],[.35,.58,.02]];
  return <group ref={ref}><Tube points={curl} radius={.095} color={config.hairColor||config.secondary} opacity={.9}/><Tube points={curl.map(([x,y,z])=>[x+.035,y+.04,z+.05])} radius={.035} color={config.accent} opacity={.75}/></group>;
}

function Mustache({config}){
  if(!config.mustache) return null;
  const c=config.mustacheColor||config.secondary;
  const left=[[-.03,-.19,.94],[-.22,-.14,.96],[-.46,-.17,.93],[-.69,-.1,.84],[-.83,.01,.72],[-.77,.11,.63]];
  const right=left.map(([x,y,z])=>[-x,y,z]);
  return <group><Tube points={left} radius={.085} color={c} opacity={.92}/><Tube points={right} radius={.085} color={c} opacity={.92}/><Tube points={left.map(([x,y,z])=>[x,y+.035,z+.03])} radius={.028} color={config.accent} opacity={.75}/><Tube points={right.map(([x,y,z])=>[x,y+.035,z+.03])} radius={.028} color={config.accent} opacity={.75}/></group>;
}

function OrbCore({config,state,audioLevel}){
  const group=useRef(), shell=useRef(), inner=useRef(), energy=useRef();
  const blinkState=useRef({next:3+Math.random()*4,until:0,double:false});
  const blinkValue=useRef(1);
  const amp=Math.max(.05,Math.min(1,audioLevel||0));
  useFrame(({clock},delta)=>{
    const t=clock.elapsedTime; if(!group.current)return;
    const breath=Math.sin((t/5.1)*Math.PI*2)*.5+.5;
    const sx=1+breath*.016, sy=1+breath*.010;
    group.current.scale.set(sx,sy,sx);
    group.current.position.y=.025*Math.sin(t*.73);
    group.current.rotation.z=THREE.MathUtils.degToRad(.72*Math.sin(t*.31));
    if(shell.current){shell.current.rotation.y=t*.045;shell.current.rotation.x=.02*Math.sin(t*.21);}
    const stateBoost=state==='speaking' ? amp*.48 : state==='listening' ? amp*.23 : state==='thinking' ? .14 : 0;
    if(inner.current){inner.current.scale.setScalar(1+breath*.02+stateBoost*.07);inner.current.material.emissiveIntensity=.18+breath*.08+stateBoost*.8;inner.current.rotation.y=t*(state==='thinking' ? .22 : .06);inner.current.rotation.z=t*(state==='thinking' ? .11 : .025)}
    if(energy.current){energy.current.visible=['speaking','listening','thinking'].includes(state);energy.current.scale.setScalar(.58+stateBoost*.6+Math.sin(t*3.2)*.025);energy.current.material.emissiveIntensity=.35+stateBoost*1.8;energy.current.rotation.y=t*.42;energy.current.rotation.x=t*.19;}
    const b=blinkState.current;
    if(t>b.next){b.until=t+.13;b.next=t+3+Math.random()*4;b.double=Math.random()<.16;}
    let target=t<b.until ? .06 : 1;
    if(b.double && t>b.until+.12 && t<b.until+.25) target=.06;
    blinkValue.current=THREE.MathUtils.damp(blinkValue.current,target,34,delta);
  });
  return <group ref={group}>
    <mesh ref={shell}><sphereGeometry args={[1,96,96]}/><meshPhysicalMaterial {...glassMaterial(config.primary,config.opacity||.78,.045,.12,.83)} thickness={2.4} ior={1.38} clearcoat={1} clearcoatRoughness={.02} attenuationColor={config.secondary} attenuationDistance={1.7}/></mesh>
    <mesh ref={inner} scale={.9}><sphereGeometry args={[1,72,72]}/><meshPhysicalMaterial color={config.secondary} transparent opacity={.17} roughness={.14} transmission={.25} emissive={config.accent} emissiveIntensity={.24}/></mesh>
    <mesh ref={energy} scale={.58}><icosahedronGeometry args={[1,5]}/><meshPhysicalMaterial color={config.accent} transparent opacity={.20} roughness={.1} transmission={.35} emissive={config.accent} emissiveIntensity={.8}/></mesh>
    <mesh position={[-.34,.48,.72]} scale={[.42,.13,.12]} rotation={[0,0,-.26]}><sphereGeometry args={[1,40,24]}/><meshBasicMaterial color="#ffffff" transparent opacity={.32}/></mesh>
    {config.eyes && config.eyeStyle!=='none' && <><Eye side={-1} config={config} blinkRef={blinkValue}/><Eye side={1} config={config} blinkRef={blinkValue}/></>}
    {config.mouth && <mesh position={[0,-.37,.94]} scale={[.20,.035,.03]}><sphereGeometry args={[1,30,16]}/><meshPhysicalMaterial color="#ffb0dd" emissive="#ff70cf" emissiveIntensity={.22} roughness={.14} clearcoat={1}/></mesh>}
    <Hair config={config}/><Mustache config={config}/>
  </group>;
}

function Scene({config,state,audioLevel}){
  return <>
    <ambientLight intensity={.42}/><directionalLight position={[0,3,5]} intensity={2.2} color="#dff8ff"/><pointLight position={[-4,1,3]} intensity={30} distance={9} color="#19dfff"/><pointLight position={[4,1,2]} intensity={28} distance={9} color="#b04cff"/><pointLight position={[0,-3,2]} intensity={18} distance={7} color="#ff5dbd"/>
    <Float speed={.6} rotationIntensity={.04} floatIntensity={.08}><group position={[0,.78,0]}><OrbCore config={config} state={state} audioLevel={audioLevel}/><Limb side={-1} kind="arm" config={config}/><Limb side={1} kind="arm" config={config}/><Limb side={-1} kind="leg" config={config}/><Limb side={1} kind="leg" config={config}/></group></Float>
    <mesh position={[0,-2.45,-.35]} rotation={[-Math.PI/2,0,0]} scale={[2.7,2.7,1]}><circleGeometry args={[1,64]}/><meshBasicMaterial color={config.secondary} transparent opacity={.065}/></mesh>
  </>;
}

export function LivingOrb({config,state='idle',audioLevel=.12}){
  return <div className="livingOrbCanvas" aria-label="Living Orb 3D"><Canvas camera={{position:[0,.1,6.1],fov:37}} dpr={[1,2]} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}}><Scene config={config} state={state} audioLevel={audioLevel}/></Canvas></div>;
}
