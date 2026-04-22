// CapabilitySection — broad categories of work.

function CapabilitySection({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const bg = isDark ? 'var(--ink)' : 'var(--paper-warm)';
  const ink = isDark ? '#f8f6f0' : '#0b1220';
  const muted = isDark ? '#9099ad' : '#6b7388';
  const gold = 'var(--gold)';
  const lineColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(11,18,32,0.1)';
  const chipBorder = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(11,18,32,0.12)';
  const chipBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(11,18,32,0.02)';

  const ref = React.useRef(null);
  const inView = useInView(ref);

  const capabilities = [
    {
      name: 'Custom Systems',
      desc: 'Dealbook platforms, case-management tools, client portals\u2009—\u2009software shaped to the institution.',
      tags: ['Data platforms', 'Internal tools', 'Client portals', 'Reporting engines'],
    },
    {
      name: 'Data Infrastructure',
      desc: 'Ingestion, reconciliation, graph construction, and delivery\u2009—\u2009the plumbing underneath every decision.',
      tags: ['ETL pipelines', 'Entity resolution', 'Graph databases', 'API layers'],
    },
    {
      name: 'Technical Workflows',
      desc: 'Websites, automations, AI-assisted operations, and back-office systems.',
      tags: ['Websites', 'Automations', 'AI receptionists', 'CRM', 'Phone systems'],
    },
  ];

  return (
    <section id="capabilities" ref={ref} style={{
      background: bg, padding:'120px 0 140px', position:'relative', overflow:'hidden',
    }}>
      <div className="grain" />
      <div className="container">
        <div className="h-eyebrow" style={{
          color: gold, marginBottom:24,
          opacity: inView ? 1 : 0,
          transition: 'opacity 0.6s ease 0.1s',
        }}>
          III. &nbsp; What we build
        </div>

        <h2 className="h-display" style={{
          fontSize:'clamp(42px, 5.5vw, 80px)', color: ink, marginBottom:20,
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(18px)',
          transition: 'opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s',
        }}>
          Custom systems. Data infrastructure.<br/>Technical workflows.
        </h2>

        <p style={{
          maxWidth:680, fontSize:18, lineHeight:1.55, color: muted, marginBottom:56,
          opacity: inView ? 1 : 0,
          transition: 'opacity 0.6s ease 0.25s',
        }}>
          We don't sell licenses. We design, build, and operate the technical infrastructure
          our clients depend on — then stay to make sure it works.
        </p>

        <RevealLine delay={0.3} color={lineColor} />

        {capabilities.map((cap, i) => (
          <div key={cap.name}>
            <div style={{
              display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'start',
              padding:'40px 0',
              opacity: inView ? 1 : 0,
              transform: inView ? 'translateY(0)' : 'translateY(16px)',
              transition: `opacity 0.6s ease ${0.35 + i * 0.15}s, transform 0.6s ease ${0.35 + i * 0.15}s`,
            }}>
              <div>
                <h3 className="h-serif" style={{fontSize:28, color: ink, marginBottom:12}}>{cap.name}</h3>
                <p style={{fontSize:16, lineHeight:1.55, color: muted}}>{cap.desc}</p>
              </div>
              <div style={{display:'flex', flexWrap:'wrap', gap:8, paddingTop:6}}>
                {cap.tags.map((tag, j) => (
                  <span key={tag} style={{
                    padding:'8px 14px',
                    fontSize:12,
                    fontFamily:'var(--mono)',
                    letterSpacing:'0.04em',
                    border: `1px solid ${chipBorder}`,
                    background: chipBg,
                    color: ink,
                    opacity: inView ? 1 : 0,
                    transform: inView ? 'translateX(0)' : 'translateX(12px)',
                    transition: `opacity 0.4s ease ${0.5 + i * 0.15 + j * 0.06}s, transform 0.4s ease ${0.5 + i * 0.15 + j * 0.06}s`,
                  }}>{tag}</span>
                ))}
              </div>
            </div>
            {i < capabilities.length - 1 && (
              <div style={{height:1, background: lineColor}} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

window.CapabilitySection = CapabilitySection;
