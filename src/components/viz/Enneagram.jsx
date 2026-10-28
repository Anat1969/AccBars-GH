import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { ENNEAGRAM, HEXAD, TRIANGLE, linesOf, wingsOf } from '../../lib/enneagram';

const R = 120;
const C = 160;
const pt = (n) => {
  const a = ((n % 9) * 40 - 90) * (Math.PI / 180);
  return [C + R * Math.cos(a), C + R * Math.sin(a)];
};
const poly = (arr, closed = true) => `M${arr.map((n) => pt(n).join(' ')).join(' L')}${closed ? ' Z' : ''}`;

/**
 * The enneagram figure. `active` highlights one type with its wings and lines;
 * `counts` places a quiet cluster of drops at each point; `onSelect` makes points interactive.
 */
export default function Enneagram({ active, counts, onSelect, size = 320, caption }) {
  const still = useReducedMotion();
  const [hover, setHover] = useState(null);
  const focus = hover ?? active ?? null;
  const wings = focus ? wingsOf(focus) : [];
  const lines = focus ? linesOf(focus) : [];
  const draw = (delay) => (still ? {} : { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { duration: 2.6, delay, ease: 'easeInOut' } });
  const info = ENNEAGRAM.find((t) => t.n === focus);

  return (
    <figure className="viz enneagram" style={{ maxWidth: size }}>
      <svg viewBox="0 0 320 320" role="img" aria-label={caption || 'דיאגרמת אניאגרם'}>
        <defs>
          <radialGradient id="en-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#fff7ec" />
            <stop offset="1" stopColor="#fff7ec" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="en-drop" cx="35%" cy="30%" r="70%">
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.6" stopColor="#fbf3e8" />
            <stop offset="1" stopColor="#d9bfa3" />
          </radialGradient>
        </defs>
        <circle cx={C} cy={C} r={R + 26} fill="url(#en-glow)" opacity="0.9" />
        <motion.circle cx={C} cy={C} r={R} fill="none" stroke="var(--stem)" strokeOpacity="0.45" strokeWidth="1.2" {...draw(0)} />
        <motion.path d={poly(TRIANGLE)} fill="none" stroke="var(--rust)" strokeOpacity="0.35" strokeWidth="1.2" {...draw(0.6)} />
        <motion.path d={poly(HEXAD)} fill="none" stroke="var(--stem)" strokeOpacity="0.4" strokeWidth="1.2" {...draw(1)} />
        {focus &&
          lines.map((m) => (
            <motion.line key={`l${focus}${m}`} x1={pt(focus)[0]} y1={pt(focus)[1]} x2={pt(m)[0]} y2={pt(m)[1]} stroke="var(--rust-deep)" strokeWidth="2.4" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: 'easeOut' }} />
          ))}
        {ENNEAGRAM.map(({ n, name }) => {
          const [x, y] = pt(n);
          const isFocus = n === focus;
          const isWing = wings.includes(n);
          const isLine = lines.includes(n);
          const c = counts?.[n] ?? 0;
          const lx = C + (R + 30) * Math.cos(((n % 9) * 40 - 90) * (Math.PI / 180));
          const ly = C + (R + 30) * Math.sin(((n % 9) * 40 - 90) * (Math.PI / 180));
          return (
            <g
              key={n}
              className={onSelect ? 'en-point is-interactive' : 'en-point'}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(null)}
              onClick={() => onSelect?.(n)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect?.(n)}
              tabIndex={onSelect ? 0 : -1}
              role={onSelect ? 'button' : undefined}
              aria-label={`${n}, ${name}`}
            >
              {isFocus && !still && (
                <motion.circle cx={x} cy={y} r="22" fill="var(--amber)" opacity="0.25" animate={{ r: [18, 26, 18], opacity: [0.3, 0.12, 0.3] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
              )}
              <motion.circle
                cx={x}
                cy={y}
                fill={isFocus ? 'url(#en-drop)' : isWing || isLine ? '#fbf1e4' : 'rgba(255,252,246,0.85)'}
                stroke={isFocus ? 'var(--rust-deep)' : isWing ? 'var(--rust)' : 'var(--stem)'}
                strokeWidth={isFocus ? 2 : 1.2}
                initial={{ r: 0 }}
                animate={{ r: isFocus ? 15 : isWing || isLine ? 12 : 10 }}
                transition={{ duration: 0.9, delay: still ? 0 : 1.4 + n * 0.08, ease: [0.22, 0.61, 0.36, 1] }}
              />
              <text x={x} y={y + 4} textAnchor="middle" className="en-n">
                {n}
              </text>
              <text x={lx} y={ly + 4} textAnchor="middle" className={`en-name ${isFocus ? 'is-focus' : ''}`}>
                {name}
              </text>
              {c > 0 &&
                Array.from({ length: Math.min(c, 6) }, (_, k) => {
                  const a = (k / Math.min(c, 6)) * Math.PI * 2;
                  return (
                    <motion.circle key={k} cx={x + Math.cos(a) * 19} cy={y + Math.sin(a) * 19} r="3.4" fill="url(#en-drop)" stroke="var(--rust)" strokeOpacity="0.4"
                      initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 2 + k * 0.1 }} />
                  );
                })}
            </g>
          );
        })}
      </svg>
      <AnimatePresence mode="wait">
        <motion.figcaption key={focus ?? 'none'} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
          {info ? (
            <>
              <strong>
                {info.n}, {info.name}
              </strong>
              <span>{info.core}.</span>
              <span className="quiet small">
                כנפיים {wingsOf(info.n).join(' ו-')}. קווים אל {linesOf(info.n).join(' ו-')}.
              </span>
            </>
          ) : (
            <span className="quiet small">{caption || 'מסגרת להתבוננות, לא אבחון.'}</span>
          )}
        </motion.figcaption>
      </AnimatePresence>
    </figure>
  );
}
