"use client";

import React,{useMemo,useRef} from "react";
import * as THREE from "three";
import {useFrame} from "@react-three/fiber";

const GESTURE_NAMES=[
  "rest","soft-open-hand","one-hand-explain","two-hand-explain",
  "small-emphasis","medium-emphasis","gentle-offering","light-presenting",
  "chest-level-open","small-inward-gesture","side-accent","subtle-wrist-turn"
];

const GESTURES={
  rest:{l:[0,0,0,0,0,0,.14],r:[0,0,0,0,0,0,.14]},
  "soft-open-hand":{l:[-.10,.06,-.12,.08,.02,.10,.66],r:[-.20,-.05,.18,-.12,-.03,-.10,.72]},
  "one-hand-explain":{l:[-.05,.02,-.04,.05,0,.04,.30],r:[-.42,-.12,.34,-.28,-.06,-.18,.86]},
  "two-hand-explain":{l:[-.34,.12,-.27,.22,.05,.14,.82],r:[-.38,-.12,.29,-.24,-.05,-.14,.84]},
  "small-emphasis":{l:[-.16,.06,-.10,.12,.03,.10,.52],r:[-.30,-.08,.24,-.22,-.04,-.16,.62]},
  "medium-emphasis":{l:[-.44,.16,-.34,.30,.08,.18,.80],r:[-.48,-.16,.36,-.32,-.08,-.20,.82]},
  "gentle-offering":{l:[-.36,.10,-.22,.24,.04,.22,.92],r:[-.31,-.08,.20,-.20,-.03,-.20,.90]},
  "light-presenting":{l:[-.12,.04,-.08,.08,.02,.08,.48],r:[-.50,-.16,.42,-.30,-.08,-.30,.88]},
  "chest-level-open":{l:[-.46,.18,-.30,.28,.07,.24,.94],r:[-.44,-.18,.31,-.26,-.07,-.24,.94]},
  "small-inward-gesture":{l:[-.26,.12,.12,.24,.06,.18,.64],r:[-.17,-.06,-.10,-.12,-.02,-.08,.46]},
  "side-accent":{l:[-.48,.10,-.42,.20,.04,.28,.78],r:[-.10,-.02,.08,-.08,-.01,-.08,.38]},
  "subtle-wrist-turn":{l:[-.10,.02,-.06,.06,.02,.30,.46],r:[-.13,-.03,.08,-.07,-.02,-.26,.48]}
};

const EMOTION_GESTURE_SCALE={calm:.72,caring:.82,happy:1.06,curious:.96,excited:1.14,sad:.62,warning:.94,error:.98,neutral:.88,surprised:1.06};

function clamp01(v){return Math.max(0,Math.min(1,v));}
function damp(current,target,lambda,delta){return THREE.MathUtils.lerp(current,target,1-Math.exp(-lambda*delta));}

function GlassMat({color="#80E8FF",opacity=.78,glow=.02}){return <meshPhysicalMaterial color={color} transparent opacity={opacity} transmission={.74} thickness={.16} roughness={.055} metalness={0} clearcoat={1} clearcoatRoughness={.02} ior={1.45} iridescence={.78} envMapIntensity={1.8} emissive={color} emissiveIntensity={glow}/>;}

function CurveTube({points,radius=.038,color="#78E8FF",opacity=.78}){
  const curve=useMemo(()=>new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),[points]);
  return <mesh><tubeGeometry args={[curve,32,radius,8,false]}/><GlassMat color={color} opacity={opacity}/></mesh>;
}

function HandRig({mirror=false,openRef,wristRef}){
  const fingers=useRef([]);const sign=mirror?-1:1;
  useFrame((state,delta)=>{
    const open=clamp01(openRef.current??.2);
    fingers.current.forEach((g,i)=>{if(!g)return;const spread=(i-1.5)*.055*open*sign;g.rotation.z=damp(g.rotation.z,spread,10,delta);g.rotation.x=damp(g.rotation.x,(1-open)*.18,10,delta);});
  });
  return <group ref={wristRef}>
    <mesh scale={[.13,.17,.07]}><sphereGeometry args={[1,24,24]}/><GlassMat color="#A1ECFF" opacity={.72}/></mesh>
    {[0,1,2,3].map(i=><group key={i} ref={el=>fingers.current[i]=el} position={[(.035+i*.031)*sign,-.09,0]}><CurveTube radius={.012} color={i%2?"#9DEBFF":"#B77BFF"} points={[[0,0,0],[.012*sign,-.105,.01],[.018*sign,-.215,.015]]}/></group>)}
    <group ref={el=>fingers.current[4]=el} position={[-.04*sign,-.02,.01]} rotation={[0,0,.24*sign]}><CurveTube radius={.013} color="#CE7BFF" points={[[0,0,0],[-.08*sign,-.07,.02],[-.15*sign,-.13,.03]]}/></group>
  </group>;
}

function ArmRig({side="left",shoulderRef,elbowRef,wristRef,openRef}){
  const left=side==="left",sign=left?-1:1;
  const elbow=[sign*.31,-.55,.12];
  const hand=[sign*.21,-.57,.19];
  return <group ref={shoulderRef} position={[sign*1.42,1.40,.03]}>
    <CurveTube color={left?"#70E7FF":"#AD78FF"} points={[[0,0,0],[sign*.15,-.25,.05],elbow]}/>
    <group ref={elbowRef} position={elbow}>
      <CurveTube color={left?"#82E9FF":"#B17DFF"} points={[[0,0,0],[sign*.12,-.27,.08],hand]}/>
      <group position={hand}><HandRig mirror={!left} openRef={openRef} wristRef={wristRef}/></group>
    </group>
  </group>;
}

function Legs(){return <>
  <CurveTube radius={.045} color="#83E7FF" points={[[-.24,-.16,0],[-.24,-.88,0],[-.21,-1.67,0],[-.18,-2.43,0]]}/>
  <CurveTube radius={.045} color="#AE80FF" points={[[.24,-.16,0],[.24,-.88,0],[.21,-1.67,0],[.18,-2.43,0]]}/>
  <mesh position={[-.28,-2.50,.16]} scale={[.29,.10,.38]}><sphereGeometry args={[1,28,28]}/><GlassMat color="#83E8FF" opacity={.76}/></mesh>
  <mesh position={[.28,-2.50,.16]} scale={[.29,.10,.38]}><sphereGeometry args={[1,28,28]}/><GlassMat color="#AE7EFF" opacity={.76}/></mesh>
</>}

function chooseGesture(audio,emotion,last){
  const low=["soft-open-hand","subtle-wrist-turn","small-inward-gesture"];
  const mid=["one-hand-explain","two-hand-explain","gentle-offering","light-presenting","small-emphasis","side-accent"];
  const high=["medium-emphasis","chest-level-open","two-hand-explain","light-presenting","side-accent"];
  let pool=audio<.20?low:audio<.55?mid:high;
  if(emotion==="caring")pool=["gentle-offering","soft-open-hand","one-hand-explain","small-inward-gesture"];
  if(emotion==="calm"||emotion==="sad")pool=["soft-open-hand","subtle-wrist-turn","small-inward-gesture"];
  if(emotion==="happy")pool=["two-hand-explain","gentle-offering","light-presenting","small-emphasis"];
  if(emotion==="curious")pool=["one-hand-explain","side-accent","small-inward-gesture","subtle-wrist-turn"];
  const filtered=pool.filter(x=>x!==last);return filtered[Math.floor(Math.random()*filtered.length)]||pool[0];
}

export function ConversationalBody({state="idle",audioLevel=0,emotion="neutral",enabled=true}){
  const lS=useRef(),lE=useRef(),lW=useRef(),rS=useRef(),rE=useRef(),rW=useRef();
  const lOpen=useRef(.14),rOpen=useRef(.14);
  const gesture=useRef({enabled:true,mode:"speaking",intensity:0,currentGesture:"rest",nextGestureAt:0,handednessBias:"balanced",startedAt:0,duration:1.2});
  const lastAudio=useRef(0);
  useFrame((frame,delta)=>{
    const t=frame.clock.elapsedTime,a=clamp01(audioLevel),g=gesture.current;
    const speech=enabled&&state==="speaking";
    const variation=Math.abs(a-lastAudio.current);lastAudio.current=a;
    if(speech&&t>=g.nextGestureAt){
      const name=chooseGesture(a+variation*.8,emotion,g.currentGesture);
      g.currentGesture=name;g.startedAt=t;g.duration=.72+Math.random()*.72;g.intensity=clamp01(.28+a*.72+variation*.55);
      g.handednessBias=Math.random()<.34?"left":Math.random()<.68?"right":"balanced";
      const pause=.35+(1-a)*.85+Math.random()*.45;g.nextGestureAt=t+g.duration+pause;
    }
    if(!speech)g.currentGesture="rest";
    if(speech&&a<.035&&t-g.startedAt>.30)g.currentGesture="rest";
    const preset=GESTURES[g.currentGesture]||GESTURES.rest;
    const emo=EMOTION_GESTURE_SCALE[emotion]??.88;
    const power=speech?(.55+g.intensity*.45)*emo:(state==="thinking"?.24:state==="listening"?.12:.08);
    const phase=speech?Math.sin(Math.min(1,(t-g.startedAt)/Math.max(.4,g.duration))*Math.PI):0;
    const micro=state==="idle"||state==="listening"||state==="thinking"?Math.sin(t*.55)*.015:0;
    const apply=(ref,arr,offset=0)=>{if(!ref.current)return;ref.current.rotation.x=damp(ref.current.rotation.x,arr[0]*power+micro*.3,6.5,delta);ref.current.rotation.y=damp(ref.current.rotation.y,arr[1]*power,6.5,delta);ref.current.rotation.z=damp(ref.current.rotation.z,arr[2]*power+offset*phase,6.5,delta);};
    apply(lS.current?lS:null,preset.l,-.018);apply(rS.current?rS:null,preset.r,.018);
    if(lE.current){lE.current.rotation.x=damp(lE.current.rotation.x,preset.l[3]*power,7.5,delta);lE.current.rotation.z=damp(lE.current.rotation.z,preset.l[4]*power,7.5,delta);}
    if(rE.current){rE.current.rotation.x=damp(rE.current.rotation.x,preset.r[3]*power,7.5,delta);rE.current.rotation.z=damp(rE.current.rotation.z,preset.r[4]*power,7.5,delta);}
    if(lW.current){lW.current.rotation.z=damp(lW.current.rotation.z,preset.l[5]*power+Math.sin(t*1.3)*.018*power,9,delta);}
    if(rW.current){rW.current.rotation.z=damp(rW.current.rotation.z,preset.r[5]*power+Math.sin(t*1.17+.8)*.018*power,9,delta);}
    lOpen.current=damp(lOpen.current,preset.l[6]*power+.12,7,delta);rOpen.current=damp(rOpen.current,preset.r[6]*power+.12,7,delta);
  });
  return <><ArmRig side="left" shoulderRef={lS} elbowRef={lE} wristRef={lW} openRef={lOpen}/><ArmRig side="right" shoulderRef={rS} elbowRef={rE} wristRef={rW} openRef={rOpen}/><Legs/></>;
}

const VISEME_SHAPES={
  rest:{width:.26,open:.018,round:0,smile:.02,jaw:0,closed:.1},
  aa:{width:.28,open:.17,round:.08,smile:0,jaw:.08,closed:0},
  ee:{width:.36,open:.065,round:0,smile:.14,jaw:.02,closed:0},
  oh:{width:.205,open:.165,round:.85,smile:0,jaw:.06,closed:0},
  fv:{width:.31,open:.035,round:.04,smile:.02,jaw:0,closed:.18},
  mbp:{width:.285,open:.006,round:0,smile:0,jaw:0,closed:1},
  ln:{width:.30,open:.08,round:.06,smile:.02,jaw:.03,closed:.05},
  wq:{width:.19,open:.105,round:.92,smile:0,jaw:.03,closed:.04},
  smile:{width:.37,open:.035,round:0,smile:.22,jaw:0,closed:.05},
  "open-wide":{width:.30,open:.22,round:.10,smile:0,jaw:.10,closed:0},
  closed:{width:.28,open:.002,round:0,smile:0,jaw:0,closed:1}
};
const VISEME_KEYS=Object.keys(VISEME_SHAPES);

function normalizeCue(cue){if(!cue)return null;const c=String(cue).toLowerCase().replaceAll("/","").trim();if(VISEME_SHAPES[c])return c;if(["a","aa","ah"].includes(c))return"aa";if(["e","i","ee"].includes(c))return"ee";if(["o","u","oh"].includes(c))return"oh";if(["f","v","fv"].includes(c))return"fv";if(["m","b","p","mbp"].includes(c))return"mbp";if(["l","n","d","t","ln"].includes(c))return"ln";if(["w","q","wq"].includes(c))return"wq";return null;}

function autoViseme(t,a,bands,deltaAudio){
  if(a<.035)return"rest";
  if(deltaAudio<-.18&&a<.25)return"mbp";
  const low=bands?.low??a*.7,mid=bands?.mid??(.45+.35*Math.sin(t*2.7))*a,high=bands?.high??(.45+.35*Math.sin(t*4.9+1))*a;
  if(low>mid*1.25&&low>high*1.15)return Math.sin(t*5)>0?"oh":"wq";
  if(high>low*1.22&&high>mid*1.08)return Math.sin(t*6.2)>0?"ee":"fv";
  if(deltaAudio>.12)return"ln";
  const seq=["aa","ee","ln","oh","fv","aa","wq","mbp"];
  return seq[Math.floor(t*7.4)%seq.length];
}

export function LipSyncMouth({state="idle",audioLevel=0,audioBands=null,emotion="neutral",visemeCue=null}){
  const mouth=useRef(),upper=useRef(),lower=useRef(),cavity=useRef(),teeth=useRef();
  const weights=useRef(Object.fromEntries(VISEME_KEYS.map(k=>[k,k==="rest"?1:0])));const prevAudio=useRef(0);
  useFrame((frame,delta)=>{
    const t=frame.clock.elapsedTime,a=clamp01(audioLevel),d=a-prevAudio.current;prevAudio.current=a;
    let target=state==="speaking"?(normalizeCue(visemeCue)||autoViseme(t,a,audioBands,d)):emotion==="happy"?"smile":"rest";
    if(state==="speaking"&&a<.025)target="rest";
    const speed=12;VISEME_KEYS.forEach(k=>{const desired=k===target?1:0;weights.current[k]=damp(weights.current[k],desired,speed,delta);});
    const shape={width:0,open:0,round:0,smile:0,jaw:0,closed:0};let total=0;VISEME_KEYS.forEach(k=>{const w=weights.current[k];total+=w;const s=VISEME_SHAPES[k];Object.keys(shape).forEach(p=>shape[p]+=s[p]*w);});total=Math.max(.001,total);Object.keys(shape).forEach(p=>shape[p]/=total);
    const emo=emotion==="calm"?.84:emotion==="caring"?.90:emotion==="happy"?1.05:emotion==="excited"?1.10:.98;const open=shape.open*emo*(.78+a*.42);
    if(mouth.current){mouth.current.scale.x=damp(mouth.current.scale.x,shape.width/.28,14,delta);mouth.current.rotation.z=damp(mouth.current.rotation.z,Math.sin(t*.9)*.006*(state==="speaking"?1:0),10,delta);}
    if(upper.current){upper.current.position.y=damp(upper.current.position.y,.018+open*.50+shape.smile*.045,16,delta);upper.current.scale.y=damp(upper.current.scale.y,.72+shape.round*.55-shape.closed*.25,16,delta);upper.current.scale.x=damp(upper.current.scale.x,1-shape.round*.18+shape.smile*.12,16,delta);}
    if(lower.current){lower.current.position.y=damp(lower.current.position.y,-.018-open*.58-shape.jaw*.08+shape.smile*.018,16,delta);lower.current.scale.y=damp(lower.current.scale.y,.76+shape.round*.42-shape.closed*.30,16,delta);lower.current.scale.x=damp(lower.current.scale.x,1-shape.round*.16+shape.smile*.10,16,delta);}
    if(cavity.current){cavity.current.scale.x=damp(cavity.current.scale.x,.92-shape.round*.24,16,delta);cavity.current.scale.y=damp(cavity.current.scale.y,Math.max(.06,open*5.4),16,delta);cavity.current.visible=open>.012&&shape.closed<.72;}
    if(teeth.current){teeth.current.visible=target==="fv"||target==="ee";teeth.current.position.y=damp(teeth.current.position.y,target==="fv"?-.008:.018,16,delta);}
  });
  return <group ref={mouth} position={[0,.91,1.50]}>
    <mesh ref={cavity} position={[0,-.012,-.025]} scale={[.92,.08,.52]}><sphereGeometry args={[.24,28,20]}/><meshBasicMaterial color="#170A22" transparent opacity={.72}/></mesh>
    <mesh ref={upper} position={[0,.018,.01]} scale={[1,.72,1]}><sphereGeometry args={[.285,.045,.055,32,16]}/><meshPhysicalMaterial color="#FF8FCA" emissive="#D84B9E" emissiveIntensity={.10} roughness={.11} clearcoat={1} transparent opacity={.88}/></mesh>
    <mesh ref={lower} position={[0,-.018,.018]} scale={[1,.76,1]}><sphereGeometry args={[.285,.050,.060,32,16]}/><meshPhysicalMaterial color="#FF79C2" emissive="#C947A2" emissiveIntensity={.08} roughness={.11} clearcoat={1} transparent opacity={.88}/></mesh>
    <mesh ref={teeth} position={[0,.014,.026]} scale={[.16,.018,.025]} visible={false}><boxGeometry args={[1,1,1]}/><meshPhysicalMaterial color="#FFFDF8" roughness={.18}/></mesh>
  </group>;
}

export function SpeakingHeadMotion({state="idle",audioLevel=0,emotion="neutral",children}){
  const ref=useRef();const last=useRef(0);
  useFrame((frame,delta)=>{if(!ref.current)return;const t=frame.clock.elapsedTime,a=clamp01(audioLevel),speech=state==="speaking";const accent=Math.max(0,a-last.current);last.current=a;const emo=emotion==="calm"?.55:emotion==="caring"?.68:emotion==="happy"?1.05:emotion==="curious"?1.08:.82;const rx=speech?(Math.sin(t*.78)*.006+accent*.018)*emo:0;const ry=speech?Math.sin(t*.43+.8)*.010*emo:0;const rz=speech?Math.sin(t*.57)*.007*emo:0;ref.current.rotation.x=damp(ref.current.rotation.x,rx,5,delta);ref.current.rotation.y=damp(ref.current.rotation.y,ry,5,delta);ref.current.rotation.z=damp(ref.current.rotation.z,rz,5,delta);});
  return <group ref={ref}>{children}</group>;
}
