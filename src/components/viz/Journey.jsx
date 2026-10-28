import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fmtDate } from '../../lib/format';

/**
 * The patient's path as a fern frond: oldest session at the base, newest at the tip.
 * A drop marks an insight; a filled seed marks an exercise that was practised.
 * An open session curls at the tip like a fiddlehead.
 */
export default function Journey({ sessions, exercises, patientId }) {
  const still = useReducedMotion();
  const nav = useNavigate();
  const [hover, setHover] = useState(null);
  const done = sessions.filter((s) => s.status === 'done').slice().reverse();
  const draft = sessions.find((s) => s.status === 'draft');
  const exBy = Object.fromEntries(exercises.filter((e) => e.session_id).map((e) => [e.session_id, e]));
  const n = Math.max(done.length, 1);
  const W = 760;
  const H = 260;
  const x0 = W - 40;
  const x1 = 90;
  const stemY = (t) => 200 - Math.sin(t * Math.PI * 0.9) * 70 - t * 30;
  const pos = (i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    return { x: x0 - (x0 - x1) * t * 0.92, y: stemY(t * 0.92), t };
  };
  const steps = 40;
  const stem = Array.from({ length: steps + 1 }, (_, k) => {
    const t = k / steps;
    return `${k ? 'L' : 'M'}${(x0 - (x0 - x1) * t).toFixed(1)} ${stemY(t).toFixed(1)}`;
  }).join(' ');
  const tip = { x: x1, y: stemY(1) };
  const focus = hover;

  return (
    <figure className="viz journey">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="מסע הסשנים">
        <defs>
          <radialGradient id="jr-drop" cx="35%" cy="30%" r="70%">
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.55" stopColor="#fdf7ee" />
            <stop offset="1" stopColor="#dcc2a6" />
          </radialGradient>
          <linearGradient id="jr-leaf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8a9a84" />
            <stop offset="1" stopColor="#5f6e5c" />
          </linearGradient>
        </defs>
        <motion.path d={stem} fill="none" stroke="var(--stem)" strokeWidth="3.5" strokeLinecap="round"
          initial={{ pathLength: still ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.4, ease: 'easeInOut' }} />
        {done.map((s, i) => {
          const { x, y } = pos(i);
          const len = 66;
          const ex = exBy[s.id];
          const side = i % 2 ? 1 : -1;
          const isFocus = focus?.id === s.id;
          return (
            <motion.g key={s.id} className="jr-leaf" tabIndex={0} role="link" aria-label={`סשן ${fmtDate(s.session_date)}${s.summary ? `: ${s.summary}` : ''}`}
              style={{ originX: `${x}px`, originY: `${y}px` }}
              initial={{ scale: still ? 1 : 0, opacity: 0 }} animate={{ scale: isFocus ? 1.08 : 1, opacity: 1 }}
              transition={{ duration: 1, delay: still ? 0 : 0.8 + i * 0.22, ease: [0.22, 0.61, 0.36, 1] }}
              onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(s)} onBlur={() => setHover(null)}
              onClick={() => nav(`/patients/${patientId}/sessions/${s.id}`)} onKeyDown={(e) => e.key === 'Enter' && nav(`/patients/${patientId}/sessions/${s.id}`)}>
              <g transform={`translate(${x} ${y}) rotate(${side * 58 - 12})`}>
                <path d={`M0 0 q ${len * 0.35} ${-len * 0.28} ${len} 0 q ${-len * 0.6} ${len * 0.26} ${-len} 0z`} fill="url(#jr-leaf)" opacity={isFocus ? 0.95 : 0.72} />
                <path d={`M0 0 L ${len * 0.9} 0`} stroke="#eef0e8" strokeOpacity="0.5" strokeWidth="1" />
                {s.insight && <circle cx={len * 0.78} cy={-len * 0.06} r="6.5" fill="url(#jr-drop)" stroke="#c8a888" strokeOpacity="0.5" />}
              </g>
              {ex && (
                <circle cx={x} cy={y} r="6" fill={ex.done_note ? 'var(--rust-deep)' : '#fffaf2'} stroke="var(--rust-deep)" strokeWidth="1.5" />
              )}
              <text x={x} y={y + 30 * (side > 0 ? 1 : 1)} textAnchor="middle" className="jr-date">
                {fmtDate(s.session_date).slice(0, -5)}
              </text>
            </motion.g>
          );
        })}
        {draft ? (
          <motion.path
            className="jr-curl"
            d={`M${tip.x} ${tip.y} c -22 -6 -34 -30 -18 -46 c 14 -14 34 -4 30 12 c -3 11 -18 12 -20 2`}
            fill="none" stroke="var(--rust)" strokeWidth="3" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: [0.35, 1, 0.35] }} transition={{ duration: 7, repeat: still ? 0 : Infinity, ease: 'easeInOut' }}
          />
        ) : (
          <circle cx={tip.x} cy={tip.y} r="4" fill="var(--stem)" />
        )}
      </svg>
      <figcaption>
        {focus ? (
          <>
            <span className="label">{fmtDate(focus.session_date)}</span>
            <span>{focus.summary || focus.insight || focus.discussed || 'סשן'}</span>
          </>
        ) : (
          <span className="quiet small">כל עלה הוא סשן. טיפה היא תובנה. זרע מלא הוא תרגיל שנעשה.{draft ? ' הקצה המסולסל הוא הסשן הפתוח.' : ''}</span>
        )}
      </figcaption>
    </figure>
  );
}
