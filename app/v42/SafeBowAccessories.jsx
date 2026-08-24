"use client";

import React,{useMemo} from "react";
import * as THREE from "three";

const ORB_CENTER=new THREE.Vector3(0,.35,0);
const ORB_RADIUS=1.68;
const Z_AXIS=new THREE.Vector3(0,0,1);

const BOW_STYLES={
 "small-bow":{scale:.58,loopX:.92,loopY:.62,tail:.48,asym:.05,double:false},
 "big-bow":{scale:.86,loopX:1.10,loopY:.72,tail:.70,asym:.08,double:false},
 "side-bow":{scale:.72,loopX:1.02,loopY:.66,tail:.58,asym:.14,double:false},
 "center-bow":{scale:.76,loopX:1.00,loopY:.67,tail:.60,asym:.03,double:false},
 "double-bow":{scale:.72,loopX:.96,loopY:.62,tail:.56,asym:.06,double:true},
};

const POSITION_PRESETS={
 top:{normal:[0,.94,.34],clearance:.13,roll:-.06},
 left:{normal:[-.84,.42,.34],clearance:.13,roll:.18},
 right:{normal:[.84,.42,.34],clearance:.13,roll:-.18},
 "front-hair":{normal:[0,.55,.84],clearance:.14,roll:0},
 "bow-tie":{normal:[0,-.82,.57],clearance:.12,roll:0},
};

function LivingAccessoryMaterial({color="#FF79CE",mode="iridescent",opacity=.84}){
 const modes={
  glass:[.91,.055,0,.30],
  "frosted-glass":[.58,.22,0,.22],
  iridescent:[.82,.065,.01,.95],
  holographic:[.67,.09,.10,.95],
  pearlescent:[.70,.13,.03,.58],
  "chrome-glass":[.44,.075,.26,.74],
 };
 const m=modes[mode]||modes.iridescent;
 return <meshPhysicalMaterial color={color} transparent opacity={opacity} transmission={m[0]} roughness={m[1]} metalness={m[2]} thickness={.22} clearcoat={1} clearcoatRoughness={.03} ior={1.45} iridescence={m[3]} envMapIntensity={1.35} emissive={color} emissiveIntensity={.018} depthWrite={false}/>;
}

function loopGeometry(side=1,loopX=1,loopY=.66){
 const shape=new THREE.Shape();
 shape.moveTo(.02,0);
 shape.bezierCurveTo(.22,loopY*.92,.72*loopX,loopY*.98,1.0*loopX,.18);
 shape.bezierCurveTo(.84*loopX,-.54*loopY,.28,-.54*loopY,.02,0);
 const hole=new THREE.Path();
 hole.moveTo(.18,.01);
 hole.bezierCurveTo(.34,loopY*.50,.64*loopX,loopY*.54,.78*loopX,.16);
 hole.bezierCurveTo(.66*loopX,-.24*loopY,.36,-.26*loopY,.18,.01);
 shape.holes.push(hole);
 const g=new THREE.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:true,bevelSegments:5,steps:1,bevelSize:.035,bevelThickness:.035,curveSegments:32});
 g.center();
 if(side<0){const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setX(i,-p.getX(i));p.needsUpdate=true;}
 g.computeVertexNormals();
 return g;
}

function tailGeometry(side=1,length=.60){
 const shape=new THREE.Shape();
 shape.moveTo(0,.10);
 shape.bezierCurveTo(.18,.04,.27,-.12,.25,-.31);
 shape.lineTo(.14,-length);
 shape.lineTo(.02,-length*.82);
 shape.lineTo(-.12,-length);
 shape.lineTo(-.18,-.34);
 shape.bezierCurveTo(-.20,-.11,-.12,.04,0,.10);
 const g=new THREE.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:24});
 g.center();
 if(side<0){const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setX(i,-p.getX(i));p.needsUpdate=true;}
 g.computeVertexNormals();
 return g;
}

function BowLoop({side=1,loopX=1,loopY=.66,color,mode,asym=0}){
 const geometry=useMemo(()=>loopGeometry(side,loopX*(1+side*asym),loopY*(1-side*asym*.45)),[side,loopX,loopY,asym]);
 return <mesh geometry={geometry} position={[side*.10,side*.018,0]} rotation={[side*.05,side*.055,side*.055]}><LivingAccessoryMaterial color={color} mode={mode}/></mesh>;
}

function BowTail({side=1,length=.6,color,mode,asym=0}){
 const geometry=useMemo(()=>tailGeometry(side,length*(1-side*asym*.25)),[side,length,asym]);
 return <mesh geometry={geometry} position={[side*.16,-.33,-.01]} rotation={[side*.025,side*.05,side*.17]}><LivingAccessoryMaterial color={color} mode={mode} opacity={.80}/></mesh>;
}

export function VolumetricBow({type="small-bow",color="#FF79CE",mode="iridescent",scale=1}){
 const cfg=BOW_STYLES[type]||BOW_STYLES["small-bow"];
 return <group scale={cfg.scale*scale}>
  <BowLoop side={-1} loopX={cfg.loopX} loopY={cfg.loopY} color={color} mode={mode} asym={cfg.asym}/>
  <BowLoop side={1} loopX={cfg.loopX} loopY={cfg.loopY} color={color} mode={mode} asym={cfg.asym}/>
  <mesh scale={[.25,.25,.18]} position={[0,0,.01]}><sphereGeometry args={[1,32,24]}/><LivingAccessoryMaterial color={color} mode={mode} opacity={.92}/></mesh>
  <BowTail side={-1} length={cfg.tail} color={color} mode={mode} asym={cfg.asym}/>
  <BowTail side={1} length={cfg.tail} color={color} mode={mode} asym={cfg.asym}/>
  {cfg.double&&<group position={[0,.25,-.06]} scale={.62} rotation={[0,0,.03]}>
   <BowLoop side={-1} loopX={cfg.loopX} loopY={cfg.loopY} color="#89E8FF" mode={mode} asym={cfg.asym}/>
   <BowLoop side={1} loopX={cfg.loopX} loopY={cfg.loopY} color="#B88AFF" mode={mode} asym={cfg.asym}/>
   <mesh scale={[.22,.22,.16]}><sphereGeometry args={[1,28,20]}/><LivingAccessoryMaterial color={color} mode={mode}/></mesh>
  </group>}
 </group>;
}

export function resolveBowPlacement(positionName="top",extra={}){
 const preset=POSITION_PRESETS[positionName]||POSITION_PRESETS.top;
 const normal=new THREE.Vector3(...preset.normal).normalize();
 const center=ORB_CENTER.clone().addScaledVector(normal,ORB_RADIUS+preset.clearance+(extra.offsetOut||0));
 center.x+=extra.offsetX||0;
 center.y+=extra.offsetY||0;
 center.z+=extra.offsetZ||0;
 const q=new THREE.Quaternion().setFromUnitVectors(Z_AXIS,normal);
 const e=new THREE.Euler().setFromQuaternion(q,"XYZ");
 e.z+=preset.roll+(extra.rotationZ||0);
 e.x+=extra.rotationX||0;
 e.y+=extra.rotationY||0;
 return {position:[center.x,center.y,center.z],rotation:[e.x,e.y,e.z],scale:extra.scale??1};
}

export default function SafeBowAccessories({bow=null}){
 if(!bow||bow.type==="none")return null;
 const placement=resolveBowPlacement(bow.position||"top",bow);
 return <group position={placement.position} rotation={placement.rotation} scale={placement.scale}>
  <VolumetricBow type={bow.type} color={bow.color||"#FF79CE"} mode={bow.material||"iridescent"}/>
 </group>;
}
