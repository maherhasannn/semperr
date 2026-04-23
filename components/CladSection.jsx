// Clad — intelligence for law firms.
// Aesthetic: paper, dossier, annotated case file. Warm cream background, steel blue + ink.
// Hover: stacked case files fan out, highlighter marks swipe across key phrases.

function CladSection({ variant = 'dossier' }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <section id="clad" style={{
      background:'var(--paper-warm)', color:'var(--ink)',
      padding:'120px 0 140px', position:'relative', overflow:'hidden',
    }}>
      <div className="grain" />

      <div className="container">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:56}}>
          <div className="h-eyebrow" style={{color:'#2f5c96'}}>II. &nbsp; Clad</div>
          <div className="h-eyebrow" style={{color:'#7a7466'}}>Intelligence for law firms</div>
        </div>

        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display:'grid', gridTemplateColumns:'1.3fr 1.1fr', gap:72, alignItems:'center',
          }}
        >
          {/* Visual: fanned case files */}
          <CladDossier hovered={hovered} />

          {/* Copy */}
          <div>
            <h2 className="h-display" style={{
              fontSize:'clamp(52px, 6.5vw, 104px)', color:'#0b1220',
              marginBottom:32,
            }}>
              The full<br/>
              <em style={{fontStyle:'italic', color:'#2f5c96'}}>record.</em><br/>
              Indexed.
            </h2>
            <p style={{maxWidth:460, fontSize:18, lineHeight:1.55, color:'#4a4638'}}>
              Every federal filing, every state docket, every administrative ruling — read, 
              annotated, and cross-referenced. Clad gives partners the precedent they need 
              before the associate has finished pouring coffee.
            </p>

            <div style={{marginTop:40, display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:0, maxWidth:520}}>
              <StatInk n="52M" l="Documents indexed" />
              <StatInk n="1,240" l="Jurisdictions" c/>
              <StatInk n="< 2s" l="Citation lookup" c/>
            </div>

            <a style={{
              display:'inline-flex', alignItems:'center', gap:10, marginTop:48,
              padding:'14px 22px', borderRadius:999,
              background:'#0b1220', color:'#f8f6f0', fontSize:14, fontWeight:500,
            }}>Explore Clad ↗</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatInk({ n, l, c }) {
  return (
    <div style={{
      paddingLeft: c ? 20 : 0,
      borderLeft: c ? '1px solid rgba(11,18,32,0.15)' : 'none',
    }}>
      <div className="h-serif" style={{fontSize:36, color:'#0b1220'}}>{n}</div>
      <div style={{fontSize:11, color:'#7a7466', marginTop:6, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.08em', textTransform:'uppercase'}}>{l}</div>
    </div>
  );
}

function CladDossier({ hovered }) {
  // Three case files layered. On hover, they fan.
  const files = [
    {
      title: 'Memorandum of Law',
      caption: 'Hollister v. Briar Capital · 2nd Cir.',
      date: 'Filed 03·14·2026',
      rot: -6,
      dx: -40, dy: 20,
      hoverRot: -14, hoverDx: -140, hoverDy: 24,
    },
    {
      title: 'Expert Report',
      caption: 'SEC v. Meridian Holdings · S.D.N.Y.',
      date: 'Filed 02·28·2026',
      rot: 2,
      dx: 0, dy: 0,
      hoverRot: -2, hoverDx: 0, hoverDy: -8,
    },
    {
      title: 'Deposition Transcript',
      caption: 'In re: Copperline Estate · Del. Ch.',
      date: 'Sealed 02·11·2026',
      rot: 8,
      dx: 40, dy: -20,
      hoverRot: 14, hoverDx: 140, hoverDy: 16,
    },
  ];

  return (
    <div style={{
      position:'relative', height: 540,
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      {files.map((f, i) => (
        <div key={i} style={{
          position:'absolute',
          width: 360, height: 460,
          background:'#fbf9f2',
          border:'1px solid #d4cfbd',
          boxShadow: hovered
            ? '0 30px 60px -20px rgba(11,18,32,0.25), 0 8px 16px -8px rgba(11,18,32,0.15)'
            : '0 20px 40px -20px rgba(11,18,32,0.2)',
          transform: hovered
            ? `translate(${f.hoverDx}px, ${f.hoverDy}px) rotate(${f.hoverRot}deg)`
            : `translate(${f.dx}px, ${f.dy}px) rotate(${f.rot}deg)`,
          transition: `transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) ${i * 0.06}s, box-shadow 0.5s`,
          zIndex: i === 1 ? 3 : (i === 0 ? 1 : 2),
        }}>
          <CaseFile {...f} highlight={hovered && i === 1} />
        </div>
      ))}
    </div>
  );
}

function CaseFile({ title, caption, date, highlight }) {
  return (
    <div style={{padding:'28px 28px', height:'100%', position:'relative', display:'flex', flexDirection:'column'}}>
      {/* Header: stamp + bates */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22}}>
        <div>
          <div style={{fontFamily:'JetBrains Mono, monospace', fontSize:9, letterSpacing:'0.12em', color:'#7a7466', textTransform:'uppercase'}}>
            Clad · Exhibit
          </div>
          <div style={{fontFamily:'Instrument Serif, serif', fontSize:22, color:'#0b1220', marginTop:6, letterSpacing:'-0.01em'}}>
            {title}
          </div>
          <div style={{fontSize:11, color:'#7a7466', marginTop:4}}>
            {caption}
          </div>
        </div>
        <div style={{
          border:'1.5px solid #2f5c96', color:'#2f5c96',
          padding:'4px 10px', fontSize:9, fontFamily:'JetBrains Mono, monospace',
          letterSpacing:'0.12em', textTransform:'uppercase',
          transform:'rotate(3deg)',
          fontWeight:600,
        }}>Analyzed</div>
      </div>

      {/* Body: ruled lines + one highlighted passage */}
      <div style={{flex:1, position:'relative'}}>
        {[...Array(14)].map((_, i) => {
          const isHighlight = highlight && (i === 4 || i === 5);
          const isPartial = highlight && i === 9;
          return (
            <div key={i} style={{
              position:'relative',
              height: 14, marginBottom: 10,
              background: isHighlight ? 'rgba(201,169,97,0.32)' : 'transparent',
              transition: 'background 0.6s ease 0.4s',
            }}>
              <div style={{
                height: 1, background: '#d4cfbd', position:'absolute', bottom: 0, left: 0,
                width: isPartial ? '45%' : (i % 3 === 0 ? '92%' : (i % 4 === 1 ? '78%' : '88%')),
              }}/>
              {isPartial && (
                <div style={{
                  position:'absolute', bottom:0, left:0, height: 4,
                  width: highlight ? '45%' : 0,
                  background:'#c9a961',
                  transition:'width 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.6s',
                  opacity: 0.6,
                }}/>
              )}
            </div>
          );
        })}

        {/* Pull quote when highlighted */}
        {highlight && (
          <div style={{
            position:'absolute', left: '50%', top: '32%',
            transform:'translateX(-50%)',
            background:'#0b1220', color:'#f8f6f0',
            padding:'10px 14px',
            fontFamily:'Instrument Serif, serif', fontSize:14,
            whiteSpace:'nowrap',
            animation:'cladQuote 0.5s ease 0.7s both',
          }}>
            "See <em style={{color:'#c9a961'}}>§ 4.2</em> — material breach."
            <style>{`
              @keyframes cladQuote {
                from { opacity: 0; transform: translate(-50%, 6px); }
                to   { opacity: 1; transform: translate(-50%, 0); }
              }
            `}</style>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display:'flex', justifyContent:'space-between',
        fontFamily:'JetBrains Mono, monospace', fontSize:9,
        color:'#7a7466', letterSpacing:'0.08em', textTransform:'uppercase',
        paddingTop:14, borderTop:'1px solid #e4dfcf',
      }}>
        <span>{date}</span>
        <span>Bates · CL-00{Math.floor(Math.random()*900)+100}</span>
      </div>
    </div>
  );
}

window.CladSection = CladSection;
