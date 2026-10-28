import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import { BARS, VIEWS } from '../../lib/bars';

const ease = [0.22, 0.61, 0.36, 1];
const BOX = { side: '0 0 400 440', top: '0 0 300 340', front: '0 0 300 340' };

function Head({ view }) {
  const line = { fill: 'none', stroke: 'var(--stem)', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (view === 'side')
    return (
      <g>
        <path className="head-fill" d="M150 400 C 140 350, 100 330, 85 290 C 60 230, 70 150, 120 105 C 170 60, 250 62, 290 110 C 312 138, 312 168, 306 188 L 326 228 L 308 238 C 312 248, 314 256, 306 262 C 312 270, 308 282, 300 290 C 292 305, 268 312, 244 312 C 236 340, 236 370, 240 400 Z" />
        <path {...line} d="M150 400 C 140 350, 100 330, 85 290 C 60 230, 70 150, 120 105 C 170 60, 250 62, 290 110 C 312 138, 312 168, 306 188 L 326 228 L 308 238 C 312 248, 314 256, 306 262 C 312 270, 308 282, 300 290 C 292 305, 268 312, 244 312 C 236 340, 236 370, 240 400" />
        <ellipse cx="190" cy="242" rx="14" ry="25" {...line} />
        <path {...line} strokeWidth="1.4" d="M192 228 C 182 234, 184 252, 194 256" />
        <path {...line} strokeWidth="1.6" d="M276 196 q 9 -6 18 0 q -9 5 -18 0" />
        <path {...line} strokeWidth="1.4" d="M272 184 q 12 -6 24 -1" />
      </g>
    );
  if (view === 'top')
    return (
      <g>
        <ellipse className="head-fill" cx="150" cy="182" rx="104" ry="138" />
        <ellipse cx="150" cy="182" rx="104" ry="138" {...line} />
        <path {...line} d="M140 46 L 150 30 L 160 46" />
        <path {...line} d="M47 168 q -14 14 0 34" />
        <path {...line} d="M253 168 q 14 14 0 34" />
        <path {...line} strokeWidth="1" strokeDasharray="2 6" d="M150 52 L 150 312" />
      </g>
    );
  return (
    <g>
      <ellipse className="head-fill" cx="150" cy="185" rx="98" ry="128" />
      <ellipse cx="150" cy="185" rx="98" ry="128" {...line} />
      <path {...line} d="M98 180 q 14 -9 28 0 q -14 8 -28 0" />
      <path {...line} d="M174 180 q 14 -9 28 0 q -14 8 -28 0" />
      <path {...line} strokeWidth="1.4" d="M96 168 q 16 -8 32 -2" />
      <path {...line} strokeWidth="1.4" d="M172 166 q 16 -6 32 2" />
      <path {...line} strokeWidth="1.6" d="M150 190 L 144 232 L 156 234" />
      <path {...line} d="M128 262 q 22 12 44 0" />
      <path {...line} d="M52 176 q -12 18 2 40" />
      <path {...line} d="M248 176 q 12 18 -2 40" />
    </g>
  );
}

const fillFor = (b) => (b.color === 'iridescent' ? 'url(#hm-iri)' : b.color ? b.color : 'url(#hm-dew)');

/**
 * One view of the head with its bars.
 * mode "explore": hover and pick one bar. mode "select": toggle bars on and off.
 * `counts` lights each bar by how many sessions ran it. `dim` greys out bars outside a group filter.
 */
export default function HeadMap({ view = 'side', focus, onFocus, selected = [], onPick, counts, dim, label = true }) {
  const still = useReducedMotion();
  // the outgoing view stays on screen while it fades; it must not catch the pointer
  const current = useRef(view);
  current.current = view;
  const live = (b, fn) => () => b.view === current.current && fn?.(b.key);
  const bars = BARS.filter((b) => b.view === view);
  const max = counts ? Math.max(1, ...Object.values(counts)) : 1;
  const name = VIEWS.find((v) => v.key === view)?.name;

  return (
    <figure className="viz headmap">
      <AnimatePresence mode="wait">
        <motion.svg key={view} viewBox={BOX[view]} role="img" aria-label={`מפת הבארס, ${name}`}
          initial={{ opacity: 0, scale: 0.96, filter: 'blur(6px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 1.02, filter: 'blur(6px)' }}
          transition={{ duration: still ? 0 : 0.8, ease }}>
          <defs>
            <radialGradient id="hm-dew" cx="35%" cy="30%" r="70%">
              <stop offset="0" stopColor="#fff" />
              <stop offset="0.6" stopColor="#fbf4ea" />
              <stop offset="1" stopColor="#dcc4a8" />
            </radialGradient>
            <linearGradient id="hm-iri" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#e9b8c9" />
              <stop offset="0.33" stopColor="#b9d6e8" />
              <stop offset="0.66" stopColor="#cfe5b8" />
              <stop offset="1" stopColor="#f0d79c" />
            </linearGradient>
            <radialGradient id="hm-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#fff4e2" stopOpacity="0.95" />
              <stop offset="1" stopColor="#fff4e2" stopOpacity="0" />
            </radialGradient>
          </defs>
          <Head view={view} />
          {bars.map((b, bi) => {
            const isFocus = focus === b.key;
            const isOn = selected.includes(b.key);
            const c = counts?.[b.key] ?? 0;
            const faded = (dim && dim(b)) || (counts && !c && !isFocus);
            const op = faded ? 0.25 : 1;
            const r = counts ? 6 + (c / max) * 6 : isFocus || isOn ? 10 : 7.5;
            return (
              <g key={b.key} className={`hm-bar ${onPick ? 'is-interactive' : ''}`} opacity={op} tabIndex={onPick ? 0 : -1}
                role={onPick ? 'button' : undefined} aria-pressed={onPick ? isOn || isFocus : undefined} aria-label={`${b.he}, ${b.en}`}
                onMouseEnter={live(b, onFocus)} onFocus={live(b, onFocus)}
                onClick={live(b, onPick)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), live(b, onPick)())}>
                {b.line && <polyline points={b.pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={isFocus ? 'var(--rust-deep)' : 'var(--stem)'} strokeWidth="1.6" strokeDasharray="4 5" />}
                {b.ring && <circle cx={b.pts[0][0]} cy={b.pts[0][1]} r={b.ring} fill="none" stroke={isFocus ? 'var(--rust-deep)' : 'var(--stem)'} strokeWidth="1.6" strokeDasharray="3 5" />}
                {b.band && <path d="M78 286 C 96 304, 130 312, 150 306" fill="none" stroke={b.color} strokeOpacity="0.55" strokeWidth={isFocus ? 9 : 6} strokeLinecap="round" />}
                {b.crown && <ellipse cx="150" cy="182" rx="92" ry="124" fill="none" stroke={isFocus ? 'var(--rust-deep)' : 'var(--stem)'} strokeWidth="1.6" strokeDasharray="3 6" />}
                {b.pts.map(([x, y], i) => (
                  <g key={i}>
                    {(isFocus || isOn) && !still && (
                      <motion.circle cx={x} cy={y} r="22" fill="url(#hm-glow)" animate={{ r: [16, 24, 16], opacity: [0.95, 0.5, 0.95] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }} />
                    )}
                    <motion.circle cx={x} cy={y} fill={fillFor(b)} stroke={isOn ? 'var(--rust-deep)' : b.color && b.color !== 'iridescent' ? 'rgba(42,34,29,0.35)' : 'var(--stem)'}
                      strokeWidth={isOn ? 2.4 : 1.2} initial={{ r: 0 }} animate={{ r }} transition={{ duration: 0.9, delay: still ? 0 : 0.15 + bi * 0.05, ease }} />
                  </g>
                ))}
                {label && isFocus && (
                  <foreignObject x={Math.min(Math.max(b.pts[0][0] - 80, 4), (view === 'side' ? 400 : 300) - 164)} y={view === 'side' ? b.pts[0][1] - 46 : Math.max(...b.pts.map((p) => p[1])) + 16} width="160" height="30" style={{ overflow: 'visible', pointerEvents: 'none' }}>
                    <div className="hm-tag-wrap">
                      <div className="hm-tag">{b.he}</div>
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}
        </motion.svg>
      </AnimatePresence>
    </figure>
  );
}
