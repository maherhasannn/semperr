// Semperr wordmark — editorial serif with a small "double-r" detail.
// The double-R ligature is the brand mark: one R in gold.

function Wordmark({ size = 28, tone = "ink", asMark = false }) {
  const color = tone === "ink" ? "#0b1220" : "#f8f6f0";
  const gold = "#c9a961";

  if (asMark) {
    // Just the "rr" mark for small spaces
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" style={{display:'block'}}>
        <text x="24" y="36" textAnchor="middle"
          fontFamily="Instrument Serif, serif" fontSize="42" fill={color} letterSpacing="-2">
          r<tspan fill={gold}>r</tspan>
        </text>
      </svg>
    );
  }

  return (
    <span style={{
      fontFamily:'Instrument Serif, serif',
      fontSize:size,
      color,
      letterSpacing:'-0.02em',
      fontWeight:400,
      lineHeight:1,
      whiteSpace:'nowrap',
      display:'inline-block',
    }}>
      Sempe<span style={{color: gold}}>rr</span>
    </span>
  );
}

window.Wordmark = Wordmark;
