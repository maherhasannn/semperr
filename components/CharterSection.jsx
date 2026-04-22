// CharterSection — five operating values in editorial format.

function CharterSection({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const bg = isDark ? 'var(--ink-soft)' : 'var(--paper-warm)';
  const ink = isDark ? '#f8f6f0' : '#0b1220';
  const muted = isDark ? '#9099ad' : '#6b7388';
  const gold = 'var(--gold)';
  const lineColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(11,18,32,0.1)';

  const ref = React.useRef(null);
  const inView = useInView(ref);

  const values = [
    { num: 'I', name: 'Rigor', desc: 'Every figure traceable. Every source dated. Every derivation recoverable.' },
    { num: 'II', name: 'Discretion', desc: 'Client data is treated as testimony\u2009—\u2009never shared, never inferred, never sold.' },
    { num: 'III', name: 'Durability', desc: "We build for the decade, not the quarter. If it can\u2019t survive a regime change, it doesn\u2019t ship." },
    { num: 'IV', name: 'Clarity', desc: 'Plain language, honest timelines, no jargon designed to obscure.' },
    { num: 'V', name: 'Accountability', desc: 'A name on every deliverable. A partner on every engagement.' },
  ];

  return (
    <section id="charter" ref={ref} style={{
      background: bg, padding: '120px 0 140px', position:'relative', overflow:'hidden',
    }}>
      <div className="grain" />
      <div className="container">
        <div className="h-eyebrow" style={{
          color: gold, marginBottom:24,
          opacity: inView ? 1 : 0,
          transition: 'opacity 0.6s ease 0.1s',
        }}>
          I. &nbsp; The Charter
        </div>

        <h2 className="h-display" style={{
          fontSize:'clamp(42px, 5.5vw, 80px)', color: ink, marginBottom:20,
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(18px)',
          transition: 'opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s',
        }}>
          Five principles. No exceptions.
        </h2>

        <p style={{
          maxWidth:620, fontSize:18, lineHeight:1.55, color: muted, marginBottom:56,
          opacity: inView ? 1 : 0,
          transition: 'opacity 0.6s ease 0.25s',
        }}>
          Every engagement, every hire, every line of code is measured against the same standard.
        </p>

        <RevealLine delay={0.3} color={lineColor} />

        <div style={{position:'relative'}}>
          <div style={{
            position:'absolute', top:0, left:0, right:0, height:1,
            background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
            opacity: inView ? 0.6 : 0,
            animation: inView ? 'scanLine 2.5s ease-in-out 0.5s forwards' : 'none',
            pointerEvents: 'none',
            zIndex: 2,
          }} />

          {values.map((v, i) => (
            <div key={v.num} style={{
              display:'grid', gridTemplateColumns:'48px 160px 1fr', gap:24, alignItems:'baseline',
              padding:'28px 0',
              borderBottom: `1px solid ${lineColor}`,
              opacity: inView ? 1 : 0,
              transform: inView ? 'translateY(0)' : 'translateY(14px)',
              transition: `opacity 0.5s ease ${0.35 + i * 0.12}s, transform 0.5s ease ${0.35 + i * 0.12}s`,
            }}>
              <span className="charter-value-numeral h-eyebrow" style={{color: gold, fontSize:12}}>{v.num}</span>
              <span className="h-serif" style={{fontSize:24, color: ink}}>{v.name}</span>
              <span style={{fontSize:16, lineHeight:1.55, color: muted}}>{v.desc}</span>
            </div>
          ))}
        </div>

        <div style={{
          marginTop:48,
          opacity: inView ? 1 : 0,
          transition: 'opacity 0.6s ease 1s',
        }}>
          <a href="charter.html" style={{
            display:'inline-flex', alignItems:'center', gap:10,
            padding:'14px 22px', borderRadius:999,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(11,18,32,0.2)'}`,
            color: ink, fontSize:14, fontWeight:500,
          }}>Read the full charter <span style={{opacity:0.5}}>→</span></a>
        </div>
      </div>
    </section>
  );
}

window.CharterSection = CharterSection;
