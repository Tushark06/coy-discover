import { useState, useEffect, useRef } from 'react';

const api = (p, body) =>
  fetch('/api' + p, body && { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error); return j; });

export default function App() {
  const [tab, setTab] = useState('discover');
  return (
    <div className="app">
      <main>{tab === 'home' ? <div /> : <Discover />}</main>
      <nav className="tabs">
        <button className={tab === 'home' ? 'on' : ''} onClick={() => setTab('home')}>Home</button>
        <button className={tab === 'discover' ? 'on' : ''} onClick={() => setTab('discover')}>Discover</button>
      </nav>
    </div>
  );
}

function Discover() {
  const [view, setView] = useState('swipe');
  return (
    <div className="disc">
      <div className="seg">
        <button className={view === 'swipe' ? 'on' : ''} onClick={() => setView('swipe')}>Swipe</button>
        <button className={view === 'matches' ? 'on' : ''} onClick={() => setView('matches')}>Matches</button>
      </div>
      {view === 'swipe' ? <Swipe onMatches={() => setView('matches')} /> : <Matches />}
    </div>
  );
}

function Card({ p, style, children, ...rest }) {
  return (
    <div className="card" style={style} {...rest}>
      <img src={p.photo} alt={p.name} draggable={false} />
      <div className="info">
        <h2>{p.name}, {p.age}</h2>
        <p className="place">{p.place}</p>
        <p>{p.bio}</p>
        <div className="chips">{p.interests.map(i => <span key={i}>{i}</span>)}</div>
      </div>
      {children}
    </div>
  );
}

function Swipe({ onMatches }) {
  const [feed, setFeed] = useState(null);
  const [err, setErr] = useState(false);
  const [dx, setDx] = useState(0);
  const [fly, setFly] = useState(0);
  const [drag, setDrag] = useState(false);
  const [match, setMatch] = useState(null);
  const startX = useRef(null);
  const busy = useRef(false);

  const loadFeed = () => { setErr(false); setFeed(null); api('/feed').then(setFeed).catch(() => setErr(true)); };
  useEffect(loadFeed, []);
  if (err) return (
    <div className="empty">
      <h2>Couldn't load profiles</h2>
      <p>Check your connection and try again.</p>
      <button className="pill" onClick={loadFeed}>Retry</button>
    </div>
  );
  if (!feed) return <p className="empty">Loading…</p>;

  const top = feed[0];
  async function swipe(dir) {
    if (busy.current || !top) return;
    busy.current = true;
    setFly(dir === 'like' ? 1 : -1);
    try {
      const r = await api('/swipe', { profileId: top.id, direction: dir });
      setTimeout(() => {
        setFeed(f => f.slice(1)); setFly(0); setDx(0); busy.current = false;
        if (r.match) setMatch(r.profile);
      }, 280);
    } catch {
      setFly(0); setDx(0); busy.current = false;
      api('/feed').then(setFeed).catch(() => setErr(true));
    }
  }

  if (!top) return (
    <div className="empty">
      <h2>You've seen everyone for now</h2>
      <p>New people show up here as they join. Check your matches in the meantime.</p>
      <button className="pill" onClick={onMatches}>View matches</button>
      <button className="link" onClick={() => api('/reset', {}).then(() => api('/feed').then(setFeed)).catch(() => setErr(true))}>Reset demo data</button>
    </div>
  );

  const x = fly ? fly * 600 : dx;
  const stamp = Math.min(Math.abs(x) / 100, 1);
  return (
    <>
      <div className="stack">
        {feed[1] && <Card p={feed[1]} style={{ transform: 'scale(.95) translateY(12px)', opacity: .7 }} />}
        <Card
          key={top.id} p={top}
          style={{ transform: `translateX(${x}px) rotate(${x / 18}deg)`, transition: drag ? 'none' : 'transform .28s ease', touchAction: 'pan-y' }}
          onPointerDown={e => { startX.current = e.clientX; setDrag(true); e.currentTarget.setPointerCapture(e.pointerId); }}
          onPointerMove={e => startX.current != null && setDx(e.clientX - startX.current)}
          onPointerUp={() => { const d = dx; startX.current = null; setDrag(false); d > 110 ? swipe('like') : d < -110 ? swipe('pass') : setDx(0); }}
          onPointerCancel={() => { startX.current = null; setDrag(false); setDx(0); }}
        >
          <span className="stamp like" style={{ opacity: x > 0 ? stamp : 0 }}>Like</span>
          <span className="stamp nope" style={{ opacity: x < 0 ? stamp : 0 }}>Pass</span>
        </Card>
      </div>
      <div className="actions">
        <button className="round pass" aria-label="Pass" onClick={() => swipe('pass')}>✕</button>
        <button className="round like" aria-label="Like" onClick={() => swipe('like')}>♥</button>
      </div>
      {match && (
        <div className="overlay">
          <h1>It's a match!</h1>
          <img src={match.photo} alt={match.name} />
          <p>You and {match.name} liked each other.</p>
          <button className="pill" onClick={() => { setMatch(null); onMatches(); }}>See matches</button>
          <button className="link" onClick={() => setMatch(null)}>Keep swiping</button>
        </div>
      )}
    </>
  );
}

function Matches() {
  const [list, setList] = useState(null);
  const [err, setErr] = useState(false);
  const loadMatches = () => { setErr(false); setList(null); api('/matches').then(setList).catch(() => setErr(true)); };
  useEffect(loadMatches, []);
  if (err) return (
    <div className="empty">
      <h2>Couldn't load matches</h2>
      <p>Check your connection and try again.</p>
      <button className="pill" onClick={loadMatches}>Retry</button>
    </div>
  );
  if (!list) return <p className="empty">Loading…</p>;
  if (!list.length) return <div className="empty"><h2>No matches yet</h2><p>A match only appears when you both like each other.</p></div>;
  return (
    <ul className="matches">
      {list.map(m => (
        <li key={m.id}>
          <img src={m.photo} alt={m.name} />
          <div><b>{m.name}, {m.age}</b><span>{m.place}</span></div>
        </li>
      ))}
    </ul>
  );
}
