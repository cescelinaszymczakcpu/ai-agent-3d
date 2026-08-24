"use client";

import React,{useMemo} from "react";
import * as THREE from "three";

const ORB_CENTER=new THREE.Vector3(0,.35,0);
const MAX_BREATH_RADIUS=1.715;
const HAIR_CLEARANCE={none:0,short:.025,"reference-curl":.060,"long-hair":.095};

function EyewearMaterial({color="#80E9FF",mode="iridescent",opacity=.88,lens=false}){
 const modes={glass:[.91,.055,0,.30],"frosted-glass":[.58,.22,0,.22],iridescent:[.82,.065,.01,.95],holographic:[.67,.09,.10,.95],pearlescent:[.70,.13,.03,.58],"chrome-glass":[.44,.075,.26,.74]};
 const m=modes[mode]||modes.iridescent;
 return <meshPhysicalMaterial color={color} transparent opacity={lens?.26:opacity} transmission={lens?.95:m[0]} roughness={lens?.035:m[1]} metalness={lens?0:m[2]} thickness={lens?.08:.16} clearcoat={1} clearcoatRoughness={.02} ior={lens?1.48:1.45} iridescence={lens?.24:m[3]} envMapIntensity={1.35} emissive={color} emissiveIntensity={lens?.006:.018} depthWrite={false}/>;
}

function ringCurve(cx,cy,rx,ry,z,n=64){
 const pts=Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2;const squash=1-.035*Math.cos(a*2);return new THREE.Vector3(cx+Math.cos(a)*rx*squash,cy+Math.sin(a)*ry,z);});
 return new THREE.CatmullRomCurve3(pts,true,"centripetal");
}

function sphereSideX(y,z,clearance){
 const dy=y-ORB_CENTER.y;
 const inside=MAX_BREATH_RADIUS*MAX_BREATH_RADIUS-dy*dy-z*z;
 return (inside>0?Math.sqrt(inside):0)+clearance;
}

function makeTempleCurve(side,frameX,frameY,frontZ,clearance){
 const zs=[frontZ-.05,1.36,1.02,.66,.28,-.08];
 const pts=zs.map((z,i)=>{
  if(i===0)return new THREE.Vector3(side*frameX,frameY,z);
  const x=sphereSideX(frameY-.02*i,z,clearance+.02*i);
  return new THREE.Vector3(side*x,frameY-.02*i,z);
 });
 return new THREE.CatmullRomCurve3(pts,false,"centripetal");
}

function makeBridgeCurve(z){return new THREE.CatmullRomCurve3([new THREE.Vector3(-.17,.57,z),new THREE.Vector3(0,.62,z+.025),new THREE.Vector3(.17,.57,z)],false,"centripetal");}

function geometrySamples({frameZ,clearance}){
 const samples=[];
 for(const side of [-1,1]){
  const ring=ringCurve(side*.48,.58,.34,.30,frameZ,48);
  for(let i=0;i<48;i+=3)samples.push(ring.getPoint(i/48));
  const temple=makeTempleCurve(side,.80,.58,frameZ,clearance);
  for(let i=0;i<28;i+=2)samples.push(temple.getPoint(i/27));
 }
 const bridge=makeBridgeCurve(frameZ);
 for(let i=0;i<12;i+=1)samples.push(bridge.getPoint(i/11));
 return samples;
}

function resolveRoundPlacement(glasses={}){
 const scale=THREE.MathUtils.clamp(glasses.scale??1,.82,1.18);
 const hair=HAIR_CLEARANCE[glasses.hairStyle||"none"]??0;
 const y=.58+(glasses.offsetY||0);
 const x=THREE.MathUtils.clamp(glasses.offsetX||0,-.12,.12);
 const minFront=Math.sqrt(Math.max(0,MAX_BREATH_RADIUS*MAX_BREATH_RADIUS-Math.pow(y-ORB_CENTER.y,2)))+.085;
 let frameZ=Math.max(minFront,minFront+(glasses.offsetZ||0));
 const rotation=[THREE.MathUtils.clamp(glasses.rotationX||0,-.12,.12),THREE.MathUtils.clamp(glasses.rotationY||0,-.12,.12),THREE.MathUtils.clamp(glasses.rotationZ||0,-.12,.12)];
 const clearance=Math.max(.035,glasses.collisionRadius??.055)+hair;
 const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation,"XYZ"));
 for(let pass=0;pass<7;pass+=1){
  let worst=0;
  for(const p0 of geometrySamples({frameZ,clearance})){
   const local=p0.clone().sub(new THREE.Vector3(0,.58,frameZ));
   const p=local.multiplyScalar(scale).applyQuaternion(q).add(new THREE.Vector3(x,y,frameZ));
   const need=MAX_BREATH_RADIUS+clearance*.45-p.distanceTo(ORB_CENTER);
   if(need>worst)worst=need;
  }
  if(worst<=.001)break;
  frameZ+=worst+.018;
 }
 return {scale,position:[x,y,frameZ],rotation,frameZ,clearance};
}

function Lens({x,z,scale=1,material="iridescent"}){
 return <mesh position={[x,0,z]} rotation={[Math.PI/2,0,0]} scale={[.34*scale,.026*scale,.30*scale]}>
  <cylinderGeometry args={[1,1,1,48,1,false]}/>
  <EyewearMaterial color="#BDEFFF" mode={material} lens/>
 </mesh>;
}

export function PremiumRoundGlasses({glasses={}}){
 const p=resolveRoundPlacement(glasses);
 const material=glasses.material||"iridescent",color=glasses.color||"#80E9FF";
 const leftRing=useMemo(()=>ringCurve(-.48,0,.34,.30,0),[]);
 const rightRing=useMemo(()=>ringCurve(.48,0,.34,.30,0),[]);
 const bridge=useMemo(()=>new THREE.CatmullRomCurve3([new THREE.Vector3(-.17,-.01,0),new THREE.Vector3(0,.045,.025),new THREE.Vector3(.17,-.01,0)],false,"centripetal"),[]);
 const leftTemple=useMemo(()=>{const world=makeTempleCurve(-1,.80,.58,p.frameZ,p.clearance);return new THREE.CatmullRomCurve3(world.points.map(v=>v.clone().sub(new THREE.Vector3(0,.58,p.frameZ))),false,"centripetal");},[p.frameZ,p.clearance]);
 const rightTemple=useMemo(()=>{const world=makeTempleCurve(1,.80,.58,p.frameZ,p.clearance);return new THREE.CatmullRomCurve3(world.points.map(v=>v.clone().sub(new THREE.Vector3(0,.58,p.frameZ))),false,"centripetal");},[p.frameZ,p.clearance]);
 return <group position={p.position} rotation={p.rotation} scale={p.scale}>
  <mesh><tubeGeometry args={[leftRing,88,.035,10,true]}/><EyewearMaterial color={color} mode={material}/></mesh>
  <mesh><tubeGeometry args={[rightRing,88,.035,10,true]}/><EyewearMaterial color={color} mode={material}/></mesh>
  <Lens x={-.48} z={-.012} material={material}/><Lens x={.48} z={-.012} material={material}/>
  <mesh><tubeGeometry args={[bridge,40,.030,10,false]}/><EyewearMaterial color="#D9F8FF" mode={material} opacity={.84}/></mesh>
  <mesh><tubeGeometry args={[leftTemple,90,.027,9,false]}/><EyewearMaterial color={color} mode={material} opacity={.82}/></mesh>
  <mesh><tubeGeometry args={[rightTemple,90,.027,9,false]}/><EyewearMaterial color={color} mode={material} opacity={.82}/></mesh>
  <mesh position={[-.17,-.11,-.035]} scale={[.055,.035,.024]} rotation={[0,.12,-.15]}><sphereGeometry args={[1,20,14]}/><EyewearMaterial color="#F1FBFF" mode={material} opacity={.72}/></mesh>
  <mesh position={[.17,-.11,-.035]} scale={[.055,.035,.024]} rotation={[0,-.12,.15]}><sphereGeometry args={[1,20,14]}/><EyewearMaterial color="#F1FBFF" mode={material} opacity={.72}/></mesh>
  <mesh position={[-.82,0,-.005]} rotation={[0,Math.PI/2,0]}><cylinderGeometry args={[.055,.055,.08,22]}/><EyewearMaterial color="#B486FF" mode={material} opacity={.90}/></mesh>
  <mesh position={[.82,0,-.005]} rotation={[0,Math.PI/2,0]}><cylinderGeometry args={[.055,.055,.08,22]}/><EyewearMaterial color="#B486FF" mode={material} opacity={.90}/></mesh>
 </group>;
}

export default function SafeEyewearAccessories({glasses=null}){
 if(!glasses||glasses.type!=="round")return null;
 return <PremiumRoundGlasses glasses={glasses}/>;
}
