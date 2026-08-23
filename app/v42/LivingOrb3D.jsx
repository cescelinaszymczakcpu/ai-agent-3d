'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useMemo, useRef } from 'react';

export const hairStyles=[];
export const eyeStyles=[];
export const mustacheStyles=[];
export const voicePresets=[];
export const presets={
  femaleAurora:{
    name:'Female Orb · Stage 1–2',gender:'female',primary:'#f7fbff',secondary:'#765cff',accent:'#ff72c8',
    opacity:1,glow:.75,glass:1,limbWidth:.45,armLength:1,legLength:1,
    eyes:false,eyeStyle:'none',eyeColor:'#8a6cff',eyeSize:1,
    hair:false,hairStyle:'none',hairColor:'#9b70ff',mustache:false,mustacheStyle:'none',mustacheColor:'#7b63ff',
    beard:false,mouth:false,voicePreset:'none'
  }
};

const energyVertex=`
varying vec3 vPos;
varying vec3 vNormalW;
uniform float uTime;
uniform float uBreath;
void main(){
  vPos=position;
  vec3 p=position;
  float n1=sin(p.x*3.2+uTime*.24)*sin(p.y*2.7-uTime*.17)*sin(p.z*3.8+uTime*.13);
  float n2=sin((p.x+p.y)*5.0-uTime*.11)*0.35;
  float deform=(n1+n2)*0.018*(0.45+uBreath*0.55);
  p += normal*deform;
  vec4 world=modelMatrix*vec4(p,1.0);
  vNormalW=normalize(mat3(modelMatrix)*normal);
  gl_Position=projectionMatrix*viewMatrix*world;
}`;

const energyFragment=`
varying vec3 vPos;
varying vec3 vNormalW;
uniform float uTime;
uniform float uBreath;
uniform float uIntensity;

vec3 cyan=vec3(0.03,0.90,1.00);
vec3 blue=vec3(0.08,0.32,1.00);
vec3 violet=vec3(0.47,0.20,1.00);
vec3 magenta=vec3(0.96,0.16,0.78);
vec3 pink=vec3(1.00,0.42,0.70);
vec3 warm=vec3(1.00,0.48,0.24);

void main(){
  float t=uTime;
  vec3 p=vPos;
  float f1=sin(p.y*5.2 + sin(p.x*3.0+t*.18)*1.3 - t*.22)*.5+.5;
  float f2=sin(p.x*4.6 + p.z*2.2 - t*.15)*.5+.5;
  float f3=sin((p.x-p.y+p.z)*6.1 + t*.11)*.5+.5;
  float f4=sin((p.x+p.y)*3.3 - p.z*5.0 + t*.08)*.5+.5;

  vec3 c=mix(cyan,violet,f1);
  c=mix(c,magenta,f2*.62);
  c=mix(c,pink,f3*.36);
  c=mix(c,warm,pow(f4,6.0)*.22);
  c=mix(c,blue,(1.0-f2)*.28);

  vec3 V=normalize(cameraPosition - (modelMatrix*vec4(vPos,1.0)).xyz);
  float fres=pow(1.0-max(dot(normalize(vNormalW),V),0.0),2.4);
  float bands=smoothstep(.38,.92,f1*.6+f2*.35+f3*.18);
  float alpha=(.075 + bands*.12 + fres*.075) * (0.82+uBreath*.18) * uIntensity;
  gl_FragColor=vec4(c,alpha);
}`;

function InternalAurora(){
  const mat=useRef();
  const uniforms=useMemo(()=>({
    uTime:{value:0},uBreath:{value:0},uIntensity:{value:1}
  }),[]);
  useFrame(({clock})=>{
    const t=clock.elapsedTime;
    const b=(Math.sin((t/5.0)*Math.PI*2 - Math.PI/2)+1)/2;
    if(mat.current){mat.current.uniforms.uTime.value=t;mat.current.uniforms.uBreath.value=b;}
  });
  return <mesh scale={0.86}>
    <sphereGeometry args={[1,128,128]}/>
    <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={energyVertex} fragmentShader={energyFragment} transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide}/>
  </mesh>;
}

function BreathingOrb(){
  const root=useRef();
  const shell=useRef();
  const halo=useRef();
  const innerGlow=useRef();

  useFrame(({clock})=>{
    const t=clock.elapsedTime;
    // seamless 5s breathing cycle: neutral -> inhale -> exhale -> neutral
    const wave=(Math.sin((t/5.0)*Math.PI*2 - Math.PI/2)+1)/2;
    const breath=THREE.MathUtils.smoothstep(wave,0,1);
    const s=1+breath*.015;
    if(root.current){
      root.current.scale.set(s*(1+breath*.0015),s,s*(1-breath*.0008));
      root.current.rotation.y=.025*Math.sin(t*.10);
      root.current.rotation.z=THREE.MathUtils.degToRad(.18*Math.sin(t*.13));
    }
    if(shell.current){
      shell.current.rotation.y=t*.014;
      shell.current.rotation.x=.006*Math.sin(t*.16);
    }
    if(halo.current){
      halo.current.scale.setScalar(1.0+breath*.018);
      halo.current.material.opacity=.055+breath*.025;
    }
    if(innerGlow.current){
      innerGlow.current.intensity=2.8+breath*.9;
      innerGlow.current.distance=3.3+breath*.35;
    }
  });

  return <group ref={root}>
    <mesh ref={shell}>
      <sphereGeometry args={[1,160,160]}/>
      <MeshTransmissionMaterial
        color="#fbfdff"
        samples={16}
        resolution={1024}
        transmission={1}
        roughness={0.035}
        thickness={1.45}
        ior={1.47}
        chromaticAberration={0.24}
        anisotropy={0.16}
        distortion={0.055}
        distortionScale={0.075}
        temporalDistortion={0.012}
        clearcoat={1}
        clearcoatRoughness={0.018}
        attenuationColor="#ffffff"
        attenuationDistance={2.4}
      />
    </mesh>

    <InternalAurora/>

    <mesh scale={0.73} rotation={[.24,.38,.12]}>
      <sphereGeometry args={[1,96,96]}/>
      <meshPhysicalMaterial
        color="#ffffff" transparent opacity={0.045} transmission={0.72}
        roughness={0.08} thickness={0.55} ior={1.39} clearcoat={1}
        iridescence={1} iridescenceIOR={1.34} iridescenceThicknessRange={[120,620]}
        emissive="#ff6fcf" emissiveIntensity={0.12}
      />
    </mesh>

    <mesh ref={halo} scale={1.055}>
      <sphereGeometry args={[1,96,96]}/>
      <meshBasicMaterial color="#bdf7ff" transparent opacity={0.065} side={THREE.BackSide} blending={THREE.AdditiveBlending}/>
    </mesh>

    <pointLight ref={innerGlow} position={[-.18,.08,.15]} color="#40eaff" intensity={3.2} distance={3.5}/>
    <pointLight position={[.22,-.16,.12]} color="#ff56c8" intensity={2.2} distance={2.8}/>
    <pointLight position={[.08,.20,-.20]} color="#765cff" intensity={2.6} distance={3.0}/>
  </group>;
}

function Scene(){
  return <>
    <color attach="background" args={["#02040b"]}/>
    <ambientLight intensity={0.08}/>
    <directionalLight position={[0,3.2,5]} intensity={1.7} color="#edfaff"/>
    <pointLight position={[-3.2,1.2,2.4]} intensity={28} distance={8} color="#19e6ff"/>
    <pointLight position={[3.0,.8,2.0]} intensity={26} distance={8} color="#c43cff"/>
    <pointLight position={[1.0,-2.6,1.8]} intensity={12} distance={6} color="#ff6e9f"/>
    <pointLight position={[-1.4,-1.7,1.5]} intensity={7} distance={5} color="#ff8a4e"/>

    <Environment resolution={256}>
      <Lightformer form="rect" intensity={5.5} position={[0,3,-4]} scale={[5,1.2,1]}/>
      <Lightformer form="rect" intensity={8} color="#c8fbff" position={[-4,1,1]} rotation={[0,Math.PI/2,0]} scale={[4,.8,1]}/>
      <Lightformer form="rect" intensity={7} color="#ff70d3" position={[4,.5,0]} rotation={[0,-Math.PI/2,0]} scale={[3.5,.7,1]}/>
      <Lightformer form="ring" intensity={4} color="#7c5cff" position={[0,-2,-2]} scale={[3,3,1]}/>
    </Environment>

    <BreathingOrb/>
  </>;
}

export function LivingOrb(){
  return <div className="livingOrbCanvas" aria-label="Stage 1–2 breathing iridescent glass orb">
    <Canvas camera={{position:[0,0,4.6],fov:35}} dpr={[1,2]} gl={{antialias:true,alpha:false,powerPreference:'high-performance',toneMapping:THREE.ACESFilmicToneMapping}}>
      <Scene/>
    </Canvas>
  </div>;
}
