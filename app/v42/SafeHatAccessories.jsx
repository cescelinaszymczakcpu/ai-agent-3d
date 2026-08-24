"use client";

import React,{useMemo} from "react";
import * as THREE from "three";

const ORB_CENTER=new THREE.Vector3(0,.35,0);
const ORB_RADIUS=1.68;
const MAX_BREATH_RADIUS=1.715;
const HEAD_TOP_Y=ORB_CENTER.y+MAX_BREATH_RADIUS;

const HAIR_CLEARANCE={
 none:0,
 short:.075,
 "reference-curl":.165,
 "long-hair":.235,
};

function AccessoryMaterial({color="#8E72FF",mode="iridescent",opacity=.84}){
 const modes={
  glass:[.91,.055,0,.30],
  "frosted-glass":[.58,.22,0,.22],
  iridescent:[.82,.065,.01,.95],
  holographic:[.67,.09,.10,.95],
  pearlescent:[.70,.13,.03,.58],
  "chrome-glass":[.44,.075,.26,.74],
 };
 const m=modes[mode]||modes.iridescent;
 return <meshPhysicalMaterial color={color} transparent opacity={opacity} transmission={m[0]} roughness={m[1]} metalness={m[2]} thickness={.24} clearcoat={1} clearcoatRoughness={.025} ior={1.46} iridescence={m[3]} envMapIntensity={1.45} emissive={color} emissiveIntensity={.018} depthWrite={false}/>;
}

function createFedoraBrimGeometry(){
 const segments=112;
 const inner=.49;
 const outer=1.10;
 const thickness=.075;
 const verts=[];
 const indices=[];
 const yAt=(r,a)=>{
  const radial=(r-inner)/(outer-inner);
  const front=Math.max(0,Math.sin(a));
  const back=Math.max(0,-Math.sin(a));
  const sideWave=Math.cos(a*2+.35)*.022;
  return radial*(sideWave-front*.052+back*.025)+Math.sin(a-.55)*.010;
 };
 const push=(x,y,z)=>{verts.push(x,y,z);return verts.length/3-1};
 const topOuter=[],topInner=[],bottomOuter=[],bottomInner=[];
 for(let i=0;i<segments;i+=1){
  const a=i/segments*Math.PI*2;
  const ca=Math.cos(a),sa=Math.sin(a);
  const yo=yAt(outer,a),yi=yAt(inner,a);
  topOuter.push(push(ca*outer,yo+thickness*.5,sa*outer));
  topInner.push(push(ca*inner,yi+thickness*.5,sa*inner));
  bottomOuter.push(push(ca*outer,yo-thickness*.5,sa*outer));
  bottomInner.push(push(ca*inner,yi-thickness*.5,sa*inner));
 }
 const quad=(a,b,c,d)=>indices.push(a,b,d,b,c,d);
 for(let i=0;i<segments;i+=1){
  const n=(i+1)%segments;
  quad(topInner[i],topInner[n],topOuter[n],topOuter[i]);
  quad(bottomOuter[i],bottomOuter[n],bottomInner[n],bottomInner[i]);
  quad(topOuter[i],topOuter[n],bottomOuter[n],bottomOuter[i]);
  quad(bottomInner[i],bottomInner[n],topInner[n],topInner[i]);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));
 g.setIndex(indices);
 g.computeVertexNormals();
 return g;
}

function crownRadius(t,a){
 const base=.555-.035*t-.045*t*t;
 const front=Math.max(0,Math.sin(a));
 const pinch=Math.exp(-Math.pow((t-.78)/.22,2))*front*.085;
 const sideDent=Math.exp(-Math.pow((t-.72)/.24,2))*Math.abs(Math.cos(a))*.032;
 return Math.max(.39,base-pinch-sideDent);
}

function createFedoraCrownGeometry(){
 const segments=104;
 const rows=22;
 const verts=[];
 const indices=[];
 for(let j=0;j<=rows;j+=1){
  const t=j/rows;
  const y=.035+t*.71;
  for(let i=0;i<segments;i+=1){
   const a=i/segments*Math.PI*2;
   const r=crownRadius(t,a);
   const x=Math.cos(a)*r;
   const z=Math.sin(a)*r*.93;
   const front=Math.max(0,Math.sin(a));
   const yy=y-front*Math.pow(t,2)*.025;
   verts.push(x,yy,z);
  }
 }
 const idx=(j,i)=>j*segments+(i%segments+segments)%segments;
 for(let j=0;j<rows;j+=1){
  for(let i=0;i<segments;i+=1){
   const n=(i+1)%segments;
   indices.push(idx(j,i),idx(j,n),idx(j+1,i),idx(j,n),idx(j+1,n),idx(j+1,i));
  }
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));
 g.setIndex(indices);
 g.computeVertexNormals();
 return g;
}

function createFedoraTopGeometry(){
 const segments=104;
 const rings=18;
 const verts=[];
 const indices=[];
 for(let j=0;j<=rings;j+=1){
  const u=j/rings;
  for(let i=0;i<segments;i+=1){
   const a=i/segments*Math.PI*2;
   const edge=crownRadius(1,a);
   const r=edge*u;
   const x=Math.cos(a)*r;
   const z=Math.sin(a)*r*.93;
   const centerCrease=.085*Math.exp(-x*x*18)*(.45+.55*u);
   const sideDents=.035*Math.exp(-Math.pow(Math.abs(x)-.25,2)*38)*u;
   const frontPinch=.028*Math.max(0,z)*u;
   const y=.745-centerCrease-sideDents-frontPinch+.014*(1-u*u);
   verts.push(x,y,z);
  }
 }
 const idx=(j,i)=>j*segments+(i%segments+segments)%segments;
 for(let j=0;j<rings;j+=1){
  for(let i=0;i<segments;i+=1){
   const n=(i+1)%segments;
   indices.push(idx(j,i),idx(j+1,i),idx(j,n),idx(j,n),idx(j+1,i),idx(j+1,n));
  }
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));
 g.setIndex(indices);
 g.computeVertexNormals();
 return g;
}

function makeBandCurve(){
 const pts=[];
 for(let i=0;i<72;i+=1){
  const a=i/72*Math.PI*2;
  const r=.555;
  pts.push(new THREE.Vector3(Math.cos(a)*r,.18,Math.sin(a)*r*.93));
 }
 return new THREE.CatmullRomCurve3(pts,true,"centripetal");
}

export function PremiumFedora({color="#8E72FF",material="iridescent"}){
 const brim=useMemo(()=>createFedoraBrimGeometry(),[]);
 const crown=useMemo(()=>createFedoraCrownGeometry(),[]);
 const top=useMemo(()=>createFedoraTopGeometry(),[]);
 const bandCurve=useMemo(()=>makeBandCurve(),[]);
 return <group>
  <mesh geometry={brim}><AccessoryMaterial color={color} mode={material} opacity={.82}/></mesh>
  <mesh geometry={crown}><AccessoryMaterial color={color} mode={material} opacity={.86}/></mesh>
  <mesh geometry={top}><AccessoryMaterial color={color} mode={material} opacity={.86}/></mesh>
  <mesh><tubeGeometry args={[bandCurve,96,.028,10,true]}/><AccessoryMaterial color="#FF72C9" mode={material} opacity={.92}/></mesh>
  <mesh position={[.45,.22,.32]} rotation={[.18,-.18,-.48]} scale={[.16,.065,.035]}><sphereGeometry args={[1,24,16]}/><AccessoryMaterial color="#7DE9FF" mode={material} opacity={.90}/></mesh>
 </group>;
}

function localSamples(){
 const samples=[];
 for(let i=0;i<32;i+=1){
  const a=i/32*Math.PI*2;
  for(const r of [.50,.80,1.10])samples.push(new THREE.Vector3(Math.cos(a)*r,-.048,Math.sin(a)*r));
 }
 samples.push(new THREE.Vector3(0,0,0));
 return samples;
}

function penetrationPush(base,rotation,scale,margin=.025){
 const euler=new THREE.Euler(rotation[0],rotation[1],rotation[2],"XYZ");
 const q=new THREE.Quaternion().setFromEuler(euler);
 let yPush=0;
 for(let pass=0;pass<4;pass+=1){
  let worst=0;
  for(const sample of localSamples()){
   const p=sample.clone().multiplyScalar(scale).applyQuaternion(q).add(new THREE.Vector3(base[0],base[1]+yPush,base[2]));
   const d=p.distanceTo(ORB_CENTER);
   const need=ORB_RADIUS+margin-d;
   if(need>worst)worst=need;
  }
  if(worst<=.001)break;
  yPush+=worst+.012;
 }
 return yPush;
}

export function resolveFedoraPlacement(hat={}){
 const hair=HAIR_CLEARANCE[hat.hairStyle||"none"]??0;
 const scale=THREE.MathUtils.clamp(hat.scale??1,.72,1.28);
 const minY=HEAD_TOP_Y+hair+.060;
 const base=[hat.offsetX||0,Math.max(minY,minY+(hat.offsetY||0)),hat.offsetZ||0];
 const rotation=[
  -.035+(hat.rotationX||0),
  .025+(hat.rotationY||0),
  .045+(hat.rotationZ||0),
 ];
 const margin=Math.max(.018,hat.collisionRadius??.035);
 base[1]+=penetrationPush(base,rotation,scale,margin);
 return {position:base,rotation,scale};
}

export default function SafeHatAccessories({hat=null}){
 if(!hat||hat.type!=="fedora")return null;
 const p=resolveFedoraPlacement(hat);
 return <group position={p.position} rotation={p.rotation} scale={p.scale}>
  <PremiumFedora color={hat.color||"#8E72FF"} material={hat.material||"iridescent"}/>
 </group>;
}
