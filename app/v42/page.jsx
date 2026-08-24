'use client';

import { LivingOrbCharacter } from './LivingOrbStudio';

export default function LivingOrbStage(){
  return (
    <main style={{width:'100vw',height:'100dvh',margin:0,padding:0,overflow:'hidden',background:'#030713'}}>
      <LivingOrbCharacter
        config={{
          variant:'female',
          hair:{style:'elegant-light-curl'},
          orb:{breathing:true,breathPeriod:5.2,breathAmount:0.018}
        }}
        emotion="neutral"
        emotionIntensity={0.85}
        state="idle"
        audioLevel={0}
        enableOrbit={false}
        style={{width:'100vw',height:'100dvh',minHeight:'100dvh'}}
      />
    </main>
  );
}
