'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';

export const hairStyles=[];
export const eyeStyles=[];
export const mustacheStyles=[];
export const voicePresets=[];
export const presets={
  femaleAurora:{name:'Living Glass Orb · Stage 1–3',gender:'female',primary:'#f8fdff',secondary:'#785cff',accent:'#ff6fcf',opacity:1,glow:.8,glass:1,eyes:false,hair:false,mustache:false,mouth:false}
};

function smooth01(x){ return x*x*(3-2*x); }
function lumeniaBreath(t){
  const cycle=5.15;
  const c=((t%cycle)+cycle)%cycle;
  if(c<1.85) return smooth01(c/1.85);
  if(c<2.45) return 1;
  return 1-smooth01((c-2.45)/(cycle-2.45));
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
  float n=noise3(p*2.6+vec3(t,-t*.55,t*.35));
  float n2=noise3(p*5.0+vec3(-t*.4,t*.28,-t*.2));
  float organic=(n*.66+n2*.34-.5);
  p += normal*organic*(0.020+uBreath*0.026);
  p *= 1.0+uBreath*0.026;
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
  vec3 p=vLocal*mix(1.0,.865,uBreath);
  float n1=fbm(p*2.0+vec3(t,-t*.6,t*.3));
  float n2=fbm((p.yzx+vec3(.4,-.1,.2))*2.6+vec3(-t*.45,t*.25,-t*.15));
  float ribbons=smoothstep(.32,.79,n1*.68+n2*.48);
  float wisps=smoothstep(.47,.86,fbm(p*4.2+vec3(t*.2,t*.3,-t*.25)));

  vec3 cyan=vec3(.03,.94,1.00);
  vec3 turquoise=vec3(.02,.75,.88);
  vec3 blue=vec3(.09,.38,1.00);
  vec3 violet=vec3(.49,.22,1.00);
  vec3 magenta=vec3(.94,.16,.76);
  vec3 pink=vec3(1.00,.43,.73);
  vec3 peach=vec3(1.00,.60,.40);

  float y=clamp(p.y*.5+.5,0.0,1.0);
  float x=clamp(p.x*.5+.5,0.0,1.0);
  vec3 col=mix(cyan,blue,smoothstep(.18,.72,n1));
  col=mix(col,violet,smoothstep(.44,.84,n2)*.58);
  col=mix(col,magenta,smoothstep(.62,.92,n1+n2*.28)*.34);
  col=mix(col,pink,smoothstep(.63,.94,wisps)*.25);
  col=mix(col,turquoise,(1.0-y)*.24+(1.0-x)*.11);
  float warm=pow(max(0.0,fbm(p*5.0+vec3(-t*.15,t*.1,t*.08))-.63),2.0)*4.0;
  col=mix(col,peach,clamp(warm*.18,0.0,.18));

  vec3 V=normalize(cameraPosition-vWorld);
  float fres=pow(1.0-clamp(dot(normalize(vNormalW),V),0.0,1.0),2.1);
  float center=1.0-smoothstep(.30,1.05,length(p.xy));
  float alpha=(.22+ribbons*.25+wisps*.12+fres*.07)*(1.0+uBreath*.16);
  float lum=1.14+center*.30+uBreath*.14;
  gl_FragColor=vec4(col*lum,alpha);
}`;

function InternalAurora(){
  const mat=useRef();
  const group=useRef();
  const core=useRef();
  const uniforms=useMemo(()=>({uTime:{value:0},uBreath:{value:0}}),[]);
  useFrame(({clock})=>{
    const t=clock.elapsedTime;
    const b=lumeniaBreath(t);
    if(mat.current){
      mat.current.uniforms.uTime.value=t;
      mat.current.uniforms.uBreath.value=b;
    }
    if(group.current){
      const e=1+b*.036;
      group.current.scale.set(e,e*(1+b*.004),e);
      group.current.rotation.y=t*.010;
      group.current.rotation.z=.014*Math.sin(t*.09);
    }
    if(core.current){
      core.current.scale.setScalar(.68+b*.035);
      core.current.material.emissiveIntensity=.75+b*.16;
      core.current.material.opacity=.095+b*.018;
    }
  });
  return <group ref={group}>
    <mesh scale={.872}>
      <sphereGeometry args={[1,128,128]}/>
      <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={auroraVertex} fragmentShader={auroraFragment} transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide}/>
    </mesh>
    <mesh ref={core} scale={.68} rotation={[.22,-.28,.12]}>
      <sphereGeometry args={[1,96,96]}/>
      <meshPhysicalMaterial color="#a3f5ff" transparent opacity={.095} roughness={.20} transmission={.28} emissive="#63ecff" emissiveIntensity={.75}/>
    </mesh>
  </group>;
}

function useBreathingGlassMaterial(){
  const shaderRef=useRef(null);
  const material=useMemo(()=>{
    const m=new THREE.MeshPhysicalMaterial({
      color:new THREE.Color('#fbfeff'),
      metalness:0,
      roughness:.055,
      transmission:.98,
      thickness:.58,
      ior:1.47,
      clearcoat:1,
      clearcoatRoughness:.025,
      iridescence:1,
      iridescenceIOR:1.32,
      iridescenceThicknessRange:[120,520],
      transparent:true,
      opacity:.96,
      attenuationColor:new THREE.Color('#f7fdff'),
      attenuationDistance:7.5,
      envMapIntensity:1.25,
      side:THREE.FrontSide
    });
    if('dispersion' in m) m.dispersion=.11;
    m.onBeforeCompile=(shader)=>{
      shader.uniforms.uBreath={value:0};
      shader.uniforms.uTime={value:0};
      shaderRef.current=shader;
      shader.vertexShader=shader.vertexShader
        .replace('#include <common>',`#include <common>\nuniform float uBreath;\nuniform float uTime;\nfloat orbHash(vec3 p){p=fract(p*.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}`)
        .replace('#include <begin_vertex>',`vec3 transformed=vec3(position);\nfloat drift=uTime*.035;\nfloat n1=orbHash(normalize(position)*3.7+vec3(drift,-drift*.6,drift*.3));\nfloat n2=orbHash(normalize(position)*7.1+vec3(-drift*.35,drift*.22,-drift*.18));\nfloat micro=(n1*.65+n2*.35-.5);\nfloat radial=uBreath*.0135;\nfloat organic=micro*(.0035+uBreath*.0045);\ntransformed += normal*(radial+organic);`);
    };
    m.customProgramCacheKey=()=> 'living-glass-shell-v3';
    return m;
  },[]);
  useEffect(()=>()=>material.dispose(),[material]);
  return {material,shaderRef};
}

function LivingGlassOrb(){
  const shell=useRef();
  const cyan=useRef();
  const magenta=useRef();
  const violet=useRef();
  const {material,shaderRef}=useBreathingGlassMaterial();

  useFrame(({clock})=>{
    const t=clock.elapsedTime;
    const b=lumeniaBreath(t);
    const micro=.0007*Math.sin(t*.39)+.00045*Math.sin(t*.73+1.1);
    if(shaderRef.current){
      shaderRef.current.uniforms.uBreath.value=b;
      shaderRef.current.uniforms.uTime.value=t;
    }
    if(shell.current){
      // secondary silhouette motion; actual surface deformation is performed in the physical material shader above
      shell.current.scale.set(1+b*.014+micro,1+b*.010+micro*.5,1+b*.014-micro*.3);
      shell.current.rotation.y=t*.0045;
      shell.current.rotation.x=.003*Math.sin(t*.11);
    }
    if(cyan.current) cyan.current.intensity=7.6*(1+b*.11);
    if(magenta.current) magenta.current.intensity=5.5*(1+b*.09);
    if(violet.current) violet.current.intensity=4.8*(1+b*.11);
  });

  return <group>
    <InternalAurora/>
    <mesh ref={shell} material={material}>
      <sphereGeometry args={[1,160,160]}/>
    </mesh>
    <pointLight ref={cyan} position={[-.34,.08,.05]} color="#37eaff" intensity={7.6} distance={3.2}/>
    <pointLight ref={magenta} position={[.30,-.10,.02]} color="#ff58c9" intensity={5.5} distance={2.9}/>
    <pointLight ref={violet} position={[.08,.22,-.20]} color="#795cff" intensity={4.8} distance={3.0}/>
  </group>;
}

function Scene(){
  return <>
    <color attach="background" args={["#07101d"]}/>
    <hemisphereLight args={["#dff8ff","#140b2a",1.75]}/>
    <ambientLight intensity={.46}/>
    <directionalLight position={[0,3.4,5.4]} intensity={2.55} color="#f2fcff"/>
    <directionalLight position={[-4.2,1.3,2.1]} intensity={2.9} color="#4be9ff"/>
    <directionalLight position={[4.0,.6,1.2]} intensity={2.4} color="#ff69cf"/>
    <directionalLight position={[1.8,-2.2,2.2]} intensity={.78} color="#ffa06d"/>
    <LivingGlassOrb/>
  </>;
}

export function LivingOrb(){
  return <div className="livingOrbCanvas" aria-label="Living Glass Orb stage 1 to 3">
    <Canvas
      camera={{position:[0,0,5.25],fov:34}}
      dpr={[1,2]}
      gl={{antialias:true,alpha:false,powerPreference:'high-performance',toneMapping:THREE.ACESFilmicToneMapping}}
      onCreated={({gl})=>{gl.toneMappingExposure=1.6;gl.outputColorSpace=THREE.SRGBColorSpace;}}
    >
      <Scene/>
    </Canvas>
  </div>;
}
