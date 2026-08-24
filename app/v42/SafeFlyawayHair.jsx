"use client";

import React,{useMemo,useRef} from "react";
import * as THREE from "three";
import {useFrame} from "@react-three/fiber";

const MAX_RADIUS=1.715;
const CLEARANCE=.050;

function clamp01(v){return THREE.MathUtils.clamp(v,0,1)}
function smooth01(v){const t=clamp01(v);return t*t*(3-2*t)}
function breath(t,period=5.2){const c=(t%period)/period;if(c<.34)return smooth01(c/.34);if(c<.40)return 1;if(c<.88)return 1-smooth01((c-.40)/.48);return Math.sin(((c-.88)/.12)*Math.PI)*.018}

function HairMaterial({color="#8AEAFF",accent=false}){
 return <meshPhysicalMaterial color={color} transparent opacity={accent?.70:.78} transmission={accent?.58:.72} thickness={.14} roughness={.08} metalness={.01} clearcoat={1} clearcoatRoughness={.025} ior={1.45} iridescence={.88} envMapIntensity={1.25} emissive={color} emissiveIntensity={.018} depthWrite={false}/>;
}

function projectOutside(p,extra=0){
 const v=p.clone();
 const min=MAX_RADIUS+CLEARANCE+extra;
 const l=v.length();
 if(l<min){
  if(l<.0001)v.set(0,1,0);
  v.normalize().multiplyScalar(min);
 }
 return v;
}

function curveFrom(points,extra=0){
 return new THREE.CatmullRomCurve3(points.map(p=>projectOutside(new THREE.Vector3(...p),extra)),false,"centripetal");
}

function Strand({points,radius=.025,color="#83E9FF",extra=0}){
 const curve=useMemo(()=>curveFrom(points,extra),[points,extra]);
 return <mesh><tubeGeometry args={[curve,96,radius,10,false]}/><HairMaterial color={color}/></mesh>;
}

function Curl({side=1,phase=0,length=.92,y=1.28,z=.12,radius=.024,color="#B985FF"}){
 const pts=useMemo(()=>{
  const out=[];
  const anchor=new THREE.Vector3(side*1.36,y,z);
  for(let i=0;i<9;i+=1){
   const u=i/8;
   const ang=phase+u*Math.PI*2.15;
   const x=side*(1.40+u*.46)+Math.cos(ang)*.10;
   const yy=y-u*length+Math.sin(ang)*.12;
   const zz=z+Math.cos(ang*.82)*.14+u*.12;
   out.push([x,yy,zz]);
  }
  out[0]=[anchor.x,anchor.y,anchor.z];
  return out;
 },[side,phase,length,y,z]);
 return <Strand points={pts} radius={radius} color={color} extra={.025}/>;
}

function Ponytail({side=1,long=false,color="#8AEAFF"}){
 const points=useMemo(()=>[
  [side*1.47,.98,.04],
  [side*1.72,.94,.08],
  [side*1.96,.68,.12],
  [side*(long?2.10:1.98),.26,.18],
  [side*(long?1.98:1.82),long?-.22:.02,.24],
  [side*(long?2.16:1.96),long?-.58:-.24,.28],
 ],[side,long]);
 const tie=projectOutside(new THREE.Vector3(side*1.50,.98,.04),.06);
 return <group>
  <mesh position={tie.toArray()} scale={[.11,.13,.10]}><sphereGeometry args={[1,24,18]}/><HairMaterial color="#FF84CF" accent/></mesh>
  <Strand points={points} radius={long?.070:.060} color={color} extra={.035}/>
  <Strand points={points.map((p,i)=>[p[0]+side*.06,p[1]+(i%2?.035:-.02),p[2]-.045])} radius={long?.035:.032} color="#B98AFF" extra={.040}/>
  <Strand points={points.map((p,i)=>[p[0]-side*.05,p[1]-.025*i,p[2]+.055])} radius={long?.030:.028} color="#6FE9FF" extra={.042}/>
 </group>;
}

function HairSet({style="none",color="#83E9FF"}){
 if(style==="none")return null;
 if(style==="one-strand")return <Strand color={color} points={[[.22,1.72,.18],[.40,1.83,.22],[.55,1.70,.29],[.64,1.51,.33]]}/>;
 if(style==="two-strands")return <><Strand color={color} points={[[-.24,1.71,.18],[-.42,1.84,.24],[-.57,1.66,.30],[-.66,1.46,.34]]}/><Strand color="#B58AFF" points={[[.26,1.72,.17],[.44,1.85,.23],[.60,1.64,.31],[.70,1.43,.34]]}/></>;
 if(style==="three-strands")return <><Strand color="#73E9FF" points={[[-.34,1.67,.15],[-.54,1.82,.21],[-.70,1.61,.28],[-.76,1.38,.34]]}/><Strand color="#9C8BFF" points={[[0,1.78,.18],[.08,1.94,.24],[.18,1.76,.31],[.20,1.52,.37]]}/><Strand color="#CF79FF" points={[[.35,1.67,.15],[.56,1.82,.21],[.72,1.60,.29],[.79,1.37,.35]]}/></>;
 if(style==="side-strand")return <><Strand radius={.029} color={color} points={[[1.28,1.07,.10],[1.49,1.05,.17],[1.67,.80,.26],[1.72,.48,.34],[1.61,.21,.40]]}/><Strand radius={.020} color="#C587FF" points={[[1.37,.95,.07],[1.57,.85,.16],[1.73,.57,.23],[1.70,.30,.31]]}/></>;
 if(style==="soft-curls")return <><Curl side={-1} phase={.3} color="#72EBFF"/><Curl side={1} phase={1.4} color="#C383FF"/><Curl side={1} phase={2.2} length={.70} y={1.43} z={-.05} radius={.020} color="#FF87CF"/></>;
 if(style==="messy-strands")return <><Strand color="#70ECFF" points={[[-.86,1.42,.08],[-1.13,1.57,.12],[-1.35,1.46,.22],[-1.42,1.19,.30]]}/><Strand color="#8A9CFF" points={[[-.15,1.72,-.10],[-.32,1.94,-.04],[-.46,1.78,.08],[-.40,1.50,.20]]}/><Strand color="#C27EFF" points={[[.61,1.58,.04],[.86,1.76,.10],[1.11,1.60,.18],[1.25,1.32,.25]]}/><Strand color="#FF83CD" points={[[1.03,1.23,-.02],[1.30,1.30,.08],[1.48,1.07,.18],[1.50,.80,.28]]}/></>;
 if(style==="side-ponytail")return <Ponytail side={1} long color={color}/>;
 if(style==="twin-ponytails")return <><Ponytail side={-1} long color="#75E9FF"/><Ponytail side={1} long color="#C282FF"/></>;
 return null;
}

export function hairClearanceProfile(style="none"){
 if(style==="none")return "none";
 if(style==="soft-curls")return "reference-curl";
 if(style==="side-ponytail"||style==="twin-ponytails")return "long-hair";
 return "short";
}

export default function SafeFlyawayHair({hair=null}){
 const root=useRef();
 const style=hair?.style||"none";
 const color=hair?.color||"#83E9FF";
 useFrame(frame=>{
  if(!root.current)return;
  const t=frame.clock.elapsedTime;
  const b=breath(t,5.2);
  const s=1+b*.012;
  root.current.scale.setScalar(s);
  root.current.rotation.z=Math.sin(t*.38)*.006;
  root.current.rotation.y=Math.sin(t*.27)*.006;
 });
 if(style==="none")return null;
 return <group ref={root} position={[0,.35,0]}><HairSet style={style} color={color}/></group>;
}
