'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useMemo, useRef } from 'react';

export const hairStyles=[];
export const eyeStyles=[];
export const mustacheStyles=[];
export const voicePresets=[];
export const presets={
  femaleAurora:{name:'Living Glass Orb v1',gender:'female',primary:'#f8fdff',secondary:'#785cff',accent:'#ff6fcf',opacity:1,glow:.8,glass:1,eyes:false,hair:false,mustache:false,mouth:false}
};

function smooth01(x){ return x*x*(3-2*x); }
function lumeniaBreath(t){
  const c=((t%5.2)+5.2)%5.2;
  if(c<1.9) return smooth01(c/1.9);
  if(c<2.5) return 1;
  return 1-smooth01((c-2.5)/2.7);
}

const auroraVertex=`
varying vec3 vLocal;
varying vec3 vWorld;
varying vec3 vNormalW;
uniform float uTime;
uniform float uBreath;

float hash(vec3 p){
  p=fract(p*0.3183099+.1);
  p*=17.0;
  return fract(p.x*p.y*p.z*(p.x+p.y+p.z));
}
float noise3(vec3 x){
  vec3 i=floor(x);
  vec3 f=fract(x);
  f=f*f*(3.0-2.0*f);
  return mix(
    mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),
    f.z
  );
}
void main(){
  vLocal=position;
  vec3 p=position;
  float t=uTime*.03;
  float n=noise3(p*2.7+vec3(t,-t*.55,t*.35));
  float n2=noise3(p*5.1+vec3(-t*.4,t*.28,-t*.2));
  float organic=(n*.65+n2*.35-.5);
  float deform=organic*(0.018 + uBreath*0.032);
  p += normal*deform;
  p *= 1.0 + uBreath*0.030;
  vec4 world=modelMatrix*vec4(p,1.0);
  vWorld=world.xyz;
  vNormalW=normalize(mat3(modelMatrix)*normal);
  gl_Position=projectionMatrix*viewMatrix*world;
}`;

const auroraFragment=`
varying vec3 vLocal;
varying vec3 vWorld;
varying vec3 vNormalW;
uniform float uTime;
uniform float uBreath;

float hash(vec3 p){
  p=fract(p*0.3183099+.1);
  p*=17.0;
  return fract(p.x*p.y*p.z*(p.x+p.y+p.z));
}
float noise3(vec3 x){
  vec3 i=floor(x);
  vec3 f=fract(x);
  f=f*f*(3.0-2.0*f);
  return mix(
    mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),
    f.z
  );
}
float fbm(vec3 p){
  float v=0.0;
  float a=.52;
  for(int i=0;i<4;i++){
    v+=a*noise3(p);
    p=p*2.02+vec3(4.7,2.3,1.9);
    a*=.5;
  }
  return v;
}
void main(){
  float t=uTime*.03;
  vec3 p=vLocal;
  p*=mix(1.0,.86,uBreath);
  float n1=fbm(p*2.0+vec3(t,-t*.6,t*.3));
  float n2=fbm((p.yzx+vec3(.4,-.1,.2))*2.6+vec3(-t*.45,t*.25,-t*.15));
  float ribbons=smoothstep(.33,.78,n1*.68+n2*.48);
  float wisps=smoothstep(.48,.86,fbm(p*4.2+vec3(t*.2,t*.3,-t*.25)));

  vec3 cyan=vec3(.04,.92,1.00);
  vec3 turquoise=vec3(.02,.72,.86);
  vec3 blue=vec3(.10,.36,1.00);
  vec3 violet=vec3(.48,.22,1.00);
  vec3 magenta=vec3(.92,.16,.74);
  vec3 pink=vec3(1.00,.42,.72);
  vec3 peach=vec3(1.00,.58,.38);

  float y=clamp(p.y*.5+.5,0.0,1.0);
  float x=clamp(p.x*.5+.5,0.0,1.0);
  vec3 col=mix(cyan,blue,smoothstep(.18,.72,n1));
  col=mix(col,violet,smoothstep(.46,.84,n2)*.58);
  col=mix(col,magenta,smoothstep(.62,.92,n1+n2*.28)*.34);
  col=mix(col,pink,smoothstep(.64,.94,wisps)*.24);
  col=mix(col,turquoise,(1.0-y)*.22 + (1.0-x)*.10);
  float warm=pow(max(0.0,fbm(p*5.0+vec3(-t*.15,t*.1,t*.08))-.63),2.0)*4.0;
  col=mix(col,peach,clamp(warm*.16,0.0,.16));

  vec3 V=normalize(cameraPosition-vWorld);
  float fres=pow(1.0-clamp(dot(normalize(vNormalW),V),0.0,1.0),2.15);
  float center=1.0-smoothstep(.30,1.05,length(p.xy));
  float alpha=(.20+ribbons*.24+wisps*.11+fres*.065)*(1.0+uBreath*.18);
  float lum=(1.10+center*.30+uBreath*.18);
  gl_FragColor=vec4(col*lum,alpha);
}`;

function InternalAurora(){
  const mat=useRef();
  const group=useRef();
  const core=useRef();
  const uniforms=useMemo(()=>({uTime:{value:0},uBreath:{value:0}}),[]);
  useFrame(({clock})=>{
    const t=clock.elapsedTime;
    const breath=lumeniaBreath(t);
    if(mat.current){
      mat.current.uniforms.uTime.value=t;
      mat.current.uniforms.uBreath.value=breath;
    }
    if(group.current){
      const e=1+breath*.050;
      group.current.scale.set(e,e*(1+breath*.006),e);
      group.current.rotation.y=t*.012;
      group.current.rotation.z=.018*Math.sin(t*.09);
    }
    if(core.current){
      core.current.scale.setScalar(.69+breath*.055);
      core.current.material.emissiveIntensity=.72+breath*.28;
      core.current.material.opacity=.10+breath*.025;
    }
  });
  return <group ref={group}>
    <mesh scale={.875}>
      <sphereGeometry args={[1,128,128]}/>
      <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={auroraVertex} fragmentShader={auroraFragment} transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide}/>
    </mesh>
    <mesh ref={core} scale={.69} rotation={[.22,-.28,.12]}>
      <sphereGeometry args={[1,96,96]}/>
      <meshPhysicalMaterial color="#8cecff" transparent opacity={.10} roughness={.24} transmission={.30} emissive="#67eaff" emissiveIntensity={.72}/>
    </mesh>
  </group>;
}

function LivingGlassOrb(){
  const shell=useRef();
  const cyan=useRef();
  const magenta=useRef();
  const violet=useRef();

  useFrame(({clock})=>{
    const t=clock.elapsedTime;
    const breath=lumeniaBreath(t);
    const micro=.0012*Math.sin(t*.41)+.0008*Math.sin(t*.73+1.1);
    if(shell.current){
      const sx=1+breath*.035+micro;
      const sy=1+breath*.022+micro*.45;
      const sz=1+breath*.035-micro*.30;
      shell.current.scale.set(sx,sy,sz);
      shell.current.rotation.y=t*.006;
      shell.current.rotation.x=.004*Math.sin(t*.11);
    }
    if(cyan.current) cyan.current.intensity=7.4*(1+breath*.18);
    if(magenta.current) magenta.current.intensity=5.4*(1+breath*.16);
    if(violet.current) violet.current.intensity=4.6*(1+breath*.18);
  });

  return <group>
    <InternalAurora/>

    <mesh ref={shell}>
      <sphereGeometry args={[1,160,160]}/>
      <MeshTransmissionMaterial
        color="#f7fdff"
        samples={20}
        resolution={1024}
        transmission={1}
        roughness={.055}
        thickness={.72}
        ior={1.47}
        chromaticAberration={.10}
        anisotropy={.08}
        distortion={.032}
        distortionScale={.045}
        temporalDistortion={.009}
        clearcoat={1}
        clearcoatRoughness={.022}
        attenuationColor="#f7fdff"
        attenuationDistance={8}
        backside
        backsideThickness={.38}
      />
    </mesh>

    <pointLight ref={cyan} position={[-.34,.08,.05]} color="#37eaff" intensity={7.4} distance={3.2}/>
    <pointLight ref={magenta} position={[.30,-.10,.02]} color="#ff58c9" intensity={5.4} distance={2.9}/>
    <pointLight ref={violet} position={[.08,.22,-.20]} color="#795cff" intensity={4.6} distance={3.0}/>
  </group>;
}

function Scene(){
  return <>
    <color attach="background" args={["#07101d"]}/>
    <hemisphereLight args={["#dff8ff","#130b28",1.65]}/>
    <ambientLight intensity={.42}/>
    <directionalLight position={[0,3.2,5.2]} intensity={2.4} color="#f1fbff"/>
    <directionalLight position={[-4,1.2,2.0]} intensity={2.7} color="#4be9ff"/>
    <directionalLight position={[4,.5,1.2]} intensity={2.25} color="#ff69cf"/>
    <directionalLight position={[1.8,-2.2,2.2]} intensity={.72} color="#ff9b68"/>
    <LivingGlassOrb/>
  </>;
}

export function LivingOrb(){
  return <div className="livingOrbCanvas" aria-label="Living Glass Orb v1">
    <Canvas
      camera={{position:[0,0,5.3],fov:34}}
      dpr={[1,2]}
      gl={{antialias:true,alpha:false,powerPreference:'high-performance',toneMapping:THREE.ACESFilmicToneMapping}}
      onCreated={({gl})=>{gl.toneMappingExposure=1.55; gl.outputColorSpace=THREE.SRGBColorSpace;}}
    >
      <Scene/>
    </Canvas>
  </div>;
}
