// Hero — editorial, confident. Single variant with entrance animation.

function Hero({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const ink = isDark ? '#f8f6f0' : '#0b1220';
  const muted = isDark ? '#9099ad' : '#6b7388';
  const gold = 'var(--gold)';

  const [revealed, setRevealed] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 100);
    return () => clearTimeout(t);
  }, []);

  const prefersReduced = React.useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );
  const show = prefersReduced || revealed;

  const t = (delay) => prefersReduced ? {} : {
    opacity: show ? 1 : 0,
    transform: show ? 'translateY(0)' : 'translateY(18px)',
    transition: `opacity 0.6s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}s, transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}s`,
  };

  return (
    <section style={{
      position:'relative',
      background: isDark ? 'var(--ink)' : 'var(--paper)',
      padding: '80px 0 96px',
      overflow:'hidden',
    }}>
      <div className="grain" />

      <div className="container">
        <div className="h-eyebrow" style={{
          color: gold, marginBottom:32,
          ...t(0.1),
        }}>
          The interface for serious work
        </div>

        <h1 className="h-display" style={{
          fontSize:'clamp(52px, 8vw, 132px)',
          color: ink,
        }}>
          <span style={{display:'block', ...t(0.2)}}>Custom systems,</span>
          <span style={{display:'block', ...t(0.35)}}>data <em style={{
            fontStyle:'italic',
            color: show ? 'var(--gold)' : (isDark ? '#6b7388' : '#9099ad'),
            transition: prefersReduced ? 'none' : 'color 0.6s cubic-bezier(0.25,0.46,0.45,0.94) 0.5s',
          }}>infrastructure,</em></span>
          <span style={{display:'block', ...t(0.5)}}>technical workflows.</span>
        </h1>

        <div style={{marginTop:28, maxWidth:600}}>
          <RevealLine delay={0.6} color={gold} />
        </div>

        <p style={{
          marginTop:32, maxWidth:620, fontSize:19, lineHeight:1.55,
          color: muted,
          ...t(0.8),
        }}>
          Semperr builds and operates the software that private-equity firms, law practices,
          and owner-run businesses depend on when the answer has to be right.
        </p>

        <div style={{
          display:'flex', gap:12, marginTop:40,
          ...t(1.0),
        }}>
          <a href="charter.html" style={{
            display:'inline-flex', alignItems:'center', gap:10,
            padding:'14px 22px', borderRadius:999,
            background: ink, color: isDark ? '#0b1220' : '#f8f6f0',
            fontSize:14, fontWeight:500,
          }}>Read the charter <span style={{opacity:0.5}}>→</span></a>
          <a href="contact.html" style={{
            display:'inline-flex', alignItems:'center', gap:10,
            padding:'14px 22px', borderRadius:999,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(11,18,32,0.2)'}`,
            color: ink, fontSize:14, fontWeight:500,
          }}>Get in touch</a>
        </div>
      </div>
    </section>
  );
}

window.Hero = Hero;
