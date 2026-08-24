"use client";

import React,{useMemo} from "react";
import * as THREE from "three";

const ORB_CENTER=new THREE.Vector3(0,.35,0);
const MAX_RADIUS=1.715;

function HairMaterial({color="#9F7CFF",opacity=.82}){
 return <meshPhysicalMaterial side={THREE.DoubleSide} color={color} transparent opacity={opacity} transmission={.68} thickness={.13} roughness={.085} metalness={.01} clearcoat={1} clearcoatRoughness={.025} ior={1.45} iridescence={.82} envMapIntensity={1.25} emissive={color} emissiveIntensity={.017} depthWrite={false}/>;
}

function surfaceZ(y,x=0,extra=.075){
 const dx=x-ORB_CENTER.x,dy=y-ORB_CENTER.y;
 const inside=MAX_RADIUS*MAX_RADIUS-dx*dx-dy*dy;
 return Math.sqrt(Math.max(0,inside))+extra;
}

function halfMustacheShape(style="classic"){
 const s=new THREE.Shape();
 const cfg={
  "reference-curled":{w:.62,h:.19,tip:.16,drop:.01},
  classic:{w:.56,h:.17,tip:.10,drop:.025},
  slim:{w:.54,h:.115,tip:.075,drop:.015},
  handlebar:{w:.68,h:.15,tip:.18,drop:-.015},
  short:{w:.43,h:.14,tip:.06,drop:.02},
 }[style]||{w:.56,h:.17,tip:.10,drop:.025};
 const {w,h,tip,drop}=cfg;
 s.moveTo(0,.015);
 s.bezierCurveTo(w*.16,h*.64,w*.52,h*.78,w*.78,h*.40);
 s.bezierCurveTo(w*.94,h*.24,w+tip,h*.42,w+tip*.92,h*.72);
 s.bezierCurveTo(w+tip*.55,h*.38,w*.88,-h*.34,w*.56,-h*.44-drop);
 s.bezierCurveTo(w*.32,-h*.40,w*.10,-h*.17,0,-.015);
 s.closePath();
 return s;
}

function halfMustacheGeometry(style="classic",side=1){
 const shape=halfMustacheShape(style);
 const g=new THREE.ExtrudeGeometry(shape,{depth:.085,bevelEnabled:true,bevelSegments:5,bevelSize:.018,bevelThickness:.018,curveSegments:36,steps:1});
 g.center();
 if(side<0)g.scale(-1,1,1);
 g.computeVertexNormals();
 return g;
}

function curlCurve(side=1,large=false){
 const pts=[];
 const radius=large?.16:.12;
 for(let i=0;i<10;i+=1){
  const u=i/9;
  const a=u*Math.PI*1.5;
  const x=side*(.59+u*.14+Math.sin(a)*radius);
  const y=.035+Math.cos(a)*radius*.72+u*.055;
  const z=.06+u*.025;
  pts.push(new THREE.Vector3(x,y,z));
 }
 return new THREE.CatmullRomCurve3(pts,false,"centripetal");
}

function VolumetricMustache({style="classic",color="#9F7CFF"}){
 const left=useMemo(()=>halfMustacheGeometry(style,-1),[style]);
 const right=useMemo(()=>halfMustacheGeometry(style,1),[style]);
 const leftCurl=useMemo(()=>curlCurve(-1,style==="handlebar"||style==="reference-curled"),[style]);
 const rightCurl=useMemo(()=>curlCurve(1,style==="handlebar"||style==="reference-curled"),[style]);
 const y=.17;
 const z=surfaceZ(y,0,.105);
 return <group position={[0,y,z]} rotation={[-.035,0,0]} scale={style==="slim"?.92:1}>
  <mesh geometry={left} position={[-.025,0,0]}><HairMaterial color={color}/></mesh>
  <mesh geometry={right} position={[-.025,0,0]}><HairMaterial color={color}/></mesh>
  {(style==="handlebar"||style==="reference-curled")&&<><mesh><tubeGeometry args={[leftCurl,72,.025,10,false]}/><HairMaterial color="#7BE9FF" opacity={.78}/></mesh><mesh><tubeGeometry args={[rightCurl,72,.025,10,false]}/><HairMaterial color="#C582FF" opacity={.78}/></mesh></>}
 </group>;
}

function projectedFacePoint(x,y,extra=.085){return new THREE.Vector3(x,y,surfaceZ(y,x,extra))}
function beardCurve(points){return new THREE.CatmullRomCurve3(points.map(([x,y,e=.085])=>projectedFacePoint(x,y,e)),false,"centripetal")}

function BeardStrand({points,radius=.030,color="#8D8BFF"}){
 const curve=useMemo(()=>beardCurve(points),[points]);
 return <mesh><tubeGeometry args={[curve,80,radius,10,false]}/><HairMaterial color={color} opacity={.76}/></mesh>;
}

function ShortBeard({color="#8E86FF"}){
 return <group>
  <BeardStrand color={color} radius={.034} points={[[-.72,-.25,.070],[-.62,-.50,.080],[-.43,-.72,.090],[-.18,-.84,.100]]}/>
  <BeardStrand color="#B47EFF" radius={.034} points={[[.72,-.25,.070],[.62,-.50,.080],[.43,-.72,.090],[.18,-.84,.100]]}/>
  <BeardStrand color="#76E8FF" radius={.030} points={[[-.18,-.84,.10],[0,-.94,.115],[.18,-.84,.10]]}/>
  <BeardStrand color="#A790FF" radius={.022} points={[[-.52,-.54,.09],[-.34,-.73,.10],[-.06,-.88,.12]]}/>
  <BeardStrand color="#D37DFF" radius={.022} points={[[.52,-.54,.09],[.34,-.73,.10],[.06,-.88,.12]]}/>
 </group>;
}

function Goatee({color="#A682FF"}){
 return <group>
  <BeardStrand color={color} radius={.040} points={[[-.15,-.54,.10],[-.12,-.74,.11],[-.07,-.98,.13],[0,-1.14,.16]]}/>
  <BeardStrand color="#79E9FF" radius={.032} points={[[.15,-.54,.10],[.12,-.74,.11],[.07,-.98,.13],[0,-1.14,.16]]}/>
  <BeardStrand color="#D37CFF" radius={.020} points={[[0,-.58,.13],[.04,-.80,.15],[0,-1.08,.18]]}/>
 </group>;
}

export default function SafeFacialHair({facialHair=null}){
 const style=facialHair?.style||"none";
 if(style==="none")return null;
 const color=facialHair?.color||"#9F7CFF";
 if(style==="beard")return <group><VolumetricMustache style="classic" color={color}/><ShortBeard color={color}/></group>;
 if(style==="goatee")return <group><VolumetricMustache style="slim" color={color}/><Goatee color={color}/></group>;
 return <VolumetricMustache style={style} color={color}/>;
}
