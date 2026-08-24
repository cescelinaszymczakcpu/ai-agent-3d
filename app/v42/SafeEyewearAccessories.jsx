"use client";

import React,{useMemo} from "react";
import * as THREE from "three";

const ORB_CENTER=new THREE.Vector3(0,.35,0);
const MAX_BREATH_RADIUS=1.715;
const HAIR_CLEARANCE={none:0,short:.025,"reference-curl":.060,"long-hair":.095};

function EyewearMaterial({color="#80E9FF",mode="iridescent",opacity=.88,lens=false}){
 const modes={glass:[.91,.055,0,.30],"frosted-glass":[.58,.22,0,.22],iridescent:[.82,.065,.01,.95],holographic:[.67,.09,.10,.95],pearlescent:[.70,.13,.03,.58],"chrome-glass":[.44,.075,.26,.74]};
 const m=modes[mode]||modes.iridescent;
 return <meshPhysicalMaterial side={THREE.DoubleSide} color={color} transparent opacity={lens?.25:opacity} transmission={lens?.95:m[0]} roughness={lens?.035:m[1]} metalness={lens?0:m[2]} thickness={lens?.075:.16} clearcoat={1} clearcoatRoughness={.02} ior={lens?1.48:1.45} iridescence={lens?.24:m[3]} envMapIntensity={1.35} emissive={color} emissiveIntensity={lens?.006:.018} depthWrite={false}/>;
}

function roundCurve(cx,cy,rx,ry,z,n=72){
 const pts=Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2;const squash=1-.035*Math.cos(a*2);return new THREE.Vector3(cx+Math.cos(a)*rx*squash,cy+Math.sin(a)*ry,z);});
 return new THREE.CatmullRomCurve3(pts,true,"centripetal");
}

function catEyePoints(cx,cy,side,rx=.385,ry=.275,z=0,n=80){
 return Array.from({length:n},(_,i)=>{
  const a=i/n*Math.PI*2;
  const ca=Math.cos(a),sa=Math.sin(a);
  const wing=Math.max(0,side*ca);
  const upper=Math.max(0,sa);
  const x=cx+ca*rx+side*Math.pow(wing,2)*.060;
  const y=cy+sa*ry+Math.pow(wing,2)*(.040+.075*upper)-.018*Math.max(0,-sa)*(1-wing);
  return new THREE.Vector3(x,y,z);
 });
}

function catEyeCurve(cx,cy,side,z=0){return new THREE.CatmullRomCurve3(catEyePoints(cx,cy,side,.385,.275,z),true,"centripetal");}

function catEyeLensGeometry(side=1){
 const pts=catEyePoints(0,0,side,.325,.222,0,72).map(p=>new THREE.Vector2(p.x,p.y));
 const shape=new THREE.Shape(pts);
 const g=new THREE.ExtrudeGeometry(shape,{depth:.038,bevelEnabled:true,bevelSegments:3,bevelSize:.008,bevelThickness:.008,curveSegments:24,steps:1});
 g.center();
 g.computeVertexNormals();
 return g;
}

function sphereSideX(y,z,clearance){
 const dy=y-ORB_CENTER.y;
 const inside=MAX_BREATH_RADIUS*MAX_BREATH_RADIUS-dy*dy-z*z;
 return (inside>0?Math.sqrt(inside):0)+clearance;
}

function makeTempleCurve(side,frameX,frameY,frontZ,clearance){
 const zs=[frontZ-.045,1.38,1.05,.70,.34,.02,-.16];
 const pts=zs.map((z,i)=>{
  if(i===0)return new THREE.Vector3(side*frameX,frameY,z);
  const y=frameY-.018*i;
  const x=sphereSideX(y,z,clearance+.018*i);
  return new THREE.Vector3(side*x,y,z);
 });
 return new THREE.CatmullRomCurve3(pts,false,"centripetal");
}

function makeBridgeCurve(z,y=.58,width=.17,lift=.05){return new THREE.CatmullRomCurve3([new THREE.Vector3(-width,y,z),new THREE.Vector3(0,y+lift,z+.025),new THREE.Vector3(width,y,z)],false,"centripetal");}

const CFG={
 round:{centerX:.48,frameY:.58,rx:.34,ry:.30,outerX:.82,bridgeWidth:.17,bridgeLift:.05,defaultColor:"#80E9FF",baseClearance:.055},
 "cat-eye":{centerX:.50,frameY:.60,rx:.385,ry:.275,outerX:.93,bridgeWidth:.16,bridgeLift:.055,defaultColor:"#FF82CE",baseClearance:.060},
};

function frameCurve(type,side,cfg,z){return type==="cat-eye"?catEyeCurve(side*cfg.centerX,cfg.frameY,side,z):roundCurve(side*cfg.centerX,cfg.frameY,cfg.rx,cfg.ry,z);}

function geometrySamples({type,frameZ,clearance,cfg}){
 const samples=[];
 for(const side of [-1,1]){
  const frame=frameCurve(type,side,cfg,frameZ);
  for(let i=0;i<64;i+=3)samples.push(frame.getPoint(i/63));
  const temple=makeTempleCurve(side,cfg.outerX,cfg.frameY,frameZ,clearance);
  for(let i=0;i<32;i+=2)samples.push(temple.getPoint(i/31));
 }
 const bridge=makeBridgeCurve(frameZ,cfg.frameY,cfg.bridgeWidth,cfg.bridgeLift);
 for(let i=0;i<14;i+=1)samples.push(bridge.getPoint(i/13));
 return samples;
}

function resolvePlacement(glasses={},type="round"){
 const cfg=CFG[type]||CFG.round;
 const scale=THREE.MathUtils.clamp(glasses.scale??1,.82,1.18);
 const hair=HAIR_CLEARANCE[glasses.hairStyle||"none"]??0;
 const y=cfg.frameY+THREE.MathUtils.clamp(glasses.offsetY||0,-.14,.14);
 const x=THREE.MathUtils.clamp(glasses.offsetX||0,-.12,.12);
 const surfaceZ=Math.sqrt(Math.max(0,MAX_BREATH_RADIUS*MAX_BREATH_RADIUS-Math.pow(y-ORB_CENTER.y,2)));
 const clearance=Math.max(.035,glasses.collisionRadius??cfg.baseClearance)+hair;
 const minFront=surfaceZ+.075+clearance*.25;
 let frameZ=Math.max(minFront,minFront+(glasses.offsetZ||0));
 const rotation=[THREE.MathUtils.clamp(glasses.rotationX||0,-.12,.12),THREE.MathUtils.clamp(glasses.rotationY||0,-.12,.12),THREE.MathUtils.clamp(glasses.rotationZ||0,-.12,.12)];
 const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(rotation[0],rotation[1],rotation[2],"XYZ"));
 for(let pass=0;pass<8;pass+=1){
  let worst=0;
  const pivot=new THREE.Vector3(0,cfg.frameY,frameZ);
  for(const p0 of geometrySamples({type,frameZ,clearance,cfg})){
   const local=p0.clone().sub(pivot);
   const p=local.multiplyScalar(scale).applyQuaternion(q).add(new THREE.Vector3(x,y,frameZ));
   const need=MAX_BREATH_RADIUS+clearance*.52-p.distanceTo(ORB_CENTER);
   if(need>worst)worst=need;
  }
  if(worst<=.001)break;
  frameZ+=worst+.018;
 }
 return {cfg,scale,position:[x,y,frameZ],rotation,frameZ,clearance};
}

function RoundLens({x,material="iridescent"}){
 return <mesh position={[x,0,-.012]} rotation={[Math.PI/2,0,0]} scale={[.34,.026,.30]}><cylinderGeometry args={[1,1,1,48,1,false]}/><EyewearMaterial color="#BDEFFF" mode={material} lens/></mesh>;
}

function CatEyeLens({side=1,x=0,material="iridescent"}){
 const geometry=useMemo(()=>catEyeLensGeometry(side),[side]);
 return <mesh geometry={geometry} position={[x,0,-.018]}><EyewearMaterial color="#C8F4FF" mode={material} lens/></mesh>;
}

function Temples({p,type,material,color}){
 const cfg=p.cfg;
 const pivot=new THREE.Vector3(0,cfg.frameY,p.frameZ);
 const left=useMemo(()=>{const world=makeTempleCurve(-1,cfg.outerX,cfg.frameY,p.frameZ,p.clearance);return new THREE.CatmullRomCurve3(world.points.map(v=>v.clone().sub(pivot)),false,"centripetal");},[cfg.outerX,cfg.frameY,p.frameZ,p.clearance]);
 const right=useMemo(()=>{const world=makeTempleCurve(1,cfg.outerX,cfg.frameY,p.frameZ,p.clearance);return new THREE.CatmullRomCurve3(world.points.map(v=>v.clone().sub(pivot)),false,"centripetal");},[cfg.outerX,cfg.frameY,p.frameZ,p.clearance]);
 return <>
  <mesh><tubeGeometry args={[left,96,type==="cat-eye"?.030:.027,10,false]}/><EyewearMaterial color={color} mode={material} opacity={.84}/></mesh>
  <mesh><tubeGeometry args={[right,96,type==="cat-eye"?.030:.027,10,false]}/><EyewearMaterial color={color} mode={material} opacity={.84}/></mesh>
 </>;
}

function Hardware({type,material}){
 const hingeX=type==="cat-eye"?.94:.82;
 return <>
  <mesh position={[-.17,-.11,-.035]} scale={[.055,.035,.024]} rotation={[0,.12,-.15]}><sphereGeometry args={[1,20,14]}/><EyewearMaterial color="#F1FBFF" mode={material} opacity={.72}/></mesh>
  <mesh position={[.17,-.11,-.035]} scale={[.055,.035,.024]} rotation={[0,-.12,.15]}><sphereGeometry args={[1,20,14]}/><EyewearMaterial color="#F1FBFF" mode={material} opacity={.72}/></mesh>
  <mesh position={[-hingeX,0,-.005]} rotation={[0,Math.PI/2,0]}><cylinderGeometry args={[.055,.055,.085,22]}/><EyewearMaterial color="#B486FF" mode={material} opacity={.90}/></mesh>
  <mesh position={[hingeX,0,-.005]} rotation={[0,Math.PI/2,0]}><cylinderGeometry args={[.055,.055,.085,22]}/><EyewearMaterial color="#B486FF" mode={material} opacity={.90}/></mesh>
 </>;
}

export function PremiumRoundGlasses({glasses={}}){
 const p=resolvePlacement(glasses,"round");
 const material=glasses.material||"iridescent",color=glasses.color||p.cfg.defaultColor;
 const leftRing=useMemo(()=>roundCurve(-p.cfg.centerX,0,p.cfg.rx,p.cfg.ry,0),[p.cfg.centerX,p.cfg.rx,p.cfg.ry]);
 const rightRing=useMemo(()=>roundCurve(p.cfg.centerX,0,p.cfg.rx,p.cfg.ry,0),[p.cfg.centerX,p.cfg.rx,p.cfg.ry]);
 const bridge=useMemo(()=>new THREE.CatmullRomCurve3([new THREE.Vector3(-p.cfg.bridgeWidth,-.01,0),new THREE.Vector3(0,p.cfg.bridgeLift-.01,.025),new THREE.Vector3(p.cfg.bridgeWidth,-.01,0)],false,"centripetal"),[p.cfg.bridgeWidth,p.cfg.bridgeLift]);
 return <group position={p.position} rotation={p.rotation} scale={p.scale}>
  <mesh><tubeGeometry args={[leftRing,88,.035,10,true]}/><EyewearMaterial color={color} mode={material}/></mesh><mesh><tubeGeometry args={[rightRing,88,.035,10,true]}/><EyewearMaterial color={color} mode={material}/></mesh>
  <RoundLens x={-p.cfg.centerX} material={material}/><RoundLens x={p.cfg.centerX} material={material}/>
  <mesh><tubeGeometry args={[bridge,40,.030,10,false]}/><EyewearMaterial color="#D9F8FF" mode={material} opacity={.84}/></mesh>
  <Temples p={p} type="round" material={material} color={color}/><Hardware type="round" material={material}/>
 </group>;
}

export function PremiumCatEyeGlasses({glasses={}}){
 const p=resolvePlacement(glasses,"cat-eye");
 const material=glasses.material||"iridescent",color=glasses.color||p.cfg.defaultColor;
 const left=useMemo(()=>catEyeCurve(-p.cfg.centerX,0,-1,0),[p.cfg.centerX]);
 const right=useMemo(()=>catEyeCurve(p.cfg.centerX,0,1,0),[p.cfg.centerX]);
 const bridge=useMemo(()=>new THREE.CatmullRomCurve3([new THREE.Vector3(-p.cfg.bridgeWidth,-.015,0),new THREE.Vector3(0,p.cfg.bridgeLift,.030),new THREE.Vector3(p.cfg.bridgeWidth,-.015,0)],false,"centripetal"),[p.cfg.bridgeWidth,p.cfg.bridgeLift]);
 return <group position={p.position} rotation={p.rotation} scale={p.scale}>
  <mesh><tubeGeometry args={[left,96,.038,11,true]}/><EyewearMaterial color={color} mode={material} opacity={.91}/></mesh>
  <mesh><tubeGeometry args={[right,96,.038,11,true]}/><EyewearMaterial color={color} mode={material} opacity={.91}/></mesh>
  <CatEyeLens side={-1} x={-p.cfg.centerX} material={material}/><CatEyeLens side={1} x={p.cfg.centerX} material={material}/>
  <mesh><tubeGeometry args={[bridge,44,.031,10,false]}/><EyewearMaterial color="#E4F9FF" mode={material} opacity={.88}/></mesh>
  <mesh position={[-.815,.115,.006]} rotation={[0,0,.28]}><capsuleGeometry args={[.025,.14,6,10]}/><EyewearMaterial color="#FF9DDA" mode={material} opacity={.90}/></mesh>
  <mesh position={[.815,.115,.006]} rotation={[0,0,-.28]}><capsuleGeometry args={[.025,.14,6,10]}/><EyewearMaterial color="#FF9DDA" mode={material} opacity={.90}/></mesh>
  <Temples p={p} type="cat-eye" material={material} color={color}/><Hardware type="cat-eye" material={material}/>
 </group>;
}

export default function SafeEyewearAccessories({glasses=null}){
 if(!glasses||glasses.type==="none")return null;
 if(glasses.type==="round")return <PremiumRoundGlasses glasses={glasses}/>;
 if(glasses.type==="cat-eye")return <PremiumCatEyeGlasses glasses={glasses}/>;
 return null;
}
