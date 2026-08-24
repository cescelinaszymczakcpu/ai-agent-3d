"use client";

import React,{useRef,useState} from "react";
import LivingLumeniaOrb from "../LivingLumeniaOrb";
import "./creator.css";

const PRESETS={Aurora:["#22E8FF","#3568FF","#A245FF","#FF42C2"],Ocean:["#24EAD8","#20DFFF","#285DFF","#7955FF"],Sunset:["#FFB38E","#FF7DAF","#E84ACB","#8C55FF"]};
const EMOTIONS={
 neutral:["#22E8FF","#3568FF","#A245FF","#FF42C2"],happy:["#2CF4FF","#39DCC8","#FF57CC","#FFB47E"],caring:["#54E8F4","#637CFF","#C477FF","#FF8EAE"],calm:["#65EAD9","#63B8FF","#9C8FFF","#DDA4FF"],curious:["#35F0FF","#406CFF","#A34DFF","#DC58FF"],excited:["#00F6FF","#425DFF","#CD38FF","#FF35A9"],sad:["#367AAE","#3859B8","#6550A8","#835B9D"],surprised:["#A8FAFF","#46BDFF","#B855FF","#FF75DF"],warning:["#FFBF44","#FF7A4A","#C454FF","#FF568D"],error:["#FF419C","#9E3DFF","#FF486A","#694AFF"]
};

function Chips({items,value,onChange}){return <div className="chipRow">{items.map(name=><button key={name} className={value===name?"chip active":"chip"} onClick={()=>onChange(name)}>{name.toUpperCase()}</button>)}</div>}
function Range({label,value,min,max,step,onChange}){return <label className="rangeControl"><span><b>{label}</b><em>{Number(value).toFixed(3)}</em></span><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>}

export default function LivingOrbCreatorPage(){
 const [characterType]=useState("orb");
 const [colors,setColors]=useState(PRESETS.Aurora);
 const [emotion,setEmotion]=useState("neutral");
 const [flow,setFlow]=useState(.06);
 const [view,setView]=useState("front");
 const custom=useRef([...PRESETS.Aurora]);

 const applyEmotion=name=>{setEmotion(name);if(name==="neutral")setColors([...custom.current]);else setColors([...EMOTIONS[name]]);};
 const applyPreset=p=>{custom.current=[...p];setColors([...p]);setEmotion("neutral");};
 const updateColor=(i,v)=>{setColors(prev=>{const next=prev.map((c,j)=>j===i?v:c);custom.current=[...next];return next});setEmotion("neutral")};

 return <main className="creatorRoot" style={{background:"#020611"}}>
  <section className="creatorPreview" style={{background:"#020611"}}>
   {characterType==="orb"&&<LivingLumeniaOrb emotion={emotion} view={view} colorFlowSpeed={flow} orbColors={colors} style={{width:"100%",height:"100%",minHeight:"100%",background:"#020611"}}/>}
   <div className="creatorBadge">RECOVERY MODE · LIVING ORB</div>
   <div className="viewDock">
    {[["front","FRONT"],["left","LEFT"],["right","RIGHT"],["back","BACK"],["top","TOP"]].map(([id,label])=><button key={id} onClick={()=>setView(id)} className={view===id?"mini active":"mini"}>{label}</button>)}
   </div>
  </section>

  <aside className="creatorPanel">
   <div className="creatorHead"><div><span className="creatorEyebrow">ALTER · SECOND LIFE · RECOVERY</span><h1>Living Orb</h1></div><a className="backLink" href="/v42">ORB</a></div>
   <p className="creatorIntro">Najpierw przywrócony został stabilny renderer. Akcesoria, gesty, lip sync i Realtime są chwilowo wyłączone, aby żaden z tych modułów nie mógł wyłączyć całego Canvas.</p>

   <div className="controlBlock"><div className="controlTitle">CHARACTER TYPE</div><Chips items={["orb"]} value={characterType} onChange={()=>{}}/><p className="controlHelp">Default = ORB. Human Avatar nie zastępuje Living Orb i zostanie ponownie włączony dopiero po walidacji renderera.</p></div>

   <div className="controlBlock"><div className="controlTitle">COLORS</div><div className="colorGrid">{colors.map((c,i)=><label className="colorCard" key={i}><span>COLOR {i+1}</span><input type="color" value={c} onChange={e=>updateColor(i,e.target.value)}/><code>{c.toUpperCase()}</code></label>)}</div><div className="chipRow" style={{marginTop:10}}>{Object.entries(PRESETS).map(([name,p])=><button key={name} className="chip" onClick={()=>applyPreset(p)}>{name.toUpperCase()}</button>)}</div><Range label="COLOR FLOW" value={flow} min={.02} max={.12} step={.005} onChange={setFlow}/></div>

   <div className="controlBlock"><div className="controlTitle">EMOTION PREVIEW</div><Chips items={Object.keys(EMOTIONS)} value={emotion} onChange={applyEmotion}/><p className="controlHelp">Emocje zmieniają paletę orba, ale nie uruchamiają żadnych zewnętrznych modułów.</p></div>

   <div className="stageNote">RECOVERY TEST: ciemne tło · orb widoczny od razu · breathing · multicolor flow · FRONT/LEFT/RIGHT/BACK/TOP · bez white screen.</div>
  </aside>
 </main>;
}
