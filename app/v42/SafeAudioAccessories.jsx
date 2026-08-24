"use client";

import React,{useMemo} from "react";
import * as THREE from "three";

const ORB_CENTER=new THREE.Vector3(0,.35,0);
const ORB_RADIUS=1.68;
const MAX_BREATH_RADIUS=1.715;

const HAIR_CLEARANCE={
 none:0,
 short:.035,
 "reference-curl":.075,
 "long-hair":.12,
};

function AudioMaterial({color="#74E8FF",mode="iridescent",opacity=.84,frosted=false}){
 const modes={
  glass:[.91,.055,0,.30],
  "frosted-glass":[.58,.22,0,.22],
  iridescent:[.82,.065,.01,.95],
  holographic:[.67,.09,.10,.95],
  pearlescent:[.70,.13,.03,.58],
  "chrome-glass":[.44,.075,.26,.74],
 };
 const m=modes[mode]||modes.iridescent;
 return <meshPhysicalMaterial color={color} transparent opacity={opacity} transmission={frosted?Math.min(.56,m[0]):m[0]} roughness={frosted?Math.max(.20,m[1]):m[1]} metalness={m[2]} thickness={.24} clearcoat={1} clearcoatRoughness={.025} ior={1.46} iridescence={m[3]} envMapIntensity={1.45} emissive={color} emissiveIntensity={.018} depthWrite={false}/>;
}

function OvalPad({side=1,x=1.92,y=.48,z=.02,color="#7FEAFF",material="iridescent"}){
 const innerX=x-side*.10;
 return <group>
  <mesh position={[x,y,z]} scale={[.18,.47,.36]}>
   <sphereGeometry args={[1,40,30]}/>
   <AudioMaterial color={color} mode={material} opacity={.82}/>
  </mesh>
  <mesh position={[innerX,y,z+.012]} scale={[.105,.405,.305]}>
   <sphereGeometry args={[1,36,26]}/>
   <AudioMaterial color="#DDF9FF" mode={material} opacity={.66} frosted/>
  </mesh>
  <mesh position={[x+side*.115,y,z-.005]} scale={[.085,.34,.265]}>
   <sphereGeometry args={[1,32,24]}/>
   <AudioMaterial color={side<0?"#7EEBFF":"#C486FF"} mode={material} opacity={.88}/>
  </mesh>
  <mesh position={[innerX-side*.015,y,z+.028]} rotation={[0,Math.PI/2,0]} scale={[1,1.14,1]}>
   <torusGeometry args={[.285,.032,12,56]}/>
   <AudioMaterial color="#F2FBFF" mode={material} opacity={.72} frosted/>
  </mesh>
  <mesh position={[x+side*.205,y+.16,z-.015]} rotation={[0,0,side*.10]}>
   <capsuleGeometry args={[.048,.18,7,12]}/>
   <AudioMaterial color="#9A8CFF" mode={material} opacity={.90}/>
  </mesh>
  <mesh position={[x+side*.22,y+.30,z-.015]} rotation={[0,0,Math.PI/2]} scale={[.10,.10,.10]}>
   <sphereGeometry args={[1,24,18]}/>
   <AudioMaterial color="#FFD27B" mode={material} opacity={.86}/>
  </mesh>
 </group>;
}

function makeBandCurve(leftX,rightX,cupY,cupZ,topY){
 const pts=[
  new THREE.Vector3(leftX-.18,cupY+.28,cupZ-.02),
  new THREE.Vector3(leftX-.13,cupY+.62,cupZ-.06),
  new THREE.Vector3(-1.30,topY-.24,cupZ-.12),
  new THREE.Vector3(-.64,topY+.02,cupZ-.15),
  new THREE.Vector3(0,topY+.10,cupZ-.16),
  new THREE.Vector3(.64,topY+.02,cupZ-.15),
  new THREE.Vector3(1.30,topY-.24,cupZ-.12),
  new THREE.Vector3(rightX+.13,cupY+.62,cupZ-.06),
  new THREE.Vector3(rightX+.18,cupY+.28,cupZ-.02),
 ];
 return new THREE.CatmullRomCurve3(pts,false,"centripetal");
}

function bandSamples(curve,count=48){return Array.from({length:count},(_,i)=>curve.getPoint(i/(count-1)));}

function sphereHalfWidth(y,z,radius=MAX_BREATH_RADIUS){
 const dy=y-ORB_CENTER.y,dz=z-ORB_CENTER.z;
 const inside=radius*radius-dy*dy-dz*dz;
 return inside>0?Math.sqrt(inside):0;
}

function resolveEarmuffGeometry(audio={}){
 const scale=THREE.MathUtils.clamp(audio.scale??1,.78,1.20);
 const hair=HAIR_CLEARANCE[audio.hairStyle||"none"]??0;
 const cupY=.50+(audio.offsetY||0);
 const cupZ=.02+(audio.offsetZ||0);
 const offsetX=THREE.MathUtils.clamp(audio.offsetX||0,-.16,.16);
 const padInnerDepth=.115*scale;
 const safety=Math.max(.035,audio.collisionRadius??.055)+hair;
 const required=sphereHalfWidth(cupY,cupZ)+padInnerDepth+safety;
 let leftX=Math.min(-required,-1.84*scale)+offsetX;
 let rightX=Math.max(required,1.84*scale)+offsetX;
 if(leftX>-required)leftX=-required;
 if(rightX<required)rightX=required;
 let topY=ORB_CENTER.y+MAX_BREATH_RADIUS+.16+hair;
 const baseCurve=makeBandCurve(leftX,rightX,cupY,cupZ,topY);
 let worst=0;
 for(const p of bandSamples(baseCurve)){
  const need=MAX_BREATH_RADIUS+safety*.45-p.distanceTo(ORB_CENTER);
  if(need>worst)worst=need;
 }
 if(worst>0)topY+=worst+.06;
 return {scale,leftX,rightX,cupY,cupZ,topY};
}

export function PremiumEarmuffs({audio={}}){
 const g=resolveEarmuffGeometry(audio);
 const curve=useMemo(()=>makeBandCurve(g.leftX,g.rightX,g.cupY,g.cupZ,g.topY),[g.leftX,g.rightX,g.cupY,g.cupZ,g.topY]);
 const innerCurve=useMemo(()=>makeBandCurve(g.leftX+.055,g.rightX-.055,g.cupY+.015,g.cupZ+.015,g.topY-.055),[g.leftX,g.rightX,g.cupY,g.cupZ,g.topY]);
 const material=audio.material||"iridescent";
 const color=audio.color||"#7FEAFF";
 const rotation=[audio.rotationX||0,audio.rotationY||0,audio.rotationZ||0];
 return <group rotation={rotation}>
  <OvalPad side={-1} x={g.leftX} y={g.cupY} z={g.cupZ} color={color} material={material}/>
  <OvalPad side={1} x={g.rightX} y={g.cupY} z={g.cupZ} color={color} material={material}/>
  <mesh><tubeGeometry args={[curve,128,.072*g.scale,14,false]}/><AudioMaterial color={color} mode={material} opacity={.84}/></mesh>
  <mesh><tubeGeometry args={[innerCurve,128,.032*g.scale,12,false]}/><AudioMaterial color="#DDF8FF" mode={material} opacity={.62} frosted/></mesh>
  <mesh position={[g.leftX-.14,g.cupY+.38,g.cupZ-.035]} rotation={[0,0,-.14]}><capsuleGeometry args={[.045,.22,7,12]}/><AudioMaterial color="#AA86FF" mode={material} opacity={.88}/></mesh>
  <mesh position={[g.rightX+.14,g.cupY+.38,g.cupZ-.035]} rotation={[0,0,.14]}><capsuleGeometry args={[.045,.22,7,12]}/><AudioMaterial color="#AA86FF" mode={material} opacity={.88}/></mesh>
 </group>;
}

export default function SafeAudioAccessories({audio=null}){
 if(!audio||audio.type!=="earmuffs")return null;
 return <PremiumEarmuffs audio={audio}/>;
}
