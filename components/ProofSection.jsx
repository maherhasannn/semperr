// ProofSection — institutional credibility through client categories.

function ProofSection({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const muted = '#9099ad';
  const gold = 'var(--gold)';
  const cardBorder = 'rgba(255,255,255,0.1)';

  const ref = React.useRef(null);
  const inView = useInView(ref);

  const cards = [
    { title: 'Private Equity', desc: 'Mid-market and growth funds pricing acquisitions and portfolio ops.', stat: '40+ funds served' },
    { title: 'Law Firms', desc: 'Litigation, regulatory, and transactional practices needing precedent at speed.', stat: 'AmLaw 200 coverage' },
    { title: 'Owner-Operated Businesses', desc: 'Restaurants, clinics, trades\u2009—\u2009the businesses that open before the first train.', stat: '300+ active accounts' },
    { title: 'Family Offices & Advisors', desc: 'Multi-generational stewards who prize discretion and accuracy equally.', stat: 'Referral-only intake' },
  ];

  return (
    <section id="company" ref={ref} style={{
      background: isDark ? '#080d18' : 'var(--ink)', color:'#f8f6f0',
      padding:'120px 0 140px', position:'relative', overflow:'hidden',
    }}>
      <div className="grain" />
      <div className="container">
        <div className="h-eyebrow" style={{
          color: gold, marginBottom:24,
          opacity: inView ? 1 : 0,
          transition: 'opacity 0.6s ease 0.1s',
        }}>
          II. &nbsp; Who we serve
        </div>

        <h2 className="h-display" style={{
          fontSize:'clamp(42px, 5.5vw, 80px)', color:'#f8f6f0', marginBottom:20,
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(18px)',
          transition: 'opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s',
        }}>
          Built for institutions that<br/>cannot afford to guess.
        </h2>

        <p style={{
          maxWidth:660, fontSize:18, lineHeight:1.55, color: muted, marginBottom:64,
          opacity: inView ? 1 : 0,
          transition: 'opacity 0.6s ease 0.25s',
        }}>
          Our clients don't evaluate software — they evaluate risk. We serve the organizations
          where a wrong number has real consequences.
        </p>

        <div style={{
          display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:20,
        }}>
          {cards.map((c, i) => (
            <div key={c.title} style={{
              border: `1px solid ${cardBorder}`,
              padding:'32px 24px',
              display:'flex', flexDirection:'column', justifyContent:'space-between',
              minHeight:260,
              opacity: inView ? 1 : 0,
              transform: inView ? 'translateY(0)' : 'translateY(24px)',
              transition: `opacity 0.6s ease ${0.3 + i * 0.15}s, transform 0.6s ease ${0.3 + i * 0.15}s`,
            }}>
              <div>
                <h3 className="h-serif" style={{fontSize:22, color:'#f8f6f0', marginBottom:14}}>{c.title}</h3>
                <p style={{fontSize:14, lineHeight:1.55, color:'#9099ad'}}>{c.desc}</p>
              </div>
              <div style={{
                marginTop:24,
                fontFamily:'var(--mono)', fontSize:12, letterSpacing:'0.06em',
                color: 'var(--gold)',
                overflow:'hidden',
              }}>
                <span style={{
                  display:'inline-block',
                  transform: inView ? 'translateX(0)' : 'translateX(-100%)',
                  transition: `transform 0.6s ease ${0.6 + i * 0.15}s`,
                }}>
                  {c.stat}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

window.ProofSection = ProofSection;
