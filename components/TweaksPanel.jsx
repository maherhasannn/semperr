// Tweaks panel — floating bottom-right. Exposes the Edit Mode-driven knobs.

function TweaksPanel({ state, setState, visible }) {
  if (!visible) return null;

  const set = (k, v) => {
    setState(s => ({...s, [k]: v}));
    window.parent.postMessage({type:'__edit_mode_set_keys', edits:{[k]: v}}, '*');
  };

  const Row = ({label, children}) => (
    <div style={{
      display:'grid', gridTemplateColumns:'86px 1fr', gap:12, alignItems:'center',
      padding:'10px 0', borderBottom:'1px solid rgba(11,18,32,0.06)',
    }}>
      <div style={{
        fontFamily:'JetBrains Mono, monospace', fontSize:10,
        letterSpacing:'0.08em', textTransform:'uppercase', color:'#6b7388',
      }}>{label}</div>
      <div>{children}</div>
    </div>
  );

  const Seg = ({value, onChange, opts}) => (
    <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
      {opts.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)} style={{
          padding:'6px 10px', fontSize:11,
          border: `1px solid ${value === o.v ? '#0b1220' : 'rgba(11,18,32,0.15)'}`,
          background: value === o.v ? '#0b1220' : '#fff',
          color: value === o.v ? '#f8f6f0' : '#0b1220',
          cursor:'pointer', borderRadius:2,
          fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.04em',
        }}>{o.l}</button>
      ))}
    </div>
  );

  return (
    <div style={{
      position:'fixed', bottom:20, right:20, zIndex:100,
      width:320,
      background:'#f8f6f0',
      border:'1px solid rgba(11,18,32,0.15)',
      boxShadow:'0 30px 60px -20px rgba(0,0,0,0.3)',
      borderRadius:4,
      overflow:'hidden',
      fontFamily:'Inter Tight, sans-serif',
    }}>
      <div style={{
        padding:'14px 16px',
        borderBottom:'1px solid rgba(11,18,32,0.1)',
        background:'#0b1220', color:'#f8f6f0',
        display:'flex', justifyContent:'space-between', alignItems:'center',
      }}>
        <span style={{fontFamily:'Instrument Serif, serif', fontSize:20}}>Tweaks</span>
        <span style={{fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'#c9a961', letterSpacing:'0.1em'}}>SEMPERR</span>
      </div>
      <div style={{padding:'8px 16px 16px'}}>
        <Row label="Theme">
          <Seg value={state.theme} onChange={v => set('theme', v)}
            opts={[{v:'light', l:'Paper'}, {v:'dark', l:'Ink'}]}/>
        </Row>
        <Row label="Hero">
          <Seg value={state.heroVariant} onChange={v => set('heroVariant', v)}
            opts={[{v:'editorial', l:'Editorial'}, {v:'centered', l:'Centered'}, {v:'split', l:'Split'}]}/>
        </Row>
        <Row label="Accent">
          <Seg value={state.accent} onChange={v => set('accent', v)}
            opts={[{v:'gold', l:'Gold'}, {v:'rust', l:'Rust'}, {v:'steel', l:'Steel'}]}/>
        </Row>
        <Row label="Type">
          <Seg value={state.type} onChange={v => set('type', v)}
            opts={[{v:'instrument', l:'Instrument'}, {v:'dmserif', l:'DM Serif'}, {v:'fraunces', l:'Fraunces'}]}/>
        </Row>
        <Row label="Dev flash">
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <input type="range" min="0" max="10" value={state.flashLevel}
              onChange={e => set('flashLevel', +e.target.value)}
              style={{flex:1, accentColor:'#b8502a'}}/>
            <span style={{fontFamily:'JetBrains Mono, monospace', fontSize:11, color:'#0b1220', width:20, textAlign:'right'}}>{state.flashLevel}</span>
          </div>
        </Row>
      </div>
    </div>
  );
}

window.TweaksPanel = TweaksPanel;
