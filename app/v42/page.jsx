"use client";

import LivingLumeniaOrb from "./LivingLumeniaOrb";

export default function LivingOrbStage(){
 return <main style={{width:"100vw",height:"100dvh",margin:0,padding:0,overflow:"hidden",background:"#020611",position:"relative"}}>
  <LivingLumeniaOrb emotion="neutral" colorFlowSpeed={.06} style={{width:"100vw",height:"100dvh",minHeight:"100dvh",background:"#020611"}}/>
  <div style={{position:"absolute",left:18,top:18,zIndex:20,padding:"9px 12px",borderRadius:12,border:"1px solid rgba(255,255,255,.10)",background:"rgba(3,8,22,.72)",color:"#DDF7FF",fontSize:11,letterSpacing:".08em",backdropFilter:"blur(12px)"}}>RECOVERY MODE · LIVING ORB</div>
  <a href="/v42/creator" style={{position:"absolute",right:18,bottom:18,zIndex:20,padding:"11px 16px",borderRadius:999,border:"1px solid rgba(255,255,255,.12)",background:"rgba(5,12,30,.78)",color:"#F5FBFF",textDecoration:"none",fontSize:12}}>CREATOR</a>
 </main>;
}
