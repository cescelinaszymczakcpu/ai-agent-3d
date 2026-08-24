"use client";

import React,{useMemo,useRef} from "react";
import * as THREE from "three";
import {Canvas,useFrame,useThree} from "@react-three/fiber";
import {OrbitControls} from "@react-three/drei";
import SafeConversationalBody from "./SafeConversationalBody";
import SafeBowAccessories from "./SafeBowAccessories";
import SafeHatAccessories from "./SafeHatAccessories";
import SafeAudioAccessories from "./SafeAudioAccessories";

const EMOTIONS={
 neutral:{colors:["#24E7FF","#2867FF","#A347FF","#FF43C4"],speed:1,glow:1},
 happy:{colors:["#2CF4FF","#39DCC8","#FF57CC","#FFB47E"],speed:1.08,glow:1.12},
 caring:{colors:["#54E8F4","#637CFF","#C477FF","#FF8EAE"],speed:.90,glow:1.02},
 calm:{colors:["#65EAD9","#63B8FF","#9C8FFF","#DDA4FF"],speed:.82,glow:.92},
 curious:{colors:["#35F0FF","#406CFF","#A34DFF","#DC58FF"],speed:1.08,glow:1.06},
 excited:{colors:["#00F6FF","#425DFF","#CD38FF","#FF35A9"],speed:1.18,glow:1.16},
 sad:{colors:["#367AAE","#3859B8","#6550A8","#835B9D"],speed:.76,glow:.82},
 surprised:{colors:["#A8FAFF","#46BDFF","#B855FF","#FF75DF"],speed:1.16,glow:1.14},
 warning:{colors:["#FFBF44","#FF7A4A","#C454FF","#FF568D"],speed:1.04,glow:1.08},
 error:{colors:["#FF419C","#9E3DFF","#FF486A","#694AFF"],speed:1.10,glow:1.10}
};

function smooth01(x){const t=THREE.MathUtils.clamp(x,0,1);return t*t*(3-2*t);}
function livingBreath(time,period=5.2){const c=(time%period)/period;if(c<.34)return smooth01(c/.34);if(c<.40)return 1;if(c<.88)return 1-smooth01((c-.40)/.48);return Math.sin(((c-.88)/.12)*Math.PI)*.018;}

function CameraView({view="front"}){
 const {camera}=useThree();
 useFrame(()=>{
  const target=new THREE.Vector3(0,-.22,0);
  let dest=new THREE.Vector3(0,-.10,8.8);
  if(view==="left")dest.set(-8.8,-.10,0);
  else if(view==="right"||view==="side")dest.set(8.8,-.10,0);
  else if(view==="back")dest.set(0,-.10,-8.8);
  else if(view==="top")dest.set(0,9.1,.20);
  camera.position.lerp(dest,.10);
  camera.lookAt(target);
 });
 return null;
}

function LivingOrb({emotion="neutral",orbColors=null,colorFlowSpeed=.06}){
 const root=useRef();
 const shell=useRef();
 const energy=useRef();
 const halo=useRef();
 const lobes=useRef([]);
 const e=EMOTIONS[emotion]||EMOTIONS.neutral;
 const palette=useMemo(()=>orbColors?.length===4?orbColors:e.colors,[orbColors,e.colors]);
 const base=useMemo(()=>[
  new THREE.Vector3(-.42,.28,.12),
  new THREE.Vector3(.40,.22,-.10),
  new THREE.Vector3(-.18,-.34,.18),
  new THREE.Vector3(.30,-.26,.10)
 ],[]);

 useFrame((frame,delta)=>{
  const t=frame.clock.elapsedTime;
  const b=livingBreath(t*e.speed,5.2);
  if(root.current){const s=1+b*.012;root.current.scale.set(s*1.001,s*1.003,s);root.current.rotation.z=Math.sin(t*.22)*.004;}
  if(shell.current){shell.current.rotation.y=t*.018;shell.current.rotation.x=Math.sin(t*.16)*.006;}
  if(energy.current){energy.current.rotation.y=t*(.10+colorFlowSpeed*.75);energy.current.rotation.z=Math.sin(t*.18)*.06;}
  if(halo.current){const hs=1.01+b*.035;halo.current.scale.setScalar(hs);halo.current.material.opacity=.018+b*.018;}
  lobes.current.forEach((m,i)=>{if(!m)return;const p=base[i];const phase=t*(.28+colorFlowSpeed*2.6)+i*1.57;m.position.set(p.x+Math.sin(phase+i)*.24,p.y+Math.cos(phase*.88+i*.7)*.22,p.z+Math.sin(phase*.72+i*1.2)*.20);const s=.78+b*.08+Math.sin(phase*1.15+i)*.08;m.scale.set(s*(i%2?1.08:.94),s*(i%2?.92:1.08),s);m.material.opacity=THREE.MathUtils.lerp(m.material.opacity,.22+b*.045,Math.min(1,delta*5));});
 });

 return <group ref={root} position={[0,.35,0]}>
  <group ref={energy}>
   {palette.map((color,i)=><mesh key={`${color}-${i}`} ref={el=>{lobes.current[i]=el}} position={base[i]}>
    <sphereGeometry args={[1.03,48,48]}/>
    <meshBasicMaterial color={color} transparent opacity={.22} depthWrite={false} blending={THREE.AdditiveBlending}/>
   </mesh>)}
   <mesh scale={.72}><sphereGeometry args={[1.18,48,48]}/><meshBasicMaterial color="#F5FBFF" transparent opacity={.08} depthWrite={false} blending={THREE.AdditiveBlending}/></mesh>
  </group>
  <mesh ref={shell}><sphereGeometry args={[1.68,72,72]}/><meshPhysicalMaterial color="#F5FBFF" transparent opacity={.34} transmission={.92} thickness={.62} roughness={.07} metalness={0} clearcoat={1} clearcoatRoughness={.025} ior={1.45} envMapIntensity={1.1} emissive={palette[0]} emissiveIntensity={.02*e.glow} depthWrite={false}/></mesh>
  <mesh ref={halo} scale={1.01}><sphereGeometry args={[1.68,48,48]}/><meshBasicMaterial color={palette[2]} transparent opacity={.018} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending}/></mesh>
  <pointLight position={[0,.15,1.3]} color={palette[0]} intensity={1.9*e.glow} distance={5}/>
  <pointLight position={[.8,-.3,-.8]} color={palette[3]} intensity={1.5*e.glow} distance={4}/>
 </group>;
}

function Character({emotion,orbColors,colorFlowSpeed,state,audioLevel,audioBands,bow,hat,audio}){
 const root=useRef();
 useFrame(frame=>{if(root.current){const t=frame.clock.elapsedTime;root.current.position.y=Math.sin(t*.54)*.010;root.current.rotation.y=Math.sin(t*.18)*.007;}});
 return <group ref={root}>
  <LivingOrb emotion={emotion} orbColors={orbColors} colorFlowSpeed={colorFlowSpeed}/>
  <SafeConversationalBody state={state} audioLevel={audioLevel} audioBands={audioBands}/>
  <SafeBowAccessories bow={bow}/>
  <SafeHatAccessories hat={hat}/>
  <SafeAudioAccessories audio={audio}/>
 </group>;
}

function StudioLights(){return <>
 <ambientLight intensity={.42}/>
 <hemisphereLight intensity={.62} color="#DFF8FF" groundColor="#050914"/>
 <directionalLight position={[-4,5,5]} color="#DDF9FF" intensity={2.3}/>
 <directionalLight position={[4,2,2]} color="#E3A7FF" intensity={1.6}/>
 <pointLight position={[-3,-1,4]} color="#5AEAFF" intensity={2.2} distance={9}/>
 <pointLight position={[3,-1,3]} color="#FF79C9" intensity={1.9} distance={8}/>
 </>}

function Scene(props){return <>
 <color attach="background" args={["#020611"]}/>
 <StudioLights/>
 <CameraView view={props.view}/>
 <Character {...props}/>
 <OrbitControls target={[0,-.22,0]} enablePan={false} enableDamping dampingFactor={.08} minDistance={6.4} maxDistance={11}/>
 </>}

export function RealisticAccessoryModel(){return null;}

export default function LivingLumeniaOrb({emotion="neutral",view="front",colorFlowSpeed=.06,orbColors=null,state="idle",audioLevel=0,audioBands=null,bow=null,hat=null,audio=null,style={}}){
 return <div style={{width:"100%",height:"100%",minHeight:650,background:"#020611",overflow:"hidden",position:"relative",...style}}>
  <Canvas dpr={[1,1.5]} camera={{position:[0,-.10,8.8],fov:38,near:.1,far:40}} gl={{antialias:true,alpha:false,powerPreference:"high-performance"}} fallback={<div style={{width:"100%",height:"100%",minHeight:650,display:"grid",placeItems:"center",background:"#020611",color:"#DDF7FF",fontFamily:"system-ui"}}>3D renderer unavailable</div>} onCreated={({gl})=>{gl.setClearColor("#020611",1);gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.16;gl.outputColorSpace=THREE.SRGBColorSpace;gl.domElement.style.display="block";gl.domElement.style.background="#020611";}}>
   <Scene emotion={emotion} view={view} colorFlowSpeed={THREE.MathUtils.clamp(colorFlowSpeed,.01,.15)} orbColors={orbColors} state={state} audioLevel={THREE.MathUtils.clamp(audioLevel||0,0,1)} audioBands={audioBands} bow={bow} hat={hat} audio={audio}/>
  </Canvas>
 </div>;
}
