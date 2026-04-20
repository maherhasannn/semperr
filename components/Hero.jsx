// Hero — editorial, confident. Big serif headline, a disciplined grid of product chips below.

function Hero({ variant = 'editorial', theme = 'light' }) {
  const isDark = theme === 'dark';
  const ink = isDark ? '#f8f6f0' : '#0b1220';
  const muted = isDark ? '#9099ad' : '#6b7388';
  const gold = '#c9a961';

  return (
    <section style={{
      position:'relative',
      background: isDark ? 'var(--ink)' : 'var(--paper)',
      padding: '80px 0 96px',
      overflow:'hidden',
    }}>
      <div className="grain" />

      {/* Top editorial slug */}
      <div className="container" style={{marginBottom:48}}>
        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'center',
          fontSize:11, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.12em', textTransform:'uppercase',
          color: muted,
        }}>
          <span>Vol. V · No. 11</span>
          <span>The Semperr Broadsheet</span>
          <span>April · 2026</span>
        </div>
        <div className="hair" style={{marginTop:14, borderColor: isDark ? 'rgba(255,255,255,0.1)' : undefined}}/>
      </div>

      {variant === 'editorial' && (
        <div className="container">
          <div style={{display:'grid', gridTemplateColumns:'1fr 360px', gap:80, alignItems:'end'}}>
            <div>
              <div className="h-eyebrow" style={{color: gold, marginBottom:28}}>
                ❖ &nbsp; Quiet tools for loud decisions
              </div>
              <h1 className="h-display" style={{
                fontSize:'clamp(64px, 9.5vw, 156px)',
                color: ink,
              }}>
                Software <em style={{fontStyle:'italic', color: gold}}>serious</em><br/>
                businesses run on.
              </h1>
              <p style={{
                marginTop:36, maxWidth:560, fontSize:19, lineHeight:1.55,
                color: muted,
              }}>
                Semperr builds data and technical infrastructure for people who can't afford to guess — 
                private-equity analysts, law-firm partners, and the small businesses keeping the rest of the economy running.
              </p>
              <div style={{display:'flex', gap:12, marginTop:40}}>
                <a style={{
                  display:'inline-flex', alignItems:'center', gap:10,
                  padding:'14px 22px', borderRadius:999,
                  background: ink, color: isDark ? '#0b1220' : '#f8f6f0',
                  fontSize:14, fontWeight:500,
                }}>Book a briefing <span style={{opacity:0.5}}>↗</span></a>
                <a href="charter.html" style={{
                  display:'inline-flex', alignItems:'center', gap:10,
                  padding:'14px 22px', borderRadius:999,
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(11,18,32,0.2)'}`,
                  color: ink, fontSize:14, fontWeight:500,
                }}>Read the charter</a>
              </div>
            </div>

            {/* Right column — a small "masthead of products" block */}
            <ProductRoster ink={ink} muted={muted} gold={gold} isDark={isDark}/>
          </div>
        </div>
      )}

      {variant === 'centered' && (
        <div className="container" style={{textAlign:'center', paddingTop:40}}>
          <div className="h-eyebrow" style={{color: gold, marginBottom:32}}>
            ❖ &nbsp; Three tools, one operating principle
          </div>
          <h1 className="h-display" style={{
            fontSize:'clamp(56px, 11vw, 180px)', color: ink, maxWidth:1100, margin:'0 auto',
          }}>
            Software <em style={{fontStyle:'italic', color: gold}}>serious</em>
            <br/>businesses run on.
          </h1>
          <p style={{
            margin:'40px auto 0', maxWidth:620, fontSize:19, lineHeight:1.55, color: muted,
          }}>
            Semperr builds data and technical infrastructure for people who can't afford to guess.
          </p>
          <div style={{display:'flex', gap:12, justifyContent:'center', marginTop:40}}>
            <a style={{padding:'14px 22px', borderRadius:999, background: ink, color: isDark ? '#0b1220' : '#f8f6f0', fontSize:14, fontWeight:500}}>Book a briefing ↗</a>
            <a href="charter.html" style={{padding:'14px 22px', borderRadius:999, border:`1px solid ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(11,18,32,0.2)'}`, fontSize:14, fontWeight:500, color: ink}}>Read the charter</a>
          </div>
        </div>
      )}

      {variant === 'split' && (
        <div className="container">
          <div style={{display:'grid', gridTemplateColumns:'1.1fr 1fr', gap:64, alignItems:'center'}}>
            <div>
              <div className="h-eyebrow" style={{color: gold, marginBottom:28}}>❖ &nbsp; Est. MMXXI</div>
              <h1 className="h-display" style={{fontSize:'clamp(56px, 8vw, 132px)', color: ink}}>
                Three tools.<br/>
                <em style={{fontStyle:'italic', color: gold}}>One</em> operating principle.
              </h1>
              <p style={{marginTop:32, maxWidth:520, fontSize:19, lineHeight:1.55, color: muted}}>
                Build things that work the first time, for people who notice. Our clients run private-equity funds, 
                argue precedent-setting cases, and open the shop every Tuesday at 6 AM.
              </p>
            </div>
            <ProductRoster ink={ink} muted={muted} gold={gold} isDark={isDark} large/>
          </div>
        </div>
      )}
    </section>
  );
}

function ProductRoster({ ink, muted, gold, isDark, large }) {
  const rows = [
    { letter:'T', name:'Trace', tag:'Data for private equity', color: gold, href:'Trace.html' },
    { letter:'C', name:'Clad', tag:'Intelligence for law firms', color: '#4a7fc1', href:'#clad' },
    { letter:'D', name:'Dev', tag:'Technical services · human led', color: '#b8502a', href:'Dev.html' },
  ];
  return (
    <div style={{
      border:`1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(11,18,32,0.12)'}`,
      padding: large ? '28px 28px' : '22px 24px',
      background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(11,18,32,0.015)',
    }}>
      <div className="h-eyebrow" style={{color: muted, marginBottom:18}}>Our Products</div>
      {rows.map((r, i) => (
        <a href={r.href} key={r.name} style={{
          display:'grid', gridTemplateColumns:'36px 1fr auto', gap:16, alignItems:'baseline',
          padding:'16px 0',
          borderTop: i === 0 ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(11,18,32,0.08)'}`,
        }}>
          <span className="h-display" style={{fontSize: large ? 40 : 32, color: r.color}}>{r.letter}</span>
          <div>
            <div className="h-serif" style={{fontSize: large ? 28 : 22, color: ink}}>{r.name}</div>
            <div style={{fontSize:12, color: muted, marginTop:2}}>{r.tag}</div>
          </div>
          <span style={{color: muted, fontSize:14}}>↘</span>
        </a>
      ))}
    </div>
  );
}

window.Hero = Hero;
