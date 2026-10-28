import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fmtWhen } from '../../lib/format';

const C = 170;
const R = 128;
const DAY = 24 * 3600 * 1000;
const dayName = new Intl.DateTimeFormat('he-IL', { weekday: 'short' });

/** Seven days around a ring, today at the top. Each coming session is a drop at its hour. */
export default function WeekRing({ patients }) {
  const still = useReducedMotion();
  const nav = useNavigate();
  const [hover, setHover] = useState(null);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const now = Date.now();
  const angle = (t) => ((t - start.getTime()) / (7 * DAY)) * 360 - 90;
  const at = (deg, r = R) => [C + r * Math.cos((deg * Math.PI) / 180), C + r * Math.sin((deg * Math.PI) / 180)];
  const coming = patients
    .filter((p) => p.next_session_at && new Date(p.next_session_at).getTime() >= now - 3600 * 1000 && new Date(p.next_session_at).getTime() < start.getTime() + 7 * DAY)
    .sort((a, b) => new Date(a.next_session_at) - new Date(b.next_session_at));
  const nowDeg = angle(now);
  const focus = hover ?? coming[0] ?? null;

  return (
    <figure className="viz week-ring">
      <svg viewBox="0 0 340 340" role="img" aria-label="השבוע הקרוב">
        <defs>
          <radialGradient id="wr-drop" cx="35%" cy="30%" r="70%">
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.55" stopColor="#fdf6ec" />
            <stop offset="1" stopColor="#d7b99a" />
          </radialGradient>
          <linearGradient id="wr-arc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--amber)" />
            <stop offset="1" stopColor="var(--rust-deep)" />
          </linearGradient>
        </defs>
        <circle cx={C} cy={C} r={R + 22} fill="rgba(255,250,243,0.55)" />
        <circle cx={C} cy={C} r={R} fill="none" stroke="var(--line)" strokeWidth="18" />
        {Array.from({ length: 7 }, (_, d) => {
          const deg = d * (360 / 7) - 90;
          const [x1, y1] = at(deg, R - 12);
          const [x2, y2] = at(deg, R + 12);
          const [lx, ly] = at(deg + 360 / 14, R + 34);
          const day = new Date(start.getTime() + d * DAY);
          return (
            <g key={d}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--stem)" strokeOpacity="0.35" />
              <text x={lx} y={ly + 4} textAnchor="middle" className={`wr-day ${d === 0 ? 'is-today' : ''}`}>
                {d === 0 ? 'היום' : dayName.format(day)}
              </text>
            </g>
          );
        })}
        <motion.circle
          cx={C}
          cy={C}
          r={R}
          fill="none"
          stroke="url(#wr-arc)"
          strokeWidth="4"
          strokeLinecap="round"
          transform={`rotate(-90 ${C} ${C})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.max(0.002, (nowDeg + 90) / 360) }}
          transition={{ duration: still ? 0 : 2.4, ease: 'easeInOut' }}
        />
        {(() => {
          const [x, y] = at(nowDeg);
          return <circle cx={x} cy={y} r="5" fill="var(--rust-deep)" />;
        })()}
        {coming.map((p, i) => {
          const [x, y] = at(angle(new Date(p.next_session_at).getTime()));
          const isFocus = focus?.id === p.id;
          return (
            <g key={p.id} className="wr-drop" tabIndex={0} role="link" aria-label={`${p.full_name}, ${fmtWhen(p.next_session_at)}`}
              onMouseEnter={() => setHover(p)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(p)} onBlur={() => setHover(null)}
              onClick={() => nav(`/patients/${p.id}`)} onKeyDown={(e) => e.key === 'Enter' && nav(`/patients/${p.id}`)}>
              {isFocus && !still && (
                <motion.circle cx={x} cy={y} r="20" fill="#fff4e6" animate={{ r: [14, 22, 14], opacity: [0.9, 0.3, 0.9] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }} />
              )}
              <motion.circle cx={x} cy={y} fill="url(#wr-drop)" stroke="var(--rust)" strokeOpacity="0.55"
                initial={{ r: 0 }} animate={{ r: isFocus ? 11 : 8 }} transition={{ duration: 1, delay: still ? 0 : 1.2 + i * 0.15 }} />
            </g>
          );
        })}
        <foreignObject x={C - 82} y={C - 52} width="164" height="104">
          <div className="wr-center">
            {focus ? (
              <>
                <span className="label">{hover ? 'סשן' : 'הבא בתור'}</span>
                <strong>{focus.full_name}</strong>
                <span className="small">{fmtWhen(focus.next_session_at)}</span>
              </>
            ) : (
              <>
                <span className="label">השבוע</span>
                <strong>אין סשנים קבועים</strong>
              </>
            )}
          </div>
        </foreignObject>
      </svg>
      <figcaption className="quiet small">{coming.length ? `${coming.length} סשנים בשבעת הימים הקרובים` : 'שבעת הימים הקרובים'}</figcaption>
    </figure>
  );
}
