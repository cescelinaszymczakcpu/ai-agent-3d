"use client";

import React,{useRef,useState} from "react";
import LivingLumeniaOrb from "../LivingLumeniaOrb";
import useOpenAIRealtimeVoice from "../useOpenAIRealtimeVoice";
import "./creator.css";

const PRESETS={Aurora:["#22E8FF","#3568FF","#A245FF","#FF42C2"],Ocean:["#24EAD8","#20DFFF","#285DFF","#7955FF"],Sunset:["#FFB38E","#FF7DAF","#E84ACB","#8C55FF"]};
const EMOTIONS={neutral:["#22E8FF","#3568FF","#A245FF","#FF42C2"],happy:["#2CF4FF","#39DCC8","#FF57CC","#FFB47E"],caring:["#54E8F4","#637CFF","#C477FF","#FF8EAE"],calm:["#65EAD9","#63B8FF","#9C8FFF","#DDA4FF"],curious:["#35F0FF","#406CFF","#A34DFF","#DC58FF"],excited:["#00F6FF","#425DFF","#CD38FF","#FF35A9"],sad:["#367AAE","#3859B8","#6550A8","#835B9D"],surprised:["#A8FAFF","#46BDFF","#B855FF","#FF75DF"],warning:["#FFBF44","#FF7A4A","#C454FF","#FF568D"],error:["#FF419C","#9E3DFF","#FF486A","#694AFF"]};
const BOW_TYPES=["none","small-bow","big-bow","side-bow","center-bow","double-bow"];
const BOW_POSITIONS=["top","left","right","front-hair","bow-tie"];
const HAT_TYPES=["none","fedora"];
const HAIR_PROFILES=["none","short","reference-curl","long-hair"];
const MATERIALS=["glass","frosted-glass","iridescent","holographic","pearlescent","chrome-glass"];

function Chips({items,value,onChange}){return <div className="chipRow">{items.map(name=><button key={name} className={value===name?"chip active":"chip"} onClick={()=>onChange(name)}>{name.replaceAll("-"," ").toUpperCase()}</button>)}</div>}
function Range({label,value,min,max,step,onChange}){return <label className="rangeControl"><span><b>{label}</b><em>{Number(value).toFixed(3)}</em></span><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>}

export default function LivingOrbCreatorPage(){
 const [characterType]=useState("orb");
 const [colors,setColors]=useState(PRESETS.Aurora);
 const [emotion,setEmotion]=useState("neutral");
 const [flow,setFlow]=useState(.06);
 const [view,setView]=useState("front");
 const [variant,setVariant]=useState("female");
 const [bow,setBow]=useState({type:"none",position:"top",material:"iridescent",color:"#FF79CE",scale:1,offsetOut:0,offsetX:0,offsetY:0,offsetZ:0,rotationX:0,rotationY:0,rotationZ:0});
 const [hat,setHat]=useState({type:"none",material:"iridescent",color:"#8E72FF",scale:1,hairStyle:"none",offsetX:0,offsetY:0,offsetZ:0,rotationX:0,rotationY:0,rotationZ:0,collisionRadius:.035});
 const custom=useRef([...PRESETS.Aurora]);
 const realtime=useOpenAIRealtimeVoice(variant);
 const state=realtime.connected?realtime.phase:"idle";

 const applyEmotion=name=>{setEmotion(name);if(name==="neutral")setColors([...custom.current]);else setColors([...EMOTIONS[name]]);};
 const applyPreset=p=>{custom.current=[...p];setColors([...p]);setEmotion("neutral");};
 const updateColor=(i,v)=>{setColors(prev=>{const next=prev.map((c,j)=>j===i?v:c);custom.current=[...next];return next});setEmotion("neutral")};
 const changeVariant=v=>{realtime.stop();setVariant(v)};
 const testVoice=()=>realtime.startAndSend("Powiedz po polsku krótkie naturalne zdanie. Mów spokojnie, ale z ludzką intonacją, aby gesty rąk mogły reagować na rytm i akcenty mowy.");
 const patchBow=p=>setBow(prev=>({...prev,...p}));
 const patchHat=p=>setHat(prev=>({...prev,...p}));
 const selectBow=v=>{patchBow({type:v});if(v!=="none")patchHat({type:"none"});};
 const selectHat=v=>{patchHat({type:v,offsetX:0,offsetY:0,offsetZ:0,rotationX:0,rotationY:0,rotationZ:0});if(v!=="none")patchBow({type:"none"});};

 return <main className="creatorRoot" style={{background:"#020611"}}>
  <section className="creatorPreview" style={{background:"#020611"}}>
   {characterType==="orb"&&<LivingLumeniaOrb emotion={emotion} view={view} colorFlowSpeed={flow} orbColors={colors} state={state} audioLevel={realtime.audioLevel} audioBands={realtime.audioBands} bow={bow} hat={hat} style={{width:"100%",height:"100%",minHeight:"100%",background:"#020611"}}/>}
   <div className="creatorBadge">SAFE BODY · BOWS + FEDORA · {state.toUpperCase()}</div>
   <div className="viewDock">{[["front","FRONT"],["left","LEFT"],["right","RIGHT"],["back","BACK"],["top","TOP"]].map(([id,label])=><button key={id} onClick={()=>setView(id)} className={view===id?"mini active":"mini"}>{label}</button>)}</div>
  </section>

  <aside className="creatorPanel">
   <div className="creatorHead"><div><span className="creatorEyebrow">ALTER · SECOND LIFE</span><h1>Living Orb</h1></div><a className="backLink" href="/v42">ORB</a></div>
   <p className="creatorIntro">Stabilny Living Orb, breathing, color flow i bezpieczny rig kończyn pozostają bazą. Dodatki są ponownie włączane pojedynczo i mają własne zabezpieczenia kolizji.</p>

   <div className="controlBlock"><div className="controlTitle">CHARACTER TYPE</div><Chips items={["orb"]} value={characterType} onChange={()=>{}}/><p className="controlHelp">Default = ORB. Żaden opcjonalny moduł nie zastępuje Living Orb.</p></div>

   <div className="controlBlock"><div className="controlTitle">OPENAI REALTIME VOICE + GESTURES</div><Chips items={["female","male"]} value={variant} onChange={changeVariant}/><div className="chipRow" style={{marginTop:10}}><button className={realtime.connected?"testButton active":"testButton"} onClick={realtime.connected?realtime.stop:realtime.start}>{realtime.connecting?"CONNECTING…":realtime.connected?"STOP REALTIME":"START REALTIME"}</button><button className="testButton" onClick={testVoice}>TEST VOICE + GESTURES</button></div><p className="controlHelp">{variant==="female"?"FEMALE · MARIN":"MALE · CEDAR"} · {state.toUpperCase()}. Gesty reagują na rzeczywisty sygnał audio niezależnie od dodatków.</p><div className="audioMeter"><i style={{width:`${Math.round(realtime.audioLevel*100)}%`}}/></div>{realtime.error&&<p className="controlHelp" style={{color:"#ff9ab9"}}>{realtime.error}</p>}</div>

   <div className="controlBlock"><div className="controlTitle">BOWS · REAL 3D</div><div className="subTitle">STYLE</div><Chips items={BOW_TYPES} value={bow.type} onChange={selectBow}/>{bow.type!=="none"&&<><div className="subTitle">POSITION</div><Chips items={BOW_POSITIONS} value={bow.position} onChange={v=>patchBow({position:v})}/><div className="subTitle">MATERIAL</div><Chips items={MATERIALS} value={bow.material} onChange={v=>patchBow({material:v})}/><label className="smallColor"><span>COLOR</span><input type="color" value={bow.color} onChange={e=>patchBow({color:e.target.value})}/><code>{bow.color.toUpperCase()}</code></label><Range label="SCALE" value={bow.scale} min={.72} max={1.28} step={.01} onChange={v=>patchBow({scale:v})}/><Range label="SURFACE OFFSET" value={bow.offsetOut} min={-.03} max={.25} step={.01} onChange={v=>patchBow({offsetOut:v})}/></>}</div>

   <div className="controlBlock"><div className="controlTitle">HATS · FEDORA</div><Chips items={HAT_TYPES} value={hat.type} onChange={selectHat}/>{hat.type==="fedora"&&<><div className="subTitle">HAIR CLEARANCE PROFILE</div><Chips items={HAIR_PROFILES} value={hat.hairStyle} onChange={v=>patchHat({hairStyle:v})}/><div className="subTitle">MATERIAL</div><Chips items={MATERIALS} value={hat.material} onChange={v=>patchHat({material:v})}/><label className="smallColor"><span>COLOR</span><input type="color" value={hat.color} onChange={e=>patchHat({color:e.target.value})}/><code>{hat.color.toUpperCase()}</code></label><Range label="SCALE" value={hat.scale} min={.78} max={1.18} step={.01} onChange={v=>patchHat({scale:v})}/><Range label="OFFSET X" value={hat.offsetX} min={-.30} max={.30} step={.01} onChange={v=>patchHat({offsetX:v})}/><Range label="OFFSET Y" value={hat.offsetY} min={-.12} max={.30} step={.01} onChange={v=>patchHat({offsetY:v})}/><Range label="OFFSET Z" value={hat.offsetZ} min={-.30} max={.30} step={.01} onChange={v=>patchHat({offsetZ:v})}/><Range label="ROTATION X" value={hat.rotationX} min={-.30} max={.30} step={.01} onChange={v=>patchHat({rotationX:v})}/><Range label="ROTATION Y" value={hat.rotationY} min={-.40} max={.40} step={.01} onChange={v=>patchHat({rotationY:v})}/><Range label="ROTATION Z" value={hat.rotationZ} min={-.30} max={.30} step={.01} onChange={v=>patchHat({rotationZ:v})}/><Range label="COLLISION RADIUS" value={hat.collisionRadius} min={.018} max={.12} step={.002} onChange={v=>patchHat({collisionRadius:v})}/><p className="controlHelp">Fedora ma własną koronę z front pinch i central crease, grubą falującą bryłę ronda, przestrzenny band i automatyczny test penetracji próbkowany wokół całego ronda. Profil włosów podnosi minimalny bezpieczny anchor.</p></>}</div>

   <div className="controlBlock"><div className="controlTitle">COLORS</div><div className="colorGrid">{colors.map((c,i)=><label className="colorCard" key={i}><span>COLOR {i+1}</span><input type="color" value={c} onChange={e=>updateColor(i,e.target.value)}/><code>{c.toUpperCase()}</code></label>)}</div><div className="chipRow" style={{marginTop:10}}>{Object.entries(PRESETS).map(([name,p])=><button key={name} className="chip" onClick={()=>applyPreset(p)}>{name.toUpperCase()}</button>)}</div><Range label="COLOR FLOW" value={flow} min={.02} max={.12} step={.005} onChange={setFlow}/></div>

   <div className="controlBlock"><div className="controlTitle">EMOTION PREVIEW</div><Chips items={Object.keys(EMOTIONS)} value={emotion} onChange={applyEmotion}/><p className="controlHelp">Emocje nadal zmieniają paletę orba niezależnie od gestów i dodatków.</p></div>

   <div className="stageNote">FEDORA TEST: FRONT / LEFT / RIGHT / BACK / TOP · NONE / SHORT / REFERENCE CURL / LONG HAIR clearance · test penetracji z maksymalnym promieniem orba podczas breathing. Fedora i bow są chwilowo wzajemnie wykluczone do czasu resolvera kolizji między dodatkami.</div>
  </aside>
 </main>;
}
