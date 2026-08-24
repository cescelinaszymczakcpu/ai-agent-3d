'use client';

import {useState} from 'react';
import LivingLumeniaOrb from './LivingLumeniaOrb';
import useOpenAIRealtimeVoice from './useOpenAIRealtimeVoice';

const TEST_TEXT='Dzień dobry. To jest głos OpenAI Realtime. Mówię naturalnie po polsku, a postać reaguje na prawdziwy sygnał audio ruchem ust, gestami i światłem orba.';

export default function LivingOrbStage(){
  const [variant,setVariant]=useState('female');
  const realtime=useOpenAIRealtimeVoice(variant);
  const renderState=['listening','thinking','speaking'].includes(realtime.phase)?realtime.phase:'idle';

  const toggleRealtime=async()=>{
    if(realtime.connected||realtime.connecting){realtime.stop();return;}
    await realtime.start();
  };

  const testVoice=async()=>{
    await realtime.startAndSend(TEST_TEXT);
  };

  return (
    <main style={{width:'100vw',height:'100dvh',margin:0,padding:0,overflow:'hidden',background:'#020611',position:'relative'}}>
      <LivingLumeniaOrb
        variant={variant}
        emotion="neutral"
        emotionIntensity={0.85}
        state={renderState}
        audioLevel={realtime.audioLevel}
        audioBands={realtime.audioBands}
        visemeCue={null}
        gesturesEnabled
        lipSyncEnabled
        colorFlowSpeed={0.10}
        style={{width:'100vw',height:'100dvh',minHeight:'100dvh'}}
      />

      <div style={{position:'absolute',left:18,bottom:18,zIndex:20,display:'flex',gap:8,flexWrap:'wrap',maxWidth:'calc(100vw - 36px)'}}>
        <button onClick={()=>setVariant('female')} disabled={realtime.connecting} style={pill(variant==='female')}>
          FEMALE · MARIN
        </button>
        <button onClick={()=>setVariant('male')} disabled={realtime.connecting} style={pill(variant==='male')}>
          MALE · CEDAR
        </button>
        <button onClick={toggleRealtime} style={pill(realtime.connected||realtime.connecting,true)}>
          {realtime.connecting?'CONNECTING…':realtime.connected?'STOP REALTIME':'START REALTIME'}
        </button>
        <button onClick={testVoice} disabled={realtime.connecting} style={pill(false,true)}>
          TEST OPENAI VOICE
        </button>
      </div>

      <div style={{position:'absolute',left:18,top:18,zIndex:20,padding:'9px 12px',borderRadius:12,border:'1px solid rgba(255,255,255,.10)',background:'rgba(3,8,22,.72)',color:'#DDF7FF',fontSize:11,letterSpacing:'.05em',backdropFilter:'blur(12px)'}}>
        OPENAI REALTIME · {variant.toUpperCase()} · {realtime.voice.toUpperCase()} · {realtime.phase.toUpperCase()}
        {realtime.error&&<div style={{marginTop:6,color:'#FF9ABF',maxWidth:360,letterSpacing:0}}>{realtime.error}</div>}
      </div>

      <a href="/v42/creator" style={{position:'absolute',right:18,bottom:18,zIndex:20,padding:'11px 16px',borderRadius:999,border:'1px solid rgba(255,255,255,.12)',background:'rgba(5,12,30,.72)',color:'#F5FBFF',textDecoration:'none',backdropFilter:'blur(12px)',fontSize:12}}>CREATOR</a>
    </main>
  );
}

function pill(active=false,strong=false){
  return {
    padding:'11px 14px',borderRadius:999,
    border:active?'1px solid rgba(92,229,255,.72)':'1px solid rgba(255,255,255,.13)',
    background:active?(strong?'rgba(42,194,255,.20)':'rgba(100,100,255,.17)'):'rgba(5,12,30,.78)',
    color:'#F5FBFF',backdropFilter:'blur(12px)',cursor:'pointer',fontWeight:700,fontSize:11,letterSpacing:'.05em'
  };
}
