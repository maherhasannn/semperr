// Top navigation — quiet, editorial, with sticky header and backdrop blur.

function Masthead({ theme }) {
  const isDark = theme === 'dark';
  const [open, setOpen] = React.useState(false);
  const panelBg = isDark ? '#0b1220' : '#f8f6f0';
  const line = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(11,18,32,0.08)';
  return (
    <header style={{
      position:'sticky', top:0, zIndex:50,
      background: isDark ? 'rgba(11,18,32,0.78)' : 'rgba(248,246,240,0.78)',
      backdropFilter:'blur(14px) saturate(140%)',
      WebkitBackdropFilter:'blur(14px) saturate(140%)',
      borderBottom: `1px solid ${line}`,
    }}>
      <div className="container" style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        height:64,
      }}>
        <div style={{display:'flex', alignItems:'center', gap:40}}>
          <Wordmark size={24} tone={isDark ? 'paper' : 'ink'} />
          <nav className="mast-nav" style={{display:'flex', gap:28, fontSize:13, color: isDark ? '#9099ad' : '#6b7388'}}>
            <a href="charter.html">Charter</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#company">Company</a>
            <a href="#careers">Careers</a>
          </nav>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:20}}>
          <span className="h-eyebrow mast-eyebrow" style={{color: isDark ? '#c9a961' : '#a68846'}}>
            Est. MMXXI · NYC
          </span>
          <button className="mast-burger" onClick={() => setOpen(o => !o)} aria-label="Menu" style={{
            display:'none', alignItems:'center', justifyContent:'center',
            width:40, height:40,
            border:`1px solid ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(11,18,32,0.2)'}`,
            borderRadius:8, color: isDark ? '#f8f6f0' : '#0b1220',
          }}>
            <span style={{display:'grid', gap:4}}>
              <span style={{width:16, height:1.5, background:'currentColor', display:'block'}}/>
              <span style={{width:16, height:1.5, background:'currentColor', display:'block'}}/>
              <span style={{width:16, height:1.5, background:'currentColor', display:'block'}}/>
            </span>
          </button>
          <a href="contact.html" style={{
            fontSize:13,
            padding:'8px 16px',
            border:`1px solid ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(11,18,32,0.2)'}`,
            borderRadius:999,
            color: isDark ? '#f8f6f0' : '#0b1220',
          }}>Get in touch →</a>
        </div>
      </div>
      {open && (
        <div className="mast-panel m-only" style={{
          background: panelBg, borderTop:`1px solid ${line}`, padding:'16px 20px 24px',
        }}>
          <nav style={{display:'grid', gap:14, fontSize:16, color: isDark ? '#c7cdd9' : '#2a3246', fontFamily:'var(--serif)'}}>
            <a onClick={() => setOpen(false)} href="charter.html">Charter</a>
            <a onClick={() => setOpen(false)} href="#capabilities">Capabilities</a>
            <a onClick={() => setOpen(false)} href="#company">Company</a>
            <a onClick={() => setOpen(false)} href="#careers">Careers</a>
            <a onClick={() => setOpen(false)} href="contact.html" style={{color:'var(--gold)', marginTop:4}}>Get in touch →</a>
          </nav>
        </div>
      )}
    </header>
  );
}

window.Masthead = Masthead;
