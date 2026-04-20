// Footer — editorial, calm. A final statement + the three products listed once more.

function Outro({ theme }) {
  const isDark = theme === 'dark';
  return (
    <footer style={{
      background: isDark ? '#05090f' : '#0b1220',
      color:'#f8f6f0', padding:'100px 0 48px', position:'relative', overflow:'hidden',
    }}>
      <div className="grain" />
      <div className="container">
        <div style={{
          display:'grid', gridTemplateColumns:'1.2fr 0.8fr', gap:64, alignItems:'end',
          paddingBottom:80, borderBottom:'1px solid rgba(255,255,255,0.1)',
        }}>
          <h2 className="h-display" style={{
            fontSize:'clamp(48px, 6vw, 96px)', color:'#f8f6f0',
          }}>
            Build things<br/>
            that <em style={{fontStyle:'italic', color:'#c9a961'}}>work</em>,<br/>
            for people who <em style={{fontStyle:'italic', color:'#c9a961'}}>notice.</em>
          </h2>
          <div>
            <p style={{fontSize:16, lineHeight:1.55, color:'#9099ad', maxWidth:380, marginBottom:28}}>
              Semperr is hiring engineers, analysts, and designers who hold the line on quality. 
              We don't ship average work.
            </p>
            <a style={{
              display:'inline-flex', alignItems:'center', gap:10,
              padding:'14px 22px', borderRadius:999,
              background:'#f8f6f0', color:'#0b1220', fontSize:14, fontWeight:500,
            }}>See open roles ↗</a>
          </div>
        </div>

        <div style={{
          display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr 1fr',
          gap:48, padding:'48px 0',
        }}>
          <div>
            <Wordmark size={32} tone="paper" />
            <p style={{fontSize:13, color:'#6b7388', marginTop:16, maxWidth:280, lineHeight:1.5}}>
              A holding company for software & data that serious businesses run on. Headquartered in NYC, with teams in Cork, Austin, and Toronto.
            </p>
          </div>
          <FootCol title="Products" rows={[
            ['Trace', 'Data for PE',       'Trace.html'],
            ['Clad',  'Intelligence for law', '#clad'],
            ['Dev',   'Technical services', 'Dev.html'],
          ]}/>
          <FootCol title="Company" rows={[
            ['About'], ['Careers'], ['Press'], ['Contact'],
          ]}/>
          <FootCol title="Legal" rows={[
            ['Terms'], ['Privacy'], ['Security'], ['Responsible AI'],
          ]}/>
        </div>

        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'center',
          paddingTop:28, borderTop:'1px solid rgba(255,255,255,0.1)',
          fontFamily:'JetBrains Mono, monospace', fontSize:11,
          color:'#6b7388', letterSpacing:'0.08em', textTransform:'uppercase',
        }}>
          <span>© 2026 Semperr Labs, Inc.</span>
          <span>Made in NYC · Cork · Austin</span>
          <span style={{color:'#c9a961'}}>◆ Semper paratus</span>
        </div>
      </div>
    </footer>
  );
}

function FootCol({ title, rows }) {
  return (
    <div>
      <div className="h-eyebrow" style={{color:'#c9a961', marginBottom:18}}>{title}</div>
      {rows.map((r, i) => (
        <a key={i} href={r[2]} style={{
          display:'grid', gridTemplateColumns: r[1] ? '60px 1fr' : '1fr',
          gap:12, alignItems:'baseline',
          padding:'8px 0',
          fontSize:14, color:'#d4dbe8',
        }}>
          <span>{r[0]}</span>
          {r[1] && <span style={{fontSize:11, color:'#6b7388', fontFamily:'JetBrains Mono, monospace'}}>{r[1]}</span>}
        </a>
      ))}
    </div>
  );
}

window.Outro = Outro;
