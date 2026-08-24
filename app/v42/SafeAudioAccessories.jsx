"use client";

import React,{useMemo} from "react";
import * as THREE from "three";

const ORB_CENTER=new THREE.Vector3(0,.35,0);
const MAX_BREATH_RADIUS=1.715;

const HAIR_CLEARANCE={none:0,short:.035,"reference-curl":.075,"long-hair":.12};

function AudioMaterial({color="#74E8FF",mode="iridescent",opacity=.84,frosted=false}){
 const modes={glass:[.91,.055,0,.30],"frosted-glass":[.58,.22,0,.22],iridescent:[.82,.065,.01,.95],holographic:[.67,.09,.10,.95],pearlescent:[.70,.13,.03,.58],"chrome-glass":[.44,.075,.26,.74]};
 const m=modes[mode]||modes.iridescent;
 return <meshPhysicalMaterial color={color} transparent opacity={opacity} transmission={frosted?Math.min(.56,m[0]):m[0]} roughness={frosted?Math.max(.20,m[1]):m[1]} metalness={m[2]} thickness={.24} clearcoat={1} clearcoatRoughness={.025} ior={1.46} iridescence={m[3]} envMapIntensity={1.45} emissive={color} emissiveIntensity={.018} depthWrite={false}/>;
}

function ellipseYZCurve(x,y,z,ry,rz,n=56){
 const pts=Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2;return new THREE.Vector3(x,y+Math.cos(a)*ry,z+Math.sin(a)*rz);});
 return new THREE.CatmullRomCurve3(pts,true,"centripetal");
}

function OvalPad({side=1,x=1.92,y=.48,z=.02,size=1,color="#7FEAFF",material="iridescent"}){
 const innerX=x-side*.10*size;
 return <group>
  <mesh position={[x,y,z]} scale={[.18*size,.47*size,.36*size]}><sphereGeometry args={[1,40,30]}/><AudioMaterial color={color} mode={material} opacity={.82}/></mesh>
  <mesh position={[innerX,y,z+.012*size]} scale={[.105*size,.405*size,.305*size]}><sphereGeometry args={[1,36,26]}/><AudioMaterial color="#DDF9FF" mode={material} opacity={.66} frosted/></mesh>
  <mesh position={[x+side*.115*size,y,z-.005*size]} scale={[.085*size,.34*size,.265*size]}><sphereGeometry args={[1,32,24]}/><AudioMaterial color={side<0?"#7EEBFF":"#C486FF"} mode={material} opacity={.88}/></mesh>
  <mesh position={[innerX-side*.015*size,y,z+.028*size]} rotation={[0,Math.PI/2,0]} scale={[size,1.14*size,size]}><torusGeometry args={[.285,.032,12,56]}/><AudioMaterial color="#F2FBFF" mode={material} opacity={.72} frosted/></mesh>
  <mesh position={[x+side*.205*size,y+.16*size,z-.015*size]} rotation={[0,0,side*.10]}><capsuleGeometry args={[.048*size,.18*size,7,12]}/><AudioMaterial color="#9A8CFF" mode={material} opacity={.90}/></mesh>
  <mesh position={[x+side*.22*size,y+.30*size,z-.015*size]} rotation={[0,0,Math.PI/2]} scale={[.10*size,.10*size,.10*size]}><sphereGeometry args={[1,24,18]}/><AudioMaterial color="#FFD27B" mode={material} opacity={.86}/></mesh>
 </group>;
}

function createHeadphoneCupGeometry(){
 const s=new THREE.Shape();
 s.moveTo(0,.42);
 s.bezierCurveTo(.25,.42,.32,.28,.32,.05);
 s.bezierCurveTo(.32,-.25,.20,-.42,0,-.44);
 s.bezierCurveTo(-.20,-.42,-.32,-.25,-.32,.05);
 s.bezierCurveTo(-.32,.28,-.25,.42,0,.42);
 const g=new THREE.ExtrudeGeometry(s,{depth:.18,bevelEnabled:true,bevelSegments:6,bevelSize:.035,bevelThickness:.035,curveSegments:28,steps:1});
 g.center();
 g.rotateY(Math.PI/2);
 g.computeVertexNormals();
 return g;
}

function HeadphoneCup({side=1,x=2.02,y=.46,z=.02,size=1,color="#6FE8FF",material="iridescent"}){
 const shell=useMemo(()=>createHeadphoneCupGeometry(),[]);
 const cushion=useMemo(()=>ellipseYZCurve(x-side*.155*size,y,z+.012*size,.37*size,.285*size),[x,side,size,y,z]);
 const accent=useMemo(()=>ellipseYZCurve(x+side*.108*size,y,z-.018*size,.30*size,.225*size),[x,side,size,y,z]);
 return <group>
  <mesh geometry={shell} position={[x,y,z]} scale={[size,size,size]}><AudioMaterial color={color} mode={material} opacity={.88}/></mesh>
  <mesh><tubeGeometry args={[cushion,88,.046*size,12,true]}/><AudioMaterial color="#E7FBFF" mode={material} opacity={.70} frosted/></mesh>
  <mesh><tubeGeometry args={[accent,80,.022*size,10,true]}/><AudioMaterial color={side<0?"#75EEFF":"#C47BFF"} mode={material} opacity={.90}/></mesh>
  <mesh position={[x+side*.145*size,y,z-.012*size]} scale={[.055*size,.27*size,.20*size]}><sphereGeometry args={[1,28,22]}/><AudioMaterial color="#A183FF" mode={material} opacity={.88}/></mesh>
  <mesh position={[x+side*.20*size,y+.34*size,z-.025*size]} rotation={[0,0,side*.08]}><capsuleGeometry args={[.040*size,.20*size,7,12]}/><AudioMaterial color="#DDF8FF" mode={material} opacity={.78}/></mesh>
  <mesh position={[x+side*.205*size,y+.51*size,z-.03*size]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.075*size,.075*size,.095*size,24]}/><AudioMaterial color="#FFD47D" mode={material} opacity={.86}/></mesh>
 </group>;
}

function makeEarmuffBandCurve(leftX,rightX,cupY,cupZ,topY,size=1){
 const pts=[new THREE.Vector3(leftX-.18*size,cupY+.28*size,cupZ-.02*size),new THREE.Vector3(leftX-.13*size,cupY+.62*size,cupZ-.06*size),new THREE.Vector3(-1.30*size,topY-.24*size,cupZ-.12*size),new THREE.Vector3(-.64*size,topY+.02*size,cupZ-.15*size),new THREE.Vector3(0,topY+.10*size,cupZ-.16*size),new THREE.Vector3(.64*size,topY+.02*size,cupZ-.15*size),new THREE.Vector3(1.30*size,topY-.24*size,cupZ-.12*size),new THREE.Vector3(rightX+.13*size,cupY+.62*size,cupZ-.06*size),new THREE.Vector3(rightX+.18*size,cupY+.28*size,cupZ-.02*size)];
 return new THREE.CatmullRomCurve3(pts,false,"centripetal");
}

function makeHeadphoneBandCurve(leftX,rightX,cupY,cupZ,topY,size=1){
 const pts=[new THREE.Vector3(leftX-.20*size,cupY+.50*size,cupZ-.035*size),new THREE.Vector3(leftX-.12*size,cupY+.82*size,cupZ-.07*size),new THREE.Vector3(-1.22*size,topY-.18*size,cupZ-.15*size),new THREE.Vector3(-.55*size,topY+.06*size,cupZ-.19*size),new THREE.Vector3(0,topY+.13*size,cupZ-.20*size),new THREE.Vector3(.55*size,topY+.06*size,cupZ-.19*size),new THREE.Vector3(1.22*size,topY-.18*size,cupZ-.15*size),new THREE.Vector3(rightX+.12*size,cupY+.82*size,cupZ-.07*size),new THREE.Vector3(rightX+.20*size,cupY+.50*size,cupZ-.035*size)];
 return new THREE.CatmullRomCurve3(pts,false,"centripetal");
}

function bandSamples(curve,count=52){return Array.from({length:count},(_,i)=>curve.getPoint(i/(count-1)));}
function sphereHalfWidth(y,z,radius=MAX_BREATH_RADIUS){const dy=y-ORB_CENTER.y,dz=z-ORB_CENTER.z;const inside=radius*radius-dy*dy-dz*dz;return inside>0?Math.sqrt(inside):0;}

function padSamples(side,x,y,z,size,innerDepth,ry,rz){
 const innerX=x-side*innerDepth*size;
 const pts=[];
 for(let i=0;i<28;i+=1){const a=i/28*Math.PI*2;pts.push(new THREE.Vector3(innerX,y+Math.cos(a)*ry*size,z+Math.sin(a)*rz*size));}
 pts.push(new THREE.Vector3(innerX,y,z));
 return pts;
}

function rotatedWorstPenetration({leftX,rightX,cupY,cupZ,size,rotation,safety,innerDepth,padRy,padRz,curve}){
 const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(rotation[0],rotation[1],rotation[2],"XYZ"));
 const points=[...padSamples(-1,leftX,cupY,cupZ,size,innerDepth,padRy,padRz),...padSamples(1,rightX,cupY,cupZ,size,innerDepth,padRy,padRz),...bandSamples(curve)];
 let worst=0;
 for(const source of points){const p=source.clone().applyQuaternion(q);const need=MAX_BREATH_RADIUS+safety-p.distanceTo(ORB_CENTER);if(need>worst)worst=need;}
 return worst;
}

function resolveAudioGeometry(audio={},type="earmuffs"){
 const isHeadphones=type==="headphones";
 const size=THREE.MathUtils.clamp(audio.scale??1,.78,1.20);
 const hair=HAIR_CLEARANCE[audio.hairStyle||"none"]??0;
 const cupY=(isHeadphones?.46:.50)+(audio.offsetY||0);
 const cupZ=.02+(audio.offsetZ||0);
 const offsetX=THREE.MathUtils.clamp(audio.offsetX||0,-.16,.16);
 const innerDepth=(isHeadphones?.245:.205);
 const padRy=isHeadphones?.39:.405;
 const padRz=isHeadphones?.30:.305;
 const safety=Math.max(.035,audio.collisionRadius??(isHeadphones?.060:.055))+hair;
 const required=sphereHalfWidth(cupY,cupZ)+innerDepth*size+safety;
 const natural=(isHeadphones?1.94:1.84)*size;
 let leftX=Math.min(-required,-natural)+offsetX;
 let rightX=Math.max(required,natural)+offsetX;
 if(leftX>-required)leftX=-required;
 if(rightX<required)rightX=required;
 let topY=ORB_CENTER.y+MAX_BREATH_RADIUS+(isHeadphones?.22:.18)+hair;
 const rotation=[THREE.MathUtils.clamp(audio.rotationX||0,-.16,.16),THREE.MathUtils.clamp(audio.rotationY||0,-.16,.16),THREE.MathUtils.clamp(audio.rotationZ||0,-.16,.16)];
 const makeCurve=isHeadphones?makeHeadphoneBandCurve:makeEarmuffBandCurve;
 for(let pass=0;pass<7;pass+=1){
  const curve=makeCurve(leftX,rightX,cupY,cupZ,topY,size);
  const worst=rotatedWorstPenetration({leftX,rightX,cupY,cupZ,size,rotation,safety:safety*.65,innerDepth,padRy,padRz,curve});
  if(worst<=.001)break;
  leftX-=worst*.94+.025;rightX+=worst*.94+.025;topY+=worst*.64+.018;
 }
 return {size,leftX,rightX,cupY,cupZ,topY,rotation};
}

export function PremiumEarmuffs({audio={}}){
 const g=resolveAudioGeometry(audio,"earmuffs");
 const curve=useMemo(()=>makeEarmuffBandCurve(g.leftX,g.rightX,g.cupY,g.cupZ,g.topY,g.size),[g.leftX,g.rightX,g.cupY,g.cupZ,g.topY,g.size]);
 const innerCurve=useMemo(()=>makeEarmuffBandCurve(g.leftX+.055*g.size,g.rightX-.055*g.size,g.cupY+.015*g.size,g.cupZ+.015*g.size,g.topY-.055*g.size,g.size),[g.leftX,g.rightX,g.cupY,g.cupZ,g.topY,g.size]);
 const material=audio.material||"iridescent",color=audio.color||"#7FEAFF";
 return <group rotation={g.rotation}>
  <OvalPad side={-1} x={g.leftX} y={g.cupY} z={g.cupZ} size={g.size} color={color} material={material}/><OvalPad side={1} x={g.rightX} y={g.cupY} z={g.cupZ} size={g.size} color={color} material={material}/>
  <mesh><tubeGeometry args={[curve,128,.072*g.size,14,false]}/><AudioMaterial color={color} mode={material} opacity={.84}/></mesh><mesh><tubeGeometry args={[innerCurve,128,.032*g.size,12,false]}/><AudioMaterial color="#DDF8FF" mode={material} opacity={.62} frosted/></mesh>
  <mesh position={[g.leftX-.14*g.size,g.cupY+.38*g.size,g.cupZ-.035*g.size]} rotation={[0,0,-.14]}><capsuleGeometry args={[.045*g.size,.22*g.size,7,12]}/><AudioMaterial color="#AA86FF" mode={material} opacity={.88}/></mesh><mesh position={[g.rightX+.14*g.size,g.cupY+.38*g.size,g.cupZ-.035*g.size]} rotation={[0,0,.14]}><capsuleGeometry args={[.045*g.size,.22*g.size,7,12]}/><AudioMaterial color="#AA86FF" mode={material} opacity={.88}/></mesh>
 </group>;
}

export function PremiumHeadphones({audio={}}){
 const g=resolveAudioGeometry(audio,"headphones");
 const curve=useMemo(()=>makeHeadphoneBandCurve(g.leftX,g.rightX,g.cupY,g.cupZ,g.topY,g.size),[g.leftX,g.rightX,g.cupY,g.cupZ,g.topY,g.size]);
 const rail=useMemo(()=>makeHeadphoneBandCurve(g.leftX+.045*g.size,g.rightX-.045*g.size,g.cupY+.01*g.size,g.cupZ+.025*g.size,g.topY-.055*g.size,g.size),[g.leftX,g.rightX,g.cupY,g.cupZ,g.topY,g.size]);
 const material=audio.material||"iridescent",color=audio.color||"#6FE8FF";
 return <group rotation={g.rotation}>
  <HeadphoneCup side={-1} x={g.leftX} y={g.cupY} z={g.cupZ} size={g.size} color={color} material={material}/><HeadphoneCup side={1} x={g.rightX} y={g.cupY} z={g.cupZ} size={g.size} color={color} material={material}/>
  <mesh><tubeGeometry args={[curve,144,.060*g.size,14,false]}/><AudioMaterial color={color} mode={material} opacity={.88}/></mesh><mesh><tubeGeometry args={[rail,144,.026*g.size,10,false]}/><AudioMaterial color="#D9F8FF" mode={material} opacity={.68} frosted/></mesh>
  <mesh position={[g.leftX-.16*g.size,g.cupY+.67*g.size,g.cupZ-.055*g.size]} rotation={[0,0,-.10]}><capsuleGeometry args={[.035*g.size,.34*g.size,7,12]}/><AudioMaterial color="#9B82FF" mode={material} opacity={.90}/></mesh><mesh position={[g.rightX+.16*g.size,g.cupY+.67*g.size,g.cupZ-.055*g.size]} rotation={[0,0,.10]}><capsuleGeometry args={[.035*g.size,.34*g.size,7,12]}/><AudioMaterial color="#9B82FF" mode={material} opacity={.90}/></mesh>
 </group>;
}

export default function SafeAudioAccessories({audio=null}){
 if(!audio||audio.type==="none")return null;
 if(audio.type==="earmuffs")return <PremiumEarmuffs audio={audio}/>;
 if(audio.type==="headphones")return <PremiumHeadphones audio={audio}/>;
 return null;
}
