import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { fmtDate } from '../../lib/format';

/** Goals on the right, sessions on the left, a soft thread wherever a session touched a goal. */
export default function GoalMap({ goals, sessions }) {
  const still = useReducedMotion();
  const [hover, setHover] = useState(null); // { kind, id }
  const done = sessions.filter((s) => s.status === 'done' || s.goal_ids?.length).slice(0, 10);
  const links = done.flatMap((s) => (s.goal_ids ?? []).filter((g) => goals.some((x) => x.id === g)).map((g) => ({ s: s.id, g })));
  if (!goals.length) return null;

  const rowH = 46;
  const H = Math.max(goals.length, done.length, 2) * rowH + 30;
  const W = 640;
  const gx = W - 250;
  const sx = 150;
  const gy = (i) => 30 + i * rowH + ((Math.max(done.length, goals.length) - goals.length) * rowH) / 2;
  const sy = (i) => 30 + i * rowH + ((Math.max(done.length, goals.length) - done.length) * rowH) / 2;
  const lit = (l) => !hover || (hover.kind === 'g' ? l.g === hover.id : l.s === hover.id);
  const touched = (g) => links.filter((l) => l.g === g.id).length;

  return (
    <figure className="viz goal-map">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="מפת יעדים וסשנים">
        {links.map((l, k) => {
          const gi = goals.findIndex((x) => x.id === l.g);
          const si = done.findIndex((x) => x.id === l.s);
          const [x1, y1, x2, y2] = [gx - 10, gy(gi), sx + 10, sy(si)];
          const mid = (x1 + x2) / 2;
          return (
            <motion.path key={`${l.s}-${l.g}`} d={`M${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`} fill="none"
              stroke={lit(l) ? 'var(--rust)' : 'var(--stem)'} strokeOpacity={lit(l) ? 0.6 : 0.12} strokeWidth={lit(l) && hover ? 2.6 : 1.6}
              initial={{ pathLength: still ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.8, delay: still ? 0 : 0.4 + k * 0.08, ease: 'easeInOut' }} />
          );
        })}
        {goals.map((g, i) => (
          <g key={g.id} className="gm-node" onMouseEnter={() => setHover({ kind: 'g', id: g.id })} onMouseLeave={() => setHover(null)}>
            <circle cx={gx} cy={gy(i)} r={6 + Math.min(touched(g), 6)} fill="#fffaf2" stroke="var(--rust-deep)" strokeWidth="1.6" />
            <foreignObject x={gx + 18} y={gy(i) - 20} width={W - gx - 22} height="40">
              <div className="gm-label">{g.text}</div>
            </foreignObject>
          </g>
        ))}
        {done.map((s, i) => (
          <g key={s.id} className="gm-node" onMouseEnter={() => setHover({ kind: 's', id: s.id })} onMouseLeave={() => setHover(null)}>
            <circle cx={sx} cy={sy(i)} r="6" fill="var(--stem)" opacity={s.goal_ids?.length ? 1 : 0.35} />
            <text x={sx - 14} y={sy(i) + 4} textAnchor="end" className="gm-date">
              {fmtDate(s.session_date)}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="quiet small">{links.length ? 'כל חוט מחבר סשן ליעד שהוא נגע בו. מעבר עם העכבר מבליט את החוטים.' : 'בסשן הבא אפשר לסמן לאיזה יעד הוא נגע, והחוטים יופיעו כאן.'}</figcaption>
    </figure>
  );
}
