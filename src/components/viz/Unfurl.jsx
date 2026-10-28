import { motion, useReducedMotion } from 'framer-motion';

/** A fiddlehead that opens as the session moves forward. Each node is a step button. */
export default function Unfurl({ steps, current, onGo }) {
  const still = useReducedMotion();
  const W = 720;
  const H = 150;
  // a gentle curve that ends in a spiral on the left (the future)
  const N = 6;
  const nodes = Array.from({ length: N }, (_, i) => {
    const t = i / (N - 1);
    return { x: W - 60 - t * (W - 200), y: 92 - Math.sin(t * Math.PI) * 34 };
  });
  const spiral = (() => {
    const cx = 92;
    const cy = 70;
    const pts = [];
    for (let k = 0; k <= 60; k++) {
      const a = (k / 60) * Math.PI * 2.4;
      const r = 34 - k * 0.48;
      pts.push(`${(cx + Math.cos(a + Math.PI * 0.05) * r).toFixed(1)} ${(cy + Math.sin(a + Math.PI * 0.05) * r).toFixed(1)}`);
    }
    return `M${nodes[N - 1].x} ${nodes[N - 1].y} Q 130 104 ${pts[0]} L ${pts.slice(1).join(' L ')}`;
  })();
  const path = `M${nodes.map((n) => `${n.x} ${n.y}`).join(' L ')}`;
  const progress = current / (N - 1);

  return (
    <nav className="viz unfurl" aria-label="שלבי הסשן">
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <path d={path} fill="none" stroke="var(--line)" strokeWidth="3" strokeLinecap="round" />
        <motion.path d={path} fill="none" stroke="var(--stem)" strokeWidth="3.5" strokeLinecap="round"
          animate={{ pathLength: Math.max(progress, 0.001) }} transition={{ duration: still ? 0 : 1.4, ease: [0.22, 0.61, 0.36, 1] }} />
        <motion.path d={spiral} fill="none" stroke="var(--stem)" strokeWidth="3" strokeLinecap="round"
          animate={{ pathLength: 1 - progress * 0.85, opacity: 1 - progress * 0.6 }} transition={{ duration: still ? 0 : 1.8, ease: 'easeInOut' }} />
      </svg>
      <ol>
        {steps.map((st, i) => (
          <li key={st.key} style={{ left: `${(nodes[i].x / W) * 100}%`, top: `${(nodes[i].y / H) * 100}%` }}>
            <button className={`uf-node ${i === current ? 'is-current' : ''} ${i < current ? 'is-past' : ''}`} onClick={() => onGo(i)} aria-current={i === current ? 'step' : undefined} aria-label={`${i + 1}, ${st.title}`}>
              <span className="uf-dot" />
              <span className="uf-t">{st.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
