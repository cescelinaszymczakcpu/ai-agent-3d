'use client';

import { useMemo, useState } from 'react';

const views = [
  ['start','START'],['echo','ECHO'],['world','ŚWIAT'],['collection','KOLEKCJA'],['relations','RELACJE'],['multiplayer','MULTIPLAYER']
];

const hairGlyph = { none:'', long:'⏜', short:'︵', messy:'≋', bob:'◜◝' };
const accGlyph = { none:'', clip:'✧', clips:'✦', crown:'♕', hat:'🎩', halo:'◯' };

export default function Home() {
  const [view, setView] = useState('start');
  const [echo, setEcho] = useState({ core:'✦', hair:'long', acc:'clip', color:'#9f7aea' });
  const [roomCode, setRoomCode] = useState('A7K2Q9');
  const [joined, setJoined] = useState(false);
  const [mic, setMic] = useState(false);

  const echoStyle = useMemo(() => ({ '--orb': echo.color }), [echo.color]);

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
        <div className="eyebrow">ALTER · LIVE PREVIEW</div>
        <h1>Drugie życie,<br/>które trwa.</h1>
        <p className="lead">Nie oglądasz historii. Wchodzisz do niej z prawdziwymi ludźmi, a AI Director zmienia świat na podstawie Waszych decyzji.</p>
        <div className="featureGrid">
          <button className="feature" onClick={()=>nav('echo')}><span>◌</span><b>ZBUDUJ ECHO</b><small>orb, włosy, dodatki, kolor</small></button>
          <button className="feature" onClick={()=>nav('world')}><span>◈</span><b>WEJDŹ DO ŚWIATA</b><small>NOX, Glass Room, prywatne miejsca</small></button>
          <button className="feature" onClick={()=>nav('multiplayer')}><span>🎙️</span><b>MULTIPLAYER</b><small>pokój 2–6 osób</small></button>
        </div>
        <button className="primary big" onClick={()=>nav('echo')}>ZACZNIJ →</button>
      </section>}

      {view==='echo' && <section className="screen">
        <div className="eyebrow">01 · ECHO BUILDER</div>
        <h2>Zbuduj własną obecność.</h2>
        <p className="lead smallLead">Stylizowany avatar zamiast realistycznej twarzy. Łatwy do personalizacji, charakterystyczny i bez problemów z lip-syncem.</p>
        <div className="builder">
          <div className="previewCard">
            <div className="echo" style={echoStyle}>
              <span className="aura"/>
              <span className="hair">{hairGlyph[echo.hair]}</span>
              <span className="core">{echo.core}</span>
              <span className="acc">{accGlyph[echo.acc]}</span>
            </div>
          </div>
          <div className="panel">
            <Picker title="Rdzeń" values={['✦','△','☾','∞','◇']} current={echo.core} onPick={v=>setEcho({...echo,core:v})}/>
            <Picker title="Włosy / styl" values={['long','short','messy','bob','none']} current={echo.hair} labels={{long:'długie',short:'krótkie',messy:'messy',bob:'bob',none:'brak'}} onPick={v=>setEcho({...echo,hair:v})}/>
            <Picker title="Dodatek" values={['clip','clips','crown','hat','halo','none']} current={echo.acc} labels={{clip:'spinka',clips:'spinki',crown:'korona',hat:'kapelusz',halo:'halo',none:'brak'}} onPick={v=>setEcho({...echo,acc:v})}/>
            <div className="pickGroup"><b>Kolor orba</b><div className="swatches">{['#9f7aea','#67e8f9','#fb7185','#f9d976','#86efac','#60a5fa'].map(c=><button key={c} aria-label={c} className={echo.color===c?'swatch selected':'swatch'} style={{background:c}} onClick={()=>setEcho({...echo,color:c})}/>)}</div></div>
            <button className="primary" onClick={()=>nav('world')}>WEJDŹ DO ŚWIATA →</button>
          </div>
        </div>
      </section>}

      {view==='world' && <section className="screen">
        <div className="eyebrow">02 · SECOND LIFE MAP</div><h2>Świat, nie feed.</h2>
        <p className="lead smallLead">Widzisz miejsca i obecność innych osób. Każda przestrzeń ma własny klimat i historię.</p>
        <div className="mapGrid">
          <Place title="NOX CLUB" badge="8 ONLINE" desc="Publiczna historia. Director aktywny." people="✦ ◇ ☾ +5" tone="violet"/>
          <Place title="GLASS ROOM" badge="UNLOCKED" desc="Lokacja odkryta przez wspólną decyzję." people="∞ ⊙" tone="cyan"/>
          <Place title="ROOFTOP 4AM" badge="QUIET" desc="Mniejsza przestrzeń do rozmów po północy." people="⌁ ✦ +2" tone="gold"/>
          <Place title="TWÓJ POKÓJ" badge="PRIVATE" desc="Wchodzą tylko zaproszone osoby." people="◌" tone="rose"/>
        </div>
        <div className="ctaRow"><button className="primary" onClick={()=>nav('collection')}>CO MOŻNA ZDOBYĆ →</button><button className="secondary" onClick={()=>nav('relations')}>RELACJE</button></div>
      </section>}

      {view==='collection' && <section className="screen">
        <div className="eyebrow">03 · COLLECTION</div><h2>To, co przeżywasz, zostaje z Tobą.</h2>
        <p className="lead smallLead">Najciekawsze rzeczy zdobywasz przez historie, relacje i wydarzenia, a nie tylko zakup.</p>
        <div className="itemGrid">
          <Item icon="◌" rarity="RARE" name="Violet Aura" text="Startowy efekt ECHO."/>
          <Item icon="🜁" rarity="RARE" name="Midnight Cloak" text="Po pierwszej sesji."/>
          <Item icon="🗝️" rarity="STORY" name="Key 307" text="Tylko jeśli zabierzesz klucz."/>
          <Item icon="🔮" rarity="EPIC" name="Glass Shard" text="Za odkrycie sekretu Glass Room."/>
          <Item icon="🎟️" rarity="LIVE" name="4AM Ticket" text="Z wydarzenia czasowego."/>
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
        <p className="lead smallLead">Ten ekran już działa jako interaktywna symulacja tworzenia pokoju. Następny etap podłączy realny realtime voice.</p>
        <div className="multiGrid">
          <div className="panel roomPanel">
            <span className="status"><i/> ROOM ONLINE</span>
            <div className="roomCode">{roomCode}</div>
            <p className="muted">Kod sesji dla znajomych.</p>
            <div className="avatars">✦ ◇ ☾ ∞ +2</div>
            <div className="ctaRow">
              <button className={mic?'primary':'secondary'} onClick={()=>setMic(!mic)}>{mic?'🎙️ MIKROFON ON':'🔇 MIKROFON OFF'}</button>
              <button className="secondary" onClick={createRoom}>{joined?'NOWY KOD':'UTWÓRZ POKÓJ'}</button>
            </div>
          </div>
          <div className="panel">
            <div className="eyebrow">AI DIRECTOR</div>
            <div className="director">„Światła gasną na 7 sekund. Kiedy wracają, jedno ECHO stoi w innym miejscu.”</div>
            <div className="chat"><p><b>Lena:</b> Kto się przesunął?</p><p><b>Alex:</b> Nie ja.</p><p><b>Mira:</b> Spójrzcie na drzwi 307.</p></div>
          </div>
        </div>
        <button className="secondary" onClick={()=>nav('start')}>WRÓĆ NA START</button>
      </section>}
    </main>
  );
}

function Picker({title,values,current,onPick,labels={}}){ return <div className="pickGroup"><b>{title}</b><div className="choices">{values.map(v=><button key={v} className={current===v?'choice selected':'choice'} onClick={()=>onPick(v)}>{labels[v]??v}</button>)}</div></div> }
function Place({title,badge,desc,people,tone}){ return <article className={`place ${tone}`}><span className="badge">{badge}</span><h3>{title}</h3><p>{desc}</p><div className="avatars">{people}</div></article> }
function Item({icon,rarity,name,text}){ return <article className="item"><div className="itemIcon">{icon}</div><div><span>{rarity}</span><h3>{name}</h3><p>{text}</p></div></article> }
function Relation({avatar,name,score,memories}){ return <article className="relation"><div className="relHead"><div className="miniEcho">{avatar}</div><div><h3>{name}</h3><p>Bond {score}</p></div></div><div className="meter"><i style={{width:`${score}%`}}/></div><small>{memories}</small></article> }
