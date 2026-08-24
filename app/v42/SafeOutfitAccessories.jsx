"use client";

import React,{useMemo,useRef} from "react";
import * as THREE from "three";
import {useFrame} from "@react-three/fiber";

const CENTER_Y=.35;
const R=1.715;
const CLEAR=.075;

function clamp01(v){return THREE.MathUtils.clamp(v,0,1)}
function smooth01(v){const t=clamp01(v);return t*t*(3-2*t)}
function breath(t,period=5.2){const c=(t%period)/period;if(c<.34)return smooth01(c/.34);if(c<.40)return 1;if(c<.88)return 1-smooth01((c-.40)/.48);return Math.sin(((c-.88)/.12)*Math.PI)*.018}

function OutfitMaterial({color="#8B80FF",opacity=.68,accent=false}){
 return <meshPhysicalMaterial side={THREE.DoubleSide} color={color} transparent opacity={accent?.82:opacity} transmission={accent?.64:.78} thickness={.16} roughness={accent?.07:.10} metalness={.01} clearcoat={1} clearcoatRoughness={.025} ior={1.45} iridescence={.88} envMapIntensity={1.30} emissive={color} emissiveIntensity={accent?.035:.015} depthWrite={false}/>;
}

function frontZ(x,y,clearance=CLEAR){
 const dy=y-CENTER_Y;
 return Math.sqrt(Math.max(0,R*R-x*x-dy*dy))+clearance;
}
function backZ(x,y,clearance=CLEAR){return -frontZ(x,y,clearance)}

function panelGeometry(side=1,{yBottom=-.42,yTop=.90,outer=.88,innerBottom=.10,innerTop=.44,clearance=.075}={}){
 const rows=18,cols=5,verts=[],indices=[];
 for(let j=0;j<=rows;j+=1){
  const u=j/rows,y=THREE.MathUtils.lerp(yBottom,yTop,u);
  const inner=THREE.MathUtils.lerp(innerBottom,innerTop,u);
  for(let i=0;i<=cols;i+=1){
   const v=i/cols;
   const ax=THREE.MathUtils.lerp(inner,outer,v),x=side*ax,z=frontZ(x,y,clearance);
   verts.push(x,y,z);
  }
 }
 const idx=(j,i)=>j*(cols+1)+i;
 for(let j=0;j<rows;j+=1)for(let i=0;i<cols;i+=1){indices.push(idx(j,i),idx(j+1,i),idx(j,i+1),idx(j,i+1),idx(j+1,i),idx(j+1,i+1))}
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

function edgeCurve(side=1,{yBottom=-.42,yTop=.90,xFn=()=>.5,clearance=.09}={}){
 const pts=[];for(let i=0;i<=24;i+=1){const u=i/24,y=THREE.MathUtils.lerp(yBottom,yTop,u),x=side*xFn(u),z=frontZ(x,y,clearance);pts.push(new THREE.Vector3(x,y,z))}return new THREE.CatmullRomCurve3(pts,false,"centripetal");
}

function waistCurve(y=-.48,clearance=.10,back=false){
 const pts=[];
 for(let i=0;i<84;i+=1){const a=i/84*Math.PI*2,x=Math.cos(a)*.98,zsign=Math.sin(a),dy=y-CENTER_Y,rad=Math.sqrt(Math.max(.01,R*R-dy*dy)),z=zsign*rad*.92;const p=new THREE.Vector3(x,y,z);const radial=new THREE.Vector3(p.x,p.y-CENTER_Y,p.z).normalize().multiplyScalar(clearance);p.add(radial);pts.push(p)}
 return new THREE.CatmullRomCurve3(pts,true,"centripetal");
}

function capeGeometry(){
 const rows=18,cols=18,verts=[],indices=[];
 for(let j=0;j<=rows;j+=1){const u=j/rows,y=THREE.MathUtils.lerp(-.20,1.02,u);for(let i=0;i<=cols;i+=1){const v=i/cols,a=THREE.MathUtils.lerp(-1.18,1.18,v);const x=Math.sin(a)*1.08*(.88+.12*u);const zz=backZ(x,y,.11)-(.08+.10*(1-u));verts.push(x,y,zz)}}
 const idx=(j,i)=>j*(cols+1)+i;for(let j=0;j<rows;j+=1)for(let i=0;i<cols;i+=1){indices.push(idx(j,i),idx(j,i+1),idx(j+1,i),idx(j,i+1),idx(j+1,i+1),idx(j+1,i))}
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

function collarCurve(side=1){
 const pts=[
  new THREE.Vector3(side*.82,.98,frontZ(side*.82,.98,.10)),
  new THREE.Vector3(side*.60,.76,frontZ(side*.60,.76,.11)),
  new THREE.Vector3(side*.36,.48,frontZ(side*.36,.48,.12)),
  new THREE.Vector3(side*.16,.20,frontZ(side*.16,.20,.13)),
 ];
 return new THREE.CatmullRomCurve3(pts,false,"centripetal");
}

function FormalCollar({color}){
 const left=useMemo(()=>collarCurve(-1),[]),right=useMemo(()=>collarCurve(1),[]);
 return <group>
  <mesh><tubeGeometry args={[left,72,.075,12,false]}/><OutfitMaterial color={color} accent/></mesh>
  <mesh><tubeGeometry args={[right,72,.075,12,false]}/><OutfitMaterial color={color} accent/></mesh>
  <mesh position={[0,.18,frontZ(0,.18,.14)]} scale={[.15,.11,.065]} rotation={[0,0,Math.PI/4]}><octahedronGeometry args={[1,2]}/><OutfitMaterial color="#FFD37B" accent/></mesh>
 </group>;
}

function GlassVest({color}){
 const left=useMemo(()=>panelGeometry(-1),[]),right=useMemo(()=>panelGeometry(1),[]);
 const leftOuter=useMemo(()=>edgeCurve(-1,{xFn:()=>.89}),[]),rightOuter=useMemo(()=>edgeCurve(1,{xFn:()=>.89}),[]);
 const leftInner=useMemo(()=>edgeCurve(-1,{xFn:u=>THREE.MathUtils.lerp(.10,.44,u),clearance:.10}),[]),rightInner=useMemo(()=>edgeCurve(1,{xFn:u=>THREE.MathUtils.lerp(.10,.44,u),clearance:.10}),[]);
 return <group>
  <mesh geometry={left}><OutfitMaterial color={color}/></mesh><mesh geometry={right}><OutfitMaterial color={color}/></mesh>
  {[leftOuter,rightOuter,leftInner,rightInner].map((c,i)=><mesh key={i}><tubeGeometry args={[c,86,i<2?.035:.025,10,false]}/><OutfitMaterial color={i%2?"#C187FF":"#74E9FF"} accent/></mesh>)}
  <FormalCollar color={color}/>
 </group>;
}

function Capelet({color}){
 const cape=useMemo(()=>capeGeometry(),[]),neck=useMemo(()=>waistCurve(.92,.11),[]);
 return <group>
  <mesh geometry={cape}><OutfitMaterial color={color} opacity={.58}/></mesh>
  <mesh><tubeGeometry args={[neck,110,.055,12,true]}/><OutfitMaterial color="#DDF9FF" accent/></mesh>
  <mesh position={[0,.87,-1.52]} scale={[.13,.13,.09]}><sphereGeometry args={[1,24,18]}/><OutfitMaterial color="#FF86CE" accent/></mesh>
 </group>;
}

function WaistSash({color}){
 const outer=useMemo(()=>waistCurve(-.50,.115),[]),inner=useMemo(()=>waistCurve(-.50,.070),[]);
 return <group>
  <mesh><tubeGeometry args={[outer,132,.075,14,true]}/><OutfitMaterial color={color} accent/></mesh>
  <mesh><tubeGeometry args={[inner,132,.026,10,true]}/><OutfitMaterial color="#E7FBFF"/></mesh>
  <mesh position={[0,-.50,frontZ(0,-.50,.18)]} scale={[.14,.105,.07]}><octahedronGeometry args={[1,2]}/><OutfitMaterial color="#FFD27B" accent/></mesh>
 </group>;
}

function OrbDress({color}){return <group><GlassVest color={color}/><WaistSash color="#FF82CE"/><Capelet color={color}/></group>}

export default function SafeOutfitAccessories({outfit=null}){
 const root=useRef();
 const type=outfit?.type||"none",color=outfit?.color||"#8B80FF";
 useFrame(frame=>{if(!root.current)return;const b=breath(frame.clock.elapsedTime),s=1+b*.012;root.current.scale.setScalar(s);root.current.rotation.y=Math.sin(frame.clock.elapsedTime*.24)*.002});
 if(type==="none")return null;
 return <group ref={root}>
  {type==="formal-collar"&&<FormalCollar color={color}/>} 
  {type==="glass-vest"&&<GlassVest color={color}/>} 
  {type==="capelet"&&<Capelet color={color}/>} 
  {type==="waist-sash"&&<WaistSash color={color}/>} 
  {type==="orb-dress"&&<OrbDress color={color}/>} 
 </group>;
}
