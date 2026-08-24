"use client";

import React,{useEffect,useMemo,useRef,useState} from "react";
import LivingLumeniaOrb from "../LivingLumeniaOrb";
import "./creator.css";

const PRESETS={Aurora:["#22E8FF","#3568FF","#A245FF","#FF42C2"],Ocean:["#24EAD8","#20DFFF","#285DFF","#7955FF"],Sunset:["#FFB38E","#FF7DAF","#E84ACB","#8C55FF"],Forest:["#48E39F","#29D9C1","#34E8FF","#B5F25C"],Fire:["#FFC34D","#FF843F","#FF6C72","#D94BFF"]};
const EMOTIONS=["neutral","happy","caring","calm","curious","excited","sad","surprised","warning","error"];
const HATS=["none","fedora","bowler","top-hat","beret","soft-cap","wide-brim","futuristic-halo-hat"];
const GLASSES=["none","round","oval","cat-eye","rectangular","futuristic","monocle"];
const FLY=["none","one-strand","two-strands","three-strands","soft-curls","messy","side-flyaways","antenna-curl"];
const MUSTACHES=["none","reference-curled","classic","slim","handlebar","big-curl","short","futuristic"];
const BEARDS=["none","short","goatee","chin-glow","full-light-beard"];
const HEAD=["none","crown","halo","headband","bow","star","light-flower","headphones","headset"];

function Chips({items,value,onChange}){return <div className="chipRow">{items.map(name=><button key={name} className={value===name?"chip active":"chip"} onClick={()=>onChange(name)}>{name.replaceAll("-"," ").toUpperCase()}</button>)}</div>;}
function Range({label,value,min,max,step,onChange,unit=""}){return <label className="rangeControl"><span><b>{label}</b><em>{Number(value).toFixed(step<.01?3:2)}{unit}</em></span><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>;}
function ColorControl({label,value,onChange}){return <label className="smallColor"><span>{label}</span><input type="color" value={value} onChange={e=>onChange(e.target.value)}/><code>{value.toUpperCase()}</code></label>;}

export default function LivingOrbCreatorPage(){
 const [colors,setColors]=useState(PRESETS.Aurora);
 const [flow,setFlow]=useState(.06);
 const [variant,setVariant]=useState("female");
 const [emotion,setEmotion]=useState("neutral");
 const [state,setState]=useState("idle");
 const [audioLevel,setAudioLevel]=useState(0);
 const [voiceTest,setVoiceTest]=useState(false);
 const [eyesEnabled,setEyesEnabled]=useState(true);
 const [eyeStyle,setEyeStyle]=useState("reference");
 const [hairStyle,setHairStyle]=useState("elegant");
 const [mustacheStyle,setMustacheStyle]=useState("reference-curled");
 const [beardStyle,setBeardStyle]=useState("none");
 const [view,setView]=useState("front");
 const [testMode,setTestMode]=useState("");
 const [hat,setHat]=useState({type:"none",material:"iridescent",color:"#8E6CFF",scale:1,rotation:0,height:0,offsetX:0,offsetY:0,offsetZ:0});
 const [glasses,setGlasses]=useState({type:"none",frameColor:"#A682FF",frameThickness:.028,lensColor:"#70E8FF",lensTransparency:.70,scale:1,positionY:0,positionZ:0});
 const [flyaways,setFlyaways]=useState({type:"none",length:1,curve:1,thickness:.045,glow:.08,color:"#9C72FF",physics:true});
 const [headAccessory,setHeadAccessory]=useState({type:"none",color:"#A874FF"});
 const testTimer=useRef(null);

 useEffect(()=>()=>{if(testTimer.current)clearTimeout(testTimer.current);},[]);
 useEffect(()=>{if(!voiceTest){setAudioLevel(0);return;}let frame=0,start=performance.now();const loop=now=>{const t=(now-start)/1000;const value=Math.max(0,Math.min(1,.34+Math.sin(t*5.1)*.16+Math.sin(t*12.7)*.11+Math.sin(t*1.4)*.16));setAudioLevel(value);frame=requestAnimationFrame(loop);};frame=requestAnimationFrame(loop);return()=>cancelAnimationFrame(frame);},[voiceTest]);

 const labels=["COLOR 1","COLOR 2","COLOR 3","COLOR 4"];
 const updateColor=(i,value)=>setColors(prev=>prev.map((c,index)=>index===i?value:c));
 const flowLabel=useMemo(()=>flow<.03?"VERY SLOW":flow<.05?"SLOW":flow<.075?"NORMAL":flow<.11?"ACTIVE":"DYNAMIC",[flow]);
 const patchHat=p=>setHat(v=>({...v,...p}));
 const patchGlasses=p=>setGlasses(v=>({...v,...p}));
 const patchFly=p=>setFlyaways(v=>({...v,...p}));

 const runBreathTest=()=>{if(testTimer.current)clearTimeout(testTimer.current);setVoiceTest(false);setAudioLevel(0);setState("idle");setEmotion("neutral");setTestMode("breath");testTimer.current=setTimeout(()=>setTestMode(""),10000);};
 const runColorTest=()=>{if(testTimer.current)clearTimeout(testTimer.current);setVoiceTest(false);setState("idle");setEmotion("neutral");setFlow(.10);setTestMode("color");testTimer.current=setTimeout(()=>{setFlow(.06);setTestMode("");},10000);};
 const toggleVoice=()=>{const next=!voiceTest;setVoiceTest(next);setState(next?"speaking":"idle");setTestMode("");};
 const chooseVariant=v=>{setVariant(v);if(v==="female"){setHairStyle(hairStyle==="swept"?"elegant":hairStyle);}else{setHairStyle(hairStyle==="elegant"||hairStyle==="long-wave"||hairStyle==="short"?"swept":hairStyle);}};

 return <main className="creatorRoot">
  <section className="creatorPreview">
   <LivingLumeniaOrb variant={variant} emotion={emotion} emotionIntensity={.86} state={state} audioLevel={audioLevel} mustacheStyle={variant==="male"?mustacheStyle:"none"} beardStyle={variant==="male"?beardStyle:"none"} eyesEnabled={eyesEnabled} eyeStyle={eyeStyle} hairStyle={hairStyle} hat={hat} glasses={glasses} flyaways={flyaways} headAccessory={headAccessory} view={view} colorFlowSpeed={flow} orbColors={colors} style={{width:"100%",height:"100%",minHeight:"100%"}}/>
   <div className="creatorBadge">LIVING 3D GLASS ORB CREATOR {testMode&&`· TEST ${testMode.toUpperCase()}`}</div>
   <div className="viewDock"><button onClick={()=>setView("front")} className={view==="front"?"mini active":"mini"}>FRONT</button><button onClick={()=>setView("side")} className={view==="side"?"mini active":"mini"}>SIDE</button><button onClick={()=>setView("back")} className={view==="back"?"mini active":"mini"}>BACK</button><button onClick={()=>setView("front")} className="mini">RESET VIEW</button></div>
  </section>

  <aside className="creatorPanel">
   <div className="creatorHead"><div><span className="creatorEyebrow">REAL-TIME 3D EDITOR</span><h1>Create Your Orb</h1></div><a className="backLink" href="/v42">ORB</a></div>
   <p className="creatorIntro">Każda aktywna kontrolka poniżej zmienia realny renderer Three.js natychmiast. Akcesoria są geometrią 3D — nie CSS-em ani nakładką.</p>

   <div className="controlBlock"><div className="controlTitle">ORB</div><Chips items={["female","male"]} value={variant} onChange={chooseVariant}/><div className="subTitle">STATE</div><Chips items={["idle","listening","thinking","speaking"]} value={state} onChange={v=>{setVoiceTest(false);setState(v);}}/></div>

   <div className="controlBlock"><div className="controlTitle">COLORS</div><div className="colorGrid">{colors.map((color,i)=><label className="colorCard" key={i}><span>{labels[i]}</span><input type="color" value={color} onChange={e=>updateColor(i,e.target.value)}/><code>{color.toUpperCase()}</code></label>)}</div><div className="subTitle">PRESETS</div><div className="chipRow">{Object.entries(PRESETS).map(([name,palette])=><button key={name} className="chip" onClick={()=>setColors(palette)}>{name.toUpperCase()}</button>)}</div><Range label={`COLOR FLOW · ${flowLabel}`} value={flow} min={.01} max={.15} step={.005} onChange={setFlow}/></div>

   <div className="controlBlock"><div className="controlTitle">EYES</div><div className="switchRow"><button className={eyesEnabled?"chip active":"chip"} onClick={()=>setEyesEnabled(v=>!v)}>EYES {eyesEnabled?"ON":"OFF"}</button></div>{eyesEnabled&&<Chips items={["reference","large","minimal"]} value={eyeStyle} onChange={setEyeStyle}/>}</div>

   <div className="controlBlock"><div className="controlTitle">HAIR</div>{variant==="female"?<Chips items={["elegant","short","long-wave","none"]} value={hairStyle} onChange={setHairStyle}/>:<Chips items={["swept","none"]} value={hairStyle} onChange={setHairStyle}/>}</div>

   <div className="controlBlock"><div className="controlTitle">FLYAWAY HAIR</div><Chips items={FLY} value={flyaways.type} onChange={v=>patchFly({type:v})}/>{flyaways.type!=="none"&&<><Range label="LENGTH" value={flyaways.length} min={.55} max={1.6} step={.05} onChange={v=>patchFly({length:v})}/><Range label="CURVE" value={flyaways.curve} min={.45} max={1.8} step={.05} onChange={v=>patchFly({curve:v})}/><Range label="THICKNESS" value={flyaways.thickness} min={.018} max={.08} step={.002} onChange={v=>patchFly({thickness:v})}/><Range label="GLOW" value={flyaways.glow} min={0} max={.35} step={.01} onChange={v=>patchFly({glow:v})}/><ColorControl label="COLOR" value={flyaways.color} onChange={v=>patchFly({color:v})}/><button className={flyaways.physics?"chip active":"chip"} onClick={()=>patchFly({physics:!flyaways.physics})}>PHYSICS {flyaways.physics?"ON":"OFF"}</button></>}</div>

   {variant==="male"&&<div className="controlBlock"><div className="controlTitle">MUSTACHE</div><Chips items={MUSTACHES} value={mustacheStyle} onChange={setMustacheStyle}/><div className="subTitle">BEARD</div><Chips items={BEARDS} value={beardStyle} onChange={setBeardStyle}/></div>}

   <div className="controlBlock"><div className="controlTitle">HATS</div><Chips items={HATS} value={hat.type} onChange={v=>patchHat({type:v})}/>{hat.type!=="none"&&<><div className="subTitle">HAT MATERIAL</div><Chips items={["glass","frosted-glass","iridescent","holographic","chrome-glass"]} value={hat.material} onChange={v=>patchHat({material:v})}/><ColorControl label="HAT COLOR" value={hat.color} onChange={v=>patchHat({color:v})}/><Range label="HAT SCALE" value={hat.scale} min={.65} max={1.45} step={.02} onChange={v=>patchHat({scale:v})}/><Range label="HAT ROTATION" value={hat.rotation} min={-3.14} max={3.14} step={.05} onChange={v=>patchHat({rotation:v})}/><Range label="HAT HEIGHT" value={hat.height} min={-.35} max={.55} step={.02} onChange={v=>patchHat({height:v})}/><Range label="OFFSET X" value={hat.offsetX} min={-.6} max={.6} step={.02} onChange={v=>patchHat({offsetX:v})}/><Range label="OFFSET Y" value={hat.offsetY} min={-.4} max={.6} step={.02} onChange={v=>patchHat({offsetY:v})}/><Range label="OFFSET Z" value={hat.offsetZ} min={-.6} max={.6} step={.02} onChange={v=>patchHat({offsetZ:v})}/></>}</div>

   <div className="controlBlock"><div className="controlTitle">GLASSES</div><Chips items={GLASSES} value={glasses.type} onChange={v=>patchGlasses({type:v})}/>{glasses.type!=="none"&&<><ColorControl label="FRAME COLOR" value={glasses.frameColor} onChange={v=>patchGlasses({frameColor:v})}/><Range label="FRAME THICKNESS" value={glasses.frameThickness} min={.012} max={.07} step={.002} onChange={v=>patchGlasses({frameThickness:v})}/><ColorControl label="LENS COLOR" value={glasses.lensColor} onChange={v=>patchGlasses({lensColor:v})}/><Range label="LENS TRANSPARENCY" value={glasses.lensTransparency} min={.1} max={.95} step={.01} onChange={v=>patchGlasses({lensTransparency:v})}/><Range label="SCALE" value={glasses.scale} min={.72} max={1.35} step={.02} onChange={v=>patchGlasses({scale:v})}/><Range label="POSITION Y" value={glasses.positionY} min={-.35} max={.35} step={.02} onChange={v=>patchGlasses({positionY:v})}/><Range label="POSITION Z" value={glasses.positionZ} min={-.25} max={.35} step={.02} onChange={v=>patchGlasses({positionZ:v})}/></>}</div>

   <div className="controlBlock"><div className="controlTitle">HEAD ACCESSORIES</div><Chips items={HEAD} value={headAccessory.type} onChange={v=>setHeadAccessory(p=>({...p,type:v}))}/>{headAccessory.type!=="none"&&<ColorControl label="ACCESSORY COLOR" value={headAccessory.color} onChange={v=>setHeadAccessory(p=>({...p,color:v}))}/>}</div>

   <div className="controlBlock"><div className="controlTitle">ANIMATION</div><div className="testRow"><button className={testMode==="breath"?"testButton active":"testButton"} onClick={runBreathTest}>TEST BREATH · 10 s</button><button className={testMode==="color"?"testButton active":"testButton"} onClick={runColorTest}>TEST COLOR FLOW · 10 s</button></div><p className="controlHelp">TEST BREATH ustawia Neutral + Idle i wyłącza reakcję głosu. TEST COLOR FLOW ustawia 0.10 na 10 sekund, potem wraca do 0.060.</p></div>

   <div className="controlBlock"><div className="controlTitle">EMOTION PREVIEW</div><Chips items={EMOTIONS} value={emotion} onChange={v=>{setEmotion(v);setTestMode("");}}/><p className="controlHelp">Zmiana emocji trafia bezpośrednio do shadera; color flow i breathing nie są resetowane.</p></div>

   <div className="controlBlock"><div className="controlTitle">VOICE PREVIEW</div><button className={voiceTest?"testButton active":"testButton"} onClick={toggleVoice}>{voiceTest?"STOP VOICE TEST":"TEST VOICE ENERGY"}</button><div className="audioMeter"><i style={{width:`${Math.round(audioLevel*100)}%`}}/></div><p className="controlHelp">Ten przycisk jest demonstracją reakcji audio 0–1. W realnej rozmowie renderer przyjmuje rzeczywisty poziom audio z istniejącego toru głosowego.</p></div>

   <div className="stageNote">REAL 3D: Emotion binding + 5.2 s Living Breath + continuous multicolor flow + Hats + Glasses + Flyaways + facial hair + Head Accessories. Każdy aktywny wybór jest podłączony do renderera.</div>
  </aside>
 </main>;
}
