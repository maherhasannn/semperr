// Trace — data for private equity.
// Aesthetic: terminal / dealbook / ticker. Ink-dark background, gold accent.
// Hover: data points stream in and settle into a live dealbook table; a small network graph pulses.

function TraceSection({ variant = 'dealbook' }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <section id="trace" style={{
      background:'var(--ink)', color:'var(--paper)',
      padding:'120px 0 140px', position:'relative', overflow:'hidden',
    }}>
      <div className="grain" />

      <div className="container">
        {/* Section chrome */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:56}}>
          <div className="h-eyebrow" style={{color:'#c9a961'}}>I. &nbsp; Trace</div>
          <div className="h-eyebrow" style={{color:'#6b7388'}}>Data for private equity</div>
        </div>

        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display:'grid', gridTemplateColumns: variant === 'wide' ? '1fr' : '1.1fr 1.3fr',
            gap: 72, alignItems:'center',
          }}
        >
          {/* Copy */}
          <div>
            <h2 className="h-display" style={{
              fontSize:'clamp(52px, 6.5vw, 104px)', color:'#f8f6f0',
              marginBottom:32,
            }}>
              Every private<br/>
              company,<br/>
              <em style={{fontStyle:'italic', color:'#c9a961'}}>mapped.</em>
            </h2>
            <p className="t-body" style={{maxWidth:460, fontSize:18}}>
              Eight million private companies, continuously traced — ownership graphs, 
              operating metrics, relationship history. The dealbook analysts wish they had 
              before the pitch.
            </p>

            <div style={{marginTop:40, display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:0, maxWidth:520}}>
              <Stat n="8.2M" l="Companies tracked" />
              <Stat n="340K" l="Transactions linked" c/>
              <Stat n="94%" l="LP coverage" c/>
            </div>

            <a href="Trace.html" style={{
              display:'inline-flex', alignItems:'center', gap:10, marginTop:48,
              padding:'14px 22px', borderRadius:999,
              background:'#c9a961', color:'#0b1220', fontSize:14, fontWeight:500,
            }}>Explore Trace ↗</a>
          </div>

          {/* Visual: dealbook */}
          <TraceDealbook hovered={hovered} />
        </div>
      </div>
    </section>
  );
}

function Stat({ n, l, c }) {
  return (
    <div style={{
      paddingLeft: c ? 20 : 0,
      borderLeft: c ? '1px solid rgba(255,255,255,0.12)' : 'none',
    }}>
      <div className="h-serif" style={{fontSize:36, color:'#f8f6f0'}}>{n}</div>
      <div style={{fontSize:11, color:'#6b7388', marginTop:6, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.08em', textTransform:'uppercase'}}>{l}</div>
    </div>
  );
}

function TraceDealbook({ hovered }) {
  // seed rows appear & flow on hover
  const rows = [
    ['Helix Logistics',    'Carlyle',     '$1.2B', 'Platform',   'Mar 12'],
    ['Atlas Precision',    'Vista',       '$410M', 'Add-on',     'Mar 09'],
    ['Meridian Supply',    'Bain Cap.',   '$2.4B', 'Secondary',  'Feb 28'],
    ['Verra Health',       'KKR',         '$860M', 'Platform',   'Feb 22'],
    ['Copperline Foods',   'Apollo',      '$315M', 'Add-on',     'Feb 18'],
    ['Northwind Ceramics', 'Genstar',     '$540M', 'Carve-out',  'Feb 11'],
  ];

  return (
    <div style={{
      position:'relative',
      background:'#0f1729',
      border:'1px solid rgba(201,169,97,0.2)',
      borderRadius:2,
      padding:'28px 0 0',
      boxShadow:'0 40px 80px -30px rgba(0,0,0,0.6)',
      transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      transition:'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
      overflow:'hidden',
    }}>
      {/* Ticker strip */}
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'0 24px 20px', borderBottom:'1px solid rgba(255,255,255,0.08)',
        fontFamily:'JetBrains Mono, monospace', fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase',
      }}>
        <div style={{color:'#c9a961'}}>● &nbsp; DEALBOOK / LIVE</div>
        <div style={{color:'#6b7388'}}>Last sync · 00:00:12 ago</div>
      </div>

      {/* Column headers */}
      <div style={{
        display:'grid', gridTemplateColumns:'2fr 1.3fr 1fr 1fr 0.8fr',
        padding:'12px 24px', gap:16,
        fontFamily:'JetBrains Mono, monospace', fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase',
        color:'#6b7388',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
      }}>
        <div>Target</div><div>Sponsor</div><div>EV</div><div>Type</div><div>Date</div>
      </div>

      {/* Rows */}
      <div style={{position:'relative'}}>
        {rows.map((r, i) => (
          <div key={i} style={{
            display:'grid', gridTemplateColumns:'2fr 1.3fr 1fr 1fr 0.8fr',
            padding:'14px 24px', gap:16,
            fontSize:13, color:'#d4dbe8',
            borderBottom: i === rows.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
            opacity: hovered ? 1 : 0.35,
            transform: hovered ? 'translateX(0)' : 'translateX(-8px)',
            transition: `all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) ${i * 0.06}s`,
          }}>
            <div style={{color:'#f8f6f0', fontWeight:500}}>{r[0]}</div>
            <div>{r[1]}</div>
            <div style={{color:'#c9a961', fontFamily:'JetBrains Mono, monospace'}}>{r[2]}</div>
            <div style={{fontSize:11, fontFamily:'JetBrains Mono, monospace', color:'#9099ad'}}>{r[3]}</div>
            <div style={{fontSize:11, fontFamily:'JetBrains Mono, monospace', color:'#6b7388'}}>{r[4]}</div>
          </div>
        ))}

        {/* Flying data points that stream into the table on hover */}
        {hovered && <FlyingPoints />}
      </div>

      {/* Network mini-graph footer */}
      <div style={{
        padding:'16px 24px',
        borderTop:'1px solid rgba(255,255,255,0.08)',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        background:'rgba(0,0,0,0.2)',
      }}>
        <div style={{fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'#6b7388', letterSpacing:'0.08em', textTransform:'uppercase'}}>
          Ownership graph · Helix Logistics
        </div>
        <NetworkGraph hovered={hovered} />
      </div>
    </div>
  );
}

function FlyingPoints() {
  // Particles that stream diagonally into the table
  const pts = Array.from({length: 22}, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: (i * 0.04),
    fromX: Math.random() * 20 - 10,
    fromY: -30 - Math.random() * 40,
  }));
  return (
    <svg style={{
      position:'absolute', inset:0, pointerEvents:'none', width:'100%', height:'100%',
    }}>
      {pts.map(p => (
        <circle key={p.id}
          cx={`${p.x}%`} cy="50%"
          r="1.5" fill="#c9a961"
          style={{
            transformOrigin:'center',
            animation: `traceStream 1.2s cubic-bezier(0.3, 0.7, 0.2, 1) ${p.delay}s forwards`,
            opacity: 0,
          }}
        />
      ))}
      <style>{`
        @keyframes traceStream {
          0%   { opacity: 0; transform: translate(${0}px, -40px) scale(0.4); }
          30%  { opacity: 0.9; }
          100% { opacity: 0; transform: translate(0, 40px) scale(1.4); }
        }
      `}</style>
    </svg>
  );
}

function NetworkGraph({ hovered }) {
  // Little ownership-graph sparkline
  const nodes = [
    { x: 10, y: 16, r: 3 },
    { x: 40, y: 8,  r: 4 },
    { x: 68, y: 20, r: 3.5 },
    { x: 88, y: 10, r: 2.5 },
    { x: 56, y: 28, r: 3 },
    { x: 24, y: 28, r: 2.5 },
  ];
  const edges = [[0,1],[1,2],[2,3],[1,4],[4,5],[0,5],[2,4]];
  return (
    <svg width="140" height="40" viewBox="0 0 100 36" style={{overflow:'visible'}}>
      {edges.map(([a,b], i) => (
        <line key={i}
          x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
          stroke="#c9a961" strokeWidth="0.4" opacity={hovered ? 0.6 : 0.25}
          style={{transition:'opacity 0.5s'}}/>
      ))}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={n.r}
          fill={i === 2 ? '#c9a961' : '#f8f6f0'}
          opacity={hovered ? 1 : 0.6}
          style={{
            transition:'opacity 0.5s',
            animation: hovered ? `tracePulse 1.8s ease-in-out ${i * 0.1}s infinite` : 'none',
            transformOrigin: `${n.x}px ${n.y}px`,
          }}/>
      ))}
      <style>{`
        @keyframes tracePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.4); }
        }
      `}</style>
    </svg>
  );
}

window.TraceSection = TraceSection;
