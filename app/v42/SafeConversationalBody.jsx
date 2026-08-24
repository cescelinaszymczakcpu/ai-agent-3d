"use client";

import React,{useRef} from "react";
import * as THREE from "three";
import {useFrame} from "@react-three/fiber";

const ORB_CENTER=new THREE.Vector3(0,.35,0);
const ORB_RADIUS=1.68;
const Y_AXIS=new THREE.Vector3(0,1,0);

const clamp01=v=>THREE.MathUtils.clamp(v,0,1);
const smooth01=v=>{const t=clamp01(v);return t*t*(3-2*t)};
function livingBreath(time,period=5.2){const c=(time%period)/period;if(c<.34)return smooth01(c/.34);if(c<.40)return 1;if(c<.88)return 1-smooth01((c-.40)/.48);return Math.sin(((c-.88)/.12)*Math.PI)*.018;}

function outsideOrb(point,margin=.12){
 const radial=point.clone().sub(ORB_CENTER);
 const min=ORB_RADIUS+margin;
 const len=radial.length();
 if(len<min){
  if(len<.0001)radial.set(1,0,0);
  point.copy(ORB_CENTER).add(radial.normalize().multiplyScalar(min));
 }
 return point;
}

function keepSide(point,side,minX=1.08){
 if(side<0)point.x=Math.min(point.x,-minX);
 else point.x=Math.max(point.x,minX);
 return point;
}

function makeSegmentSafe(a,b,side,margin=.12){
 const out=outsideOrb(keepSide(b.clone(),side),margin);
 for(let pass=0;pass<5;pass+=1){
  let worst=0;
  let push=new THREE.Vector3();
  for(const u of [.22,.42,.62,.82]){
   const sample=a.clone().lerp(out,u);
   const radial=sample.clone().sub(ORB_CENTER);
   const need=ORB_RADIUS+margin-radial.length();
   if(need>worst){worst=need;push=radial.lengthSq()>.0001?radial.normalize():new THREE.Vector3(side,0,0);}
  }
  if(worst<=.001)break;
  out.addScaledVector(push,worst+.025);
  keepSide(out,side);
 }
 return outsideOrb(out,margin);
}

function setBone(mesh,a,b,radius){
 if(!mesh)return;
 const delta=b.clone().sub(a);
 const len=Math.max(.001,delta.length());
 mesh.position.copy(a).add(b).multiplyScalar(.5);
 mesh.scale.set(radius,len,radius);
 mesh.quaternion.setFromUnitVectors(Y_AXIS,delta.normalize());
}

function setHand(group,wrist,elbow,side,turn=0){
 if(!group)return;
 const dir=wrist.clone().sub(elbow).normalize();
 group.position.copy(wrist);
 group.quaternion.setFromUnitVectors(Y_AXIS,dir);
 group.rotateY(side*turn);
 group.rotateZ(side*.10);
}

function LimbMaterial({color="#79E8FF",opacity=.72}){
 return <meshPhysicalMaterial color={color} transparent opacity={opacity} transmission={.76} thickness={.18} roughness={.075} metalness={.01} clearcoat={1} clearcoatRoughness={.025} ior={1.45} iridescence={.72} emissive={color} emissiveIntensity={.018} depthWrite={false}/>;
}

function Bone({boneRef,color,radius=.027}){
 return <mesh ref={boneRef} scale={[radius,1,radius]}><cylinderGeometry args={[1,1,1,16,1,false]}/><LimbMaterial color={color}/></mesh>;
}

function SlenderHand({handRef,side=1,color="#8FEAFF"}){
 return <group ref={handRef}>
  <mesh scale={[.078,.128,.040]}><sphereGeometry args={[1,24,18]}/><LimbMaterial color={color} opacity={.78}/></mesh>
  {[-.045,-.015,.015,.045].map((x,i)=><mesh key={i} position={[x,.165,0]} rotation={[0,0,(x*side)*.8]}><capsuleGeometry args={[.0095,.105,5,9]}/><LimbMaterial color={i%2?"#B58AFF":color} opacity={.78}/></mesh>)}
  <mesh position={[side*.082,.025,.006]} rotation={[0,0,-side*.72]}><capsuleGeometry args={[.0105,.085,5,9]}/><LimbMaterial color="#D08BFF" opacity={.78}/></mesh>
 </group>;
}

function SlenderFoot({footRef,side=1,color="#83E7FF"}){
 return <group ref={footRef}>
  <mesh rotation={[.03,side*.10,0]} scale={[.165,.065,.285]}><sphereGeometry args={[1,30,20]}/><LimbMaterial color={color} opacity={.76}/></mesh>
  <mesh position={[0,.012,.205]} scale={[.135,.048,.115]}><sphereGeometry args={[1,24,16]}/><LimbMaterial color={side<0?"#78E8FF":"#B084FF"} opacity={.67}/></mesh>
 </group>;
}

export default function SafeConversationalBody({state="idle",audioLevel=0,audioBands=null}){
 const root=useRef();
 const lUpper=useRef(),lFore=useRef(),rUpper=useRef(),rFore=useRef();
 const lThigh=useRef(),lShin=useRef(),rThigh=useRef(),rShin=useRef();
 const lHand=useRef(),rHand=useRef(),lFoot=useRef(),rFoot=useRef();
 const smoothAudio=useRef(0),previousAudio=useRef(0);

 useFrame((frame,delta)=>{
  const t=frame.clock.elapsedTime;
  const raw=clamp01(audioLevel||0);
  smoothAudio.current=THREE.MathUtils.damp(smoothAudio.current,raw,10,delta);
  const a=smoothAudio.current;
  const transient=Math.max(0,a-previousAudio.current);
  previousAudio.current=a;
  const mid=clamp01(audioBands?.mid??a*.8);
  const high=clamp01(audioBands?.high??a*.6);
  const speech=state==="speaking"?smooth01((a-.025)/.32):0;
  const accent=clamp01(transient*7+high*.24)*speech;
  const breath=livingBreath(t,5.2);

  if(root.current){
   root.current.position.y=breath*.010;
   root.current.rotation.z=Math.sin(t*.24)*.003;
  }

  const shoulderLift=breath*.016;
  const lShoulder=new THREE.Vector3(-1.765,.79+shoulderLift,.045);
  const rShoulder=new THREE.Vector3(1.765,.79+shoulderLift,.045);

  const lRestElbow=new THREE.Vector3(-2.04,.08,.12);
  const rRestElbow=new THREE.Vector3(2.04,.08,.12);
  const lRestWrist=new THREE.Vector3(-1.97,-.62,.24);
  const rRestWrist=new THREE.Vector3(1.97,-.62,.24);

  const turn=(Math.sin(t*.70)+1)*.5;
  const beat=Math.sin(t*(2.05+mid*1.75));
  const beat2=Math.sin(t*(1.72+mid*1.35)+1.15);
  const lPower=speech*(.70+.30*(1-turn));
  const rPower=speech*(.70+.30*turn);

  const lTargetElbow=new THREE.Vector3(-2.02-.10*lPower,.12+.31*lPower+.08*beat*lPower,.20+.24*lPower);
  const rTargetElbow=new THREE.Vector3(2.02+.10*rPower,.12+.31*rPower+.08*beat2*rPower,.20+.24*rPower);
  const lTargetWrist=new THREE.Vector3(-1.62-.24*lPower,-.42+.72*lPower+.12*beat*lPower,.34+.62*lPower+.10*accent);
  const rTargetWrist=new THREE.Vector3(1.62+.24*rPower,-.42+.72*rPower+.12*beat2*rPower,.34+.62*rPower+.10*accent);

  const lElbow=makeSegmentSafe(lShoulder,lRestElbow.clone().lerp(lTargetElbow,lPower),-1,.105);
  const rElbow=makeSegmentSafe(rShoulder,rRestElbow.clone().lerp(rTargetElbow,rPower),1,.105);
  const lWrist=makeSegmentSafe(lElbow,lRestWrist.clone().lerp(lTargetWrist,lPower),-1,.19);
  const rWrist=makeSegmentSafe(rElbow,rRestWrist.clone().lerp(rTargetWrist,rPower),1,.19);

  setBone(lUpper.current,lShoulder,lElbow,.026);
  setBone(lFore.current,lElbow,lWrist,.022);
  setBone(rUpper.current,rShoulder,rElbow,.026);
  setBone(rFore.current,rElbow,rWrist,.022);
  setHand(lHand.current,lWrist,lElbow,-1,.16+high*.28);
  setHand(rHand.current,rWrist,rElbow,1,.16+high*.28);

  const legBreath=breath*.010;
  const lHip=new THREE.Vector3(-.54,-1.315+legBreath,.035);
  const rHip=new THREE.Vector3(.54,-1.315+legBreath,.035);
  const lKnee=new THREE.Vector3(-.50,-1.95,.07);
  const rKnee=new THREE.Vector3(.50,-1.95,.07);
  const lAnkle=new THREE.Vector3(-.46,-2.56,.10);
  const rAnkle=new THREE.Vector3(.46,-2.56,.10);

  setBone(lThigh.current,lHip,lKnee,.030);
  setBone(lShin.current,lKnee,lAnkle,.024);
  setBone(rThigh.current,rHip,rKnee,.030);
  setBone(rShin.current,rKnee,rAnkle,.024);
  if(lFoot.current){lFoot.current.position.set(-.46,-2.64,.23);lFoot.current.rotation.z=-.025;}
  if(rFoot.current){rFoot.current.position.set(.46,-2.64,.23);rFoot.current.rotation.z=.025;}
 });

 return <group ref={root}>
  <Bone boneRef={lUpper} color="#69E8FF"/><Bone boneRef={lFore} color="#7DDCFF"/>
  <Bone boneRef={rUpper} color="#A07CFF"/><Bone boneRef={rFore} color="#C076FF"/>
  <SlenderHand handRef={lHand} side={-1} color="#79E8FF"/><SlenderHand handRef={rHand} side={1} color="#C184FF"/>
  <Bone boneRef={lThigh} color="#78E8FF"/><Bone boneRef={lShin} color="#86DCFF"/>
  <Bone boneRef={rThigh} color="#9E8AFF"/><Bone boneRef={rShin} color="#B77CFF"/>
  <SlenderFoot footRef={lFoot} side={-1} color="#80E9FF"/><SlenderFoot footRef={rFoot} side={1} color="#A989FF"/>
 </group>;
}
