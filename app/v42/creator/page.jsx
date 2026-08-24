"use client";

import React,{useMemo,useState} from "react";
import LivingLumeniaOrb from "../LivingLumeniaOrb";
import "./creator.css";

const PRESETS={
 Aurora:["#22E8FF","#3568FF","#A245FF","#FF42C2"],
 Ocean:["#24EAD8","#20DFFF","#285DFF","#7955FF"],
 Sunset:["#FFB38E","#FF7DAF","#E84ACB","#8C55FF"],
 Forest:["#48E39F","#29D9C1","#34E8FF","#B5F25C"],
 Fire:["#FFC34D","#FF843F","#FF6C72","#D94BFF"]
};

export default function LivingOrbCreatorPage(){
 const [colors,setColors]=useState(PRESETS.Aurora);
 const [flow,setFlow]=useState(.06);
 const [variant,setVariant]=useState("female");
 const [emotion,setEmotion]=useState("neutral");
 const [mustache,setMustache]=useState(true);
 const labels=["COLOR 1","COLOR 2","COLOR 3","COLOR 4"];
 const updateColor=(i,value)=>setColors(prev=>prev.map((c,index)=>index===i?value:c));
 const flowLabel=useMemo(()=>flow<.03?"VERY SLOW":flow<.05?"SLOW":flow<.075?"NORMAL":flow<.11?"ACTIVE":"DYNAMIC",[flow]);
 return <main className="creatorRoot">
  <section className="creatorPreview">
   <LivingLumeniaOrb variant={variant} emotion={emotion} emotionIntensity={.82} state="idle" showMustache={mustache} colorFlowSpeed={flow} orbColors={colors} style={{width:"100%",height:"100%",minHeight:"100%"}}/>
   <div className="creatorBadge">CREATE YOUR ORB · STAGE 1</div>
  </section>
  <aside className="creatorPanel">
   <div className="creatorHead"><div><span className="creatorEyebrow">LIVING GLASS ORB CREATOR</span><h1>Kolory + Living Flow</h1></div><a className="backLink" href="/v42">ORB</a></div>
   <p className="creatorIntro">Cztery kolory są przekazywane bezpośrednio do żywego shadera. Nie są statycznym gradientem — nadal przemieszczają się, przenikają, zmieniają fazę i reagują na oddech.</p>
   <div className="controlBlock"><div className="controlTitle">POSTAĆ</div><div className="chipRow"><button className={variant==="female"?"chip active":"chip"} onClick={()=>setVariant("female")}>FEMALE</button><button className={variant==="male"?"chip active":"chip"} onClick={()=>setVariant("male")}>MALE</button>{variant==="male"&&<button className={mustache?"chip active":"chip"} onClick={()=>setMustache(v=>!v)}>MUSTACHE {mustache?"ON":"OFF"}</button>}</div></div>
   <div className="controlBlock"><div className="controlTitle">ORB COLORS</div><div className="colorGrid">{colors.map((color,i)=><label className="colorCard" key={i}><span>{labels[i]}</span><input type="color" value={color} onChange={e=>updateColor(i,e.target.value)}/><code>{color.toUpperCase()}</code></label>)}</div></div>
   <div className="controlBlock"><div className="controlTitle">PRESETS</div><div className="chipRow">{Object.entries(PRESETS).map(([name,palette])=><button key={name} className="chip" onClick={()=>setColors(palette)}>{name.toUpperCase()}</button>)}</div></div>
   <div className="controlBlock"><div className="sliderLabel"><span>COLOR FLOW SPEED</span><strong>{flow.toFixed(3)} · {flowLabel}</strong></div><input className="flowSlider" type="range" min="0.01" max="0.15" step="0.005" value={flow} onChange={e=>setFlow(Number(e.target.value))}/><div className="sliderScale"><span>VERY SLOW</span><span>DYNAMIC</span></div></div>
   <div className="controlBlock"><div className="controlTitle">EMOTION PREVIEW</div><div className="chipRow">{["neutral","happy","caring","calm","curious","excited","sad","surprised","warning"].map(name=><button key={name} className={emotion===name?"chip active":"chip"} onClick={()=>setEmotion(name)}>{name.toUpperCase()}</button>)}</div></div>
   <div className="stageNote">ETAP 1: cztery własne kolory + ciągły Living Color Flow. Kolejne moduły będą dodawane etapami, bez naruszania działającego ORB-a.</div>
  </aside>
 </main>;
}
