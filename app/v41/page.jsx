'use client';

import { useMemo, useState } from 'react';
import './v41.css';

const palettes = {
  aurora:{name:'Aurora Glass',colors:['#7c3aed','#22d3ee','#f8fafc']},
  sunset:{name:'Sunset Glass',colors:['#fb7185','#f59e0b','#fde68a']},
  ocean:{name:'Ocean Glass',colors:['#2563eb','#2dd4bf','#e0f2fe']},
  pearl:{name:'Pearl Glass',colors:['#c4b5fd','#e0f2fe','#ffffff']},
  noir:{name:'Black Cherry',colors:['#111827','#ec4899','#a78bfa']},
  emerald:{name:'Emerald Glass',colors:['#059669','#22d3ee','#d1fae5']},
};

const accessories = [
  {id:'halo',name:'Liquid Halo',type:'head',shape:'ring'},
  {id:'crown',name:'Mirror Crown',type:'head',shape:'crown'},
  {id:'veil',name:'Glass Veil',type:'head',shape:'veil'},
  {id:'arc',name:'Aurora Arc',type:'head',shape:'arc'},
  {id:'clips',name:'Crystal Clips',type:'head',shape:'clips'},
  {id:'crest',name:'Pearl Crest',type:'head',shape:'crest'},
  {id:'visor',name:'Soft Visor',type:'face',shape:'visor'},
  {id:'mask',name:'Mist Mask',type:'face',shape:'mask'},
  {id:'orbit1',name:'Single Orbit',type:'orbit',shape:'orbit1'},
  {id:'orbit2',name:'Twin Orbit',type:'orbit',shape:'orbit2'},
  {id:'moons',name:'Twin Moons',type:'orbit',shape:'moons'},
  {id:'shards',name:'Floating Shards',type:'orbit',shape:'shards'},
  {id:'pearls',name:'Glass Pearls',type:'orbit',shape:'pearls'},
  {id:'wings',name:'Prism Wings',type:'body',shape:'wings'},
  {id:'ribbons',name:'Liquid Ribbons',type:'body',shape:'ribbons'},
  {id:'mist',name:'Soft Mist',type:'aura',shape:'mist'},
  {id:'bloom',name:'Neon Bloom',type:'aura',shape:'bloom'},
  {id:'ripple',name:'Glass Ripple',type:'aura',shape:'ripple'},
  {id:'key307',name:'Key 307 Relic',type:'story',shape:'key'},
  {id:'bluehour',name:'Blue Hour Halo',type:'story',shape:'bluehour'},
];

const locations = [
  {id:'nox',name:'NOX CLUB',meta:'8 ONLINE · PUBLIC',desc:'Główna historia na żywo.'},
  {id:'glass',name:'GLASS ROOM',meta:'2 ONLINE · STORY',desc:'Odbicia, sekrety i wspólne decyzje.'},
  {id:'rooftop',name:'ROOFTOP 4AM',meta:'4 ONLINE · QUIET',desc:'Mniejsza nocna przestrzeń.'},
  {id:'room',name:'YOUR ROOM',meta:'PRIVATE',desc:'Twój pokój, wspomnienia i kolekcja.'},
];

export default function AlterV41(){
  const [paletteId,setPaletteId]=useState('aurora');
  const [selected,setSelected]=useState(['halo','orbit1','mist']);
  const [screen,setScreen]=useState('echo');
  const [location,setLocation]=useState(null);
  const palette=palettes[paletteId];
  const style=useMemo(()=>({'--c1':palette.colors[0],'--c2':palette.colors[1],'--c3':palette.colors[2]}),[palette]);

  function toggleAccessory(id){
    setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id].slice(-5));
  }

  function enterLocation(loc){ setLocation(loc); setScreen('location'); window.scrollTo({top:0,behavior:'smooth'}); }

  return <main className="v41" style={style}>
    <header className="v41Top">
      <div><span className="brand">ALTER</span><small>v4.1 LIQUID ECHO</small></div>
      <nav><button className={screen==='echo'?'active':''} onClick={()=>setScreen('echo')}>ECHO</button><button className={screen==='world'?'active':''} onClick={()=>setScreen('world')}>WORLD</button></nav>
    </header>

    {screen==='echo' && <section className="shell hero">
      <div className="copy"><span className="eyebrow">LIQUID GLASS IDENTITY</span><h1>Orb i dodatki z jednej materii.</h1><p>Żadnych małych emoji. Każdy element jest półprzezroczysty, odbija światło, pulsuje i staje się częścią całej sylwetki ECHO.</p></div>
      <div className="builder">
        <div className="stage"><LiquidEcho selected={selected}/><div className="stageLabel"><b>{palette.name}</b><span>{selected.length} aktywne dodatki</span></div></div>
        <div className="controls">
          <Control title="Mieszana paleta">
            <div className="paletteList">{Object.entries(palettes).map(([id,p])=><button key={id} onClick={()=>setPaletteId(id)} className={paletteId===id?'palette active':'palette'}><span style={{background:`linear-gradient(120deg,${p.colors.join(',')})`}}/><b>{p.name}</b></button>)}</div>
          </Control>
          <Control title="Liquid Glass accessories · wybierz do 5">
            <div className="accessoryGrid">{accessories.map(a=><button key={a.id} className={selected.includes(a.id)?'accessory active':'accessory'} onClick={()=>toggleAccessory(a.id)}><MiniGlass shape={a.shape}/><span>{a.name}</span><small>{a.type}</small></button>)}</div>
          </Control>
          <button className="primary" onClick={()=>{setScreen('world');window.scrollTo({top:0,behavior:'smooth'})}}>WEJDŹ DO ŚWIATA →</button>
        </div>
      </div>
    </section>}

    {screen==='world' && <section className="shell world">
      <div className="worldHead"><div><span className="eyebrow">WORLD HUB</span><h1>Weszłaś do ALTER.</h1><p>Każde wejście otwiera osobną scenę. Twój Liquid ECHO pozostaje z Tobą.</p></div><LiquidEcho selected={selected} small/></div>
      <div className="worldGrid">{locations.map(loc=><button key={loc.id} className={`door ${loc.id}`} onClick={()=>enterLocation(loc)}><span className="doorLight"/><small>{loc.meta}</small><b>{loc.name}</b><p>{loc.desc}</p><i>WEJDŹ →</i></button>)}</div>
      <button className="secondary" onClick={()=>setScreen('echo')}>← WRÓĆ DO ECHO</button>
    </section>}

    {screen==='location' && location && <section className={`locationScene ${location.id}`}>
      <div className="locationGlow"/><div className="locationHud"><button className="secondary" onClick={()=>setScreen('world')}>← WORLD HUB</button><span>{location.meta}</span></div>
      <div className="locationBody"><LiquidEcho selected={selected}/><div><span className="eyebrow">ALTER LOCATION</span><h1>{location.name}</h1><p>{location.desc}</p><div className="director">Director: „To miejsce pamięta, kto wszedł tu z Tobą ostatnim razem.”</div><div className="row"><button className="primary">ROZPOCZNIJ SCENĘ</button><button className="secondary" onClick={()=>setScreen('world')}>WYJDŹ</button></div></div></div>
    </section>}
  </main>
}

function Control({title,children}){return <div className="control"><b>{title}</b>{children}</div>}

function LiquidEcho({selected,small=false}){
  return <div className={small?'liquidEcho small':'liquidEcho'}>
    <span className="orbAura"/><span className="orbLayer layerA"/><span className="orbLayer layerB"/><span className="orbLayer layerC"/><span className="orbShine"/><span className="orbCore">✦</span>
    {selected.map(id=>{const a=accessories.find(x=>x.id===id);return a?<GlassAccessory key={id} shape={a.shape}/>:null})}
  </div>
}

function GlassAccessory({shape}){
  if(shape==='ring'||shape==='bluehour') return <span className={`gAcc g-${shape}`}><i/></span>;
  if(shape==='crown') return <span className="gAcc g-crown"><i/><i/><i/></span>;
  if(shape==='veil'||shape==='ribbons') return <span className={`gAcc g-${shape}`}><i/><i/></span>;
  if(shape==='arc'||shape==='crest') return <span className={`gAcc g-${shape}`}><i/></span>;
  if(shape==='clips'||shape==='pearls'||shape==='moons'||shape==='shards') return <span className={`gAcc g-${shape}`}><i/><i/><i/><i/></span>;
  if(shape==='visor'||shape==='mask') return <span className={`gAcc g-${shape}`}><i/></span>;
  if(shape==='orbit1'||shape==='orbit2') return <span className={`gAcc g-${shape}`}><i/><i/></span>;
  if(shape==='wings') return <span className="gAcc g-wings"><i/><i/></span>;
  if(shape==='mist'||shape==='bloom'||shape==='ripple') return <span className={`gAcc g-${shape}`}><i/></span>;
  if(shape==='key') return <span className="gAcc g-key"><i/></span>;
  return null;
}

function MiniGlass({shape}){return <span className={`miniGlass m-${shape}`}><i/><i/><i/></span>}
