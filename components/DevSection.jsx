// Dev — "Don't worry about it, Dev is on it."
// Technical services for SMBs, with a REAL HUMAN rep for every customer.
// This is the flashy one: animated SVGs, glitch/static, a pixelated human face dissolving in,
// waveforms, code assembling, a phone ringing. High drama.

function DevSection({ flashLevel = 8 }) {
  const [hovered, setHovered] = React.useState(false);
  const [tick, setTick] = React.useState(0);

  // Ambient "live" clock so small things move even when not hovered
  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="dev" style={{
      background:'#0b1220', color:'#f8f6f0',
      padding:'120px 0 140px', position:'relative', overflow:'hidden',
    }}>
      {/* Ambient grid */}
      <DevGridBackdrop flashLevel={flashLevel} />
      <div className="grain" />

      <div className="container" style={{position:'relative', zIndex:2}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:56}}>
          <div className="h-eyebrow" style={{color:'#b8502a'}}>III. &nbsp; Dev</div>
          <div className="h-eyebrow" style={{color:'#6b7388'}}>Technical services · human led</div>
        </div>

        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display:'grid',
            gridTemplateColumns:'minmax(320px, 1fr) minmax(420px, 1.1fr)',
            gap:56, alignItems:'center',
          }}
        >
          {/* Copy */}
          <div style={{position:'relative'}}>
            <div style={{
              fontFamily:'JetBrains Mono, monospace', fontSize:13,
              color:'#b8502a', marginBottom:18, display:'flex', alignItems:'center', gap:10,
            }}>
              <span style={{
                width:8, height:8, borderRadius:'50%', background:'#4a7a5c',
                boxShadow:'0 0 12px #4a7a5c',
                animation:'devPulse 1.5s ease-in-out infinite',
              }}/>
              <span style={{color:'#9099ad'}}>$</span>
              <GlitchText hovered={hovered} flashLevel={flashLevel}>
                dont_worry_about_it
              </GlitchText>
            </div>

            <h2 className="h-display" style={{
              fontSize:'clamp(52px, 6.5vw, 116px)', color:'#f8f6f0',
            }}>
              <em style={{fontStyle:'italic', color:'#b8502a'}}>Dev</em><br/>
              is on it.
            </h2>

            <p className="t-body" style={{maxWidth:500, fontSize:18, marginTop:32}}>
              Websites, automations, AI receptionists, back-office plumbing — whatever the 
              small business needs to run in 2026. Every account is assigned a real human 
              engineer. No tickets. No tiers. A name and a phone number.
            </p>

            {/* Service chips */}
            <div style={{
              display:'flex', flexWrap:'wrap', gap:8, marginTop:32, maxWidth:520,
            }}>
              {['Websites', 'AI Receptionists', 'Automations', 'Phone Systems', 'CRM Setup', 'Back-office'].map((s, i) => (
                <span key={s} style={{
                  padding:'8px 14px',
                  fontSize:12,
                  fontFamily:'JetBrains Mono, monospace',
                  border:'1px solid rgba(184,80,42,0.35)',
                  color:'#f8f6f0',
                  background:'rgba(184,80,42,0.06)',
                  letterSpacing:'0.04em',
                }}>{s}</span>
              ))}
            </div>

            <a href="Dev.html" style={{
              display:'inline-flex', alignItems:'center', gap:10, marginTop:40,
              padding:'14px 22px', borderRadius:999,
              background:'#b8502a', color:'#f8f6f0', fontSize:14, fontWeight:500,
              boxShadow:'0 0 32px rgba(184,80,42,0.4)',
            }}>Meet your engineer ↗</a>
          </div>

          {/* The RIG — the visual centerpiece */}
          <DevRig hovered={hovered} tick={tick} flashLevel={flashLevel} />
        </div>
      </div>

      <style>{`
        @keyframes devPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </section>
  );
}

/* ———————————— DEV RIG: the "technician card" ———————————— */

function DevRig({ hovered, tick, flashLevel }) {
  return (
    <div style={{
      position:'relative',
      border:'1px solid rgba(184,80,42,0.3)',
      background:'linear-gradient(180deg, rgba(20,28,46,0.9), rgba(11,18,32,0.95))',
      boxShadow: hovered
        ? '0 40px 80px -30px rgba(184,80,42,0.3), 0 0 0 1px rgba(184,80,42,0.5)'
        : '0 40px 80px -30px rgba(0,0,0,0.6)',
      transition:'box-shadow 0.5s',
      overflow:'hidden',
    }}>
      {/* Terminal chrome */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'12px 16px',
        borderBottom:'1px solid rgba(255,255,255,0.08)',
        background:'rgba(0,0,0,0.3)',
      }}>
        <div style={{display:'flex', gap:6}}>
          <span style={{width:10, height:10, borderRadius:'50%', background:'#b8502a'}}/>
          <span style={{width:10, height:10, borderRadius:'50%', background:'#c9a961'}}/>
          <span style={{width:10, height:10, borderRadius:'50%', background:'#4a7a5c'}}/>
        </div>
        <div style={{fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'#6b7388', letterSpacing:'0.12em', textTransform:'uppercase'}}>
          dev_01.semperr.io / on-call
        </div>
        <div style={{fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'#4a7a5c'}}>● LIVE</div>
      </div>

      {/* Main stage — split: human card + live panel */}
      <div className="dev-rig-grid" style={{display:'grid', gridTemplateColumns:'1.1fr 1fr', minHeight:460}}>

        {/* LEFT: Human portrait with pixel-static dissolve */}
        <div style={{
          position:'relative',
          borderRight:'1px solid rgba(255,255,255,0.06)',
          padding:'32px 28px',
          display:'flex', flexDirection:'column', justifyContent:'space-between',
        }}>
          <div className="h-eyebrow" style={{color:'#b8502a'}}>Your Engineer</div>

          <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 0'}}>
            <HumanPortrait hovered={hovered} flashLevel={flashLevel} />
          </div>

          <div>
            <div className="h-serif" style={{fontSize:32, color:'#f8f6f0', letterSpacing:'-0.01em'}}>
              Kate Ó&nbsp;Súilleabháin
            </div>
            <div style={{fontFamily:'JetBrains Mono, monospace', fontSize:11, color:'#9099ad', marginTop:6, letterSpacing:'0.06em'}}>
              Senior engineer · 9 yrs · based in Cork
            </div>
            <div style={{
              display:'flex', alignItems:'center', gap:8, marginTop:14,
              padding:'10px 12px',
              background:'rgba(74,122,92,0.12)',
              border:'1px solid rgba(74,122,92,0.3)',
              fontSize:12, color:'#b8cec0',
            }}>
              <span style={{
                width:6, height:6, borderRadius:'50%', background:'#4a7a5c',
                animation:'devPulse 1.5s ease-in-out infinite',
              }}/>
              Online now · typically replies in 4 min
            </div>
          </div>
        </div>

        {/* RIGHT: Live workbench */}
        <div style={{display:'flex', flexDirection:'column'}}>
          {/* Waveform panel — AI receptionist */}
          <div style={{
            padding:'20px 22px',
            borderBottom:'1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
              <div className="h-eyebrow" style={{color:'#9099ad'}}>
                ☏ &nbsp; AI Receptionist · call in progress
              </div>
              <div style={{fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'#6b7388'}}>
                00:{String(12 + (tick % 48)).padStart(2, '0')}
              </div>
            </div>
            <Waveform hovered={hovered} tick={tick} />
            <div style={{
              marginTop:10,
              fontFamily:'Instrument Serif, serif', fontStyle:'italic',
              fontSize:14, color:'#d4dbe8', lineHeight:1.4,
            }}>
              <TypedLine hovered={hovered} />
            </div>
          </div>

          {/* Code assembly panel */}
          <div style={{
            padding:'20px 22px',
            borderBottom:'1px solid rgba(255,255,255,0.06)',
            flex:1,
          }}>
            <div className="h-eyebrow" style={{color:'#9099ad', marginBottom:12}}>
              ◉ &nbsp; Building · website.jsx
            </div>
            <CodeAssembly hovered={hovered} />
          </div>

          {/* Status strip */}
          <div style={{
            padding:'12px 22px',
            display:'flex', justifyContent:'space-between', alignItems:'center',
            background:'rgba(0,0,0,0.3)',
            fontFamily:'JetBrains Mono, monospace', fontSize:10,
            color:'#6b7388', letterSpacing:'0.08em', textTransform:'uppercase',
          }}>
            <span>Uptime · 99.98%</span>
            <span style={{color:'#4a7a5c'}}>● All systems nominal</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ———————————— HUMAN PORTRAIT ———————————— */
// Pixelated silhouette that dissolves from static into a clearer form on hover.

function HumanPortrait({ hovered, flashLevel }) {
  // Generate a pixel-art portrait of a person using colored rectangles.
  // Palette warms up and resolves on hover.
  const GRID = 28;
  const CELL = 8;

  const portrait = React.useMemo(() => makePortraitGrid(GRID), []);

  return (
    <div style={{
      position:'relative',
      width: GRID * CELL + 40, height: GRID * CELL + 40,
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      {/* Aura */}
      <div style={{
        position:'absolute', inset: 0,
        background:'radial-gradient(circle at 50% 55%, rgba(184,80,42,0.35), transparent 65%)',
        opacity: hovered ? 1 : 0.4, transition:'opacity 0.6s',
        filter:'blur(8px)',
      }}/>

      <svg width={GRID * CELL} height={GRID * CELL} style={{position:'relative'}}>
        {/* Static noise layer — fades on hover */}
        <NoiseField GRID={GRID} CELL={CELL} hovered={hovered} flashLevel={flashLevel}/>

        {/* Portrait pixels */}
        {portrait.map((row, y) =>
          row.map((cell, x) => {
            if (!cell) return null;
            // cell = 'skin' | 'hair' | 'shirt' | 'eye' | 'mouth' | 'bg'
            const colorMap = hovered ? {
              skin:  '#f1c2a3',
              hair:  '#2a1f14',
              shirt: '#b8502a',
              eye:   '#2a1f14',
              mouth: '#8a3a1f',
              cheek: '#e89579',
              shadow:'#c9916f',
            } : {
              // Pre-hover: desaturated / static
              skin:  '#4a4852',
              hair:  '#1e1e28',
              shirt: '#3a2e28',
              eye:   '#1e1e28',
              mouth: '#3a2e28',
              cheek: '#4a4852',
              shadow:'#3a3840',
            };
            return (
              <rect key={`${x}-${y}`}
                x={x * CELL} y={y * CELL}
                width={CELL + 0.5} height={CELL + 0.5}
                fill={colorMap[cell] || '#1e1e28'}
                style={{
                  transition:`fill 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) ${(x + y) * 0.005}s`,
                }}
              />
            );
          })
        )}

        {/* Scanlines */}
        <g style={{opacity: hovered ? 0.1 : 0.25, transition:'opacity 0.5s', pointerEvents:'none'}}>
          {[...Array(Math.floor(GRID * CELL / 3))].map((_, i) => (
            <rect key={i} x="0" y={i * 3} width={GRID * CELL} height="1" fill="rgba(0,0,0,0.3)" />
          ))}
        </g>
      </svg>

      {/* CRT vignette */}
      <div style={{
        position:'absolute', inset:0,
        background:'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.6))',
        pointerEvents:'none',
      }}/>
    </div>
  );
}

function NoiseField({ GRID, CELL, hovered, flashLevel }) {
  const [seed, setSeed] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setSeed(s => s + 1), hovered ? 300 : 120);
    return () => clearInterval(id);
  }, [hovered]);

  const opacity = hovered ? Math.max(0, 0.08 - flashLevel * 0.005) : 0.55;
  const cells = [];
  // sparse noise
  const N = Math.floor(GRID * GRID * (hovered ? 0.15 : 0.55));
  for (let i = 0; i < N; i++) {
    const x = Math.floor(Math.random() * GRID);
    const y = Math.floor(Math.random() * GRID);
    const v = Math.random();
    cells.push({x, y, v});
  }

  return (
    <g key={seed} style={{opacity, transition:'opacity 0.6s'}}>
      {cells.map((c, i) => (
        <rect key={i}
          x={c.x * CELL} y={c.y * CELL}
          width={CELL} height={CELL}
          fill={c.v > 0.7 ? '#f8f6f0' : c.v > 0.4 ? '#6b7388' : '#1e1e28'}
        />
      ))}
    </g>
  );
}

// Hand-laid pixel grid for the portrait. 28x28.
// Symbols: s=skin, h=hair, t=shirt (shirt), e=eye, m=mouth, c=cheek, d=shadow
function makePortraitGrid(GRID) {
  const raw = [
    '............................',
    '............................',
    '...........hhhhhhh..........',
    '.........hhhhhhhhhhh........',
    '........hhhhhhhhhhhhh.......',
    '.......hhssssssssshhhh......',
    '......hhsssssssssshhhh......',
    '......hsssssssssssshh.......',
    '......hssssssssssssss.......',
    '.....hssssdssssdssssh.......',
    '.....hsseeessseeesssh.......',
    '.....hssssssssssssssh.......',
    '.....hssssssddssssssh.......',
    '......hsssssssssssss........',
    '......hsscsssssscsss........',
    '......hssssmmmmmssss........',
    '.......hssssmmmsss..........',
    '........hsssssss............',
    '.........hssssss............',
    '..........sssss.............',
    '.........tssssst............',
    '........ttssssstt...........',
    '.......tttsssstttt..........',
    '......ttttttttttttt.........',
    '.....tttttttttttttttt.......',
    '....ttttttttttttttttttt.....',
    '...ttttttttttttttttttttt....',
    '..ttttttttttttttttttttttt...',
  ];
  const map = { '.':null, 's':'skin', 'h':'hair', 't':'shirt', 'e':'eye', 'm':'mouth', 'c':'cheek', 'd':'shadow' };
  return raw.map(row => row.split('').map(ch => map[ch] ?? null));
}

/* ———————————— WAVEFORM ———————————— */

function Waveform({ hovered, tick }) {
  const bars = 48;
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:3, height:44,
    }}>
      {[...Array(bars)].map((_, i) => {
        const phase = (tick * 0.6 + i * 0.4);
        const base = Math.sin(phase) * 0.5 + 0.5;
        const active = hovered ? 1 : 0.4;
        const h = 6 + Math.pow(base, 2) * 38 * active;
        return (
          <div key={i} style={{
            width:3, height: h,
            background: i < 24 ? '#b8502a' : '#c9a961',
            opacity: 0.6 + base * 0.4,
            transition:'height 0.18s ease-out, background 0.5s',
          }}/>
        );
      })}
    </div>
  );
}

/* ———————————— TYPED LINE ———————————— */

function TypedLine({ hovered }) {
  const line = '"Hi, I\'m Emma from Brennan\'s Bakery — can I take a message?"';
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    if (!hovered) { setN(0); return; }
    const id = setInterval(() => {
      setN(v => (v < line.length ? v + 1 : v));
    }, 28);
    return () => clearInterval(id);
  }, [hovered]);

  return (
    <span>
      {line.slice(0, hovered ? n : line.length)}
      {hovered && n < line.length && <span style={{opacity:0.6}}>▍</span>}
    </span>
  );
}

/* ———————————— CODE ASSEMBLY ———————————— */

function CodeAssembly({ hovered }) {
  const lines = [
    { i:0, t:<><span style={{color:'#6b7388'}}>01</span> <span style={{color:'#b8502a'}}>import</span> <span style={{color:'#c9a961'}}>{'{ Header, Hero }'}</span> <span style={{color:'#b8502a'}}>from</span> <span style={{color:'#4a7a5c'}}>'./bakery'</span></>},
    { i:1, t:<><span style={{color:'#6b7388'}}>02</span> <span style={{color:'#b8502a'}}>export default</span> <span style={{color:'#c9a961'}}>function</span> <span style={{color:'#f8f6f0'}}>Site</span>() {'{ '}</>},
    { i:2, t:<><span style={{color:'#6b7388'}}>03</span> &nbsp;&nbsp;<span style={{color:'#b8502a'}}>return</span> &lt;<span style={{color:'#c9a961'}}>Hero</span> title=<span style={{color:'#4a7a5c'}}>"Fresh daily."</span> /&gt;</>},
    { i:3, t:<><span style={{color:'#6b7388'}}>04</span> {'}'}</>},
  ];

  return (
    <div style={{fontFamily:'JetBrains Mono, monospace', fontSize:12, lineHeight:1.8}}>
      {lines.map((l) => (
        <div key={l.i} style={{
          opacity: hovered ? 1 : 0.35,
          transform: hovered ? 'translateX(0)' : 'translateX(-6px)',
          transition:`all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) ${l.i * 0.12}s`,
        }}>{l.t}</div>
      ))}
      <div style={{
        marginTop:10, display:'flex', alignItems:'center', gap:8,
        fontSize:11, color:'#9099ad',
      }}>
        <span style={{
          width:8, height:8, borderRadius:'50%',
          background:'#4a7a5c',
          animation:'devPulse 1.5s ease-in-out infinite',
        }}/>
        <span>deployed · v1.3.0 · 2m ago</span>
      </div>
    </div>
  );
}

/* ———————————— BACKDROP ———————————— */

function DevGridBackdrop({ flashLevel }) {
  return (
    <div style={{
      position:'absolute', inset:0, pointerEvents:'none',
      backgroundImage: `
        linear-gradient(rgba(184,80,42,${0.02 + flashLevel * 0.002}) 1px, transparent 1px),
        linear-gradient(90deg, rgba(184,80,42,${0.02 + flashLevel * 0.002}) 1px, transparent 1px)
      `,
      backgroundSize:'80px 80px',
      maskImage:'radial-gradient(ellipse at 70% 50%, black, transparent 70%)',
      WebkitMaskImage:'radial-gradient(ellipse at 70% 50%, black, transparent 70%)',
    }}/>
  );
}

/* ———————————— GLITCH TEXT ———————————— */

function GlitchText({ children, hovered, flashLevel }) {
  return (
    <span style={{position:'relative', display:'inline-block', color:'#f8f6f0'}}>
      {children}
      {hovered && flashLevel > 3 && (
        <>
          <span style={{
            position:'absolute', left:0, top:0, color:'#b8502a',
            clipPath:'inset(0 0 60% 0)',
            transform:'translate(-1px, 0)',
            animation:'devGlitch 0.3s infinite',
          }}>{children}</span>
          <span style={{
            position:'absolute', left:0, top:0, color:'#4a7fc1',
            clipPath:'inset(60% 0 0 0)',
            transform:'translate(1px, 0)',
            animation:'devGlitch 0.3s infinite reverse',
          }}>{children}</span>
        </>
      )}
      <style>{`
        @keyframes devGlitch {
          0%, 100% { transform: translate(-1px, 0); }
          25% { transform: translate(1px, 0); }
          50% { transform: translate(-1px, 1px); }
          75% { transform: translate(1px, -1px); }
        }
      `}</style>
    </span>
  );
}

window.DevSection = DevSection;
