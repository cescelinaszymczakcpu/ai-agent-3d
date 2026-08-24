'use client';

import {useEffect,useRef,useState} from 'react';
import LivingLumeniaOrb from './LivingLumeniaOrb';

function cueFromText(text=''){
  const s=text.toLowerCase();
  if(/[mbp]/.test(s)) return 'mbp';
  if(/[fv]/.test(s)) return 'fv';
  if(/[ouó]/.test(s)) return 'oh';
  if(/[eiiy]/.test(s)) return 'ee';
  if(/[wqł]/.test(s)) return 'wq';
  if(/[lndtr]/.test(s)) return 'ln';
  return 'aa';
}

export default function LivingOrbStage(){
  const [speaking,setSpeaking]=useState(false);
  const [audioLevel,setAudioLevel]=useState(0);
  const [visemeCue,setVisemeCue]=useState(null);
  const started=useRef(0),pulse=useRef(0),visemeTimer=useRef(null);

  useEffect(()=>{
    if(!speaking){setAudioLevel(0);return;}
    let frame=0;
    const loop=now=>{
      const t=(now-(started.current||now))/1000;
      pulse.current*=.91;
      const syllable=Math.max(0,Math.sin(t*11.1))*.14;
      const phrase=.55+.35*Math.sin(t*1.5);
      setAudioLevel(Math.max(.025,Math.min(1,pulse.current*.72+syllable*Math.max(.25,phrase)+.06)));
      frame=requestAnimationFrame(loop);
    };
    frame=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(frame);
  },[speaking]);

  useEffect(()=>()=>{
    if(visemeTimer.current) clearTimeout(visemeTimer.current);
    if(typeof window!=='undefined'&&window.speechSynthesis) window.speechSynthesis.cancel();
  },[]);

  const stop=()=>{
    if(typeof window!=='undefined'&&window.speechSynthesis) window.speechSynthesis.cancel();
    if(visemeTimer.current) clearTimeout(visemeTimer.current);
    setSpeaking(false);
    setAudioLevel(0);
    setVisemeCue('rest');
  };

  const testSpeaking=()=>{
    if(speaking){stop();return;}
    const text='Dzień dobry. Teraz podczas rozmowy poruszam ustami, gestykuluję rękami i subtelnie reaguję ruchem głowy. Oddychanie i wielokolorowe światło działają przez cały czas.';
    setSpeaking(true);
    setVisemeCue('rest');
    started.current=performance.now();
    pulse.current=.45;
    if(typeof window==='undefined'||!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);
    u.lang='pl-PL';u.rate=.94;u.pitch=1.02;
    const voices=window.speechSynthesis.getVoices();
    const pl=voices.find(v=>String(v.lang).toLowerCase().startsWith('pl'));
    if(pl) u.voice=pl;
    u.onstart=()=>{started.current=performance.now();pulse.current=.55;};
    u.onboundary=e=>{
      const chunk=text.slice(e.charIndex||0,(e.charIndex||0)+(e.charLength||10));
      setVisemeCue(cueFromText(chunk));
      pulse.current=Math.min(1,.54+Math.min(1,chunk.length/10)*.34);
      if(visemeTimer.current) clearTimeout(visemeTimer.current);
      visemeTimer.current=setTimeout(()=>setVisemeCue(null),240);
    };
    u.onend=()=>setTimeout(stop,180);
    u.onerror=stop;
    window.speechSynthesis.speak(u);
  };

  return (
    <main style={{width:'100vw',height:'100dvh',margin:0,padding:0,overflow:'hidden',background:'#020611',position:'relative'}}>
      <LivingLumeniaOrb
        variant="female"
        emotion="neutral"
        emotionIntensity={0.85}
        state={speaking?'speaking':'idle'}
        audioLevel={audioLevel}
        visemeCue={visemeCue}
        gesturesEnabled
        lipSyncEnabled
        colorFlowSpeed={0.10}
        style={{width:'100vw',height:'100dvh',minHeight:'100dvh'}}
      />
      <button
        onClick={testSpeaking}
        style={{position:'absolute',left:18,bottom:18,zIndex:20,padding:'11px 16px',borderRadius:999,border:'1px solid rgba(120,225,255,.35)',background:speaking?'rgba(255,90,160,.16)':'rgba(5,12,30,.78)',color:'#F5FBFF',backdropFilter:'blur(12px)',cursor:'pointer',fontWeight:700,fontSize:12,letterSpacing:'.06em'}}
      >
        {speaking?'STOP SPEAKING':'TEST SPEAKING'}
      </button>
      <a href="/v42/creator" style={{position:'absolute',right:18,bottom:18,zIndex:20,padding:'11px 16px',borderRadius:999,border:'1px solid rgba(255,255,255,.12)',background:'rgba(5,12,30,.72)',color:'#F5FBFF',textDecoration:'none',backdropFilter:'blur(12px)',fontSize:12}}>CREATOR</a>
    </main>
  );
}
