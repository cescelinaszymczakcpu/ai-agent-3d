'use client';

import LivingLumeniaOrb from './LivingLumeniaOrb';

export default function LivingOrbStage(){
  return (
    <main style={{width:'100vw',height:'100dvh',margin:0,padding:0,overflow:'hidden',background:'#020611'}}>
      <LivingLumeniaOrb
        variant="female"
        emotion="neutral"
        emotionIntensity={0.85}
        state="idle"
        audioLevel={0}
        colorFlowSpeed={0.10}
        style={{width:'100vw',height:'100dvh',minHeight:'100dvh'}}
      />
    </main>
  );
}
