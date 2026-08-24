"use client";

import React,{useMemo,useRef} from "react";
import * as THREE from "three";
import {Canvas,useFrame} from "@react-three/fiber";
import {ContactShadows,Environment,Lightformer,OrbitControls} from "@react-three/drei";

const EMOTIONS={
 neutral:{colors:["#24E7FF","#2867FF","#A347FF","#FF43C4"],glow:1,flowSpeed:1,breathSpeed:1},
 happy:{colors:["#2CF4FF","#39DCC8","#FF57CC","#FFB47E"],glow:1.15,flowSpeed:1.12,breathSpeed:1.04},
 caring:{colors:["#54E8F4","#637CFF","#C477FF","#FF8EAE"],glow:1.02,flowSpeed:.82,breathSpeed:.90},
 calm:{colors:["#65EAD9","#63B8FF","#9C8FFF","#DDA4FF"],glow:.88,flowSpeed:.70,breathSpeed:.84},
 curious:{colors:["#35F0FF","#406CFF","#A34DFF","#DC58FF"],glow:1.08,flowSpeed:1.16,breathSpeed:1},
 excited:{colors:["#00F6FF","#425DFF","#CD38FF","#FF35A9"],glow:1.25,flowSpeed:1.30,breathSpeed:1.10},
 sad:{colors:["#367AAE","#3859B8","#6550A8","#835B9D"],glow:.72,flowSpeed:.62,breathSpeed:.80},
 surprised:{colors:["#A8FAFF","#46BDFF","#B855FF","#FF75DF"],glow:1.27,flowSpeed:1.30,breathSpeed:1.08},
 warning:{colors:["#FFBF44","#FF7A4A","#C454FF","#FF568D"],glow:1.14,flowSpeed:1.05,breathSpeed:1},
 error:{colors:["#FF419C","#9E3DFF","#FF486A","#694AFF"],glow:1.17,flowSpeed:1.20,breathSpeed:1}
};

const STATE_IDS={idle:0,listening:1,thinking:2,speaking:3,success:4,warning:5,error:6};
const STATE_SPEED={idle:1,listening:1.08,thinking:1.25,speaking:1.12,success:1.14,warning:1.08,error:1.22};

function smootherStep01(value){const t=THREE.MathUtils.clamp(value,0,1);return t*t*t*(t*(t*6-15)+10);}

function getIOS26Pulse(time,period=3.6){
  const cycle=(time%period)/period;
  let pulse=0;
  if(cycle<.30){pulse=smootherStep01(cycle/.30);}
  else if(cycle<.46){const p=(cycle-.30)/.16;pulse=1-Math.sin(p*Math.PI)*.04;}
  else if(cycle<.86){const p=(cycle-.46)/.40;pulse=1-smootherStep01(p);}
  else{const p=(cycle-.86)/.14;pulse=Math.sin(p*Math.PI)*.018;}
  const micro=Math.sin(time*.92)*.012+Math.sin(time*.41+1.7)*.008;
  return THREE.MathUtils.clamp(pulse+micro,0,1);
}

const ENERGY_VERTEX_SHADER=`
precision highp float;
uniform float uTime;uniform float uBreath;varying vec3 vPosition;varying vec3 vNormal;
void main(){vec3 p=position;float a=sin(position.y*3.1+position.x*1.7+uTime*.34);float b=sin(position.z*3.7-position.y*1.4+uTime*.27);p+=normal*((a+b)*.0035*(.35+uBreath));vPosition=p;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;

const ENERGY_FRAGMENT_SHADER=`
precision highp float;
uniform float uTime;uniform float uAudio;uniform float uBreath;uniform float uGlow;uniform float uColorFlowSpeed;uniform float uFlowIntensity;uniform int uState;uniform vec3 uColorA;uniform vec3 uColorB;uniform vec3 uColorC;uniform vec3 uColorD;varying vec3 vPosition;varying vec3 vNormal;
float hash31(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=hash31(i+vec3(0,0,0)),b=hash31(i+vec3(1,0,0)),c=hash31(i+vec3(0,1,0)),d=hash31(i+vec3(1,1,0)),e=hash31(i+vec3(0,0,1)),f1=hash31(i+vec3(1,0,1)),g=hash31(i+vec3(0,1,1)),h=hash31(i+vec3(1,1,1));return mix(mix(mix(a,b,f.x),mix(c,d,f.x),f.y),mix(mix(e,f1,f.x),mix(g,h,f.x),f.y),f.z);}float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=noise3(p)*a;p*=2.02;a*=.5;}return v;}float blob(vec3 p,vec3 c,float r){return 1.-smoothstep(r*.20,r,length(p-c));}
vec3 paletteWheel(float phase){float p=fract(phase),s=p*4.;if(s<1.)return mix(uColorA,uColorB,smoothstep(0.,1.,s));if(s<2.)return mix(uColorB,uColorC,smoothstep(0.,1.,s-1.));if(s<3.)return mix(uColorC,uColorD,smoothstep(0.,1.,s-2.));return mix(uColorD,uColorA,smoothstep(0.,1.,s-3.));}
void main(){float time=uTime;vec3 p=vPosition;float colorClock=time*uColorFlowSpeed;vec3 ca=vec3(-.58+sin(time*.31)*.38,.43+cos(time*.27)*.32,.12+sin(time*.19)*.17);vec3 cb=vec3(.52+cos(time*.24+1.7)*.34,.33+sin(time*.29+.6)*.38,-.10+cos(time*.17)*.16);vec3 cc=vec3(-.28+sin(time*.22+2.4)*.45,-.52+cos(time*.26+.8)*.30,.15+sin(time*.23)*.18);vec3 cd=vec3(.53+cos(time*.27+3.5)*.32,-.32+sin(time*.21+2.5)*.36,.11+cos(time*.20)*.16);float r=1.03+uBreath*.21;float na=fbm(p*1.42+vec3(time*.085,0,0)),nb=fbm(p*1.56+vec3(0,time*.073,0)),nc=fbm(p*1.38+vec3(0,0,time*.081)),nd=fbm(p*1.49+vec3(-time*.062,time*.051,0));float fa=blob(p,ca,r)*(.57+na*.66),fb=blob(p,cb,r)*(.57+nb*.66),fc=blob(p,cc,r)*(.57+nc*.66),fd=blob(p,cd,r)*(.57+nd*.66);fa*=.80+.28*sin(p.y*3.6+na*4.-time*.58);fb*=.80+.26*sin(p.x*4.2-nb*3.8+time*.47);fc*=.80+.28*sin(p.y*4.+p.x*1.5+time*.52);fd*=.80+.26*sin(p.x*3.7-p.y*1.4-time*.49);vec3 colA=paletteWheel(colorClock),colB=paletteWheel(colorClock+.25),colC=paletteWheel(colorClock+.50),colD=paletteWheel(colorClock+.75);if(uState==2){float ang=atan(p.y,p.x);float spiral=.5+.5*sin(ang*4.+length(p.xy)*8.-time*1.65);fb+=spiral*.11;fc+=spiral*.16;}if(uState==1){float inward=1.-smoothstep(.15,1.45,length(p));fa+=inward*uAudio*.15;fb+=inward*uAudio*.10;}if(uState==3){float ripple=.5+.5*sin(length(p)*12.-time*3.5);fa+=ripple*uAudio*.18;fb+=ripple*uAudio*.14;fc+=ripple*uAudio*.20;fd+=ripple*uAudio*.23;}float wa=pow(max(fa,0.),1.45),wb=pow(max(fb,0.),1.45),wc=pow(max(fc,0.),1.45),wd=pow(max(fd,0.),1.45),total=wa+wb+wc+wd+.0001;vec3 living=(colA*wa+colB*wb+colC*wc+colD*wd)/total;float strongest=max(max(wa,wb),max(wc,wd));float pulseBloom=uBreath*.22;float brightness=.68+strongest*.82+pulseBloom+uAudio*.24;living*=brightness*uGlow*uFlowIntensity;float pearl=1.-smoothstep(.05,1.,length(p));living+=vec3(.86,.94,1.)*pearl*.035;float alpha=.24+strongest*.50+uBreath*.055;gl_FragColor=vec4(living,clamp(alpha,.08,.79));}`;

function GlassTube({points,radius=.04,color="#85DFFF",opacity=.78}){const curve=useMemo(()=>new THREE.CatmullRomCurve3(points.map(([x,y,z=0])=>new THREE.Vector3(x,y,z))),[points]);return <mesh><tubeGeometry args={[curve,64,radius,10,false]}/><meshPhysicalMaterial color={color} transparent opacity={opacity} transmission={.76} thickness={.18} roughness={.055} metalness={0} clearcoat={1} clearcoatRoughness={.02} ior={1.45} iridescence={.75} envMapIntensity={1.8}/></mesh>;}

function Eye({x,female=true}){return <group position={[x,1.56,1.40]}><mesh scale={[.41,.34,.15]}><sphereGeometry args={[1,48,48]}/><meshPhysicalMaterial color="#FCFCFF" roughness={.08} clearcoat={1} transmission={.05}/></mesh><mesh position={[0,0,.16]}><sphereGeometry args={[.215,40,40]}/><meshPhysicalMaterial color="#825BFF" emissive="#6540E8" emissiveIntensity={.25} roughness={.035} clearcoat={1} iridescence={.35}/></mesh><mesh position={[0,0,.345]}><sphereGeometry args={[.095,30,30]}/><meshBasicMaterial color="#050616"/></mesh><mesh position={[-.066,.082,.41]}><sphereGeometry args={[.044,18,18]}/><meshBasicMaterial color="#FFFFFF"/></mesh>{female&&[-2,-1,0,1,2].map(i=><GlassTube key={i} radius={.006} color="#CB91FF" opacity={.9} points={[[i*.073,.28,.07],[i*.078,.38,.08]]}/>)}</group>;}

function Face({variant,showMustache}){const eyes=useRef(),nextBlink=useRef(3+Math.random()*4),timer=useRef(0);useFrame((state,delta)=>{if(!eyes.current)return;timer.current+=delta;let blink=1;if(timer.current>nextBlink.current){const phase=timer.current-nextBlink.current;if(phase<.10)blink=1-phase/.10*.94;else if(phase<.18)blink=.06;else if(phase<.32)blink=.06+(phase-.18)/.14*.94;else{timer.current=0;nextBlink.current=3+Math.random()*4;}}eyes.current.scale.y=THREE.MathUtils.lerp(eyes.current.scale.y,blink,.6);eyes.current.rotation.y=Math.sin(state.clock.elapsedTime*.31)*.015;});return <><group ref={eyes}><Eye x={-.49} female={variant==="female"}/><Eye x={.49} female={variant==="female"}/></group><GlassTube radius={.013} color="#C18AFF" points={[[ -.77,1.98,1.40],[-.52,2.05,1.45],[-.28,1.99,1.42]]}/><GlassTube radius={.013} color="#C18AFF" points={[[.28,1.99,1.42],[.52,2.05,1.45],[.77,1.98,1.40]]}/><GlassTube radius={.019} color="#FF91CA" points={[[ -.23,.91,1.48],[0,.82,1.53],[.23,.91,1.48]]}/>{variant==="male"&&showMustache&&<Mustache/>}</>;}

function FemaleHair(){const group=useRef();useFrame(state=>{if(group.current){const t=state.clock.elapsedTime;group.current.rotation.z=Math.sin(t*.25)*.010;group.current.rotation.y=Math.sin(t*.18)*.014;}});return <group ref={group} position={[0,1.25,0]}><GlassTube radius={.080} color="#8664FF" points={[[ -.90,.98,.10],[-.55,1.42,.14],[-.08,1.69,.16],[.40,1.82,.10],[.88,1.86,.04],[1.28,1.64,.02],[1.43,1.32,.03]]}/><GlassTube radius={.054} color="#DD6CFF" opacity={.70} points={[[ -.62,1.26,.19],[-.17,1.56,.22],[.30,1.59,.18],[.72,1.41,.12]]}/><GlassTube radius={.050} color="#66E8FF" points={[[1.35,1.30,.04],[1.56,1.25,.04],[1.64,1.41,.04],[1.57,1.55,.04],[1.42,1.58,.04],[1.34,1.48,.04],[1.38,1.39,.04]]}/></group>;}

function Mustache(){return <group position={[0,1.05,1.48]}><GlassTube radius={.069} color="#7B59FF" points={[[0,0,0],[-.30,-.02,0],[-.62,-.03,0],[-.93,.08,0],[-1.16,.23,0],[-1.20,.39,0],[-1.10,.47,0]]}/><GlassTube radius={.069} color="#7B59FF" points={[[0,0,0],[.30,-.02,0],[.62,-.03,0],[.93,.08,0],[1.16,.23,0],[1.20,.39,0],[1.10,.47,0]]}/><GlassTube radius={.020} color="#E272FF" points={[[ -.03,.03,.03],[-.47,.03,.03],[-.91,.17,.03],[-1.08,.36,.03]]}/><GlassTube radius={.020} color="#62E8FF" points={[[.03,.03,.03],[.47,.03,.03],[.91,.17,.03],[1.08,.36,.03]]}/></group>;}

function Hand({position,mirror=false}){const sign=mirror?-1:1;return <group position={position}><mesh scale={[.12,.17,.065]}><sphereGeometry args={[1,28,28]}/><meshPhysicalMaterial color="#9EEFFF" transparent opacity={.70} transmission={.76} roughness={.05} clearcoat={1} iridescence={.6}/></mesh>{[0,1,2,3].map(i=>{const x=.025+i*.028;return <GlassTube key={i} radius={.013} color="#8FEAFF" points={[[x*sign,-.08,0],[(x+.015*i)*sign,-.18,0],[(x+.02*i)*sign,-.27+i*.012,0]]}/>;})}<GlassTube radius={.014} color="#CE7BFF" points={[[ -.04*sign,-.03,0],[-.14*sign,-.10,0],[-.22*sign,-.17,0]]}/></group>;}

function Limbs({variant}){return <><GlassTube radius={.041} color="#70E7FF" points={[[ -1.45,1.42,0],[-1.80,1.15,0],[-2.05,1.52,0],[-2.17,1.90,0]]}/><Hand position={[-2.19,2,0]}/><GlassTube radius={.041} color="#AD78FF" points={variant==="male"?[[1.45,1.42,0],[1.82,1.12,0],[1.63,.74,0],[1.38,.57,0]]:[[1.45,1.42,0],[1.78,1.08,0],[1.98,.61,0],[2.06,.31,0]]}/><Hand position={variant==="male"?[1.34,.52,0]:[2.09,.22,0]} mirror/><GlassTube radius={.045} color="#83E7FF" points={[[ -.24,-.16,0],[-.24,-.88,0],[-.21,-1.67,0],[-.18,-2.43,0]]}/><GlassTube radius={.045} color="#AE80FF" points={[[.24,-.16,0],[.24,-.88,0],[.21,-1.67,0],[.18,-2.43,0]]}/><mesh position={[-.28,-2.50,.16]} scale={[.29,.10,.38]}><sphereGeometry args={[1,32,32]}/><meshPhysicalMaterial color="#83E8FF" transparent opacity={.76} transmission={.60} roughness={.04} clearcoat={1} iridescence={.6}/></mesh><mesh position={[.28,-2.50,.16]} scale={[.29,.10,.38]}><sphereGeometry args={[1,32,32]}/><meshPhysicalMaterial color="#AE7EFF" transparent opacity={.76} transmission={.60} roughness={.04} clearcoat={1} iridescence={.6}/></mesh></>;}

function OrbBody({emotion,emotionIntensity,state,audioLevel,colorFlowSpeed,orbColors}){
  const root=useRef(),shell=useRef(),energy=useRef(),halo=useRef(),core=useRef(),shader=useRef(),shellMaterial=useRef();
  const emotionData=EMOTIONS[emotion]||EMOTIONS.neutral;
  const baseColors=useMemo(()=>Array.isArray(orbColors)&&orbColors.length===4?orbColors:EMOTIONS.neutral.colors,[orbColors]);
  const targets=useMemo(()=>baseColors.map((base,index)=>emotion==="neutral"?new THREE.Color(base):new THREE.Color(base).lerp(new THREE.Color(emotionData.colors[index]),emotionIntensity)),[baseColors,emotion,emotionIntensity,emotionData]);
  const uniforms=useMemo(()=>({uTime:{value:0},uAudio:{value:0},uBreath:{value:0},uGlow:{value:1},uColorFlowSpeed:{value:colorFlowSpeed},uFlowIntensity:{value:1},uState:{value:0},uColorA:{value:new THREE.Color(baseColors[0])},uColorB:{value:new THREE.Color(baseColors[1])},uColorC:{value:new THREE.Color(baseColors[2])},uColorD:{value:new THREE.Color(baseColors[3])}}),[]);

  useFrame((frameState,delta)=>{
    const t=frameState.clock.elapsedTime;
    const pulse=getIOS26Pulse(t*emotionData.breathSpeed,3.6);

    if(shell.current){const a=1+pulse*.010;shell.current.scale.set(a*1.001,a*1.0025,a);}
    if(energy.current)energy.current.scale.setScalar(1+pulse*.040);
    if(core.current)core.current.scale.setScalar(1+pulse*.082);
    if(halo.current)halo.current.scale.setScalar(1+pulse*.070);
    if(root.current){root.current.position.y=1.25+pulse*.008;root.current.rotation.z=Math.sin(t*.20)*.003;}

    if(!shader.current)return;
    const u=shader.current.uniforms;
    u.uTime.value=t*emotionData.flowSpeed*(STATE_SPEED[state]||1);
    const targetAudio=state==="speaking"?audioLevel:state==="listening"?audioLevel*.42:0;
    u.uAudio.value=THREE.MathUtils.lerp(u.uAudio.value,targetAudio,Math.min(1,delta*8));
    u.uBreath.value=THREE.MathUtils.lerp(u.uBreath.value,pulse,Math.min(1,delta*7));
    u.uGlow.value=THREE.MathUtils.lerp(u.uGlow.value,emotionData.glow,Math.min(1,delta*2));
    u.uColorFlowSpeed.value=THREE.MathUtils.lerp(u.uColorFlowSpeed.value,colorFlowSpeed,Math.min(1,delta*1.5));
    u.uFlowIntensity.value=state==="speaking"?1.06+audioLevel*.15:1;
    u.uState.value=STATE_IDS[state]??0;
    const tr=Math.min(1,delta*1.15);
    u.uColorA.value.lerp(targets[0],tr);u.uColorB.value.lerp(targets[1],tr);u.uColorC.value.lerp(targets[2],tr);u.uColorD.value.lerp(targets[3],tr);
    if(shellMaterial.current)shellMaterial.current.emissiveIntensity=.012+pulse*.012+audioLevel*.012;
  });

  return <group ref={root} position={[0,1.25,0]}>
    <mesh ref={energy} scale={.955} renderOrder={1}><sphereGeometry args={[1.49,80,80]}/><shaderMaterial ref={shader} vertexShader={ENERGY_VERTEX_SHADER} fragmentShader={ENERGY_FRAGMENT_SHADER} uniforms={uniforms} transparent depthWrite={false} side={THREE.DoubleSide} blending={THREE.NormalBlending}/></mesh>
    <mesh ref={core} scale={.58} renderOrder={0}><sphereGeometry args={[1.16,48,48]}/><meshBasicMaterial color="#F5FBFF" transparent opacity={.028} blending={THREE.AdditiveBlending} depthWrite={false}/></mesh>
    <mesh ref={shell} renderOrder={2}><sphereGeometry args={[1.56,80,80]}/><meshPhysicalMaterial ref={shellMaterial} color="#F8FCFF" emissive="#FFFFFF" emissiveIntensity={.012} transparent opacity={.25} transmission={.96} thickness={.68} roughness={.045} metalness={0} clearcoat={1} clearcoatRoughness={.018} ior={1.46} iridescence={.86} iridescenceIOR={1.30} envMapIntensity={1.75} attenuationColor="#FFFFFF" attenuationDistance={4.5} depthWrite={false}/></mesh>
    <mesh ref={halo} scale={1.025} renderOrder={0}><sphereGeometry args={[1.56,48,48]}/><meshBasicMaterial color="#9D8CFF" transparent opacity={.030} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false}/></mesh>
  </group>;
}

function Character(props){const root=useRef();useFrame(state=>{if(root.current){const t=state.clock.elapsedTime;root.current.position.y=Math.sin(t*.55)*.012;root.current.rotation.y=Math.sin(t*.20)*.012;root.current.rotation.z=Math.sin(t*.27)*.005;}});return <group ref={root}><OrbBody {...props}/><Face variant={props.variant} showMustache={props.showMustache}/>{props.variant==="female"&&<FemaleHair/>}<Limbs variant={props.variant}/></group>;}

function StudioLights(){return <><ambientLight intensity={.22}/><directionalLight position={[-4,5,5]} color="#D8F9FF" intensity={2.6}/><directionalLight position={[4,2,2]} color="#DFA4FF" intensity={1.8}/><pointLight position={[0,-2,4]} color="#FF93C7" intensity={4} distance={10}/><Environment resolution={256}><group><Lightformer form="rect" color="#F4FCFF" intensity={3.5} position={[-4,4,4]} scale={[4,1,1]}/><Lightformer form="rect" color="#63E7FF" intensity={1.8} position={[-5,0,2]} rotation={[0,Math.PI/2,0]} scale={[4,1,1]}/><Lightformer form="rect" color="#D96DFF" intensity={1.8} position={[5,1,2]} rotation={[0,-Math.PI/2,0]} scale={[4,1,1]}/></group></Environment></>;}

function Scene(props){return <><color attach="background" args={["#020611"]}/><StudioLights/><Character {...props}/><ContactShadows position={[0,-2.61,0]} scale={7} opacity={.25} blur={2.5} far={5}/><OrbitControls target={[0,.22,0]} enablePan={false} enableDamping dampingFactor={.08} minDistance={6.6} maxDistance={10}/></>;}

export default function LivingLumeniaOrb({variant="female",emotion="neutral",emotionIntensity=.85,state="idle",audioLevel=0,showMustache=true,colorFlowSpeed=.060,orbColors=null,style={}}){return <div style={{width:"100%",height:"100%",minHeight:650,background:"#020611",overflow:"hidden",...style}}><Canvas dpr={[1,1.5]} camera={{position:[0,.2,8.4],fov:38,near:.1,far:40}} gl={{antialias:true,alpha:false,powerPreference:"high-performance"}} onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.22;gl.outputColorSpace=THREE.SRGBColorSpace;}}><Scene variant={variant} emotion={emotion} emotionIntensity={THREE.MathUtils.clamp(emotionIntensity,0,1)} state={state} audioLevel={THREE.MathUtils.clamp(audioLevel,0,1)} showMustache={showMustache} colorFlowSpeed={THREE.MathUtils.clamp(colorFlowSpeed,.01,.15)} orbColors={orbColors}/></Canvas></div>;}
