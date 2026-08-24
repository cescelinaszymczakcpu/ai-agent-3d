"use client";

import React,{useRef,useState} from "react";
import LivingLumeniaOrb from "../LivingLumeniaOrb";
import useOpenAIRealtimeVoice from "../useOpenAIRealtimeVoice";
import "./creator.css";

const PRESETS={Aurora:["#22E8FF","#3568FF","#A245FF","#FF42C2"],Ocean:["#24EAD8","#20DFFF","#285DFF","#7955FF"],Sunset:["#FFB38E","#FF7DAF","#E84ACB","#8C55FF"]};
const EMOTIONS={neutral:["#22E8FF","#3568FF","#A245FF","#FF42C2"],happy:["#2CF4FF","#39DCC8","#FF57CC","#FFB47E"],caring:["#54E8F4","#637CFF","#C477FF","#FF8EAE"],calm:["#65EAD9","#63B8FF","#9C8FFF","#DDA4FF"],curious:["#35F0FF","#406CFF","#A34DFF","#DC58FF"],excited:["#00F6FF","#425DFF","#CD38FF","#FF35A9"],sad:["#367AAE","#3859B8","#6550A8","#835B9D"],surprised:["#A8FAFF","#46BDFF","#B855FF","#FF75DF"],warning:["#FFBF44","#FF7A4A","#C454FF","#FF568D"],error:["#FF419C","#9E3DFF","#FF486A","#694AFF"]};
const BOW_TYPES=["none","small-bow","big-bow","side-bow","center-bow","double-bow"];
const BOW_POSITIONS=["top","left","right","front-hair","bow-tie"];
const HAT_TYPES=["none","fedora","top-hat","bowler","beret","soft-cap","wide-brim"];
const AUDIO_TYPES=["none","earmuffs","headphones","headset"];
const EYEWEAR_TYPES=["none","round","oval","cat-eye","rectangular","futuristic","monocle"];
const HEAD_ACCESSORIES=["none","headband","crown","halo","star","light-flower"];
const OUTFITS=["none","formal-collar","glass-vest","capelet","waist-sash","orb-dress"];
const HAIR_STYLES=["none","one-strand","two-strands","three-strands","side-strand","soft-curls","messy-strands","side-ponytail","twin-ponytails"];
const FACIAL_HAIR_STYLES=["none","reference-curled","classic","slim","handlebar","short","beard","goatee"];
const MATERIALS=["glass","frosted-glass","iridescent","holographic","pearlescent","chrome-glass"];

const HAT_DEFAULTS={fedora:{color:"#8E72FF",collisionRadius:.035},"top-hat":{color:"#765BFF",collisionRadius:.035},bowler:{color:"#8A7CFF",collisionRadius:.035},beret:{color:"#B57CFF",collisionRadius:.040},"soft-cap":{color:"#6FE8FF",collisionRadius:.038},"wide-brim":{color:"#9A82FF",collisionRadius:.045}};
const HEAD_COLORS={headband:"#9B84FF",crown:"#B486FF",halo:"#7DEBFF",star:"#FFD178","light-flower":"#FF82CE"};
const OUTFIT_COLORS={"formal-collar":"#A286FF","glass-vest":"#6FE9FF",capelet:"#9A80FF","waist-sash":"#FF82CE","orb-dress":"#8A82FF"};

function hairProfile(style){if(style==="none")return "none";if(style==="soft-curls")return "reference-curl";if(style==="side-ponytail"||style==="twin-ponytails")return "long-hair";return "short"}
function Chips({items,value,onChange}){return <div className="chipRow">{items.map(name=><button key={name} className={value===name?"chip active":"chip"} onClick={()=>onChange(name)}>{name.replaceAll("-"," ").toUpperCase()}</button>)}</div>}
function Range({label,value,min,max,step,onChange}){return <label className="rangeControl"><span><b>{label}</b><em>{Number(value).toFixed(3)}</em></span><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>}
function ColorControl({value,onChange}){return <label className="smallColor"><span>COLOR</span><input type="color" value={value} onChange={e=>onChange(e.target.value)}/><code>{value.toUpperCase()}</code></label>}

export default function LivingOrbCreatorPage(){
 const [characterType]=useState("orb");
 const [colors,setColors]=useState(PRESETS.Aurora);
 const [emotion,setEmotion]=useState("neutral");
 const [flow,setFlow]=useState(.06);
 const [cameraView,setCameraView]=useState({name:"front",version:0});
 const [variant,setVariant]=useState("female");
 const [hair,setHair]=useState({style:"none",color:"#83E9FF"});
 const [facialHair,setFacialHair]=useState({style:"none",color:"#9F7CFF"});
 const [outfit,setOutfit]=useState({type:"none",color:"#8A82FF"});
 const [headAccessory,setHeadAccessory]=useState({type:"none",color:"#9B84FF",hairStyle:"none"});
 const [bow,setBow]=useState({type:"none",position:"top",material:"iridescent",color:"#FF79CE",scale:1,offsetOut:0,offsetX:0,offsetY:0,offsetZ:0,rotationX:0,rotationY:0,rotationZ:0});
 const [hat,setHat]=useState({type:"none",material:"iridescent",color:"#8E72FF",scale:1,hairStyle:"none",offsetX:0,offsetY:0,offsetZ:0,rotationX:0,rotationY:0,rotationZ:0,collisionRadius:.035});
 const [audioAccessory,setAudioAccessory]=useState({type:"none",material:"iridescent",color:"#7FEAFF",scale:1,hairStyle:"none",offsetX:0,offsetY:0,offsetZ:0,rotationX:0,rotationY:0,rotationZ:0,collisionRadius:.055});
 const [glasses,setGlasses]=useState({type:"none",material:"iridescent",color:"#80E9FF",scale:1,hairStyle:"none",offsetX:0,offsetY:0,offsetZ:0,rotationX:0,rotationY:0,rotationZ:0,collisionRadius:.055});
 const custom=useRef([...PRESETS.Aurora]);
 const realtime=useOpenAIRealtimeVoice(variant);
 const state=realtime.connected?realtime.phase:"idle";

 const applyEmotion=name=>{setEmotion(name);if(name==="neutral")setColors([...custom.current]);else setColors([...EMOTIONS[name]])};
 const applyPreset=p=>{custom.current=[...p];setColors([...p]);setEmotion("neutral")};
 const updateColor=(i,v)=>{setColors(prev=>{const next=prev.map((c,j)=>j===i?v:c);custom.current=[...next];return next});setEmotion("neutral")};
 const changeVariant=v=>{realtime.stop();setVariant(v)};
 const testVoice=()=>realtime.startAndSend("Powiedz po polsku krótkie naturalne zdanie. Mów spokojnie, ale z ludzką intonacją, aby gesty rąk mogły reagować na rytm i akcenty mowy.");
 const patchBow=p=>setBow(prev=>({...prev,...p}));
 const patchHat=p=>setHat(prev=>({...prev,...p}));
 const patchAudio=p=>setAudioAccessory(prev=>({...prev,...p}));
 const patchGlasses=p=>setGlasses(prev=>({...prev,...p}));
 const patchHead=p=>setHeadAccessory(prev=>({...prev,...p}));
 const clearMajor=keep=>{if(keep!=="bow")patchBow({type:"none"});if(keep!=="hat")patchHat({type:"none"});if(keep!=="audio")patchAudio({type:"none"});if(keep!=="glasses")patchGlasses({type:"none"});if(keep!=="head")patchHead({type:"none"})};
 const selectHair=style=>{const profile=hairProfile(style);setHair(prev=>({...prev,style}));patchHat({hairStyle:profile});patchAudio({hairStyle:profile});patchGlasses({hairStyle:profile});patchHead({hairStyle:profile})};
 const selectOutfit=type=>setOutfit(prev=>({...prev,type,color:OUTFIT_COLORS[type]||prev.color}));
 const selectBow=v=>{patchBow({type:v});if(v!=="none")clearMajor("bow")};
 const selectHat=v=>{const d=HAT_DEFAULTS[v]||{color:"#8E72FF",collisionRadius:.035};patchHat({type:v,hairStyle:hairProfile(hair.style),color:d.color,collisionRadius:d.collisionRadius,offsetX:0,offsetY:0,offsetZ:0,rotationX:0,rotationY:0,rotationZ:0});if(v!=="none")clearMajor("hat")};
 const selectAudio=v=>{const full=v==="headphones"||v==="headset";patchAudio({type:v,hairStyle:hairProfile(hair.style),color:v==="headset"?"#72E9FF":v==="headphones"?"#6FE8FF":"#7FEAFF",collisionRadius:full?.060:.055,offsetX:0,offsetY:0,offsetZ:0,rotationX:0,rotationY:0,rotationZ:0});if(v!=="none")clearMajor("audio")};
 const selectGlasses=v=>{const color=v==="cat-eye"?"#FF82CE":v==="futuristic"?"#6FF0FF":v==="monocle"?"#FFD07A":v==="rectangular"?"#A98AFF":v==="oval"?"#75E9FF":"#80E9FF";patchGlasses({type:v,hairStyle:hairProfile(hair.style),color,collisionRadius:v==="futuristic"?.065:v==="cat-eye"||v==="monocle"||v==="rectangular"?.060:.055,offsetX:0,offsetY:0,offsetZ:0,rotationX:0,rotationY:0,rotationZ:0});if(v!=="none")clearMajor("glasses")};
 const selectHead=v=>{patchHead({type:v,hairStyle:hairProfile(hair.style),color:HEAD_COLORS[v]||"#9B84FF"});if(v!=="none")clearMajor("head")};
 const chooseView=name=>setCameraView(prev=>({name,version:prev.version+1}));

 return <main className="creatorRoot" style={{background:"#020611"}}>
  <section className="creatorPreview" style={{background:"#020611"}}>
   {characterType==="orb"&&<LivingLumeniaOrb emotion={emotion} view={cameraView.name} viewVersion={cameraView.version} colorFlowSpeed={flow} orbColors={colors} state={state} audioLevel={realtime.audioLevel} audioBands={realtime.audioBands} hair={hair} facialHair={facialHair} outfit={outfit} headAccessory={headAccessory} bow={bow} hat={hat} audio={audioAccessory} glasses={glasses} style={{width:"100%",height:"100%",minHeight:"100%",background:"#020611"}}/>}
   <div className="creatorBadge">SAFE ORB · FREE ROTATION · {state.toUpperCase()}</div>
   <div className="viewDock">{[["front","FRONT"],["left","LEFT"],["right","RIGHT"],["back","BACK"],["top","TOP"]].map(([id,label])=><button key={id} onClick={()=>chooseView(id)} className={cameraView.name===id?"mini active":"mini"}>{label}</button>)}</div>
  </section>

  <aside className="creatorPanel">
   <div className="creatorHead"><div><span className="creatorEyebrow">ALTER · SECOND LIFE</span><h1>Living Orb</h1></div><a className="backLink" href="/v42">ORB</a></div>
   <p className="creatorIntro">Living Orb pozostaje bazą. Kończyny, ubranie i dodatki są osobnymi warstwami. Opcjonalne komponenty mają własne error boundaries, a kamera po presetach pozostaje swobodna.</p>

   <div className="controlBlock"><div className="controlTitle">CHARACTER TYPE</div><Chips items={["orb"]} value={characterType} onChange={()=>{}}/></div>
   <div className="controlBlock"><div className="controlTitle">OUTFIT · LIVING ORB 3D</div><Chips items={OUTFITS} value={outfit.type} onChange={selectOutfit}/>{outfit.type!=="none"&&<><ColorControl value={outfit.color} onChange={v=>setOutfit(prev=>({...prev,color:v}))}/><p className="controlHelp">Ubranie jest modelowane poza maksymalną powierzchnią orba: FORMAL COLLAR, zakrzywiony GLASS VEST, tylna CAPELET, WAIST SASH oraz ORB DRESS. Warstwa oddycha razem z orbem i nie zmienia riga rąk ani nóg.</p></>}</div>
   <div className="controlBlock"><div className="controlTitle">HAIR / FLYAWAYS / PONYTAILS</div><Chips items={HAIR_STYLES} value={hair.style} onChange={selectHair}/>{hair.style!=="none"&&<><ColorControl value={hair.color} onChange={v=>setHair(prev=>({...prev,color:v}))}/><p className="controlHelp">Pasma są projektowane poza maksymalny promień orba i oddychają z tym samym cyklem 5.2 s.</p></>}</div>
   <div className="controlBlock"><div className="controlTitle">MUSTACHE / BEARD · REAL 3D</div><Chips items={FACIAL_HAIR_STYLES} value={facialHair.style} onChange={v=>setFacialHair(prev=>({...prev,style:v}))}/>{facialHair.style!=="none"&&<><ColorControl value={facialHair.color} onChange={v=>setFacialHair(prev=>({...prev,color:v}))}/><p className="controlHelp">Wąsy mają bevel, grubość i profil boczny. BEARD / GOATEE są prowadzone po powierzchni orba.</p></>}</div>
   <div className="controlBlock"><div className="controlTitle">HEAD ACCESSORIES · REAL 3D</div><Chips items={HEAD_ACCESSORIES} value={headAccessory.type} onChange={selectHead}/>{headAccessory.type!=="none"&&<><ColorControl value={headAccessory.color} onChange={v=>patchHead({color:v})}/><p className="controlHelp">HEADBAND / CROWN / HALO / STAR / LIGHT FLOWER mają realną objętość, hair clearance i są zsynchronizowane z breathing. Hair clearance: {headAccessory.hairStyle.toUpperCase()}.</p></>}</div>

   <div className="controlBlock"><div className="controlTitle">OPENAI REALTIME VOICE + GESTURES</div><Chips items={["female","male"]} value={variant} onChange={changeVariant}/><div className="chipRow" style={{marginTop:10}}><button className={realtime.connected?"testButton active":"testButton"} onClick={realtime.connected?realtime.stop:realtime.start}>{realtime.connecting?"CONNECTING…":realtime.connected?"STOP REALTIME":"START REALTIME"}</button><button className="testButton" onClick={testVoice}>TEST VOICE + GESTURES</button></div><p className="controlHelp">{variant==="female"?"FEMALE · MARIN":"MALE · CEDAR"} · {state.toUpperCase()}. Gesty kończyn są sterowane RMS oraz MID/HIGH z prawdziwego audio.</p><div className="audioMeter"><i style={{width:`${Math.round(realtime.audioLevel*100)}%`}}/></div>{realtime.error&&<p className="controlHelp" style={{color:"#ff9ab9"}}>{realtime.error}</p>}</div>

   <div className="controlBlock"><div className="controlTitle">BOWS · REAL 3D</div><Chips items={BOW_TYPES} value={bow.type} onChange={selectBow}/>{bow.type!=="none"&&<><div className="subTitle">POSITION</div><Chips items={BOW_POSITIONS} value={bow.position} onChange={v=>patchBow({position:v})}/><div className="subTitle">MATERIAL</div><Chips items={MATERIALS} value={bow.material} onChange={v=>patchBow({material:v})}/><ColorControl value={bow.color} onChange={v=>patchBow({color:v})}/><Range label="SCALE" value={bow.scale} min={.72} max={1.28} step={.01} onChange={v=>patchBow({scale:v})}/><Range label="SURFACE OFFSET" value={bow.offsetOut} min={-.03} max={.25} step={.01} onChange={v=>patchBow({offsetOut:v})}/></>}</div>
   <div className="controlBlock"><div className="controlTitle">HATS · REAL 3D</div><Chips items={HAT_TYPES} value={hat.type} onChange={selectHat}/>{hat.type!=="none"&&<><div className="subTitle">MATERIAL</div><Chips items={MATERIALS} value={hat.material} onChange={v=>patchHat({material:v})}/><ColorControl value={hat.color} onChange={v=>patchHat({color:v})}/><Range label="SCALE" value={hat.scale} min={.78} max={1.18} step={.01} onChange={v=>patchHat({scale:v})}/><Range label="OFFSET X" value={hat.offsetX} min={-.30} max={.30} step={.01} onChange={v=>patchHat({offsetX:v})}/><Range label="OFFSET Y" value={hat.offsetY} min={-.12} max={.30} step={.01} onChange={v=>patchHat({offsetY:v})}/><Range label="OFFSET Z" value={hat.offsetZ} min={-.30} max={.30} step={.01} onChange={v=>patchHat({offsetZ:v})}/><Range label="ROTATION X" value={hat.rotationX} min={-.30} max={.30} step={.01} onChange={v=>patchHat({rotationX:v})}/><Range label="ROTATION Y" value={hat.rotationY} min={-.40} max={.40} step={.01} onChange={v=>patchHat({rotationY:v})}/><Range label="ROTATION Z" value={hat.rotationZ} min={-.30} max={.30} step={.01} onChange={v=>patchHat({rotationZ:v})}/><Range label="COLLISION RADIUS" value={hat.collisionRadius} min={.018} max={.12} step={.002} onChange={v=>patchHat({collisionRadius:v})}/><p className="controlHelp">FEDORA / TOP HAT / BOWLER / BERET / SOFT CAP / WIDE BRIM mają osobne geometrie i profile kontaktu. Kolizja jest liczona względem maksymalnego promienia orba podczas breathing.</p></>}</div>
   <div className="controlBlock"><div className="controlTitle">AUDIO ACCESSORIES · REAL 3D</div><Chips items={AUDIO_TYPES} value={audioAccessory.type} onChange={selectAudio}/>{audioAccessory.type!=="none"&&<><div className="subTitle">MATERIAL</div><Chips items={MATERIALS} value={audioAccessory.material} onChange={v=>patchAudio({material:v})}/><ColorControl value={audioAccessory.color} onChange={v=>patchAudio({color:v})}/><Range label="SCALE" value={audioAccessory.scale} min={.78} max={1.20} step={.01} onChange={v=>patchAudio({scale:v})}/><Range label="OFFSET X" value={audioAccessory.offsetX} min={-.16} max={.16} step={.01} onChange={v=>patchAudio({offsetX:v})}/><Range label="OFFSET Y" value={audioAccessory.offsetY} min={-.20} max={.24} step={.01} onChange={v=>patchAudio({offsetY:v})}/><Range label="OFFSET Z" value={audioAccessory.offsetZ} min={-.20} max={.24} step={.01} onChange={v=>patchAudio({offsetZ:v})}/><Range label="ROTATION X" value={audioAccessory.rotationX} min={-.16} max={.16} step={.01} onChange={v=>patchAudio({rotationX:v})}/><Range label="ROTATION Y" value={audioAccessory.rotationY} min={-.16} max={.16} step={.01} onChange={v=>patchAudio({rotationY:v})}/><Range label="ROTATION Z" value={audioAccessory.rotationZ} min={-.16} max={.16} step={.01} onChange={v=>patchAudio({rotationZ:v})}/><Range label="COLLISION RADIUS" value={audioAccessory.collisionRadius} min={.035} max={.14} step={.002} onChange={v=>patchAudio({collisionRadius:v})}/><p className="controlHelp">{audioAccessory.type==="headset"?"Headset: pełne over-ear cups + adjustment arms + double band + collision-safe boom microphone i capsule.":audioAccessory.type==="headphones"?"Headphones: bevelled cups, cushions, housing, arms, joints i double band.":"Earmuffs: convex pads, inner cushions, housing, double band i joints."}</p></>}</div>
   <div className="controlBlock"><div className="controlTitle">GLASSES · REAL 3D</div><Chips items={EYEWEAR_TYPES} value={glasses.type} onChange={selectGlasses}/>{glasses.type!=="none"&&<><div className="subTitle">MATERIAL</div><Chips items={MATERIALS} value={glasses.material} onChange={v=>patchGlasses({material:v})}/><ColorControl value={glasses.color} onChange={v=>patchGlasses({color:v})}/><Range label="SCALE" value={glasses.scale} min={.82} max={1.18} step={.01} onChange={v=>patchGlasses({scale:v})}/><Range label="OFFSET X" value={glasses.offsetX} min={-.12} max={.12} step={.01} onChange={v=>patchGlasses({offsetX:v})}/><Range label="OFFSET Y" value={glasses.offsetY} min={-.14} max={.14} step={.01} onChange={v=>patchGlasses({offsetY:v})}/><Range label="OFFSET Z" value={glasses.offsetZ} min={-.08} max={.24} step={.01} onChange={v=>patchGlasses({offsetZ:v})}/><Range label="ROTATION X" value={glasses.rotationX} min={-.12} max={.12} step={.01} onChange={v=>patchGlasses({rotationX:v})}/><Range label="ROTATION Y" value={glasses.rotationY} min={-.12} max={.12} step={.01} onChange={v=>patchGlasses({rotationY:v})}/><Range label="ROTATION Z" value={glasses.rotationZ} min={-.12} max={.12} step={.01} onChange={v=>patchGlasses({rotationZ:v})}/><Range label="COLLISION RADIUS" value={glasses.collisionRadius} min={.035} max={.12} step={.002} onChange={v=>patchGlasses({collisionRadius:v})}/><p className="controlHelp">ROUND / OVAL / CAT EYE / RECTANGULAR / FUTURISTIC mają pełne frame + lens + bridge + temples. MONOCLE ma pojedynczą soczewkę 3D i przestrzenny łańcuszek.</p></>}</div>

   <div className="controlBlock"><div className="controlTitle">COLORS</div><div className="colorGrid">{colors.map((c,i)=><label className="colorCard" key={i}><span>COLOR {i+1}</span><input type="color" value={c} onChange={e=>updateColor(i,e.target.value)}/><code>{c.toUpperCase()}</code></label>)}</div><div className="chipRow" style={{marginTop:10}}>{Object.entries(PRESETS).map(([name,p])=><button key={name} className="chip" onClick={()=>applyPreset(p)}>{name.toUpperCase()}</button>)}</div><Range label="COLOR FLOW" value={flow} min={.02} max={.12} step={.005} onChange={setFlow}/></div>
   <div className="controlBlock"><div className="controlTitle">EMOTION PREVIEW</div><Chips items={Object.keys(EMOTIONS)} value={emotion} onChange={applyEmotion}/></div>
   <div className="stageNote">CURRENT REBUILD: stabilny orb + speech-driven limbs + outfit + flyaways/kitki + facial hair + bows + komplet kapeluszy + earmuffs/headphones/headset + komplet okularów + headband/crown/halo/star/light flower. Nadal wymagany build i test 360° przed oznaczeniem Creatora jako READY.</div>
  </aside>
 </main>;
}
