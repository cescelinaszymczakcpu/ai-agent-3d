"use client";

import React,{useMemo,useRef} from "react";
import * as THREE from "three";
import {Canvas,useFrame} from "@react-three/fiber";
import {ContactShadows,Environment,Lightformer,OrbitControls} from "@react-three/drei";

const STATE_IDS={idle:0,listening:1,thinking:2,speaking:3,success:4,warning:5,error:6};

const EMOTIONS={
 neutral:{a:"#20E8FF",b:"#2864FF",c:"#A445FF",d:"#FF43C6",glow:1.0,energySpeed:1.0,breathSpeed:1.0},
 happy:{a:"#4DF2FF",b:"#39DCCB",c:"#FF71D7",d:"#FFC08E",glow:1.18,energySpeed:1.15,breathSpeed:1.05},
 excited:{a:"#00F6FF",b:"#5A62FF",c:"#D942FF",d:"#FF3FB7",glow:1.30,energySpeed:1.34,breathSpeed:1.14},
 calm:{a:"#72EEE5",b:"#6EB9FF",c:"#AF9EFF",d:"#E0B4FF",glow:.85,energySpeed:.72,breathSpeed:.82},
 caring:{a:"#4FE7F2",b:"#637DFF",c:"#C479FF",d:"#FF8DAE",glow:1.03,energySpeed:.78,breathSpeed:.90},
 sad:{a:"#356CAE",b:"#414BA0",c:"#745AA6",d:"#588DC1",glow:.68,energySpeed:.62,breathSpeed:.78},
 curious:{a:"#3EEFFF",b:"#516CFF",c:"#A74FFF",d:"#D968FF",glow:1.08,energySpeed:1.12,breathSpeed:1},
 surprised:{a:"#A7FAFF",b:"#63CFFF",c:"#C36CFF",d:"#FFFFFF",glow:1.30,energySpeed:1.28,breathSpeed:1.08},
 warning:{a:"#FFBF4D",b:"#FF8257",c:"#CC58FF",d:"#FF5FA6",glow:1.16,energySpeed:1.05,breathSpeed:1},
 error:{a:"#FF4FA5",b:"#A738FF",c:"#FF4868",d:"#704CFF",glow:1.18,energySpeed:1.20,breathSpeed:1.02}
};

const STATE_BEHAVIOR={idle:{speed:1,glow:1},listening:{speed:1.10,glow:1.07},thinking:{speed:1.32,glow:1.08},speaking:{speed:1.16,glow:1.12},success:{speed:1.18,glow:1.20},warning:{speed:1.12,glow:1.14},error:{speed:1.32,glow:1.18}};

const DEFAULT_CONFIG={
 variant:"female",
 orb:{useEmotionColors:true,primaryColor:"#20E8FF",secondaryColor:"#2864FF",accentColor:"#A445FF",fourthColor:"#FF43C6",transmission:.96,roughness:.055,clearcoat:1,clearcoatRoughness:.025,ior:1.46,thickness:.72,iridescence:1,glassOpacity:.34,internalOpacity:.74,breathing:true,breathPeriod:5.2,breathAmount:.018},
 eyes:{enabled:true,style:"reference",size:1,spacing:1,irisColor:"#805CFF",pupilColor:"#050615",eyelashes:true},
 mouth:{enabled:true,style:"soft-smile"},
 hair:{enabled:true,style:"elegant-light-curl",primaryColor:"#8C65FF",secondaryColor:"#E46FFF",accentColor:"#68E9FF",opacity:.78},
 mustache:{enabled:true,style:"reference-curled",primaryColor:"#7F5EFF",accentColor:"#D86FFF"},
 beard:{enabled:false,style:"chin-glow",primaryColor:"#795EFF"},
 body:{armThickness:1,legThickness:1,handScale:1},
 animation:{speed:.48,intensity:.88,amplitude:.52,glow:1,opacity:.76,audioReactive:true,microphoneReactive:true}
};

function clamp01(v){return Math.max(0,Math.min(1,v));}
function mergeConfig(userConfig={}){return {...DEFAULT_CONFIG,...userConfig,orb:{...DEFAULT_CONFIG.orb,...(userConfig.orb||{})},eyes:{...DEFAULT_CONFIG.eyes,...(userConfig.eyes||{})},mouth:{...DEFAULT_CONFIG.mouth,...(userConfig.mouth||{})},hair:{...DEFAULT_CONFIG.hair,...(userConfig.hair||{})},mustache:{...DEFAULT_CONFIG.mustache,...(userConfig.mustache||{})},beard:{...DEFAULT_CONFIG.beard,...(userConfig.beard||{})},body:{...DEFAULT_CONFIG.body,...(userConfig.body||{})},animation:{...DEFAULT_CONFIG.animation,...(userConfig.animation||{})}};}
function mixColor(a,b,amount){return new THREE.Color(a).lerp(new THREE.Color(b),clamp01(amount));}
function randomRange(min,max){return min+Math.random()*(max-min);}
function smootherStep01(x){const t=THREE.MathUtils.clamp(x,0,1);return t*t*t*(t*(t*6-15)+10);}
function getLumeniaBreath(time,period=5.2){const cycle=(time%period)/period;let breath=0;if(cycle<.34)breath=smootherStep01(cycle/.34);else if(cycle<.40)breath=1;else if(cycle<.88)breath=1-smootherStep01((cycle-.40)/(.88-.40));else breath=Math.sin(((cycle-.88)/.12)*Math.PI)*.025;const microLife=Math.sin(time*.73)*.018+Math.sin(time*.31+1.7)*.011;return THREE.MathUtils.clamp(breath+microLife,0,1);}

const ENERGY_VERTEX_SHADER=`
precision highp float;
uniform float uTime;
uniform float uBreath;
uniform float uAmplitude;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vWorldPosition;
void main(){
 vec3 p=position;
 float organicA=sin(p.x*2.7+p.y*1.8+uTime*.55);
 float organicB=sin(p.z*3.2-p.x*1.5+uTime*.37);
 float deformation=(organicA+organicB)*.5;
 float breathingDeformation=(.005+uBreath*.010)*uAmplitude;
 p+=normal*deformation*breathingDeformation;
 vPosition=p;
 vNormal=normalize(normalMatrix*normal);
 vec4 world=modelMatrix*vec4(p,1.0);
 vWorldPosition=world.xyz;
 gl_Position=projectionMatrix*viewMatrix*world;
}`;

const ENERGY_FRAGMENT_SHADER=`
precision highp float;

uniform float uTime;
uniform float uAudio;
uniform float uBreath;
uniform float uGlow;
uniform float uIntensity;
uniform float uOpacity;

uniform int uEffect;
uniform int uState;

uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform vec3 uColorD;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vWorldPosition;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.11,0.17,0.23));
  p *= 17.0;
  return fract(p.x*p.y*p.z*(p.x+p.y+p.z));
}

float noise3(vec3 x) {
  vec3 i=floor(x);
  vec3 f=fract(x);
  f=f*f*(3.0-2.0*f);
  float n000=hash(i+vec3(0.0,0.0,0.0));
  float n100=hash(i+vec3(1.0,0.0,0.0));
  float n010=hash(i+vec3(0.0,1.0,0.0));
  float n110=hash(i+vec3(1.0,1.0,0.0));
  float n001=hash(i+vec3(0.0,0.0,1.0));
  float n101=hash(i+vec3(1.0,0.0,1.0));
  float n011=hash(i+vec3(0.0,1.0,1.0));
  float n111=hash(i+vec3(1.0,1.0,1.0));
  float nx00=mix(n000,n100,f.x);
  float nx10=mix(n010,n110,f.x);
  float nx01=mix(n001,n101,f.x);
  float nx11=mix(n011,n111,f.x);
  float nxy0=mix(nx00,nx10,f.y);
  float nxy1=mix(nx01,nx11,f.y);
  return mix(nxy0,nxy1,f.z);
}

float fbm(vec3 p) {
  float value=0.0;
  float amplitude=0.5;
  for(int i=0;i<5;i++){
    value+=noise3(p)*amplitude;
    p*=2.03;
    amplitude*=0.5;
  }
  return value;
}

float softBlob(vec3 p,vec3 center,float innerRadius,float outerRadius){
  float d=distance(p,center);
  return 1.0-smoothstep(innerRadius,outerRadius,d);
}

void main(){
  float time=uTime;
  vec3 p=vPosition;

  vec3 centerA=vec3(-0.52+sin(time*.31)*.27,0.38+cos(time*.27)*.32,0.12+sin(time*.19)*.20);
  vec3 centerB=vec3(0.46+cos(time*.24+1.3)*.30,0.42+sin(time*.30+.8)*.28,-0.12+cos(time*.21)*.18);
  vec3 centerC=vec3(-0.20+sin(time*.22+2.1)*.42,-0.48+cos(time*.28+.5)*.27,0.18+sin(time*.26)*.16);
  vec3 centerD=vec3(0.48+cos(time*.29+3.4)*.25,-0.30+sin(time*.23+2.8)*.34,0.08+cos(time*.18)*.20);

  float breathExpansion=uBreath*.15;
  float radiusInner=.20+breathExpansion;
  float radiusOuter=1.05+breathExpansion;

  float fieldA=softBlob(p,centerA,radiusInner,radiusOuter);
  float fieldB=softBlob(p,centerB,radiusInner,radiusOuter);
  float fieldC=softBlob(p,centerC,radiusInner,radiusOuter);
  float fieldD=softBlob(p,centerD,radiusInner,radiusOuter);

  float noiseA=fbm(p*1.35+vec3(time*.10,0.0,0.0));
  float noiseB=fbm(p*1.55+vec3(0.0,time*.085,0.0));
  float noiseC=fbm(p*1.25+vec3(0.0,0.0,time*.095));
  float noiseD=fbm(p*1.45+vec3(-time*.075,time*.055,0.0));

  fieldA*=.62+noiseA*.62;
  fieldB*=.62+noiseB*.62;
  fieldC*=.62+noiseC*.62;
  fieldD*=.62+noiseD*.62;

  float auroraA=.5+.5*sin(p.y*4.2+p.x*1.7+noiseA*4.0-time*.62);
  float auroraB=.5+.5*sin(p.x*4.8-p.y*1.3+noiseB*4.5+time*.48);
  fieldA*=.78+auroraA*.30;
  fieldC*=.80+auroraB*.26;

  float voice=uAudio;
  fieldA+=voice*.15;
  fieldB+=voice*.10;
  fieldC+=voice*.18;
  fieldD+=voice*.22;

  if(uState==2){
    float thinkingWave=.5+.5*sin(atan(p.y,p.x)*3.0+length(p.xy)*8.0-time*1.5);
    fieldB+=thinkingWave*.12;
    fieldC+=thinkingWave*.18;
  }

  if(uState==3){
    float voiceRipple=.5+.5*sin(length(p)*11.0-time*3.2);
    fieldA+=voiceRipple*voice*.18;
    fieldB+=voiceRipple*voice*.12;
    fieldC+=voiceRipple*voice*.20;
    fieldD+=voiceRipple*voice*.24;
  }

  fieldA=pow(clamp(fieldA,0.0,1.0),1.35);
  fieldB=pow(clamp(fieldB,0.0,1.0),1.35);
  fieldC=pow(clamp(fieldC,0.0,1.0),1.35);
  fieldD=pow(clamp(fieldD,0.0,1.0),1.35);

  vec3 color=uColorA*fieldA*1.08+uColorB*fieldB*.92+uColorC*fieldC*1.03+uColorD*fieldD;

  float totalField=fieldA+fieldB+fieldC+fieldD;
  if(totalField>1.25){
    color*=1.25/totalField;
    color*=1.28;
  }

  float centerGlow=1.0-smoothstep(.08,1.30,length(p));
  color+=vec3(.72,.90,1.0)*centerGlow*(.035+uBreath*.025);
  color*=1.0+uBreath*.14;
  color*=uGlow*uIntensity;

  float strongestField=max(max(fieldA,fieldB),max(fieldC,fieldD));
  float alpha=(.24+strongestField*.48+centerGlow*.08)*uOpacity;
  gl_FragColor=vec4(color,clamp(alpha,.08,.82));
}`;

function GlassTube({points,radius=.04,color="#8CDFFF",opacity=.80,tubularSegments=64,radialSegments=10}){
 const curve=useMemo(()=>new THREE.CatmullRomCurve3(points.map(([x,y,z=0])=>new THREE.Vector3(x,y,z))),[points]);
 return <mesh><tubeGeometry args={[curve,tubularSegments,radius,radialSegments,false]}/><meshPhysicalMaterial color={color} transparent opacity={opacity} transmission={.74} thickness={.20} roughness={.055} metalness={.04} clearcoat={1} clearcoatRoughness={.025} ior={1.45} iridescence={.85} envMapIntensity={1.9}/></mesh>;
}

function Finger({index,points,color}){const ref=useRef();useFrame(state=>{if(ref.current)ref.current.rotation.z=Math.sin(state.clock.elapsedTime*.72+index*.91)*.018;});return <group ref={ref}><GlassTube points={points} radius={.014} color={color} tubularSegments={18} radialSegments={6} opacity={.76}/></group>;}

function GlassHand({position,rotation=[0,0,0],mirror=false,scale=1}){
 const ref=useRef(),sign=mirror?-1:1;
 useFrame(state=>{if(ref.current)ref.current.rotation.z=rotation[2]+Math.sin(state.clock.elapsedTime*.55)*.018;});
 return <group ref={ref} position={position} rotation={rotation} scale={scale}>
  <mesh scale={[.13,.18,.07]}><sphereGeometry args={[1,28,28]}/><meshPhysicalMaterial color="#A4EFFF" transparent opacity={.70} transmission={.80} roughness={.055} clearcoat={1} clearcoatRoughness={.02} ior={1.45} iridescence={.70}/></mesh>
  {[{x:.03,len:.27,bend:.025},{x:.065,len:.30,bend:.040},{x:.095,len:.28,bend:.055},{x:.118,len:.23,bend:.065}].map((f,index)=><Finger key={index} index={index} color="#8EE8FF" points={[[f.x*sign,-.08,0],[(f.x+f.bend)*sign,-.18,0],[(f.x+f.bend*1.5)*sign,-f.len,0]]}/>)}
  <Finger index={7} color="#D17FFF" points={[[-.04*sign,-.03,0],[-.15*sign,-.10,0],[-.23*sign,-.18,0]]}/>
 </group>;
}

function Eye({x,config,female}){
 if(!config.enabled)return null;
 const scale=config.size,style=config.style;
 const eyeWidth=style==="large"?.47:style==="futuristic"?.39:.42;
 const eyeHeight=style==="large"?.38:.34;
 if(style==="minimal")return <group position={[x,.30,0]} scale={scale}><mesh><sphereGeometry args={[.19,32,32]}/><meshPhysicalMaterial color={config.irisColor} emissive={config.irisColor} emissiveIntensity={.55} roughness={.08} clearcoat={1}/></mesh><mesh position={[0,0,.18]}><sphereGeometry args={[.075,24,24]}/><meshBasicMaterial color={config.pupilColor}/></mesh></group>;
 return <group position={[x,.30,0]} scale={scale}>
  <mesh scale={[eyeWidth,eyeHeight,.15]}><sphereGeometry args={[1,48,48]}/><meshPhysicalMaterial color="#F9FBFF" roughness={.10} clearcoat={1} clearcoatRoughness={.02} transmission={.06}/></mesh>
  <mesh position={[0,0,.16]}><sphereGeometry args={[style==="large"?.245:.22,42,42]}/><meshPhysicalMaterial color={config.irisColor} emissive={config.irisColor} emissiveIntensity={.28} roughness={.04} clearcoat={1} clearcoatRoughness={.015} iridescence={.45}/></mesh>
  <mesh position={[0,0,.345]}><sphereGeometry args={[.098,30,30]}/><meshStandardMaterial color={config.pupilColor} roughness={.12}/></mesh>
  <mesh position={[-.065,.085,.415]}><sphereGeometry args={[.047,18,18]}/><meshBasicMaterial color="#FFFFFF"/></mesh>
  <mesh position={[.055,-.005,.42]}><sphereGeometry args={[.018,14,14]}/><meshBasicMaterial color="#86EFFF"/></mesh>
  {female&&config.eyelashes&&[-2,-1,0,1,2].map(index=>{const lx=index*.085;return <GlassTube key={index} radius={.006} color="#C68BFF" opacity={.90} tubularSegments={10} radialSegments={5} points={[[lx,.29,.09],[lx*1.06,.39+Math.abs(index)*.006,.10]]}/>;})}
 </group>;
}

function Face({variant,config}){
 const eyeContainer=useRef(),nextBlink=useRef(randomRange(3,7)),blinkClock=useRef(0);
 useFrame((state,delta)=>{if(!eyeContainer.current)return;blinkClock.current+=delta;const t=blinkClock.current;let blink=1;if(t>nextBlink.current){const phase=t-nextBlink.current;if(phase<.09)blink=1-phase/.09*.94;else if(phase<.19)blink=.06;else if(phase<.34)blink=.06+(phase-.19)/.15*.94;else{blinkClock.current=0;nextBlink.current=randomRange(3,7);blink=1;}}eyeContainer.current.scale.y=THREE.MathUtils.lerp(eyeContainer.current.scale.y,blink,.58);eyeContainer.current.rotation.y=Math.sin(state.clock.elapsedTime*.37)*.018;eyeContainer.current.rotation.x=Math.sin(state.clock.elapsedTime*.23)*.008;});
 const female=variant==="female",spacing=.48*config.eyes.spacing;
 return <group position={[0,1.25,1.36]}><group ref={eyeContainer}><Eye x={-spacing} female={female} config={config.eyes}/><Eye x={spacing} female={female} config={config.eyes}/></group>{config.eyes.enabled&&config.eyes.style!=="minimal"&&<><GlassTube radius={.013} color="#C38AFF" opacity={.78} points={[[-.78,.69,.08],[-.52,.76,.10],[-.27,.70,.08]]}/><GlassTube radius={.013} color="#C38AFF" opacity={.78} points={[[.27,.70,.08],[.52,.76,.10],[.78,.69,.08]]}/></>}{config.mouth.enabled&&<GlassTube radius={.022} color="#FF9ACC" opacity={.88} tubularSegments={28} points={[[-.25,-.30,.15],[0,-.39,.19],[.25,-.30,.15]]}/>}</group>;
}

function FemaleHair({config}){
 const ref=useRef();useFrame(state=>{if(ref.current){const t=state.clock.elapsedTime;ref.current.rotation.z=Math.sin(t*.28)*.012;ref.current.rotation.y=Math.sin(t*.22)*.018;}});if(!config.enabled||config.style==="none")return null;const a=config.primaryColor,b=config.secondaryColor,c=config.accentColor,opacity=config.opacity;
 return <group ref={ref} position={[0,1.25,0]}><GlassTube radius={.085} color={a} opacity={opacity} points={[[-.92,.98,.10],[-.62,1.37,.14],[-.20,1.62,.16],[.24,1.78,.12],[.73,1.90,.05],[1.16,1.80,0],[1.39,1.53,0],[1.43,1.22,.03]]}/><GlassTube radius={.060} color={b} opacity={opacity} points={[[-.68,1.21,.19],[-.24,1.51,.23],[.24,1.62,.20],[.70,1.48,.13]]}/><GlassTube radius={.056} color={c} opacity={opacity} points={[[1.35,1.27,.04],[1.54,1.22,.05],[1.62,1.37,.05],[1.57,1.52,.05],[1.42,1.56,.05],[1.33,1.47,.05],[1.36,1.37,.05]]}/><GlassTube radius={.043} color="#FF91C8" opacity={.65} points={[[-.52,1.33,.25],[-.08,1.58,.27],[.40,1.63,.22],[.84,1.46,.14]]}/></group>;
}

function MaleHair({config}){if(!config.enabled||config.style==="none")return null;return <group position={[0,1.25,0]}><GlassTube radius={.065} color={config.primaryColor} opacity={config.opacity} points={[[-.95,1.10,.08],[-.42,1.50,.14],[.25,1.57,.10],[.95,1.25,.05]]}/></group>;}
function Mustache({config}){if(!config.enabled)return null;const style=config.style,radius=style==="slim"?.050:style==="classic"?.063:.073,curl=style==="slim"?.18:style==="classic"?.29:.43;return <group position={[0,1.03,1.47]}><GlassTube radius={radius} color={config.primaryColor} opacity={.86} points={[[0,0,0],[-.28,-.03,0],[-.58,-.04,0],[-.89,.07,0],[-1.14,.20,0],[-1.20,curl,0],[-1.10,curl+.10,0]]}/><GlassTube radius={radius} color={config.primaryColor} opacity={.86} points={[[0,0,0],[.28,-.03,0],[.58,-.04,0],[.89,.07,0],[1.14,.20,0],[1.20,curl,0],[1.10,curl+.10,0]]}/></group>;}
function Beard({config}){if(!config.enabled)return null;return <group position={[0,1.25,1.44]}><GlassTube radius={.045} color={config.primaryColor} opacity={.68} points={[[-.55,-.42,0],[-.32,-.72,0],[0,-.83,0],[.32,-.72,0],[.55,-.42,0]]}/></group>;}

function Arms({variant,config}){
 const group=useRef();useFrame(state=>{if(group.current)group.current.rotation.y=Math.sin(state.clock.elapsedTime*.31)*.006;});const thickness=.042*config.body.armThickness,handScale=config.body.handScale,leftPts=variant==="male"?[[-1.45,1.47,0],[-1.80,1.23,0],[-2.06,1.52,0],[-2.18,1.88,0]]:[[-1.45,1.42,0],[-1.80,1.15,0],[-2.05,1.53,0],[-2.17,1.91,0]],rightPts=variant==="male"?[[1.45,1.43,0],[1.86,1.14,0],[1.66,.76,0],[1.37,.58,0]]:[[1.45,1.42,0],[1.78,1.08,0],[1.99,.64,0],[2.07,.32,0]];
 return <group ref={group}><GlassTube radius={thickness} color="#71E4FF" points={leftPts}/><GlassHand position={variant==="male"?[-2.20,1.98,0]:[-2.20,2.02,0]} rotation={[0,0,-1]} scale={handScale}/><GlassTube radius={thickness} color="#AA73FF" points={rightPts}/><GlassHand position={variant==="male"?[1.33,.53,0]:[2.10,.22,0]} rotation={[0,0,variant==="male"?-.30:.34]} mirror scale={handScale}/></group>;
}

function Legs({config}){const radius=.046*config.body.legThickness;return <group><GlassTube radius={radius} color="#83E6FF" points={[[-.25,-.17,0],[-.25,-.86,0],[-.22,-1.67,0],[-.19,-2.46,0]]}/><GlassTube radius={radius} color="#B183FF" points={[[.25,-.17,0],[.25,-.86,0],[.22,-1.67,0],[.19,-2.46,0]]}/><mesh position={[-.29,-2.53,.17]} scale={[.30,.10,.39]}><sphereGeometry args={[1,36,36]}/><meshPhysicalMaterial color="#86E8FF" transparent opacity={.78} transmission={.62} roughness={.045} clearcoat={1} clearcoatRoughness={.02} iridescence={.65}/></mesh><mesh position={[
.29,-2.53,.17]} scale={[.30,.10,.39]}><sphereGeometry args={[1,36,36]}/><meshPhysicalMaterial color="#AE7FFF" transparent opacity={.78} transmission={.62} roughness={.045} clearcoat={1} clearcoatRoughness={.02} iridescence={.65}/></mesh></group>;}

function OrbBody({config,emotion,emotionIntensity,state,audioLevel}){
 const orbGroup=useRef(),energyMaterial=useRef(),glassMaterial=useRef(),shellRef=useRef(),energyRef=useRef(),coreRef=useRef(),haloRef=useRef(),coreMaterialRef=useRef(),haloMaterialRef=useRef();
 const emotionData=EMOTIONS[emotion]||EMOTIONS.neutral,neutral=EMOTIONS.neutral;
 const palette=useMemo(()=>config.orb.useEmotionColors?{a:mixColor(neutral.a,emotionData.a,emotionIntensity),b:mixColor(neutral.b,emotionData.b,emotionIntensity),c:mixColor(neutral.c,emotionData.c,emotionIntensity),d:mixColor(neutral.d,emotionData.d,emotionIntensity)}:{a:new THREE.Color(config.orb.primaryColor),b:new THREE.Color(config.orb.secondaryColor),c:new THREE.Color(config.orb.accentColor),d:new THREE.Color(config.orb.fourthColor)},[config.orb.useEmotionColors,config.orb.primaryColor,config.orb.secondaryColor,config.orb.accentColor,config.orb.fourthColor,emotion,emotionIntensity]);
 const uniforms=useMemo(()=>({uTime:{value:0},uAudio:{value:0},uBreath:{value:0},uGlow:{value:1},uIntensity:{value:1},uOpacity:{value:config.orb.internalOpacity},uAmplitude:{value:config.animation.amplitude},uEffect:{value:8},uState:{value:STATE_IDS[state]??0},uColorA:{value:palette.a.clone()},uColorB:{value:palette.b.clone()},uColorC:{value:palette.c.clone()},uColorD:{value:palette.d.clone()}}),[]);

 useFrame((frameState,delta)=>{
  const time=frameState.clock.elapsedTime;
  const stateBehavior=STATE_BEHAVIOR[state]||STATE_BEHAVIOR.idle;
  const breath=config.orb.breathing?getLumeniaBreath(time,config.orb.breathPeriod||5.2):0;

  const shellExpansion=1+breath*.018;
  if(shellRef.current)shellRef.current.scale.set(shellExpansion*(1+breath*.0015),shellExpansion*(1+breath*.003),shellExpansion);
  if(energyRef.current)energyRef.current.scale.setScalar(1+breath*.038);
  if(coreRef.current)coreRef.current.scale.setScalar(1+breath*.075);
  if(coreMaterialRef.current)coreMaterialRef.current.opacity=.018+breath*.075+audioLevel*.04;
  if(haloRef.current)haloRef.current.scale.setScalar(1+breath*.055);
  if(haloMaterialRef.current)haloMaterialRef.current.opacity=.025+breath*.055+audioLevel*.025;
  if(orbGroup.current){orbGroup.current.position.y=1.25+breath*.018;orbGroup.current.rotation.z=Math.sin(time*.24)*.0035;}

  if(!energyMaterial.current)return;
  const animation=config.animation;
  const effectiveAudio=animation.audioReactive?(state==="speaking"?audioLevel:(state==="listening"&&animation.microphoneReactive?audioLevel*.48:0)):0;
  const targetGlow=emotionData.glow*stateBehavior.glow*animation.glow*(1+breath*.08);
  const u=energyMaterial.current.uniforms;
  u.uTime.value=time*animation.speed*emotionData.energySpeed*stateBehavior.speed;
  u.uAudio.value=THREE.MathUtils.lerp(u.uAudio.value,effectiveAudio,Math.min(1,delta*8));
  u.uBreath.value=THREE.MathUtils.lerp(u.uBreath.value,breath,Math.min(1,delta*5));
  u.uGlow.value=THREE.MathUtils.lerp(u.uGlow.value,targetGlow,Math.min(1,delta*2.2));
  u.uIntensity.value=THREE.MathUtils.lerp(u.uIntensity.value,animation.intensity,Math.min(1,delta*2.5));
  u.uOpacity.value=THREE.MathUtils.lerp(u.uOpacity.value,animation.opacity,Math.min(1,delta*3));
  u.uAmplitude.value=THREE.MathUtils.lerp(u.uAmplitude.value,animation.amplitude,Math.min(1,delta*3));
  u.uState.value=STATE_IDS[state]??0;
  const cs=Math.min(1,delta*1.8);
  u.uColorA.value.lerp(palette.a,cs);u.uColorB.value.lerp(palette.b,cs);u.uColorC.value.lerp(palette.c,cs);u.uColorD.value.lerp(palette.d,cs);
  if(glassMaterial.current){glassMaterial.current.emissive.copy(palette.a);glassMaterial.current.emissiveIntensity=.025+breath*.018+effectiveAudio*.04;}
 });

 return <group ref={orbGroup} position={[0,1.25,0]}>
  <mesh ref={energyRef} scale={.955}><sphereGeometry args={[1.50,96,96]}/><shaderMaterial ref={energyMaterial} vertexShader={ENERGY_VERTEX_SHADER} fragmentShader={ENERGY_FRAGMENT_SHADER} uniforms={uniforms} transparent depthWrite={false} side={THREE.DoubleSide} blending={THREE.NormalBlending}/></mesh>
  <mesh ref={coreRef} scale={.67}><sphereGeometry args={[1.20,64,64]}/><meshBasicMaterial ref={coreMaterialRef} color="#FFFFFF" transparent opacity={.018} blending={THREE.AdditiveBlending} depthWrite={false}/></mesh>
  <mesh ref={shellRef}><sphereGeometry args={[1.56,96,96]}/><meshPhysicalMaterial ref={glassMaterial} color="#D7FAFF" emissive="#4BDFFF" emissiveIntensity={.025} transparent opacity={config.orb.glassOpacity} transmission={config.orb.transmission} thickness={config.orb.thickness} roughness={config.orb.roughness} metalness={0} clearcoat={config.orb.clearcoat} clearcoatRoughness={config.orb.clearcoatRoughness} ior={config.orb.ior} iridescence={config.orb.iridescence} iridescenceIOR={1.30} envMapIntensity={1.85} attenuationDistance={3.2} attenuationColor="#F5FBFF"/></mesh>
  <mesh ref={haloRef} scale={1.045}><sphereGeometry args={[1.56,64,64]}/><meshBasicMaterial ref={haloMaterialRef} color="#72DEFF" transparent opacity={.025} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false}/></mesh>
 </group>;
}

function CharacterModel({config,emotion,emotionIntensity,state,audioLevel}){
 const root=useRef();useFrame(frameState=>{if(root.current){const t=frameState.clock.elapsedTime;root.current.position.y=Math.sin(t*.58)*.018;root.current.rotation.z=Math.sin(t*.29)*.007;root.current.rotation.y=Math.sin(t*.22)*.015;}});
 const variant=config.variant;
 return <group ref={root}><OrbBody config={config} emotion={emotion} emotionIntensity={emotionIntensity} state={state} audioLevel={audioLevel}/><Face variant={variant} config={config}/>{variant==="female"&&<FemaleHair config={config.hair}/>} {variant==="male"&&<><MaleHair config={config.hair}/><Mustache config={config.mustache}/><Beard config={config.beard}/></>} {variant!=="neutral"&&<><Arms variant={variant} config={config}/><Legs config={config}/></>}</group>;
}

function StudioEnvironment(){return <><ambientLight intensity={.26}/><directionalLight position={[-4,5,5]} color="#65EAFF" intensity={3.6}/><directionalLight position={[4,3,2]} color="#D66AFF" intensity={3.1}/><pointLight position={[0,-2,4]} color="#FF86C2" intensity={7} distance={9}/><pointLight position={[-1.2,4.6,3.5]} color="#FFFFFF" intensity={4.5} distance={9}/><pointLight position={[3.8,1.9,-1.5]} color="#FF9B73" intensity={4.2} distance={10}/><Environment resolution={256}><group><Lightformer form="rect" intensity={3.2} color="#DDFBFF" position={[-4,4,4]} scale={[4,1,1]}/><Lightformer form="rect" intensity={2.2} color="#60E8FF" position={[-5,0,2]} rotation={[0,Math.PI/2,0]} scale={[5,1,1]}/><Lightformer form="rect" intensity={2.2} color="#DE6CFF" position={[5,1,2]} rotation={[0,-Math.PI/2,0]} scale={[5,1,1]}/><Lightformer form="rect" intensity={1.4} color="#FF9D83" position={[2,-3,3]} scale={[2.5,1,1]}/></group></Environment></>;}

function OrbScene({config,emotion,emotionIntensity,state,audioLevel,enableOrbit=false}){return <><color attach="background" args={["#030713"]}/><fog attach="fog" args={["#030713",11,18]}/><StudioEnvironment/><CharacterModel config={config} emotion={emotion} emotionIntensity={emotionIntensity} state={state} audioLevel={audioLevel}/><ContactShadows position={[0,-2.64,0]} scale={7} opacity={.22} blur={2.5} far={5}/>{enableOrbit&&<OrbitControls target={[0,.25,0]} enablePan={false} enableDamping dampingFactor={.08} minDistance={6.4} maxDistance={10}/>}</>;}

export function LivingOrbCharacter({config:userConfig={},emotion="neutral",emotionIntensity=1,state="idle",audioLevel=0,enableOrbit=false,style={},className=""}){
 const config=useMemo(()=>mergeConfig(userConfig),[userConfig]);
 return <div className={className} style={{width:"100%",height:"100%",minHeight:600,background:"#030713",overflow:"hidden",...style}}><Canvas dpr={[1,1.65]} camera={{position:[0,.20,8.4],fov:38,near:.1,far:50}} gl={{antialias:true,alpha:false,powerPreference:"high-performance"}}><OrbScene config={config} emotion={emotion} emotionIntensity={emotionIntensity} state={state} audioLevel={clamp01(audioLevel)} enableOrbit={enableOrbit}/></Canvas></div>;
}

export default LivingOrbCharacter;
