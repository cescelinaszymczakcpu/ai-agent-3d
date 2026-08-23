'use client';

import './v42.css';
import './true3d.css';
import {LivingOrb} from './LivingOrb3D';

export default function LivingOrbStage(){
  return <main className="v42">
    <div className="v42Head">
      <div>
        <div className="eyebrow">ALTER · STAGE 1 + STAGE 2</div>
        <h1>Breathing Glass Orb</h1>
        <p>Tylko bazowy ORB: transparentne szkło, irydyzacja, refrakcja, światło wewnętrzne i organiczny oddech. Bez twarzy, włosów i kończyn.</p>
      </div>
      <button className="miniButton" onClick={()=>location.href='/'}>← Aplikacja</button>
    </div>

    <section className="orbStage stageOnlyOrb">
      <LivingOrb/>
      <div className="stageNote">STAGE 1 + 2 · ORB ONLY · ~5 s BREATH</div>
    </section>
  </main>;
}
