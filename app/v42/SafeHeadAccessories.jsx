"use client";

import React,{useMemo,useRef} from "react";
import * as THREE from "three";
import {useFrame} from "@react-three/fiber";

const R=1.715;
const HAIR_CLEARANCE={none:0,short:.060,"reference-curl":.135,"long-hair":.220};

function clamp01(v){return THREE.MathUtils.clamp(v,0,1)}
function smooth01(v){const t=clamp01(v);return t*t*(3-2*t)}
function breath(t,period=5.2){const c=(t%period)/period;if(c<.34)return smooth01(c/.34);if(c<.40)return 1;if(c<.88)return 1-smooth01((c-.40)/.48);return Math.sin(((c-.88)/.12)*Math.PI)*.018}

function Material({color="#9B84FF",opacity=.84,glow=false}){
 return <meshPhysicalMaterial side={THREE.DoubleSide} color={color} transparent opacity={opacity} transmission={glow?.55:.75} thickness={.17} roughness={glow?.10:.065} metalness={glow?.04:.01} clearcoat={1} clearcoatRoughness={.025} ior={1.45} iridescence={.88} envMapIntensity={1.30} emissive={color} emissiveIntensity={glow?.12:.02} depthWrite={false}/>;
}

function bandCurve(clearance=0){const pts=[];for(let i=0;i<=24;i+=1){const u=i/24,x=THREE.MathUtils.lerp(-1.47,1.47,u),y=Math.sqrt(Math.max(0,R*R-x*x))+.055+clearance,z=.03+.075*Math.sin(Math.PI*u);pts.push(new THREE.Vector3(x,y,z))}return new THREE.CatmullRomCurve3(pts,false,"centripetal")}
function haloCurve(y,rx=1.02,rz=.76){const pts=Array.from({length:84},(_,i)=>{const a=i/84*Math.PI*2;return new THREE.Vector3(Math.cos(a)*rx,y,Math.sin(a)*rz)});return new THREE.CatmullRomCurve3(pts,true,"centripetal")}
function crownBaseCurve(y,rad=.74){const pts=Array.from({length:84},(_,i)=>{const a=i/84*Math.PI*2;return new THREE.Vector3(Math.cos(a)*rad,y,Math.sin(a)*rad*.92)});return new THREE.CatmullRomCurve3(pts,true,"centripetal")}
function crownArch(angle,y,rad,height){const dir=new THREE.Vector3(Math.cos(angle),0,Math.sin(angle)*.92).normalize(),tangent=new THREE.Vector3(-Math.sin(angle),0,Math.cos(angle)).normalize(),base=dir.clone().multiplyScalar(rad);const pts=[base.clone().addScaledVector(tangent,-.12),base.clone().multiplyScalar(.90).setY(y+.20),base.clone().multiplyScalar(.68).setY(y+height*.68),base.clone().multiplyScalar(.42).setY(y+height),base.clone().multiplyScalar(.18).setY(y+height*.82)];return new THREE.CatmullRomCurve3(pts,false,"centripetal")}

function Headband({clearance,color}){const outer=useMemo(()=>bandCurve(clearance),[clearance]),inner=useMemo(()=>bandCurve(Math.max(0,clearance-.035)),[clearance]);return <group><mesh><tubeGeometry args={[outer,112,.050,12,false]}/><Material color={color}/></mesh><mesh><tubeGeometry args={[inner,112,.020,10,false]}/><Material color="#DDF9FF" opacity={.62}/></mesh><mesh position={[-1.47,.68,.03]} rotation={[0,0,-.12]}><capsuleGeometry args={[.050,.22,7,12]}/><Material color="#FF86CE"/></mesh><mesh position={[1.47,.68,.03]} rotation={[0,0,.12]}><capsuleGeometry args={[.050,.22,7,12]}/><Material color="#7DE9FF"/></mesh><mesh position={[0,R+.10+clearance,.10]} scale={[.105,.105,.075]}><sphereGeometry args={[1,28,20]}/><Material color="#FFD479" glow/></mesh></group>}

function Crown({clearance,color}){const y=1.48+clearance,base=useMemo(()=>crownBaseCurve(y,.76),[y]),inner=useMemo(()=>crownBaseCurve(y+.045,.70),[y]),arches=useMemo(()=>Array.from({length:7},(_,i)=>crownArch(i/7*Math.PI*2,y,.76,.58+(i%2)*.08)),[y]);return <group><mesh><tubeGeometry args={[base,120,.060,12,true]}/><Material color={color}/></mesh><mesh><tubeGeometry args={[inner,120,.025,10,true]}/><Material color="#DDF9FF" opacity={.64}/></mesh>{arches.map((curve,i)=><group key={i}><mesh><tubeGeometry args={[curve,70,.035,10,false]}/><Material color={i%2?"#C080FF":"#77E9FF"}/></mesh><mesh position={curve.getPoint(1).toArray()} scale={[.075,.095,.060]}><octahedronGeometry args={[1,2]}/><Material color={i%2?"#FF87CF":"#FFD77F"} glow/></mesh></group>)}<mesh position={[0,y+.73,0]} scale={[.095,.13,.095]}><octahedronGeometry args={[1,2]}/><Material color="#F5FBFF" glow/></mesh></group>}

function Halo({clearance,color}){const y=R+.34+clearance,outer=useMemo(()=>haloCurve(y,1.05,.79),[y]),inner=useMemo(()=>haloCurve(y-.018,.92,.69),[y]);return <group rotation={[.055,0,-.035]}><mesh><tubeGeometry args={[outer,132,.050,12,true]}/><Material color={color} glow/></mesh><mesh><tubeGeometry args={[inner,128,.018,9,true]}/><Material color="#E8FBFF" opacity={.58} glow/></mesh>{[0,Math.PI/2,Math.PI,Math.PI*1.5].map((a,i)=><mesh key={i} position={[Math.cos(a)*1.05,y,Math.sin(a)*.79]} scale={[.070,.070,.070]}><sphereGeometry args={[1,22,16]}/><Material color={i%2?"#FF8AD2":"#7DEBFF"} glow/></mesh>)}</group>}

function starGeometry(){
 const shape=new THREE.Shape();
 const outer=.30,inner=.13,points=5;
 for(let i=0;i<points*2;i+=1){const a=-Math.PI/2+i*Math.PI/points,r=i%2===0?outer:inner,x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y)}shape.closePath();
 const g=new THREE.ExtrudeGeometry(shape,{depth:.13,bevelEnabled:true,bevelSegments:5,bevelSize:.025,bevelThickness:.025,curveSegments:24,steps:1});g.center();g.computeVertexNormals();return g;
}

function Star({clearance,color}){
 const geometry=useMemo(()=>starGeometry(),[]);
 const y=1.38+clearance,z=Math.sqrt(Math.max(0,R*R-Math.pow(y,2)))+.12;
 return <group position={[-.72,y,z]} rotation={[-.18,.10,-.18]}>
  <mesh geometry={geometry}><Material color={color} glow/></mesh>
  <mesh scale={[.13,.13,.09]} position={[0,0,.02]}><octahedronGeometry args={[1,2]}/><Material color="#F6FCFF" glow/></mesh>
  <pointLight color={color} intensity={.55} distance={2.1}/>
 </group>;
}

function Petal({angle=0,r=.22,color="#FF8BD1"}){
 return <mesh position={[Math.cos(angle)*r,Math.sin(angle)*r,0]} rotation={[.08*Math.sin(angle),-.10*Math.cos(angle),angle]} scale={[.19,.09,.055]}><sphereGeometry args={[1,28,18]}/><Material color={color} glow/></mesh>;
}

function LightFlower({clearance,color}){
 const y=1.28+clearance,z=Math.sqrt(Math.max(0,R*R-Math.pow(y,2)))+.13;
 return <group position={[.78,y,z]} rotation={[-.15,-.08,.15]}>
  {Array.from({length:7},(_,i)=><Petal key={`a${i}`} angle={i/7*Math.PI*2} r={.24} color={i%2?color:"#FF8BD1"}/>)}
  {Array.from({length:5},(_,i)=><Petal key={`b${i}`} angle={i/5*Math.PI*2+.25} r={.14} color={i%2?"#7EEBFF":color}/>)}
  <mesh scale={[.105,.105,.085]}><sphereGeometry args={[1,28,20]}/><Material color="#FFD779" glow/></mesh>
  <mesh scale={[.040,.040,.14]} position={[0,0,-.12]}><cylinderGeometry args={[1,1,1,18]}/><Material color="#DDF9FF" opacity={.65}/></mesh>
  <pointLight color={color} intensity={.65} distance={2}/>
 </group>;
}

export default function SafeHeadAccessories({headAccessory=null}){
 const root=useRef(),type=headAccessory?.type||"none",clearance=HAIR_CLEARANCE[headAccessory?.hairStyle||"none"]??0,color=headAccessory?.color||"#9B84FF";
 useFrame(frame=>{if(!root.current)return;const b=breath(frame.clock.elapsedTime),s=1+b*.012;root.current.scale.setScalar(s);root.current.rotation.y=Math.sin(frame.clock.elapsedTime*.22)*.004});
 if(type==="none")return null;
 return <group ref={root} position={[0,.35,0]}>
  {type==="headband"&&<Headband clearance={clearance} color={color}/>} 
  {type==="crown"&&<Crown clearance={clearance} color={color}/>} 
  {type==="halo"&&<Halo clearance={clearance} color={color}/>} 
  {type==="star"&&<Star clearance={clearance} color={color}/>} 
  {type==="light-flower"&&<LightFlower clearance={clearance} color={color}/>} 
 </group>;
}
