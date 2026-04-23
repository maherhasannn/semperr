// Footer — ledger-style editorial footer with navigation columns.

function Footer({ theme }) {
  const isDark = theme === 'dark';
  const bg = isDark ? '#05090f' : '#0b1220';
  const lineColor = 'rgba(255,255,255,0.1)';
  const muted = '#6b7388';
  const gold = 'var(--gold)';

  const ref = React.useRef(null);
  const inView = useInView(ref);

  return (
    <footer ref={ref} style={{
      background: bg, color:'#f8f6f0',
      padding:'80px 0 48px', position:'relative', overflow:'hidden',
      opacity: inView ? 1 : 0,
      transition: 'opacity 0.6s ease 0.1s',
    }}>
      <div className="grain" />
      <div className="container">
        <div className="footer-band" style={{
          display:'flex', justifyContent:'space-between', alignItems:'center',
          paddingBottom:48,
          borderBottom: `1px solid ${lineColor}`,
          lineHeight:1,
        }}>
          <Wordmark size={28} tone="paper" />
          <div className="m-hide" style={{display:'flex', alignItems:'center', gap:24}}>
            <span className="h-eyebrow" style={{color: gold, letterSpacing:'0.16em'}}>Semper paratus</span>
            <span style={{color: lineColor}}>·</span>
            <span className="h-eyebrow" style={{color: muted}}>San Francisco</span>
          </div>
        </div>

        <RevealLine delay={0.2} color={lineColor} style={{marginTop:-1}} />

        <div className="footer-grid" style={{
          display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 1fr',
          gap:48, padding:'48px 0', alignItems:'start',
        }}>
          <div>
            <p style={{fontSize:13, color: muted, maxWidth:280, lineHeight:1.5}}>
              A holding company for software & data that serious businesses run on.
              Headquartered in San Francisco.
            </p>
          </div>
          <FootCol title="Navigate" rows={[
            ['Charter', '', 'charter.html'],
            ['Capabilities', '', 'capabilities.html'],
            ['Contact', '', 'contact.html'],
          ]}/>
          <FootCol title="Company" rows={[
            ['About', '', 'about.html'], ['Careers', '', 'careers.html'], ['Press', '', 'press.html'],
          ]}/>
          <FootCol title="Legal" rows={[
            ['Terms'], ['Privacy'], ['Security'],
          ]}/>
        </div>

        <div className="footer-band-bottom" style={{
          display:'flex', justifyContent:'center', alignItems:'center',
          paddingTop:28, borderTop: `1px solid ${lineColor}`,
          fontFamily:'var(--mono)', fontSize:11, lineHeight:1,
          color: muted, letterSpacing:'0.08em', textTransform:'uppercase',
        }}>
          <span>© 2026 Semperr Labs, Inc.</span>
        </div>
      </div>
    </footer>
  );
}

function FootCol({ title, rows }) {
  return (
    <div>
      <div className="h-eyebrow" style={{color:'var(--gold)', marginBottom:18}}>{title}</div>
      {rows.map((r, i) => (
        <a key={i} href={r[2]} style={{
          display:'block',
          padding:'8px 0',
          fontSize:14, color:'#d4dbe8',
        }}>
          {r[0]}
        </a>
      ))}
    </div>
  );
}

// Keep backward compat: export as both Outro and Footer
window.Outro = Footer;
window.Footer = Footer;
