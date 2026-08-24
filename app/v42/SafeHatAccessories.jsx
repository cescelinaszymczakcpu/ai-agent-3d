"use client";

import React,{useMemo} from "react";
import * as THREE from "three";

const ORB_CENTER=new THREE.Vector3(0,.35,0);
const MAX_BREATH_RADIUS=1.715;
const HEAD_TOP_Y=ORB_CENTER.y+MAX_BREATH_RADIUS;
const HAIR_CLEARANCE={none:0,short:.075,"reference-curl":.165,"long-hair":.235};

function AccessoryMaterial({color="#8E72FF",mode="iridescent",opacity=.84}){
 const modes={glass:[.91,.055,0,.30],"frosted-glass":[.58,.22,0,.22],iridescent:[.82,.065,.01,.95],holographic:[.67,.09,.10,.95],pearlescent:[.70,.13,.03,.58],"chrome-glass":[.44,.075,.26,.74]};
 const m=modes[mode]||modes.iridescent;
 return <meshPhysicalMaterial side={THREE.DoubleSide} color={color} transparent opacity={opacity} transmission={m[0]} roughness={m[1]} metalness={m[2]} thickness={.24} clearcoat={1} clearcoatRoughness={.025} ior={1.46} iridescence={m[3]} envMapIntensity={1.45} emissive={color} emissiveIntensity={.018} depthWrite={false}/>;
}

function createBrimGeometry({inner,outer,thickness,yAt}){
 const segments=112,verts=[],indices=[],push=(x,y,z)=>{verts.push(x,y,z);return verts.length/3-1};
 const topOuter=[],topInner=[],bottomOuter=[],bottomInner=[];
 for(let i=0;i<segments;i+=1){const a=i/segments*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a),yo=yAt(outer,a),yi=yAt(inner,a);topOuter.push(push(ca*outer,yo+thickness*.5,sa*outer));topInner.push(push(ca*inner,yi+thickness*.5,sa*inner));bottomOuter.push(push(ca*outer,yo-thickness*.5,sa*outer));bottomInner.push(push(ca*inner,yi-thickness*.5,sa*inner))}
 const quad=(a,b,c,d)=>indices.push(a,b,d,b,c,d);
 for(let i=0;i<segments;i+=1){const n=(i+1)%segments;quad(topInner[i],topInner[n],topOuter[n],topOuter[i]);quad(bottomOuter[i],bottomOuter[n],bottomInner[n],bottomInner[i]);quad(topOuter[i],topOuter[n],bottomOuter[n],bottomOuter[i]);quad(bottomInner[i],bottomInner[n],topInner[n],topInner[i])}
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

function lathe(profile,segments=96){const g=new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),segments);g.computeVertexNormals();return g}
function makeBandCurve(radius=.555,y=.18,zScale=.93){const pts=[];for(let i=0;i<72;i+=1){const a=i/72*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*radius,y,Math.sin(a)*radius*zScale))}return new THREE.CatmullRomCurve3(pts,true,"centripetal")}

function createFedoraBrimGeometry(){const inner=.49,outer=1.10;return createBrimGeometry({inner,outer,thickness:.075,yAt:(r,a)=>{const radial=(r-inner)/(outer-inner),front=Math.max(0,Math.sin(a)),back=Math.max(0,-Math.sin(a));return radial*(Math.cos(a*2+.35)*.022-front*.052+back*.025)+Math.sin(a-.55)*.010}})}
function crownRadius(t,a){const base=.555-.035*t-.045*t*t,front=Math.max(0,Math.sin(a)),pinch=Math.exp(-Math.pow((t-.78)/.22,2))*front*.085,sideDent=Math.exp(-Math.pow((t-.72)/.24,2))*Math.abs(Math.cos(a))*.032;return Math.max(.39,base-pinch-sideDent)}
function createFedoraCrownGeometry(){const segments=104,rows=22,verts=[],indices=[];for(let j=0;j<=rows;j+=1){const t=j/rows,y=.035+t*.71;for(let i=0;i<segments;i+=1){const a=i/segments*Math.PI*2,r=crownRadius(t,a),x=Math.cos(a)*r,z=Math.sin(a)*r*.93,front=Math.max(0,Math.sin(a));verts.push(x,y-front*Math.pow(t,2)*.025,z)}}const idx=(j,i)=>j*segments+(i%segments+segments)%segments;for(let j=0;j<rows;j+=1)for(let i=0;i<segments;i+=1){const n=(i+1)%segments;indices.push(idx(j,i),idx(j,n),idx(j+1,i),idx(j,n),idx(j+1,n),idx(j+1,i))}const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();return g}
function createFedoraTopGeometry(){const segments=104,rings=18,verts=[],indices=[];for(let j=0;j<=rings;j+=1){const u=j/rings;for(let i=0;i<segments;i+=1){const a=i/segments*Math.PI*2,edge=crownRadius(1,a),r=edge*u,x=Math.cos(a)*r,z=Math.sin(a)*r*.93,centerCrease=.085*Math.exp(-x*x*18)*(.45+.55*u),sideDents=.035*Math.exp(-Math.pow(Math.abs(x)-.25,2)*38)*u,frontPinch=.028*Math.max(0,z)*u;verts.push(x,.745-centerCrease-sideDents-frontPinch+.014*(1-u*u),z)}}const idx=(j,i)=>j*segments+(i%segments+segments)%segments;for(let j=0;j<rings;j+=1)for(let i=0;i<segments;i+=1){const n=(i+1)%segments;indices.push(idx(j,i),idx(j+1,i),idx(j,n),idx(j,n),idx(j+1,i),idx(j+1,n))}const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();return g}

function createTopHatBrimGeometry(){const inner=.50,outer=1.04;return createBrimGeometry({inner,outer,thickness:.082,yAt:(r,a)=>{const radial=(r-inner)/(outer-inner),front=Math.max(0,Math.sin(a)),back=Math.max(0,-Math.sin(a));return radial*(Math.cos(a*2-.2)*.010-front*.018+back*.012)+Math.sin(a+.4)*.005}})}
function topHatRadius(t,a){const waist=Math.sin(Math.PI*t),base=.525-.025*waist+.035*t,oval=.96+.018*Math.cos(a*2);return base*oval}
function createTopHatCrownGeometry(){const segments=104,rows=28,verts=[],indices=[];for(let j=0;j<=rows;j+=1){const t=j/rows,y=.040+t*.995;for(let i=0;i<segments;i+=1){const a=i/segments*Math.PI*2,r=topHatRadius(t,a),x=Math.cos(a)*r,z=Math.sin(a)*r*.95,subtleBow=Math.cos(a)*.006*Math.sin(Math.PI*t);verts.push(x,y+subtleBow,z)}}const idx=(j,i)=>j*segments+(i%segments+segments)%segments;for(let j=0;j<rows;j+=1)for(let i=0;i<segments;i+=1){const n=(i+1)%segments;indices.push(idx(j,i),idx(j,n),idx(j+1,i),idx(j,n),idx(j+1,n),idx(j+1,i))}const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();return g}
function createTopHatTopGeometry(){const segments=104,rings=20,verts=[],indices=[];for(let j=0;j<=rings;j+=1){const u=j/rings;for(let i=0;i<segments;i+=1){const a=i/segments*Math.PI*2,edge=topHatRadius(1,a),r=edge*u,x=Math.cos(a)*r,z=Math.sin(a)*r*.95,dome=.018*(1-u*u)-.006*Math.cos(a*2)*u*u;verts.push(x,1.035+dome,z)}}const idx=(j,i)=>j*segments+(i%segments+segments)%segments;for(let j=0;j<rings;j+=1)for(let i=0;i<segments;i+=1){const n=(i+1)%segments;indices.push(idx(j,i),idx(j+1,i),idx(j,n),idx(j,n),idx(j+1,i),idx(j+1,n))}const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();return g}

function createBowlerBrim(){const inner=.50,outer=.93;return createBrimGeometry({inner,outer,thickness:.078,yAt:(r,a)=>{const u=(r-inner)/(outer-inner);return u*(.020+.018*Math.cos(a*2))+.008*Math.sin(a)}})}
function createBowlerShell(){return lathe([[.52,.02],[.58,.08],[.61,.20],[.59,.36],[.50,.53],[.34,.67],[.14,.75],[0,.78]],112)}

function createBeretShell(){
 const g=lathe([[.54,.02],[.70,.06],[.86,.14],[.91,.23],[.82,.32],[.60,.39],[.30,.43],[0,.44]],112),p=g.attributes.position;
 for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const n=y/.44;z*=.92;x+=.08*n+.05*Math.max(0,x)*n;y-=.055*Math.max(0,x)*n+Math.sin(z*3.1)*.006;p.setXYZ(i,x,y,z)}p.needsUpdate=true;g.computeVertexNormals();return g;
}

function createSoftCapShell(){
 const g=lathe([[.50,.02],[.58,.08],[.64,.20],[.62,.38],[.52,.55],[.34,.68],[.12,.75],[0,.77]],104),p=g.attributes.position;
 for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const front=Math.max(0,z);z*=1.04;y-=front*.035;x*=.98+Math.max(0,z)*.025;p.setXYZ(i,x,y,z)}p.needsUpdate=true;g.computeVertexNormals();return g;
}
function createVisorGeometry(){const s=new THREE.Shape();s.moveTo(-.52,0);s.bezierCurveTo(-.38,.30,.38,.30,.52,0);s.bezierCurveTo(.44,-.22,-.44,-.22,-.52,0);const g=new THREE.ExtrudeGeometry(s,{depth:.075,bevelEnabled:true,bevelSegments:5,bevelSize:.025,bevelThickness:.020,curveSegments:28,steps:1});g.center();g.rotateX(Math.PI/2);g.computeVertexNormals();return g}
function capSeam(angle){const pts=[];for(let i=0;i<=12;i+=1){const u=i/12,r=.60*(1-u*.88),y=.10+u*.62;pts.push(new THREE.Vector3(Math.cos(angle)*r,y,Math.sin(angle)*r*1.02))}return new THREE.CatmullRomCurve3(pts,false,"centripetal")}

function createWideBrim(){const inner=.50,outer=1.47;return createBrimGeometry({inner,outer,thickness:.065,yAt:(r,a)=>{const u=(r-inner)/(outer-inner);return u*(Math.sin(a*2+.35)*.045+Math.sin(a-.6)*.025)-Math.max(0,Math.sin(a))*u*.025}})}
function createWideCrown(){return lathe([[.52,.02],[.57,.08],[.56,.24],[.54,.44],[.48,.61],[.32,.69],[0,.72]],104)}

export function PremiumFedora({color="#8E72FF",material="iridescent"}){const brim=useMemo(()=>createFedoraBrimGeometry(),[]),crown=useMemo(()=>createFedoraCrownGeometry(),[]),top=useMemo(()=>createFedoraTopGeometry(),[]),band=useMemo(()=>makeBandCurve(.555,.18,.93),[]);return <group><mesh geometry={brim}><AccessoryMaterial color={color} mode={material} opacity={.82}/></mesh><mesh geometry={crown}><AccessoryMaterial color={color} mode={material} opacity={.86}/></mesh><mesh geometry={top}><AccessoryMaterial color={color} mode={material} opacity={.86}/></mesh><mesh><tubeGeometry args={[band,96,.028,10,true]}/><AccessoryMaterial color="#FF72C9" mode={material} opacity={.92}/></mesh></group>}
export function PremiumTopHat({color="#765BFF",material="iridescent"}){const brim=useMemo(()=>createTopHatBrimGeometry(),[]),crown=useMemo(()=>createTopHatCrownGeometry(),[]),top=useMemo(()=>createTopHatTopGeometry(),[]),band=useMemo(()=>makeBandCurve(.525,.205,.95),[]),rim=useMemo(()=>makeBandCurve(.56,1.025,.95),[]);return <group><mesh geometry={brim}><AccessoryMaterial color={color} mode={material} opacity={.84}/></mesh><mesh geometry={crown}><AccessoryMaterial color={color} mode={material} opacity={.87}/></mesh><mesh geometry={top}><AccessoryMaterial color={color} mode={material} opacity={.87}/></mesh><mesh><tubeGeometry args={[band,96,.030,10,true]}/><AccessoryMaterial color="#6FE8FF" mode={material} opacity={.94}/></mesh><mesh><tubeGeometry args={[rim,96,.020,9,true]}/><AccessoryMaterial color="#D67CFF" mode={material} opacity={.84}/></mesh></group>}
export function PremiumBowler({color="#8A7CFF",material="iridescent"}){const brim=useMemo(()=>createBowlerBrim(),[]),shell=useMemo(()=>createBowlerShell(),[]),band=useMemo(()=>makeBandCurve(.58,.18,.98),[]);return <group><mesh geometry={brim}><AccessoryMaterial color={color} mode={material}/></mesh><mesh geometry={shell}><AccessoryMaterial color={color} mode={material} opacity={.87}/></mesh><mesh><tubeGeometry args={[band,96,.026,10,true]}/><AccessoryMaterial color="#FF84CE" mode={material} opacity={.90}/></mesh></group>}
export function PremiumBeret({color="#B57CFF",material="iridescent"}){const shell=useMemo(()=>createBeretShell(),[]),band=useMemo(()=>makeBandCurve(.56,.055,.94),[]);return <group rotation={[.015,-.025,-.08]}><mesh geometry={shell}><AccessoryMaterial color={color} mode={material} opacity={.86}/></mesh><mesh><tubeGeometry args={[band,96,.032,10,true]}/><AccessoryMaterial color="#7DEAFF" mode={material} opacity={.86}/></mesh><mesh position={[.09,.46,-.02]} rotation={[0,0,-.10]}><capsuleGeometry args={[.025,.10,6,10]}/><AccessoryMaterial color="#FFD17A" mode={material} opacity={.90}/></mesh></group>}
export function PremiumSoftCap({color="#6FE8FF",material="iridescent"}){const shell=useMemo(()=>createSoftCapShell(),[]),visor=useMemo(()=>createVisorGeometry(),[]),seams=useMemo(()=>[0,Math.PI/2,Math.PI,Math.PI*1.5].map(capSeam),[]);return <group><mesh geometry={shell}><AccessoryMaterial color={color} mode={material} opacity={.86}/></mesh><mesh geometry={visor} position={[0,.08,.68]} rotation={[-.05,0,0]} scale={[1.0,1.0,.85]}><AccessoryMaterial color={color} mode={material} opacity={.84}/></mesh>{seams.map((c,i)=><mesh key={i}><tubeGeometry args={[c,62,.012,7,false]}/><AccessoryMaterial color={i%2?"#B985FF":"#E8FBFF"} mode={material} opacity={.62}/></mesh>)}<mesh position={[0,.78,0]} scale={[.055,.055,.055]}><sphereGeometry args={[1,18,14]}/><AccessoryMaterial color="#FF84CE" mode={material}/></mesh></group>}
export function PremiumWideBrim({color="#9A82FF",material="iridescent"}){const brim=useMemo(()=>createWideBrim(),[]),crown=useMemo(()=>createWideCrown(),[]),band=useMemo(()=>makeBandCurve(.555,.19,.96),[]);return <group><mesh geometry={brim}><AccessoryMaterial color={color} mode={material} opacity={.82}/></mesh><mesh geometry={crown}><AccessoryMaterial color={color} mode={material} opacity={.86}/></mesh><mesh><tubeGeometry args={[band,96,.030,10,true]}/><AccessoryMaterial color="#FF84CE" mode={material} opacity={.90}/></mesh></group>}

const FIT={
 fedora:{clearance:.060,rotation:[-.035,.025,.045],outer:1.10,bottom:-.050},
 "top-hat":{clearance:.070,rotation:[-.018,.012,.022],outer:1.04,bottom:-.052},
 bowler:{clearance:.060,rotation:[-.020,.018,.018],outer:.93,bottom:-.045},
 beret:{clearance:.045,rotation:[.015,-.015,-.055],outer:.91,bottom:-.020},
 "soft-cap":{clearance:.055,rotation:[-.025,.012,.010],outer:1.02,bottom:-.045},
 "wide-brim":{clearance:.065,rotation:[-.015,.018,.025],outer:1.47,bottom:-.045},
};

function localSamples(outerRadius,bottomY){const samples=[];for(let i=0;i<40;i+=1){const a=i/40*Math.PI*2;for(const r of [.48,Math.min(.80,outerRadius*.72),outerRadius])samples.push(new THREE.Vector3(Math.cos(a)*r,bottomY,Math.sin(a)*r))}samples.push(new THREE.Vector3(0,bottomY,0));return samples}
function penetrationPush(base,rotation,scale,margin,outerRadius,bottomY){const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(rotation[0],rotation[1],rotation[2],"XYZ"));let yPush=0;for(let pass=0;pass<7;pass+=1){let worst=0;for(const sample of localSamples(outerRadius,bottomY)){const p=sample.clone().multiplyScalar(scale).applyQuaternion(q).add(new THREE.Vector3(base[0],base[1]+yPush,base[2]));const need=MAX_BREATH_RADIUS+margin-p.distanceTo(ORB_CENTER);if(need>worst)worst=need}if(worst<=.001)break;yPush+=worst+.012}return yPush}
function resolvePlacement(hat,type){const hair=HAIR_CLEARANCE[hat.hairStyle||"none"]??0,scale=THREE.MathUtils.clamp(hat.scale??1,.72,1.28),cfg=FIT[type]||FIT.fedora,minY=HEAD_TOP_Y+hair+cfg.clearance,base=[hat.offsetX||0,Math.max(minY,minY+(hat.offsetY||0)),hat.offsetZ||0],rotation=[cfg.rotation[0]+(hat.rotationX||0),cfg.rotation[1]+(hat.rotationY||0),cfg.rotation[2]+(hat.rotationZ||0)],margin=Math.max(.020,hat.collisionRadius??.035);base[1]+=penetrationPush(base,rotation,scale,margin,cfg.outer,cfg.bottom);return {position:base,rotation,scale}}

function HatModel({type,color,material}){if(type==="fedora")return <PremiumFedora color={color} material={material}/>;if(type==="top-hat")return <PremiumTopHat color={color} material={material}/>;if(type==="bowler")return <PremiumBowler color={color} material={material}/>;if(type==="beret")return <PremiumBeret color={color} material={material}/>;if(type==="soft-cap")return <PremiumSoftCap color={color} material={material}/>;if(type==="wide-brim")return <PremiumWideBrim color={color} material={material}/>;return null}
export default function SafeHatAccessories({hat=null}){const type=hat?.type||"none";if(type==="none"||!FIT[type])return null;const p=resolvePlacement(hat,type);return <group position={p.position} rotation={p.rotation} scale={p.scale}><HatModel type={type} color={hat.color||"#8E72FF"} material={hat.material||"iridescent"}/></group>}
