// HiringSection — selective recruiting message with kinetic type.

function HiringSection({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const ink = '#f8f6f0';
  const muted = '#9099ad';
  const gold = 'var(--gold)';

  const ref = React.useRef(null);
  const inView = useInView(ref);

  const words = ['quality', 'judgment', 'standards', 'rigor', 'craft'];
  const [wordIndex, setWordIndex] = React.useState(0);
  const [visible, setVisible] = React.useState(true);

  const prefersReduced = React.useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  React.useEffect(() => {
    if (prefersReduced || !inView) return;
    const cycle = () => {
      setVisible(false);
      setTimeout(() => {
        setWordIndex(i => (i + 1) % words.length);
        setVisible(true);
      }, 300);
    };
    const id = setInterval(cycle, 1900);
    return () => clearInterval(id);
  }, [inView, prefersReduced]);

  return (
    <section id="careers" ref={ref} style={{
      background: isDark ? '#080d18' : 'var(--ink)', color:'#f8f6f0',
      padding:'120px 0 140px', position:'relative', overflow:'hidden',
    }}>
      <div className="grain" />
      <div className="container">
        <div style={{
          display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center',
        }}>
          <div>
            <div className="h-eyebrow" style={{
              color: gold, marginBottom:24,
              opacity: inView ? 1 : 0,
              transition: 'opacity 0.6s ease 0.1s',
            }}>
              IV. &nbsp; The team
            </div>

            <h2 className="h-display" style={{
              fontSize:'clamp(42px, 5.5vw, 80px)', color: ink, marginBottom:24,
              opacity: inView ? 1 : 0,
              transform: inView ? 'translateY(0)' : 'translateY(18px)',
              transition: 'opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s',
            }}>
              We hire for<br/><em style={{fontStyle:'italic', color: gold}}>judgment.</em>
            </h2>

            <p style={{
              maxWidth:480, fontSize:18, lineHeight:1.55, color: muted, marginBottom:40,
              opacity: inView ? 1 : 0,
              transition: 'opacity 0.6s ease 0.3s',
            }}>
              Semperr is deliberately small. Every engineer, analyst, and designer is here
              because they refused to ship something they weren't proud of.
            </p>

            <div style={{
              opacity: inView ? 1 : 0,
              transition: 'opacity 0.6s ease 0.5s',
            }}>
              <a style={{
                display:'inline-flex', alignItems:'center', gap:10,
                padding:'14px 22px', borderRadius:999,
                background:'#f8f6f0', color:'#0b1220', fontSize:14, fontWeight:500,
              }}>See open roles <span style={{opacity:0.5}}>↗</span></a>
            </div>
          </div>

          <div className="hiring-kinetic" style={{
            display:'flex', alignItems:'center', justifyContent:'center',
            minHeight:280,
          }}>
            {prefersReduced ? (
              <div style={{display:'flex', flexDirection:'column', gap:12, textAlign:'center'}}>
                {words.map(w => (
                  <span key={w} className="h-display" style={{
                    fontSize:'clamp(36px, 5vw, 72px)',
                    color: gold,
                    fontStyle:'italic',
                  }}>{w}</span>
                ))}
              </div>
            ) : (
              <span className="h-display" style={{
                fontSize:'clamp(48px, 6vw, 96px)',
                color: gold,
                fontStyle:'italic',
                opacity: visible && inView ? 1 : 0,
                transform: visible && inView ? 'translateY(0)' : 'translateY(12px)',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
              }}>
                {words[wordIndex]}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

window.HiringSection = HiringSection;
