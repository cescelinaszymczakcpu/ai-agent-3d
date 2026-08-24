"use client";

import {useState} from "react";
import LivingLumeniaOrb from "./LivingLumeniaOrb";
import useOpenAIRealtimeVoice from "./useOpenAIRealtimeVoice";

export default function LivingOrbStage(){
 const [variant,setVariant]=useState("female");
 const realtime=useOpenAIRealtimeVoice(variant);
 const state=realtime.connected?realtime.phase:"idle";
 const changeVariant=v=>{realtime.stop();setVariant(v)};
 const testVoice=()=>realtime.startAndSend("Powiedz po polsku dwa krótkie zdania z naturalną intonacją. Gestykuluj spokojnie i wyraźnie zgodnie z rytmem mowy.");
 return <main style={{width:"100vw",height:"100dvh",margin:0,padding:0,overflow:"hidden",background:"#020611",position:"relative"}}>
  <LivingLumeniaOrb emotion="neutral" colorFlowSpeed={.06} state={state} audioLevel={realtime.audioLevel} audioBands={realtime.audioBands} style={{width:"100vw",height:"100dvh",minHeight:"100dvh",background:"#020611"}}/>
  <div style={{position:"absolute",left:18,top:18,zIndex:20,padding:"9px 12px",borderRadius:12,border:"1px solid rgba(255,255,255,.10)",background:"rgba(3,8,22,.72)",color:"#DDF7FF",fontSize:11,letterSpacing:".08em",backdropFilter:"blur(12px)"}}>LIVING ORB · SAFE BODY · {state.toUpperCase()}</div>
  <div style={{position:"absolute",left:18,bottom:18,zIndex:20,display:"flex",gap:8,flexWrap:"wrap"}}>
   <button onClick={()=>changeVariant("female")} style={pill(variant==="female")}>FEMALE · MARIN</button>
   <button onClick={()=>changeVariant("male")} style={pill(variant==="male")}>MALE · CEDAR</button>
   <button onClick={realtime.connected?realtime.stop:realtime.start} style={pill(realtime.connected)}>{realtime.connecting?"CONNECTING…":realtime.connected?"STOP REALTIME":"START REALTIME"}</button>
   <button onClick={testVoice} style={pill(false)}>TEST VOICE + GESTURES</button>
  </div>
  {realtime.error&&<div style={{position:"absolute",left:18,bottom:68,zIndex:20,maxWidth:420,padding:"8px 10px",borderRadius:10,background:"rgba(50,8,25,.82)",color:"#FFB0C8",fontSize:11}}>{realtime.error}</div>}
  <a href="/v42/creator" style={{position:"absolute",right:18,bottom:18,zIndex:20,padding:"11px 16px",borderRadius:999,border:"1px solid rgba(255,255,255,.12)",background:"rgba(5,12,30,.78)",color:"#F5FBFF",textDecoration:"none",fontSize:12}}>CREATOR</a>
 </main>;
}

function pill(active){return {padding:"10px 13px",borderRadius:999,border:active?"1px solid rgba(82,230,255,.75)":"1px solid rgba(255,255,255,.12)",background:active?"rgba(63,214,255,.14)":"rgba(5,12,30,.78)",color:"#F5FBFF",cursor:"pointer",fontSize:11,fontWeight:700,letterSpacing:".05em"}}
