'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import './v42.css';
import './true3d.css';
import {LivingOrb,presets,voicePresets,hairStyles,eyeStyles,mustacheStyles} from './LivingOrb3D';

const states=['idle','listening','thinking','speaking','success','warning','error'];

export default function LivingOrbCreator(){
  const [config,setConfig]=useState({...presets.femaleAurora});
  const [state,setState]=useState('idle');
  const [audioLevel,setAudioLevel]=useState(.18);
  const [micOn,setMicOn]=useState(false);
  const raf=useRef(null); const streamRef=useRef(null); const ctxRef=useRef(null);
  const set=(key,value)=>setConfig(c=>({...c,[key]:value}));
  const selectedPreset=useMemo(()=>Object.entries(presets).find(([,p])=>p.name===config.name)?.[0]||'', [config.name]);
  async function toggleMic(){
    if(micOn){ stopMic(); return; }
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const Ctx=window.AudioContext||window.webkitAudioContext; const ctx=new Ctx();
      const analyser=ctx.createAnalyser(); analyser.fftSize=512; analyser.smoothingTimeConstant=.82;
      const source=ctx.createMediaStreamSource(stream); source.connect(analyser);
      const data=new Uint8Array(analyser.frequencyBinCount); streamRef.current=stream; ctxRef.current=ctx; setMicOn(true); setState('listening');
      const tick=()=>{analyser.getByteFrequencyData(data); let sum=0; for(const n of data) sum+=n; const avg=sum/data.length/255; setAudioLevel(Math.min(1,.08+avg*2.6)); raf.current=requestAnimationFrame(tick)}; tick();
    }catch(e){alert('Nie udało się uruchomić mikrofonu. Sprawdź uprawnienia przeglądarki.');}
  }
  function stopMic(){ if(raf.current)cancelAnimationFrame(raf.current); streamRef.current?.getTracks().forEach(t=>t.stop()); ctxRef.current?.close(); setMicOn(false); setAudioLevel(.18); setState('idle'); }
  useEffect(()=>()=>stopMic(),[]);
  function testVoice(){
    setState('speaking'); let t=0; const id=setInterval(()=>{t+=.12; setAudioLevel(.22+Math.abs(Math.sin(t*2.4))*.62*Math.abs(Math.sin(t*.73)));},70);
    if('speechSynthesis' in window){ const u=new SpeechSynthesisUtterance('Cześć. Jestem Twoim Living Orb. Tak wygląda moja reakcja na głos.'); u.lang='pl-PL'; u.rate=.95; u.onend=()=>{clearInterval(id);setState('idle');setAudioLevel(.18)}; speechSynthesis.cancel(); speechSynthesis.speak(u); setTimeout(()=>{if(!speechSynthesis.speaking){clearInterval(id);setState('idle');setAudioLevel(.18)}},7000); }
    else setTimeout(()=>{clearInterval(id);setState('idle');setAudioLevel(.18)},4500);
  }
  return <main className="v42">
    <div className="v42Head"><div><div className="eyebrow">ALTER · LIVING ORB 4.2 · TRUE 3D</div><h1>Living Orb Creator</h1><p>Renderer WebGL: szkło, refrakcja, objętościowe kończyny, mikro-ruch i Voice Orb wewnątrz kuli.</p></div><button className="miniButton" onClick={()=>location.href='/'}>← Aplikacja</button></div>
    <div className="creatorGrid">
      <section className="orbStage"><LivingOrb config={config} state={state} audioLevel={audioLevel}/><div className="stateBar">{states.map(s=><button key={s} className={state===s?'active':''} onClick={()=>setState(s)}>{s.toUpperCase()}</button>)}<button onClick={testVoice}>TEST VOICE</button><button className={micOn?'active':''} onClick={toggleMic}>{micOn?'MIC ON':'MIC REACTIVE'}</button></div></section>
      <aside className="editorPanel">
        <Section title="Presety"><div className="presetButtons">{Object.entries(presets).map(([id,p])=><button key={id} className={selectedPreset===id?'active':''} onClick={()=>setConfig({...p})}>{p.name}</button>)}</div></Section>
        <Section title="Character"><div className="seg">{['female','male','neutral'].map(g=><button key={g} className={config.gender===g?'active':''} onClick={()=>set('gender',g)}>{g}</button>)}</div><Slider label="Grubość kończyn" value={config.limbWidth} min={0.45} max={1.25} step={0.05} onChange={v=>set('limbWidth',v)}/><Slider label="Długość rąk" value={config.armLength} min={0.75} max={1.25} step={0.05} onChange={v=>set('armLength',v)}/><Slider label="Długość nóg" value={config.legLength} min={0.8} max={1.3} step={0.05} onChange={v=>set('legLength',v)}/></Section>
        <Section title="Orb"><Color label="Primary" value={config.primary} onChange={v=>set('primary',v)}/><Color label="Secondary" value={config.secondary} onChange={v=>set('secondary',v)}/><Color label="Accent" value={config.accent} onChange={v=>set('accent',v)}/><Slider label="Przezroczystość" value={config.opacity} min={0.5} max={1} step={0.02} onChange={v=>set('opacity',v)}/><Slider label="Glow" value={config.glow} min={0.1} max={1} step={0.05} onChange={v=>set('glow',v)}/><Slider label="Glass" value={config.glass} min={0.2} max={1} step={0.05} onChange={v=>set('glass',v)}/></Section>
        <Section title="Face"><Tog label="Oczy" checked={config.eyes} onChange={v=>set('eyes',v)}/><Select label="Styl oczu" value={config.eyeStyle} values={eyeStyles} onChange={v=>set('eyeStyle',v)}/><Color label="Kolor oczu" value={config.eyeColor} onChange={v=>set('eyeColor',v)}/><Slider label="Wielkość oczu" value={config.eyeSize||1} min={0.75} max={1.25} step={0.05} onChange={v=>set('eyeSize',v)}/><Tog label="Usta" checked={config.mouth} onChange={v=>set('mouth',v)}/></Section>
        <Section title="Hair"><Tog label="Włosy" checked={config.hair} onChange={v=>set('hair',v)}/><Select label="Fryzura" value={config.hairStyle} values={hairStyles} onChange={v=>set('hairStyle',v)}/><Color label="Kolor" value={config.hairColor} onChange={v=>set('hairColor',v)}/></Section>
        <Section title="Facial hair"><Tog label="Wąsy" checked={config.mustache} onChange={v=>set('mustache',v)}/><Select label="Model wąsów" value={config.mustacheStyle||'classic'} values={mustacheStyles} onChange={v=>set('mustacheStyle',v)}/><Color label="Kolor wąsów" value={config.mustacheColor||config.secondary} onChange={v=>set('mustacheColor',v)}/><Tog label="Broda" checked={config.beard} onChange={v=>set('beard',v)}/></Section>
        <Section title="Voice Orb"><Select label="Preset" value={config.voicePreset} values={voicePresets} onChange={v=>set('voicePreset',v)}/><Slider label="Reakcja audio" value={audioLevel} min={0.05} max={1} step={0.05} onChange={setAudioLevel}/><div className="toggleRow"><span className="toggle">Audio reactive: ON</span><span className="toggle">Lip-sync: OFF</span></div></Section>
      </aside>
    </div>
  </main>
}
function Section({title,children}){return <section className="section"><h3>{title}</h3>{children}</section>}
function Slider({label,value,min,max,step,onChange}){return <div className="control"><label>{label}</label><input type="range" value={value} min={min} max={max} step={step} onChange={e=>onChange(Number(e.target.value))}/></div>}
function Color({label,value,onChange}){return <div className="control"><label>{label}</label><input type="color" value={value} onChange={e=>onChange(e.target.value)}/></div>}
function Select({label,value,values,onChange}){return <div className="control"><label>{label}</label><select value={value} onChange={e=>onChange(e.target.value)}>{values.map(v=><option key={v}>{v}</option>)}</select></div>}
function Tog({label,checked,onChange}){return <label className="toggle"><input type="checkbox" checked={!!checked} onChange={e=>onChange(e.target.checked)}/>{label}</label>}
