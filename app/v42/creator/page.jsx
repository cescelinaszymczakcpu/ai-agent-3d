"use client";

import React,{useRef,useState} from "react";
import {Canvas} from "@react-three/fiber";
import LivingLumeniaOrb,{RealisticAccessoryModel} from "../LivingLumeniaOrb";
import useOpenAIRealtimeVoice from "../useOpenAIRealtimeVoice";
import "./creator.css";

const PRESETS={Aurora:["#22E8FF","#3568FF","#A245FF","#FF42C2"],Ocean:["#24EAD8","#20DFFF","#285DFF","#7955FF"],Sunset:["#FFB38E","#FF7DAF","#E84ACB","#8C55FF"]};
const EMOTIONS=["neutral","happy","caring","calm","curious","excited","sad","surprised","warning","error"];
const EMOTION_PREVIEW={
 neutral:{colors:["#22E8FF","#3568FF","#A245FF","#FF42C2"],flow:.060},happy:{colors:["#2CF4FF","#39DCC8","#FF57CC","#FFB47E"],flow:.072},caring:{colors:["#54E8F4","#637CFF","#C477FF","#FF8EAE"],flow:.050},calm:{colors:["#65EAD9","#63B8FF","#9C8FFF","#DDA4FF"],flow:.042},curious:{colors:["#35F0FF","#406CFF","#A34DFF","#DC58FF"],flow:.070},excited:{colors:["#00F6FF","#425DFF","#CD38FF","#FF35A9"],flow:.085},sad:{colors:["#367AAE","#3859B8","#6550A8","#835B9D"],flow:.038},surprised:{colors:["#A8FAFF","#46BDFF","#B855FF","#FF75DF"],flow:.088},warning:{colors:["#FFBF44","#FF7A4A","#C454FF","#FF568D"],flow:.064},error:{colors:["#FF419C","#9E3DFF","#FF486A","#694AFF"],flow:.076}
};
const HATS=["none","fedora","top-hat","bowler","soft-cap","wide-brim","beret"];
const EYEWEAR=["none","round","cat-eye","rectangular","monocle"];
const AUDIO=["none","earmuffs","headphones","headset"];
const DECOR=["none","bow-small","bow-large","bow-side","bow-center","headband","crown","halo","flower-light","star"];
const FLY=["none","one-strand","two-strands","three-strands"];
const MATERIALS=["glass","frosted-glass","iridescent","holographic","chrome-glass","pearlescent"];
const MUSTACHES=["none","reference-curled","short","handlebar","big-curl"];
const BEARDS=["none","short","goatee","full-light-beard"];

function Chips({items,value,onChange}){return <div className="chipRow">{items.map(name=><button key={name} className={value===name?"chip active":"chip"} onClick={()=>onChange(name)}>{name.replaceAll("-"," ").toUpperCase()}</button>)}</div>;}
function Range({label,value,min,max,step,onChange}){return <label className="rangeControl"><span><b>{label}</b><em>{Number(value).toFixed(step<.01?3:2)}</em></span><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>;}
function ColorControl({label,value,onChange}){return <label className="smallColor"><span>{label}</span><input type="color" value={value} onChange={e=>onChange(e.target.value)}/><code>{value.toUpperCase()}</code></label>;}

function AccessoryThumb({type,selected,onClick,color="#8E6CFF",mode="iridescent"}){
 const world=["earmuffs","headphones","headset"].includes(type);
 const eyewear=["round","cat-eye","rectangular","monocle"].includes(type);
 const decor=type.startsWith("bow-")||["headband","crown","halo","flower-light","star"].includes(type);
 const sc=world?.52:eyewear?1.25:decor?.82:type==="wide-brim"?.70:type==="top-hat"?.80:.90;
 const y=world?-2.05:eyewear?0:decor?-.05:type==="top-hat"?-.32:-.10;
 return <button onClick={onClick} style={{padding:0,border:selected?"1px solid rgba(85,225,255,.95)":"1px solid rgba(255,255,255,.10)",background:selected?"rgba(40,205,255,.10)":"rgba(255,255,255,.035)",borderRadius:14,overflow:"hidden",color:"white",cursor:"pointer"}}>
  <div style={{height:92,width:"100%",background:"radial-gradient(circle at 50% 40%,rgba(74,94,170,.22),rgba(2,6,17,.86))"}}><Canvas orthographic camera={{position:[0,.2,6],zoom:72}} dpr={[1,1.2]} gl={{antialias:true,alpha:true}}><ambientLight intensity={.65}/><directionalLight position={[-3,4,5]} intensity={2.6} color="#D8F9FF"/><directionalLight position={[3,1,3]} intensity={1.8} color="#D86CFF"/><group position={[0,y,0]} scale={sc} rotation={[.08,-.28,0]}><RealisticAccessoryModel type={type} color={color} mode={mode}/></group></Canvas></div>
  <div style={{fontSize:10,fontWeight:800,letterSpacing:.4,padding:"7px 5px"}}>{type.replaceAll("-"," ").toUpperCase()}</div>
 </button>;
}
function AccessoryGrid({items,value,onChange,color,mode}){return <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8,marginTop:9}}>{items.filter(x=>x!=="none").map(type=><AccessoryThumb key={type} type={type} selected={value===type} onClick={()=>onChange(value===type?"none":type)} color={color} mode={mode}/>)}</div>;}

export default function LivingOrbCreatorPage(){
 const [colors,setColors]=useState(PRESETS.Aurora),[flow,setFlow]=useState(.06),[variant,setVariant]=useState("female"),[emotion,setEmotion]=useState("neutral"),[manualState,setManualState]=useState("idle"),[view,setView]=useState("front"),[hairStyle,setHairStyle]=useState("elegant"),[mustacheStyle,setMustacheStyle]=useState("reference-curled"),[beardStyle,setBeardStyle]=useState("none"),[flyaways,setFlyaways]=useState({type:"none"});
 const [hat,setHat]=useState({type:"none",material:"iridescent",color:"#8E6CFF",scale:1,rotation:0,rotationX:0,rotationZ:0,height:0,offsetX:0,offsetY:0,offsetZ:0});
 const [glasses,setGlasses]=useState({type:"none",frameColor:"#A682FF",lensColor:"#70E8FF",frameThickness:.026,scale:1,positionY:0,positionZ:0});
 const [headAccessory,setHeadAccessory]=useState({type:"none",color:"#A874FF",material:"iridescent"});
 const [headDecoration,setHeadDecoration]=useState({type:"none",color:"#FF7ACB",material:"iridescent",scale:1});
 const customPalette=useRef([...PRESETS.Aurora]);
 const realtime=useOpenAIRealtimeVoice(variant);
 const effectiveState=realtime.connected?realtime.phase:manualState;
 const patchHat=p=>setHat(v=>({...v,...p})),patchGlasses=p=>setGlasses(v=>({...v,...p}));
 const updateColor=(i,v)=>{setColors(p=>{const next=p.map((c,j)=>j===i?v:c);customPalette.current=[...next];return next;});setEmotion("neutral");};
 const applyEmotion=name=>{const cfg=EMOTION_PREVIEW[name]||EMOTION_PREVIEW.neutral;setEmotion(name);if(name==="neutral"){setColors([...customPalette.current]);setFlow(.060);}else{setColors([...cfg.colors]);setFlow(cfg.flow);}};
 const applyPreset=palette=>{customPalette.current=[...palette];setColors([...palette]);setEmotion("neutral");setFlow(.060);};
 const changeVariant=v=>{realtime.stop();setVariant(v);setHairStyle(v==="female"?"elegant":"swept");setManualState("idle");};
 const testOpenAI=async()=>{let ok=realtime.connected;if(!ok)ok=await realtime.start();if(ok)realtime.sendText(variant==="female"?"Powiedz po polsku krótkie, ciepłe powitanie jako kobieca Living Orb i pokaż naturalną ekspresję głosu.":"Powiedz po polsku krótkie, ciepłe powitanie jako męski Living Orb i pokaż naturalną ekspresję głosu.");};
 return <main className="creatorRoot">
  <section className="creatorPreview"><LivingLumeniaOrb variant={variant} emotion={emotion} emotionIntensity={1} state={effectiveState} audioLevel={realtime.audioLevel} audioBands={realtime.audioBands} gesturesEnabled lipSyncEnabled hairStyle={hairStyle} flyaways={flyaways} mustacheStyle={variant==="male"?mustacheStyle:"none"} beardStyle={variant==="male"?beardStyle:"none"} hat={hat} glasses={glasses} headAccessory={headAccessory} headDecoration={headDecoration} view={view} colorFlowSpeed={flow} orbColors={colors} style={{width:"100%",height:"100%",minHeight:"100%"}}/><div className="creatorBadge">ANCHOR-SAFE CREATOR · {emotion.toUpperCase()}</div><div className="viewDock"><button onClick={()=>setView("front")} className={view==="front"?"mini active":"mini"}>FRONT</button><button onClick={()=>setView("side")} className={view==="side"?"mini active":"mini"}>SIDE</button><button onClick={()=>setView("back")} className={view==="back"?"mini active":"mini"}>BACK</button><button onClick={()=>setView("top")} className={view==="top"?"mini active":"mini"}>TOP</button></div></section>
  <aside className="creatorPanel">
   <div className="creatorHead"><div><span className="creatorEyebrow">SECOND LIFE · CREATOR REPAIR</span><h1>Create Your Orb</h1></div><a className="backLink" href="/v42">ORB</a></div>
   <p className="creatorIntro">Nakrycia głowy korzystają teraz ze wspólnego HEAD_TOP, per-model calibration i hair clearance. Każda widoczna opcja poniżej ma realny model 3D.</p>

   <div className="controlBlock"><div className="controlTitle">CHARACTER</div><Chips items={["female","male"]} value={variant} onChange={changeVariant}/><div className="subTitle">STATE PREVIEW</div><Chips items={["idle","listening","thinking","speaking"]} value={manualState} onChange={v=>{if(realtime.connected)realtime.stop();setManualState(v);}}/></div>

   <div className="controlBlock"><div className="controlTitle">LIVING COLORS</div><div className="colorGrid">{colors.map((c,i)=><label className="colorCard" key={i}><span>COLOR {i+1}</span><input type="color" value={c} onChange={e=>updateColor(i,e.target.value)}/><code>{c.toUpperCase()}</code></label>)}</div><div className="chipRow">{Object.entries(PRESETS).map(([n,p])=><button className="chip" key={n} onClick={()=>applyPreset(p)}>{n.toUpperCase()}</button>)}</div><Range label="COLOR FLOW" value={flow} min={.02} max={.12} step={.005} onChange={setFlow}/></div>

   <div className="controlBlock"><div className="controlTitle">EMOTION PREVIEW</div><Chips items={EMOTIONS} value={emotion} onChange={applyEmotion}/><p className="controlHelp">Emocja zmienia paletę, glow i tempo flow. Neutral przywraca Twoją własną paletę.</p></div>

   <div className="controlBlock"><div className="controlTitle">HAIR + FLYAWAYS</div>{variant==="female"?<Chips items={["elegant","short","long-wave","none"]} value={hairStyle} onChange={setHairStyle}/>:<Chips items={["swept","none"]} value={hairStyle} onChange={setHairStyle}/>}<div className="subTitle">FLYAWAYS</div><Chips items={FLY} value={flyaways.type} onChange={v=>setFlyaways({type:v})}/></div>

   {variant==="male"&&<div className="controlBlock"><div className="controlTitle">FACIAL HAIR</div><div className="subTitle">MUSTACHE</div><Chips items={MUSTACHES} value={mustacheStyle} onChange={setMustacheStyle}/><div className="subTitle">BEARD</div><Chips items={BEARDS} value={beardStyle} onChange={setBeardStyle}/></div>}

   <div className="controlBlock"><div className="controlTitle">HATS · COLLISION-CALIBRATED</div><AccessoryGrid items={HATS} value={hat.type} onChange={v=>patchHat({type:v,height:0,offsetY:0})} color={hat.color} mode={hat.material}/><div className="subTitle">MATERIAL</div><Chips items={MATERIALS} value={hat.material} onChange={v=>patchHat({material:v})}/><ColorControl label="COLOR" value={hat.color} onChange={v=>patchHat({color:v})}/><Range label="SCALE" value={hat.scale} min={.82} max={1.22} step={.02} onChange={v=>patchHat({scale:v})}/><Range label="EXTRA HEIGHT" value={hat.height} min={-.08} max={.32} step={.01} onChange={v=>patchHat({height:v})}/><p className="controlHelp">Beret ma osobny localBottom i minimalny surface clearance, więc nie może zostać opuszczony poniżej bezpiecznej wysokości głowy.</p></div>

   <div className="controlBlock"><div className="controlTitle">HEAD DECORATIONS · REAL 3D</div><AccessoryGrid items={DECOR} value={headDecoration.type} onChange={v=>setHeadDecoration(p=>({...p,type:v}))} color={headDecoration.color} mode={headDecoration.material}/><div className="subTitle">MATERIAL</div><Chips items={MATERIALS} value={headDecoration.material} onChange={v=>setHeadDecoration(p=>({...p,material:v}))}/><ColorControl label="COLOR" value={headDecoration.color} onChange={v=>setHeadDecoration(p=>({...p,color:v}))}/><Range label="SCALE" value={headDecoration.scale} min={.72} max={1.28} step={.02} onChange={v=>setHeadDecoration(p=>({...p,scale:v}))}/></div>

   <div className="controlBlock"><div className="controlTitle">EYEWEAR · REAL 3D</div><AccessoryGrid items={EYEWEAR} value={glasses.type} onChange={v=>patchGlasses({type:v})} color={glasses.frameColor}/><ColorControl label="FRAME" value={glasses.frameColor} onChange={v=>patchGlasses({frameColor:v})}/><ColorControl label="LENS" value={glasses.lensColor} onChange={v=>patchGlasses({lensColor:v})}/><Range label="FRAME THICKNESS" value={glasses.frameThickness} min={.016} max={.045} step={.001} onChange={v=>patchGlasses({frameThickness:v})}/><Range label="SCALE" value={glasses.scale} min={.85} max={1.18} step={.01} onChange={v=>patchGlasses({scale:v})}/></div>

   <div className="controlBlock"><div className="controlTitle">AUDIO ACCESSORIES · REAL 3D</div><AccessoryGrid items={AUDIO} value={headAccessory.type} onChange={v=>setHeadAccessory(p=>({...p,type:v}))} color={headAccessory.color} mode={headAccessory.material}/><div className="subTitle">MATERIAL</div><Chips items={MATERIALS} value={headAccessory.material} onChange={v=>setHeadAccessory(p=>({...p,material:v}))}/><ColorControl label="COLOR" value={headAccessory.color} onChange={v=>setHeadAccessory(p=>({...p,color:v}))}/></div>

   <div className="controlBlock"><div className="controlTitle">OPENAI REALTIME VOICE</div><div className="chipRow"><button className={realtime.connected?"testButton active":"testButton"} onClick={realtime.connected?realtime.stop:realtime.start}>{realtime.connecting?"CONNECTING…":realtime.connected?"STOP REALTIME":"START REALTIME"}</button><button className="testButton" onClick={testOpenAI}>TEST OPENAI VOICE</button></div><p className="controlHelp">{variant==="female"?"FEMALE · MARIN":"MALE · CEDAR"} · {realtime.connected?realtime.phase.toUpperCase():"OFFLINE"}. Realne audio steruje ustami, gestami i Voice Orb.</p><div className="audioMeter"><i style={{width:`${Math.round(realtime.audioLevel*100)}%`}}/></div>{realtime.error&&<p className="controlHelp" style={{color:"#ff9ab9"}}>{realtime.error}</p>}</div>

   <div className="stageNote">360° QA: FRONT · SIDE · BACK · TOP. Sprawdź każdy kapelusz z NO HAIR, SHORT/SWEPT i większą fryzurą. UI pokazuje wyłącznie modele faktycznie renderowane.</div>
  </aside>
 </main>;
}
