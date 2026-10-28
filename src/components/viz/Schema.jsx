import { motion, useReducedMotion } from 'framer-motion';

const NODES = [
  { id: 'p', x: 560, y: 70, t: 'מטופל', d: 'שם, גיל, פתיחה, השערת אניאגרם' },
  { id: 'g', x: 560, y: 210, t: 'יעדים', d: 'בניסוח של המטופל' },
  { id: 's', x: 330, y: 140, t: 'סשן', d: 'מה הביא, מה קרה, תובנה, סיכום' },
  { id: 'e', x: 330, y: 290, t: 'תרגיל', d: 'לשבוע, ומה נעשה בפועל' },
  { id: 'v', x: 100, y: 200, t: 'מסך המטופל', d: 'מסר אחד ותרגיל אחד' },
];
const EDGES = [
  ['p', 'g', 'מבטא'],
  ['p', 's', 'נפגש'],
  ['s', 'g', 'נוגע ב'],
  ['s', 'e', 'נותן'],
  ['s', 'v', 'הסיכום'],
  ['e', 'v', 'התרגיל'],
];

/** What is kept and where it flows. The patient screen sees only the last two arrows. */
export default function Schema() {
  const still = useReducedMotion();
  const by = Object.fromEntries(NODES.map((n) => [n.id, n]));
  return (
    <svg className="viz schema" viewBox="0 0 680 360" role="img" aria-label="סכמת המידע">
      {EDGES.map(([a, b, label], k) => {
        const A = by[a];
        const B = by[b];
        const mx = (A.x + B.x) / 2;
        const my = (A.y + B.y) / 2 - 18;
        const d = `M${A.x} ${A.y} Q ${mx} ${my} ${B.x} ${B.y}`;
        const toPatient = b === 'v';
        return (
          <g key={k}>
            <motion.path id={`edge-${k}`} d={d} fill="none" stroke={toPatient ? 'var(--rust)' : 'var(--stem)'} strokeOpacity="0.55" strokeWidth={toPatient ? 2.4 : 1.6}
              initial={{ pathLength: still ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, delay: still ? 0 : 0.5 + k * 0.25 }} />
            {!still && (
              <circle r="3.5" fill={toPatient ? 'var(--rust-deep)' : 'var(--stem)'}>
                <animateMotion dur={`${7 + k}s`} begin={`${2 + k * 0.4}s`} repeatCount="indefinite" path={d} />
              </circle>
            )}
            <text x={mx} y={my + 2} textAnchor="middle" className="sc-edge">{label}</text>
          </g>
        );
      })}
      {NODES.map((n, i) => (
        <motion.g key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: still ? 0 : i * 0.15 }}>
          <rect x={n.x - 78} y={n.y - 30} width="156" height="60" rx="18" className={`sc-node ${n.id === 'v' ? 'is-patient' : ''}`} />
          <text x={n.x} y={n.y - 4} textAnchor="middle" className="sc-t">{n.t}</text>
          <text x={n.x} y={n.y + 16} textAnchor="middle" className="sc-d">{n.d}</text>
        </motion.g>
      ))}
    </svg>
  );
}
