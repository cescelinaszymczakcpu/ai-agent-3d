'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useMemo, useRef } from 'react';

export const hairStyles=['elegant-curl','short-wave','long-wave','light-bun','none'];
export const eyeStyles=['cinematic','soft','minimal','light-only','none'];
export const mustacheStyles=['classic','wide-curl','soft-curl'];
export const voicePresets=['liquid-wave','aurora','ripple','energy-ring','neural-flow','calm-medical'];

export const presets={
  femaleAurora:{name:'Female Aurora',gender:'female',primary:'#19d9ff',secondary:'#765cff',accent:'#ff6fd8',opacity:.8,glow:.78,glass:.94,limbWidth:.62,armLength:1,legLength:1,eyes:true,eyeStyle:'cinematic',eyeColor:'#8d72ff',eyeSize:1.08,hair:true,hairStyle:'elegant-curl',hairColor:'#9a6cff',mustache:false,mustacheStyle:'classic',mustacheColor:'#785cff',beard:false,mouth:true,voicePreset:'liquid-wave'},
  maleAzure:{name:'Male Azure',gender:'male',primary:'#16d9ff',secondary:'#665cff',accent:'#ff72bf',opacity:.8,glow:.76,glass:.94,limbWidth:.65,armLength:1,legLength:1,eyes:true,eyeStyle:'cinematic',eyeColor:'#6f7dff',eyeSize:1.02,hair:false,hairStyle:'none',hairColor:'#6a6cff',mustache:true,mustacheStyle:'wide-curl',mustacheColor:'#795cff',beard:false,mouth:true,voicePreset:'liquid-wave'},
  maleNoMustache:{name:'Male No Mustache',gender:'male',primary:'#18cfff',secondary:'#7f61ff',accent:'#f47ccb',opacity:.82,glow:.7,glass:.95,limbWidth:.62,armLength:1,legLength:1,eyes:true,eyeStyle:'soft',eyeColor:'#7a73ff',eyeSize:1,hair:false,hairStyle:'none',hairColor:'#765cff',mustache:false,mustacheStyle:'classic',mustacheColor:'#765cff',beard:false,mouth:true,voicePreset:'aurora'},
  neutral:{name:'Neutral Orb',gender:'neutral',primary:'#39e8ff',secondary:'#836cff',accent:'#ff80da',opacity:.82,glow:.68,glass:.96,limbWidth:.58,armLength:1,legLength:1,eyes:false,eyeStyle:'none',eyeColor:'#ffffff',eyeSize:1,hair:false,hairStyle:'none',hairColor:'#ffffff',mustache:false,mustacheStyle:'classic',mustacheColor:'#ffffff',beard:false,mouth:false,voicePreset:'neural-flow'}
};

function physicalGlass(color,opacity=.88){
  return {color,transparent:true,opacity,roughness:.06,metalness:.12,transmission:.72,thickness:.75,ior:1.42,clearcoat:1,clearcoatRoughness:.025,envMapIntensity:1.55};
}

function curveGeometry(points,radius=.035,tubular=96){
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),tubular,radius,14,false);
}

function GlassCurve({points,radius=.035,color='#8b6cff',opacity=.9,emissive=.12}){
  const geometry=useMemo(()=>curveGeometry(points,radius),[points,radius]);
  return <mesh geometry={geometry}><meshPhysicalMaterial {...physicalGlass(color,opacity)} emissive={color} emissiveIntensity={emissive}/></mesh>;
}

function Joint({position,scale=[1,1,1],color}){
  return <mesh position={position} scale={scale}><sphereGeometry args={[.09,32,24]}/><meshPhysicalMaterial {...physicalGlass(color,.9)} emissive={color} emissiveIntensity={.08}/></mesh>;
}

function Arm({side,config}){
  const ref=useRef();
  const s=side;
  const armL=config.armLength||1;
  const radius=.047*(config.limbWidth||.62);
  const upper=[[s*1.0,.12,.03],[s*1.17,-.04,.02],[s*1.27,-.31,.03]];
  const lower=[[s*1.27,-.31,.03],[s*1.34,-.56*armL,.05],[s*1.43,-.79*armL,.09]];
  useFrame(({clock})=>{
    if(!ref.current)return;
    const t=clock.elapsedTime;
    ref.current.rotation.z=s*(.015*Math.sin(t*.74+s)+.006*Math.sin(t*.31));
    ref.current.position.y=.009*Math.sin(t*.82+s);
  });
  return <group ref={ref}>
    <GlassCurve points={upper} radius={radius*1.08} color={config.secondary}/>
    <Joint position={upper[2]} scale={[.8,.8,.8]} color={config.secondary}/>
    <GlassCurve points={lower} radius={radius*.88} color={config.primary}/>
    <Hand side={s} position={lower[2]} config={config}/>
  </group>;
}

function Hand({side,position,config}){
  const ref=useRef();
  useFrame(({clock})=>{if(ref.current) ref.current.rotation.z=side*(.14+.025*Math.sin(clock.elapsedTime*.9+side));});
  return <group ref={ref} position={position} scale={[side,1,1]}>
    <mesh scale={[.105,.145,.06]}><sphereGeometry args={[1,30,24]}/><meshPhysicalMaterial {...physicalGlass(config.secondary,.9)} emissive={config.accent} emissiveIntensity={.09}/></mesh>
    {[-.055,-.018,.02,.058].map((x,i)=><mesh key={i} position={[x,-.155-.012*i,.012]} rotation={[0,0,.08+(i-1.5)*.08]}><capsuleGeometry args={[.012,.125-.008*i,7,12]}/><meshPhysicalMaterial {...physicalGlass(config.primary,.9)}/></mesh>)}
    <mesh position={[-.1,-.055,.005]} rotation={[0,0,-.55]}><capsuleGeometry args={[.013,.095,7,12]}/><meshPhysicalMaterial {...physicalGlass(config.primary,.9)}/></mesh>
  </group>;
}

function Leg({side,config}){
  const ref=useRef();
  const s=side; const legL=config.legLength||1;
  const radius=.052*(config.limbWidth||.62);
  const thigh=[[s*.32,-.89,.01],[s*.34,-1.18*legL,.015],[s*.31,-1.48*legL,.025]];
  const shin=[[s*.31,-1.48*legL,.025],[s*.30,-1.83*legL,.05],[s*.28,-2.14*legL,.11]];
  useFrame(({clock})=>{if(ref.current){const t=clock.elapsedTime;ref.current.rotation.z=s*.006*Math.sin(t*.48+s);ref.current.position.y=.005*Math.sin(t*.64+s)}});
  return <group ref={ref}>
    <GlassCurve points={thigh} radius={radius*1.03} color={config.secondary}/>
    <Joint position={thigh[2]} scale={[.76,.76,.76]} color={config.secondary}/>
    <GlassCurve points={shin} radius={radius*.78} color={config.primary}/>
    <Foot side={s} position={shin[2]} config={config}/>
  </group>;
}

function Foot({side,position,config}){
  return <group position={position}>
    <mesh position={[side*.05,-.06,.12]} rotation={[0,0,side*.03]} scale={[.17,.075,.31]}><sphereGeometry args={[1,32,22]}/><meshPhysicalMaterial {...physicalGlass(config.secondary,.94)} emissive={config.accent} emissiveIntensity={.08}/></mesh>
    <mesh position={[side*.025,-.105,-.03]} scale={[.11,.06,.16]}><sphereGeometry args={[1,24,18]}/><meshPhysicalMaterial {...physicalGlass(config.primary,.9)}/></mesh>
  </group>;
}

function Eye({side,config,blinkRef}){
  const g=useRef();
  const pupil=useRef();
  const s=side; const size=config.eyeSize||1;
  useFrame(({clock})=>{
    const t=clock.elapsedTime;
    if(g.current) g.current.scale.set(size,size*Math.max(.055,blinkRef.current),size);
    if(pupil.current){pupil.current.position.x=.012*Math.sin(t*.53+s);pupil.current.position.y=.007*Math.sin(t*.41+s*.7)}
  });
  return <group ref={g} position={[s*.38,.14,.875]} rotation={[.02,-s*.035,0]}>
    <mesh scale={[1,.92,.58]}><sphereGeometry args={[.245,56,40]}/><meshPhysicalMaterial color="#f7f8ff" roughness={.045} clearcoat={1} clearcoatRoughness={.02} transmission={.04}/></mesh>
    <group ref={pupil}>
      <mesh position={[0,0,.158]} scale={[1,1,.45]}><sphereGeometry args={[.157,48,36]}/><meshPhysicalMaterial color={config.eyeColor||'#7f6cff'} roughness={.035} clearcoat={1} metalness={.08} emissive={config.eyeColor||'#7f6cff'} emissiveIntensity={.15}/></mesh>
      <mesh position={[0,0,.225]}><sphereGeometry args={[.078,40,30]}/><meshPhysicalMaterial color="#080817" roughness={.08} clearcoat={1}/></mesh>
      <mesh position={[-.045,.06,.277]}><sphereGeometry args={[.031,26,20]}/><meshBasicMaterial color="#ffffff"/></mesh>
      <mesh position={[.036,-.02,.264]}><sphereGeometry args={[.014,20,16]}/><meshBasicMaterial color="#bff7ff"/></mesh>
    </group>
    {config.gender==='female' && <group position={[0,.225,.08]}>{[-.11,-.055,.005,.065,.115].map((x,i)=><mesh key={i} position={[x,0,0]} rotation={[0,0,(i-2)*.09]}><capsuleGeometry args={[.006,.085+Math.abs(i-2)*.008,5,9]}/><meshPhysicalMaterial color="#e8cfff" emissive="#9e76ff" emissiveIntensity={.22} roughness={.15}/></mesh>)}</group>}
  </group>;
}

function Hair({config}){
  if(!config.hair || config.hairStyle==='none') return null;
  const ref=useRef();
  useFrame(({clock})=>{if(ref.current){const t=clock.elapsedTime;ref.current.rotation.z=.012*Math.sin(t*.43);ref.current.rotation.y=.018*Math.sin(t*.29);ref.current.position.y=.008*Math.sin(t*.37)}});
  const main=[[-.42,.75,.47],[-.33,.98,.49],[-.08,1.14,.42],[.22,1.18,.31],[.48,1.06,.19],[.64,.84,.08],[.61,.61,.02],[.43,.53,.08]];
  const strand2=main.map(([x,y,z],i)=>[x+.045,y+.035+(i%2)*.01,z+.035]);
  const strand3=main.map(([x,y,z],i)=>[x-.035,y-.02,z-.025+(i%3)*.008]);
  return <group ref={ref}>
    <GlassCurve points={main} radius={.085} color={config.hairColor||config.secondary} opacity={.94} emissive={.16}/>
    <GlassCurve points={strand2} radius={.033} color={config.accent} opacity={.82} emissive={.22}/>
    <GlassCurve points={strand3} radius={.024} color={config.primary} opacity={.75} emissive={.16}/>
    <mesh position={[.44,.58,.04]} scale={[.13,.08,.08]}><sphereGeometry args={[1,32,22]}/><meshPhysicalMaterial {...physicalGlass(config.hairColor||config.secondary,.86)} emissive={config.accent} emissiveIntensity={.12}/></mesh>
  </group>;
}

function Mustache({config}){
  if(!config.mustache) return null;
  const c=config.mustacheColor||config.secondary;
  const left=[[-.02,-.18,.945],[-.19,-.14,.965],[-.39,-.16,.94],[-.58,-.12,.88],[-.74,-.03,.77],[-.83,.08,.65],[-.79,.18,.58]];
  const right=left.map(([x,y,z])=>[-x,y,z]);
  const offset=(pts,dy,dz)=>pts.map(([x,y,z])=>[x,y+dy,z+dz]);
  return <group>
    <GlassCurve points={left} radius={.078} color={c} opacity={.95} emissive={.11}/><GlassCurve points={right} radius={.078} color={c} opacity={.95} emissive={.11}/>
    <GlassCurve points={offset(left,.032,.028)} radius={.027} color={config.accent} opacity={.84} emissive={.2}/><GlassCurve points={offset(right,.032,.028)} radius={.027} color={config.accent} opacity={.84} emissive={.2}/>
    <GlassCurve points={offset(left,-.025,-.018)} radius={.018} color={config.primary} opacity={.72} emissive={.14}/><GlassCurve points={offset(right,-.025,-.018)} radius={.018} color={config.primary} opacity={.72} emissive={.14}/>
  </group>;
}

function InternalLight({config,state,audioLevel}){
  const root=useRef(), a=useRef(), b=useRef(), ring=useRef();
  const amp=Math.max(.04,Math.min(1,audioLevel||0));
  useFrame(({clock})=>{
    const t=clock.elapsedTime;
    const speaking=state==='speaking', listening=state==='listening', thinking=state==='thinking';
    const boost=speaking?amp:listening?amp*.45:thinking?.26:.08;
    if(root.current){root.current.rotation.y=t*(thinking?.22:.045);root.current.rotation.z=.08*Math.sin(t*.19)}
    if(a.current){a.current.scale.set(1+.08*Math.sin(t*.73),.82+.07*Math.cos(t*.57),.92);a.current.material.emissiveIntensity=.42+boost*1.6}
    if(b.current){b.current.scale.set(.82+.1*Math.cos(t*.61),1+.09*Math.sin(t*.49),.9);b.current.material.emissiveIntensity=.34+boost*1.35}
    if(ring.current){ring.current.visible=speaking||listening||thinking;ring.current.rotation.x=t*.43;ring.current.rotation.y=t*.31;ring.current.scale.setScalar(.72+boost*.24+.025*Math.sin(t*3.4));ring.current.material.emissiveIntensity=.35+boost*1.9}
  });
  return <group ref={root}>
    <mesh ref={a} position={[-.22,.06,-.05]} scale={[1,.82,.92]}><sphereGeometry args={[.63,48,40]}/><meshPhysicalMaterial color={config.primary} transparent opacity={.12} roughness={.22} transmission={.2} emissive={config.primary} emissiveIntensity={.42}/></mesh>
    <mesh ref={b} position={[.24,-.11,.03]} scale={[.82,1,.9]}><sphereGeometry args={[.58,48,40]}/><meshPhysicalMaterial color={config.secondary} transparent opacity={.12} roughness={.22} transmission={.2} emissive={config.accent} emissiveIntensity={.34}/></mesh>
    <mesh ref={ring} rotation={[.6,.2,.1]}><torusKnotGeometry args={[.37,.045,128,20,2,3]}/><meshPhysicalMaterial color={config.accent} transparent opacity={.25} roughness={.1} transmission={.3} emissive={config.accent} emissiveIntensity={.55}/></mesh>
    <pointLight color={config.primary} intensity={2.4} distance={2.4}/><pointLight position={[.28,-.18,.2]} color={config.accent} intensity={1.7} distance={2}/>
  </group>;
}

function Orb({config,state,audioLevel,blinkRef}){
  const shell=useRef(), sheen=useRef();
  useFrame(({clock})=>{const t=clock.elapsedTime;if(shell.current){shell.current.rotation.y=t*.025;shell.current.rotation.x=.015*Math.sin(t*.18)}if(sheen.current){sheen.current.position.x=-.28+.05*Math.sin(t*.27);sheen.current.position.y=.43+.025*Math.sin(t*.21)}});
  return <group>
    <InternalLight config={config} state={state} audioLevel={audioLevel}/>
    <mesh ref={shell}>
      <sphereGeometry args={[1,128,128]}/>
      <MeshTransmissionMaterial color={config.primary} transmission={.97} thickness={1.35} roughness={.035} chromaticAberration={.13} anisotropy={.12} distortion={.13} distortionScale={.16} temporalDistortion={.05} ior={1.36} backside={true} samples={6} resolution={256}/>
    </mesh>
    <mesh scale={1.015}><sphereGeometry args={[1,96,96]}/><meshPhysicalMaterial color={config.secondary} transparent opacity={.055} roughness={.08} metalness={.08} clearcoat={1} clearcoatRoughness={.02} side={THREE.BackSide}/></mesh>
    <mesh ref={sheen} position={[-.28,.43,.77]} rotation={[0,0,-.28]} scale={[.43,.115,.08]}><sphereGeometry args={[1,40,24]}/><meshBasicMaterial color="#ffffff" transparent opacity={.42}/></mesh>
    <mesh position={[.55,-.38,.7]} scale={[.24,.07,.05]} rotation={[0,0,.42]}><sphereGeometry args={[1,32,20]}/><meshBasicMaterial color="#ffb4df" transparent opacity={.18}/></mesh>
    {config.eyes && config.eyeStyle!=='none' && <><Eye side={-1} config={config} blinkRef={blinkRef}/><Eye side={1} config={config} blinkRef={blinkRef}/></>}
    {config.mouth && <group position={[0,-.36,.94]}><mesh scale={[.18,.045,.028]}><sphereGeometry args={[1,36,20]}/><meshPhysicalMaterial color="#ffb7dd" roughness={.09} clearcoat={1} emissive="#ff6fcf" emissiveIntensity={.12}/></mesh><mesh position={[0,.018,.028]} scale={[.09,.012,.008]}><sphereGeometry args={[1,24,16]}/><meshBasicMaterial color="#ffe8f6" transparent opacity={.55}/></mesh></group>}
    <Hair config={config}/><Mustache config={config}/>
  </group>;
}

function Character({config,state,audioLevel}){
  const root=useRef(), orbGroup=useRef();
  const blinkState=useRef({next:3+Math.random()*4,until:0,double:false});
  const blinkValue=useRef(1);
  useFrame(({clock},delta)=>{
    const t=clock.elapsedTime;
    const phase=(Math.sin((t/5.2)*Math.PI*2-Math.PI/2)+1)/2;
    if(root.current){root.current.position.y=.035*Math.sin(t*.68);root.current.rotation.z=THREE.MathUtils.degToRad(.55*Math.sin(t*.27));root.current.scale.set(1+phase*.006,1+phase*.004,1+phase*.006)}
    if(orbGroup.current){orbGroup.current.scale.set(1+phase*.014,1+phase*.009,1+phase*.014)}
    const b=blinkState.current;
    if(t>b.next){b.until=t+.11+Math.random()*.04;b.next=t+3+Math.random()*4;b.double=Math.random()<.15;}
    let target=t<b.until?.055:1;
    if(b.double&&t>b.until+.12&&t<b.until+.23)target=.055;
    blinkValue.current=THREE.MathUtils.damp(blinkValue.current,target,38,delta);
  });
  return <group ref={root} position={[0,.7,0]}>
    <group ref={orbGroup}><Orb config={config} state={state} audioLevel={audioLevel} blinkRef={blinkValue}/></group>
    <Arm side={-1} config={config}/><Arm side={1} config={config}/><Leg side={-1} config={config}/><Leg side={1} config={config}/>
  </group>;
}

function Scene({config,state,audioLevel}){
  return <>
    <color attach="background" args={['#05060b']}/>
    <ambientLight intensity={.28}/>
    <directionalLight position={[0,3.5,5]} intensity={2.7} color="#e8fbff"/>
    <pointLight position={[-3.8,1.8,2.8]} intensity={34} distance={8} color="#18dcff"/>
    <pointLight position={[3.8,1.2,2.4]} intensity={31} distance={8} color="#a34dff"/>
    <pointLight position={[0,-2.8,2]} intensity={19} distance={7} color="#ff61bd"/>
    <Environment resolution={256}>
      <Lightformer form="rect" intensity={4} color="#dffbff" position={[-2,3,4]} scale={[3,1,1]}/>
      <Lightformer form="rect" intensity={3} color="#7a4cff" position={[3,1,2]} rotation={[0,-.8,0]} scale={[2,3,1]}/>
      <Lightformer form="ring" intensity={2.2} color="#ff69c7" position={[0,-2,1]} scale={2}/>
    </Environment>
    <Character config={config} state={state} audioLevel={audioLevel}/>
    <ContactShadows position={[0,-1.72,0]} opacity={.34} scale={5} blur={2.8} far={5}/>
  </>;
}

export function LivingOrb({config,state='idle',audioLevel=.12}){
  return <div className="livingOrbCanvas" aria-label="Living Orb 3D"><Canvas camera={{position:[0,.05,6.35],fov:35}} dpr={[1,2]} gl={{antialias:true,alpha:false,powerPreference:'high-performance'}}><Scene config={config} state={state} audioLevel={audioLevel}/></Canvas></div>;
}
