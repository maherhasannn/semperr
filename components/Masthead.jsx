// Top navigation — quiet, editorial, with a ticker hinting at the parent company's scope.

function Masthead({ theme }) {
  const isDark = theme === 'dark';
  return (
    <header style={{
      position:'sticky', top:0, zIndex:50,
      background: isDark ? 'rgba(11,18,32,0.78)' : 'rgba(248,246,240,0.78)',
      backdropFilter:'blur(14px) saturate(140%)',
      WebkitBackdropFilter:'blur(14px) saturate(140%)',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(11,18,32,0.08)'}`,
    }}>
      <div className="container" style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        height:64,
      }}>
        <div style={{display:'flex', alignItems:'center', gap:40}}>
          <Wordmark size={24} tone={isDark ? 'paper' : 'ink'} />
          <nav style={{display:'flex', gap:28, fontSize:13, color: isDark ? '#9099ad' : '#6b7388'}}>
            <a>Products</a>
            <a>Company</a>
            <a>Clients</a>
            <a>Careers</a>
          </nav>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:20}}>
          <span className="h-eyebrow" style={{color: isDark ? '#c9a961' : '#a68846'}}>
            Est. MMXXI · NYC
          </span>
          <button style={{
            fontSize:13,
            padding:'8px 16px',
            border:`1px solid ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(11,18,32,0.2)'}`,
            borderRadius:999,
            color: isDark ? '#f8f6f0' : '#0b1220',
          }}>Get in touch →</button>
        </div>
      </div>
    </header>
  );
}

window.Masthead = Masthead;
