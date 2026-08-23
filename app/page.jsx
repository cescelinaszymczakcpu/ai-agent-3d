'use client';

import { useMemo, useState } from 'react';

const views = [
  ['start','START'],['echo','ECHO'],['world','ŚWIAT'],['collection','KOLEKCJA'],['relations','RELACJE'],['multiplayer','MULTIPLAYER']
];

const palettes = {
  aurora:{name:'Aurora',colors:['#8b5cf6','#22d3ee','#f8fafc']},
  sunset:{name:'Sunset',colors:['#fb7185','#f59e0b','#fde68a']},
  ocean:{name:'Ocean',colors:['#2563eb','#2dd4bf','#dbeafe']},
  noir:{name:'Black Cherry',colors:['#111827','#ec4899','#a78bfa']},
  pearl:{name:'Pearl',colors:['#c4b5fd','#e0f2fe','#ffffff']},
  emerald:{name:'Emerald',colors:['#059669','#22d3ee','#d1fae5']},
};

const cores = ['✦','△','☾','∞','◇','⊙'];
const headpieces = {
  veil:{name:'Neon Veil',glyph:'〰',className:'veil'},
  crown:{name:'Mirror Crown',glyph:'♕',className:'crown'},
  hat:{name:'Glass Hat',glyph:'◒',className:'hat'},
  clips:{name:'Crystal Clips',glyph:'✦  ✦',className:'clips'},
  horns:{name:'Arc Horns',glyph:'⌒   ⌒',className:'horns'},
  halo:{name:'Liquid Halo',glyph:'◯',className:'halo'},
};
const orbits = {
  none:{name:'Brak'},
  ring:{name:'Glass Ring'},
  moons:{name:'Twin Moons'},
  shards:{name:'Crystal Shards'},
};

export default function Home() {
  const [view, setView] = useState('start');
  const [echo, setEcho] = useState({ core:'✦', palette:'aurora', headpiece:'veil', orbit:'ring' });
  const [roomCode, setRoomCode] = useState('A7K2Q9');
  const [joined, setJoined] = useState(false);
  const [mic, setMic] = useState(false);

  const palette = palettes[echo.palette];
  const echoStyle = useMemo(() => ({
    '--c1': palette.colors[0], '--c2': palette.colors[1], '--c3': palette.colors[2]
  }), [palette]);

  function nav(id){ setView(id); window.scrollTo({top:0,behavior:'smooth'}); }
  function createRoom(){ setRoomCode(Math.random().toString(36).slice(2,8).toUpperCase()); setJoined(true); }

  return (
    <main>
      <header className="topbar">
        <button className="brand" onClick={()=>nav('start')}>ALTER</button>
        <nav>
          {views.map(([id,label]) => <button key={id} className={view===id?'active':''} onClick={()=>nav(id)}>{label}</button>)}
        </nav>
      </header>

      {view==='start' && <section className="screen heroScreen">
        <div className="eyebrow">ALTER · V4 LIVE</div>
        <h1>Drugie życie,<br/>które naprawdę otwierasz.</h1>
        <p className="lead">Najpierw tworzysz żywe ECHO. Potem wchodzisz do świata z prawdziwymi miejscami, relacjami i wydarzeniami.</p>
        <div className="featureGrid">
          <button className="feature" onClick={()=>nav('echo')}><span>◌</span><b>ZBUDUJ ECHO</b><small>mieszane kolory, puls, aura, duże dodatki</small></button>
          <button className="feature" onClick={()=>nav('world')}><span>◈</span><b>WEJDŹ DO ŚWIATA</b><small>NOX, Glass Room, Your Room</small></button>
          <button className="feature" onClick={()=>nav('multiplayer')}><span>🎙️</span><b>MULTIPLAYER</b><small>pokój 2–6 osób</small></button>
        </div>
        <button className="primary big" onClick={()=>nav('echo')}>STWÓRZ ECHO →</button>
      </section>}

      {view==='echo' && <section className="screen">
        <div className="eyebrow">01 · PREMIUM ECHO</div>
        <h2>Twoja obecność ma żyć.</h2>
        <p className="lead smallLead">ECHO jest półprzezroczyste, wielokolorowe i pulsujące. Zamiast małych emoji dodatki tworzą dużą sylwetkę wokół orba.</p>
        <div className="builder">
          <div className="previewCard liquidStage">
            <EchoAvatar echo={echo} style={echoStyle} large />
            <div className="echoCaption"><b>{palette.name}</b><span>dynamic glass · live pulse</span></div>
          </div>
          <div className="panel builderPanel">
            <Picker title="Rdzeń" values={cores} current={echo.core} onPick={v=>setEcho({...echo,core:v})}/>
            <div className="pickGroup"><b>Paleta mieszana</b><div className="paletteGrid">{Object.entries(palettes).map(([id,p])=><button key={id} className={echo.palette===id?'paletteBtn selected':'paletteBtn'} onClick={()=>setEcho({...echo,palette:id})}><span className="paletteStrip" style={{background:`linear-gradient(120deg,${p.colors.join(',')})`}}/><small>{p.name}</small></button>)}</div></div>
            <div className="pickGroup"><b>Duży headpiece</b><div className="choices">{Object.entries(headpieces).map(([id,h])=><button key={id} className={echo.headpiece===id?'choice selected':'choice'} onClick={()=>setEcho({...echo,headpiece:id})}>{h.name}</button>)}</div></div>
            <div className="pickGroup"><b>Element orbitalny</b><div className="choices">{Object.entries(orbits).map(([id,o])=><button key={id} className={echo.orbit===id?'choice selected':'choice'} onClick={()=>setEcho({...echo,orbit:id})}>{o.name}</button>)}</div></div>
            <button className="primary enterWorld" onClick={()=>nav('world')}>WEJDŹ DO ŚWIATA →</button>
          </div>
        </div>
      </section>}

      {view==='world' && <WorldHub echo={echo} style={echoStyle} onEnter={nav} />}
      {view==='nox' && <LocationPage tone="nox" title="NOX CLUB" kicker="PUBLIC · 8 ONLINE" desc="Główna nocna przestrzeń ALTER. Tutaj spotykasz ludzi, a Director uruchamia wydarzenia na żywo." echo={echo} style={echoStyle} onBack={()=>nav('world')} extra="Director: Jedna osoba w tym pokoju zna zakończenie dzisiejszej historii."/>}
      {view==='glass' && <LocationPage tone="glass" title="GLASS ROOM" kicker="STORY SPACE · 2 ONLINE" desc="Cichsza, chłodna przestrzeń z historiami odblokowywanymi przez wspólne decyzje." echo={echo} style={echoStyle} onBack={()=>nav('world')} extra="Na ścianie pojawia się odbicie wyboru, którego nikt z Was nie podjął."/>}
      {view==='room' && <LocationPage tone="room" title="YOUR ROOM" kicker="PRIVATE" desc="Twój własny pokój. Tutaj trzymasz zdobyte przedmioty, wspomnienia i zapraszasz konkretne osoby." echo={echo} style={echoStyle} onBack={()=>nav('world')} extra="Twoje ECHO pamięta: Key 307 · Blue Hour · Lena ✦"/>}
      {view==='rooftop' && <LocationPage tone="rooftop" title="ROOFTOP 4AM" kicker="QUIET · 4 ONLINE" desc="Mniejsze miejsce do rozmów po północy, bez tłumu i bez feedu." echo={echo} style={echoStyle} onBack={()=>nav('world')} extra="Nad miastem widać trzy inne aktywne przestrzenie ALTER."/>}

      {view==='collection' && <section className="screen">
        <div className="eyebrow">03 · COLLECTION</div><h2>To, co przeżywasz, zostaje z Tobą.</h2>
        <p className="lead smallLead">Najciekawsze rzeczy zdobywasz przez historie, relacje i wydarzenia, a nie tylko zakup.</p>
        <div className="itemGrid">
          <Item icon="◌" rarity="RARE" name="Aurora Pulse" text="Wielowarstwowa aura ECHO."/>
          <Item icon="〰" rarity="RARE" name="Neon Veil" text="Duży headpiece energetyczny."/>
          <Item icon="🗝️" rarity="STORY" name="Key 307" text="Tylko jeśli zabierzesz klucz."/>
          <Item icon="◈" rarity="EPIC" name="Glass Shard" text="Za odkrycie sekretu Glass Room."/>
          <Item icon="◯" rarity="LIVE" name="Blue Hour Ring" text="Z wydarzenia czasowego."/>
          <Item icon="♕" rarity="SEASON" name="Mirror Crown" text="Nagroda sezonowa."/>
        </div>
        <button className="primary" onClick={()=>nav('relations')}>ZOBACZ RELACJE →</button>
      </section>}

      {view==='relations' && <section className="screen">
        <div className="eyebrow">04 · RELATIONSHIPS</div><h2>Nie followersi. Wspólna historia.</h2>
        <p className="lead smallLead">Więź rośnie przez to, co przeżyliście razem. Konkretne pary i grupy odblokowują własne sceny.</p>
        <div className="relationGrid">
          <Relation avatar="✦" name="Lena" score={68} memories="NOX · Key 307 · Glass Room"/>
          <Relation avatar="◇" name="Alex" score={42} memories="NOX · Rooftop 4AM"/>
          <Relation avatar="☾" name="Mira" score={31} memories="Winda · prawda o 307"/>
        </div>
        <div className="storyCard"><span>UNLOCKED WITH LENA</span><h3>THE QUIET FLOOR</h3><p>Prywatna historia dla dwóch osób. Director wykorzystuje wyłącznie Wasze wspólne wydarzenia w ALTER.</p></div>
        <button className="primary" onClick={()=>nav('multiplayer')}>WEJDŹ DO MULTIPLAYERA →</button>
      </section>}

      {view==='multiplayer' && <section className="screen">
        <div className="eyebrow">05 · LIVE ROOM</div><h2>Prawdziwi ludzie. Jeden pokój.</h2>
        <p className="lead smallLead">Ten ekran działa jako interaktywna symulacja tworzenia pokoju. Realtime voice podłączymy jako osobną warstwę produkcyjną.</p>
        <div className="multiGrid">
          <div className="panel roomPanel">
            <span className="status"><i/> ROOM ONLINE</span>
            <div className="roomCode">{roomCode}</div>
            <p className="muted">Kod sesji dla znajomych.</p>
            <div className="avatars">✦ ◇ ☾ ∞ +2</div>
            <div className="ctaRow"><button className={mic?'primary':'secondary'} onClick={()=>setMic(!mic)}>{mic?'🎙️ MIKROFON ON':'🔇 MIKROFON OFF'}</button><button className="secondary" onClick={createRoom}>{joined?'NOWY KOD':'UTWÓRZ POKÓJ'}</button></div>
          </div>
          <div className="panel"><div className="eyebrow">AI DIRECTOR</div><div className="director">„Światła gasną na 7 sekund. Kiedy wracają, jedno ECHO stoi w innym miejscu.”</div><div className="chat"><p><b>Lena:</b> Kto się przesunął?</p><p><b>Alex:</b> Nie ja.</p><p><b>Mira:</b> Spójrzcie na drzwi 307.</p></div></div>
        </div>
        <button className="secondary" onClick={()=>nav('start')}>WRÓĆ NA START</button>
      </section>}
    </main>
  );
}

function EchoAvatar({echo,style,large=false}){
  const h=headpieces[echo.headpiece];
  return <div className={large?'echo premiumEcho largeEcho':'echo premiumEcho'} style={style}>
    <span className="glassAura"/><span className="liquidLayer layerOne"/><span className="liquidLayer layerTwo"/><span className="shine"/>
    {echo.orbit!=='none' && <span className={`orbit orbit-${echo.orbit}`}><i/><i/><i/></span>}
    <span className={`headpiece ${h.className}`}>{h.glyph}</span>
    <span className="core">{echo.core}</span>
  </div>
}

function WorldHub({echo,style,onEnter}){
  return <section className="screen worldScreen">
    <div className="worldTop"><div><div className="eyebrow">02 · WORLD HUB</div><h2>Weszłaś do ALTER.</h2><p className="lead smallLead">Wybierz miejsce. Każde wejście poniżej naprawdę otwiera osobną scenę.</p></div><EchoAvatar echo={echo} style={style}/></div>
    <div className="worldCanvas">
      <WorldDoor title="NOX CLUB" meta="8 ONLINE · PUBLIC" desc="Główna historia na żywo" tone="nox" onClick={()=>onEnter('nox')}/>
      <WorldDoor title="GLASS ROOM" meta="2 ONLINE · STORY" desc="Odbicia, sekrety, wybory" tone="glass" onClick={()=>onEnter('glass')}/>
      <WorldDoor title="ROOFTOP 4AM" meta="4 ONLINE · QUIET" desc="Mniejsza nocna przestrzeń" tone="rooftop" onClick={()=>onEnter('rooftop')}/>
      <WorldDoor title="YOUR ROOM" meta="PRIVATE" desc="Twój pokój i wspomnienia" tone="room" onClick={()=>onEnter('room')}/>
      <div className="worldPulse pulseA"/><div className="worldPulse pulseB"/>
    </div>
    <div className="worldFooter"><span>LIVE EVENT · BLUE HOUR</span><button className="secondary" onClick={()=>onEnter('collection')}>KOLEKCJA</button><button className="secondary" onClick={()=>onEnter('relations')}>RELACJE</button></div>
  </section>
}

function WorldDoor({title,meta,desc,tone,onClick}){return <button className={`worldDoor ${tone}`} onClick={onClick}><span className="doorGlow"/><small>{meta}</small><b>{title}</b><p>{desc}</p><span className="doorEnter">WEJDŹ →</span></button>}

function LocationPage({tone,title,kicker,desc,extra,echo,style,onBack}){return <section className={`screen locationScene ${tone}`}><div className="locationBackdrop"/><div className="locationHud"><button className="secondary" onClick={onBack}>← WORLD HUB</button><span>{kicker}</span></div><div className="locationContent"><EchoAvatar echo={echo} style={style}/><div><div className="eyebrow">ALTER LOCATION</div><h1 className="locationTitle">{title}</h1><p className="lead smallLead">{desc}</p><div className="director locationDirector">{extra}</div><div className="ctaRow"><button className="primary">ROZPOCZNIJ SCENĘ</button><button className="secondary" onClick={onBack}>WYJDŹ</button></div></div></div></section>}

function Picker({title,values,current,onPick}){ return <div className="pickGroup"><b>{title}</b><div className="choices">{values.map(v=><button key={v} className={current===v?'choice selected':'choice'} onClick={()=>onPick(v)}>{v}</button>)}</div></div> }
function Item({icon,rarity,name,text}){ return <article className="item"><div className="itemIcon">{icon}</div><div><span>{rarity}</span><h3>{name}</h3><p>{text}</p></div></article> }
function Relation({avatar,name,score,memories}){ return <article className="relation"><div className="relHead"><div className="miniEcho">{avatar}</div><div><h3>{name}</h3><p>Bond {score}</p></div></div><div className="meter"><i style={{width:`${score}%`}}/></div><small>{memories}</small></article> }
