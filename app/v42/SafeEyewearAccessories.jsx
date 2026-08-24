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

function ellipsePoints(cx,cy,rx,ry,z=0,n=72){return Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2;return new THREE.Vector3(cx+Math.cos(a)*rx,cy+Math.sin(a)*ry,z)})}
function curveFrom(points){return new THREE.CatmullRomCurve3(points,true,"centripetal")}
function roundCurve(cx,cy,rx,ry,z,n=72){const pts=ellipsePoints(cx,cy,rx,ry,z,n).map((p,i)=>{const a=i/n*Math.PI*2;p.x=cx+(p.x-cx)*(1-.035*Math.cos(a*2));return p});return curveFrom(pts)}
function superellipsePoints(cx,cy,rx,ry,z=0,n=80,power=.34){return Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2,c=Math.cos(a),s=Math.sin(a);return new THREE.Vector3(cx+Math.sign(c)*rx*Math.pow(Math.abs(c),power),cy+Math.sign(s)*ry*Math.pow(Math.abs(s),power),z)})}
function catEyePoints(cx,cy,side,rx=.385,ry=.275,z=0,n=80){return Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a),wing=Math.max(0,side*ca),upper=Math.max(0,sa);return new THREE.Vector3(cx+ca*rx+side*Math.pow(wing,2)*.060,cy+sa*ry+Math.pow(wing,2)*(.040+.075*upper)-.018*Math.max(0,-sa)*(1-wing),z)})}
function futurePoints(cx,cy,side,z=0){const pts=[[-.39,.05],[-.30,.25],[-.06,.31],[.28,.27],[.43,.11],[.34,-.17],[.06,-.25],[-.30,-.20]];return pts.map(([x,y])=>new THREE.Vector3(cx+(side<0?-x:x),cy+y,z))}

function framePoints(type,side,cfg,z){
 if(type==="cat-eye")return catEyePoints(side*cfg.centerX,cfg.frameY,side,cfg.rx,cfg.ry,z);
 if(type==="rectangular")return superellipsePoints(side*cfg.centerX,cfg.frameY,cfg.rx,cfg.ry,z,84,.34);
 if(type==="futuristic")return futurePoints(side*cfg.centerX,cfg.frameY,side,z);
 return ellipsePoints(side*cfg.centerX,cfg.frameY,cfg.rx,cfg.ry,z,76);
}
function frameCurve(type,side,cfg,z){return curveFrom(framePoints(type,side,cfg,z))}

function plateGeometry(type,side,cfg){
 let pts;
 if(type==="cat-eye")pts=catEyePoints(0,0,side,cfg.rx*.85,cfg.ry*.81,0,72);
 else if(type==="rectangular")pts=superellipsePoints(0,0,cfg.rx*.84,cfg.ry*.80,0,76,.34);
 else if(type==="futuristic")pts=futurePoints(0,0,side,0).map(p=>new THREE.Vector3(p.x*.84,p.y*.82,0));
 else pts=ellipsePoints(0,0,cfg.rx*.86,cfg.ry*.84,0,72);
 const shape=new THREE.Shape(pts.map(p=>new THREE.Vector2(p.x,p.y)));
 const g=new THREE.ExtrudeGeometry(shape,{depth:.038,bevelEnabled:true,bevelSegments:3,bevelSize:.008,bevelThickness:.008,curveSegments:24,steps:1});g.center();g.computeVertexNormals();return g;
}

function sphereSideX(y,z,clearance){const dy=y-ORB_CENTER.y;const inside=MAX_BREATH_RADIUS*MAX_BREATH_RADIUS-dy*dy-z*z;return (inside>0?Math.sqrt(inside):0)+clearance}
function makeTempleCurve(side,frameX,frameY,frontZ,clearance,wrap=.0){
 const zs=[frontZ-.045,1.38,1.05,.70,.34,.02,-.16];
 const pts=zs.map((z,i)=>{if(i===0)return new THREE.Vector3(side*frameX,frameY,z);const y=frameY-.018*i;const x=sphereSideX(y,z,clearance+.018*i)+wrap*i*.006;return new THREE.Vector3(side*x,y,z)});
 return new THREE.CatmullRomCurve3(pts,false,"centripetal");
}
function makeBridgeCurve(z,y,width,lift){return new THREE.CatmullRomCurve3([new THREE.Vector3(-width,y,z),new THREE.Vector3(0,y+lift,z+.025),new THREE.Vector3(width,y,z)],false,"centripetal")}

const CFG={
 round:{centerX:.48,frameY:.58,rx:.34,ry:.30,outerX:.82,bridgeWidth:.17,bridgeLift:.05,defaultColor:"#80E9FF",baseClearance:.055},
 oval:{centerX:.49,frameY:.59,rx:.385,ry:.245,outerX:.88,bridgeWidth:.16,bridgeLift:.045,defaultColor:"#75E9FF",baseClearance:.055},
 "cat-eye":{centerX:.50,frameY:.60,rx:.385,ry:.275,outerX:.93,bridgeWidth:.16,bridgeLift:.055,defaultColor:"#FF82CE",baseClearance:.060},
 rectangular:{centerX:.50,frameY:.58,rx:.385,ry:.245,outerX:.91,bridgeWidth:.15,bridgeLift:.040,defaultColor:"#A98AFF",baseClearance:.060},
 futuristic:{centerX:.52,frameY:.61,rx:.43,ry:.30,outerX:.98,bridgeWidth:.12,bridgeLift:.025,defaultColor:"#6FF0FF",baseClearance:.065},
 monocle:{centerX:.47,frameY:.58,rx:.36,ry:.31,outerX:.84,bridgeWidth:0,bridgeLift:0,defaultColor:"#FFD07A",baseClearance:.060},
};

function geometrySamples({type,frameZ,clearance,cfg}){
 const samples=[];
 const sides=type==="monocle"?[1]:[-1,1];
 for(const side of sides){const frame=frameCurve(type,side,cfg,frameZ);for(let i=0;i<64;i+=3)samples.push(frame.getPoint(i/63));if(type!=="monocle"){const temple=makeTempleCurve(side,cfg.outerX,cfg.frameY,frameZ,clearance,type==="futuristic"?.8:0);for(let i=0;i<32;i+=2)samples.push(temple.getPoint(i/31))}}
 if(type!=="monocle"){const bridge=makeBridgeCurve(frameZ,cfg.frameY,cfg.bridgeWidth,cfg.bridgeLift);for(let i=0;i<14;i+=1)samples.push(bridge.getPoint(i/13))}
 return samples;
}

function resolvePlacement(glasses={},type="round"){
 const cfg=CFG[type]||CFG.round,scale=THREE.MathUtils.clamp(glasses.scale??1,.82,1.18),hair=HAIR_CLEARANCE[glasses.hairStyle||"none"]??0;
 const y=cfg.frameY+THREE.MathUtils.clamp(glasses.offsetY||0,-.14,.14),x=THREE.MathUtils.clamp(glasses.offsetX||0,-.12,.12);
 const surfaceZ=Math.sqrt(Math.max(0,MAX_BREATH_RADIUS*MAX_BREATH_RADIUS-Math.pow(y-ORB_CENTER.y,2))),clearance=Math.max(.035,glasses.collisionRadius??cfg.baseClearance)+hair,minFront=surfaceZ+.075+clearance*.25;
 let frameZ=Math.max(minFront,minFront+(glasses.offsetZ||0));
 const rotation=[THREE.MathUtils.clamp(glasses.rotationX||0,-.12,.12),THREE.MathUtils.clamp(glasses.rotationY||0,-.12,.12),THREE.MathUtils.clamp(glasses.rotationZ||0,-.12,.12)],q=new THREE.Quaternion().setFromEuler(new THREE.Euler(rotation[0],rotation[1],rotation[2],"XYZ"));
 for(let pass=0;pass<8;pass+=1){let worst=0;const pivot=new THREE.Vector3(0,cfg.frameY,frameZ);for(const p0 of geometrySamples({type,frameZ,clearance,cfg})){const local=p0.clone().sub(pivot);const p=local.multiplyScalar(scale).applyQuaternion(q).add(new THREE.Vector3(x,y,frameZ));const need=MAX_BREATH_RADIUS+clearance*.52-p.distanceTo(ORB_CENTER);if(need>worst)worst=need}if(worst<=.001)break;frameZ+=worst+.018}
 return {cfg,scale,position:[x,y,frameZ],rotation,frameZ,clearance};
}

function LensPlate({type,side,x,cfg,material}){const geometry=useMemo(()=>plateGeometry(type,side,cfg),[type,side,cfg.rx,cfg.ry]);return <mesh geometry={geometry} position={[x,0,-.018]}><EyewearMaterial color="#C8F4FF" mode={material} lens/></mesh>}

function Temples({p,type,material,color}){
 const cfg=p.cfg,pivot=new THREE.Vector3(0,cfg.frameY,p.frameZ);
 const left=useMemo(()=>{const world=makeTempleCurve(-1,cfg.outerX,cfg.frameY,p.frameZ,p.clearance,type==="futuristic"?.8:0);return new THREE.CatmullRomCurve3(world.points.map(v=>v.clone().sub(pivot)),false,"centripetal")},[cfg.outerX,cfg.frameY,p.frameZ,p.clearance,type]);
 const right=useMemo(()=>{const world=makeTempleCurve(1,cfg.outerX,cfg.frameY,p.frameZ,p.clearance,type==="futuristic"?.8:0);return new THREE.CatmullRomCurve3(world.points.map(v=>v.clone().sub(pivot)),false,"centripetal")},[cfg.outerX,cfg.frameY,p.frameZ,p.clearance,type]);
 return <><mesh><tubeGeometry args={[left,96,type==="futuristic"?.034:type==="cat-eye"?.030:.027,10,false]}/><EyewearMaterial color={color} mode={material} opacity={.84}/></mesh><mesh><tubeGeometry args={[right,96,type==="futuristic"?.034:type==="cat-eye"?.030:.027,10,false]}/><EyewearMaterial color={color} mode={material} opacity={.84}/></mesh></>;
}

function Hardware({type,material,cfg}){if(type==="monocle")return null;return <><mesh position={[-.17,-.11,-.035]} scale={[.055,.035,.024]} rotation={[0,.12,-.15]}><sphereGeometry args={[1,20,14]}/><EyewearMaterial color="#F1FBFF" mode={material} opacity={.72}/></mesh><mesh position={[.17,-.11,-.035]} scale={[.055,.035,.024]} rotation={[0,-.12,.15]}><sphereGeometry args={[1,20,14]}/><EyewearMaterial color="#F1FBFF" mode={material} opacity={.72}/></mesh><mesh position={[-cfg.outerX,0,-.005]} rotation={[0,Math.PI/2,0]}><cylinderGeometry args={[.055,.055,.085,22]}/><EyewearMaterial color="#B486FF" mode={material} opacity={.90}/></mesh><mesh position={[cfg.outerX,0,-.005]} rotation={[0,Math.PI/2,0]}><cylinderGeometry args={[.055,.055,.085,22]}/><EyewearMaterial color="#B486FF" mode={material} opacity={.90}/></mesh></>}

function PairGlasses({glasses,type}){
 const p=resolvePlacement(glasses,type),material=glasses.material||"iridescent",color=glasses.color||p.cfg.defaultColor;
 const left=useMemo(()=>curveFrom(framePoints(type,-1,{...p.cfg,frameY:0},0)),[type,p.cfg.centerX,p.cfg.rx,p.cfg.ry]);
 const right=useMemo(()=>curveFrom(framePoints(type,1,{...p.cfg,frameY:0},0)),[type,p.cfg.centerX,p.cfg.rx,p.cfg.ry]);
 const bridge=useMemo(()=>new THREE.CatmullRomCurve3([new THREE.Vector3(-p.cfg.bridgeWidth,-.01,0),new THREE.Vector3(0,p.cfg.bridgeLift-.01,.025),new THREE.Vector3(p.cfg.bridgeWidth,-.01,0)],false,"centripetal"),[p.cfg.bridgeWidth,p.cfg.bridgeLift]);
 return <group position={p.position} rotation={p.rotation} scale={p.scale}>
  <mesh><tubeGeometry args={[left,96,type==="futuristic"?.042:type==="cat-eye"?.038:.033,11,true]}/><EyewearMaterial color={color} mode={material} opacity={.91}/></mesh><mesh><tubeGeometry args={[right,96,type==="futuristic"?.042:type==="cat-eye"?.038:.033,11,true]}/><EyewearMaterial color={color} mode={material} opacity={.91}/></mesh>
  <LensPlate type={type} side={-1} x={-p.cfg.centerX} cfg={p.cfg} material={material}/><LensPlate type={type} side={1} x={p.cfg.centerX} cfg={p.cfg} material={material}/>
  <mesh><tubeGeometry args={[bridge,44,.030,10,false]}/><EyewearMaterial color="#E4F9FF" mode={material} opacity={.88}/></mesh>
  {type==="cat-eye"&&<><mesh position={[-.815,.115,.006]} rotation={[0,0,.28]}><capsuleGeometry args={[.025,.14,6,10]}/><EyewearMaterial color="#FF9DDA" mode={material} opacity={.90}/></mesh><mesh position={[(.815),.115,.006]} rotation={[0,0,-.28]}><capsuleGeometry args={[.025,.14,6,10]}/><EyewearMaterial color="#FF9DDA" mode={material} opacity={.90}/></mesh></>}
  {type==="futuristic"&&<><mesh position={[-1.00,.04,.02]} rotation={[0,.15,.12]} scale={[.15,.045,.055]}><boxGeometry args={[1,1,1,3,2,2]}/><EyewearMaterial color="#FF82CE" mode={material} opacity={.92}/></mesh><mesh position={[1.00,.04,.02]} rotation={[0,-.15,-.12]} scale={[.15,.045,.055]}><boxGeometry args={[1,1,1,3,2,2]}/><EyewearMaterial color="#FF82CE" mode={material} opacity={.92}/></mesh></>}
  <Temples p={p} type={type} material={material} color={color}/><Hardware type={type} material={material} cfg={p.cfg}/>
 </group>;
}

function Monocle({glasses}){
 const type="monocle",p=resolvePlacement(glasses,type),material=glasses.material||"iridescent",color=glasses.color||p.cfg.defaultColor;
 const ring=useMemo(()=>curveFrom(framePoints(type,1,{...p.cfg,frameY:0},0)),[p.cfg.centerX,p.cfg.rx,p.cfg.ry]);
 const chain=useMemo(()=>new THREE.CatmullRomCurve3([new THREE.Vector3(.78,-.12,.05),new THREE.Vector3(.94,-.36,.10),new THREE.Vector3(1.02,-.66,.16),new THREE.Vector3(.98,-.98,.22),new THREE.Vector3(.84,-1.20,.28)],false,"centripetal"),[]);
 return <group position={p.position} rotation={p.rotation} scale={p.scale}>
  <mesh><tubeGeometry args={[ring,96,.037,11,true]}/><EyewearMaterial color={color} mode={material} opacity={.92}/></mesh><LensPlate type={type} side={1} x={p.cfg.centerX} cfg={p.cfg} material={material}/>
  <mesh><tubeGeometry args={[chain,90,.015,8,false]}/><EyewearMaterial color="#FFD37A" mode={material} opacity={.88}/></mesh>
  {[.18,.42,.66,.90].map((u,i)=><mesh key={i} position={chain.getPoint(u).toArray()} scale={[.026,.026,.026]}><sphereGeometry args={[1,16,12]}/><EyewearMaterial color={i%2?"#7EEBFF":"#C486FF"} mode={material} opacity={.88}/></mesh>)}
 </group>;
}

export default function SafeEyewearAccessories({glasses=null}){
 const type=glasses?.type||"none";
 if(type==="none")return null;
 if(type==="monocle")return <Monocle glasses={glasses}/>;
 if(["round","oval","cat-eye","rectangular","futuristic"].includes(type))return <PairGlasses glasses={glasses} type={type}/>;
 return null;
}
