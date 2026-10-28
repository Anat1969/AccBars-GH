import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';

const C = 180;
const R = 130;

/** The session as a cycle: a drop travels slowly around it, each station opens on demand. */
export default function Cycle({ stations }) {
  const still = useReducedMotion();
  const [open, setOpen] = useState(0);
  const at = (i, r = R) => {
    const a = (i / stations.length) * Math.PI * 2 - Math.PI / 2;
    return [C + Math.cos(a) * r, C + Math.sin(a) * r];
  };
  const ring = `M ${C} ${C - R} A ${R} ${R} 0 1 1 ${C - 0.01} ${C - R}`;
  return (
    <div className="cycle">
      <svg viewBox="0 0 360 360" className="viz" role="img" aria-label="מחזור הסשן">
        <defs>
          <radialGradient id="cy-drop" cx="35%" cy="30%" r="70%">
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.6" stopColor="#fdf6ec" />
            <stop offset="1" stopColor="#d4b597" />
          </radialGradient>
        </defs>
        <motion.path d={ring} fill="none" stroke="var(--stem)" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="2 7"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.4 }} />
        {!still && (
          <circle r="7" fill="url(#cy-drop)" stroke="var(--rust)" strokeOpacity="0.5">
            <animateMotion dur="36s" repeatCount="indefinite" path={ring} />
          </circle>
        )}
        {stations.map((s, i) => {
          const [x, y] = at(i);
          const [lx, ly] = at(i, R - 40);
          const on = i === open;
          return (
            <g key={s.title} className="cy-station" tabIndex={0} role="button" aria-pressed={on} aria-label={s.title}
              onClick={() => setOpen(i)} onMouseEnter={() => setOpen(i)} onFocus={() => setOpen(i)} onKeyDown={(e) => e.key === 'Enter' && setOpen(i)}>
              <motion.circle cx={x} cy={y} animate={{ r: on ? 17 : 12 }} transition={{ duration: 0.8 }} fill={on ? 'url(#cy-drop)' : '#fffaf2'} stroke={on ? 'var(--rust-deep)' : 'var(--stem)'} strokeWidth="1.6" />
              <text x={x} y={y + 4} textAnchor="middle" className="en-n">{i + 1}</text>
              <text x={lx} y={ly + 4} textAnchor="middle" className={`cy-t ${on ? 'is-on' : ''}`}>{s.title}</text>
            </g>
          );
        })}
      </svg>
      <AnimatePresence mode="wait">
        <motion.div key={open} className="cycle-card card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.7 }}>
          <span className="label">שלב {open + 1}</span>
          <h3 className="h-section">{stations[open].title}</h3>
          <p>{stations[open].what}</p>
          <p className="quiet small">{stations[open].why}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
