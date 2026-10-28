import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

// One fern frond with dew, drawn twice: blurred in the depth, sharp in front.
function Frond({ drops = true }) {
  const pinnae = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12;
    const x = 120 + t * 330;
    const y = 760 - t * 640 + Math.sin(t * 3) * 18;
    const len = 150 * (1 - t * 0.78);
    return { x, y, len, i };
  });
  return (
    <g>
      <path d="M110 790 C 210 560, 330 330, 470 110" fill="none" stroke="var(--stem)" strokeWidth="5" strokeLinecap="round" />
      {pinnae.map(({ x, y, len, i }) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${-58 + i * 1.5})`}>
          <path d={`M0 0 q ${-len * 0.5} ${-len * 0.22} ${-len} ${-len * 0.06} q ${len * 0.52} ${len * 0.16} ${len} ${len * 0.06}z`} fill="var(--leaf)" />
          <path d={`M0 0 q ${len * 0.5} ${-len * 0.3} ${len * 0.92} ${-len * 0.42} q ${-len * 0.4} ${len * 0.32} ${-len * 0.92} ${len * 0.42}z`} fill="var(--leaf)" />
          {drops && i % 3 === 1 && <circle cx={-len * 0.72} cy={-len * 0.07} r={4 + (12 - i) * 0.35} fill="url(#dew)" />}
          {drops && i % 4 === 2 && <circle cx={len * 0.62} cy={-len * 0.3} r={3 + (12 - i) * 0.3} fill="url(#dew)" />}
        </g>
      ))}
    </g>
  );
}

// A few drops of light drifting very slowly upward; positions are fixed so the scene is calm and repeatable.
const DROPS = Array.from({ length: 18 }, (_, i) => {
  const r = (k) => ((Math.sin(i * 9301 + k * 49297) + 1) / 2);
  return { x: 4 + r(1) * 92, y: 10 + r(2) * 85, s: 3 + r(3) * 7, d: 38 + r(4) * 40, delay: r(5) * 60, dx: (r(6) - 0.5) * 60 };
});

export default function Backdrop() {
  const still = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 12, damping: 18 });
  const sy = useSpring(my, { stiffness: 12, damping: 18 });
  // three depths move at different speeds: the far layer least, the light most
  const farX = useTransform(sx, (v) => v * 10);
  const farY = useTransform(sy, (v) => v * 8);
  const nearX = useTransform(sx, (v) => v * 22);
  const nearY = useTransform(sy, (v) => v * 14);
  const glowX = useTransform(sx, (v) => v * -36);
  const glowY = useTransform(sy, (v) => v * -24);

  useEffect(() => {
    if (still) return;
    const move = (e) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [still, mx, my]);

  const sway = still ? {} : { rotate: [0, 1.2, 0, -0.8, 0], transition: { duration: 26, repeat: Infinity, ease: 'easeInOut' } };
  return (
    <div className="backdrop" aria-hidden="true">
      <motion.div className="glow glow-a" style={{ x: glowX, y: glowY }} />
      <div className="glow glow-b" />
      <motion.div className="glow glow-c" style={{ x: glowX, y: glowY }} animate={still ? {} : { opacity: [0.35, 0.6, 0.35] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.svg className="fern fern-far" viewBox="0 0 600 820" preserveAspectRatio="xMidYMid slice" style={{ x: farX, y: farY, rotate: -14 }}>
        <Frond drops={false} />
      </motion.svg>
      <motion.div className="fern-near-wrap" style={{ x: nearX, y: nearY }}>
        <motion.svg className="fern fern-near" viewBox="0 0 600 820" style={{ originX: 0.2, originY: 1 }} animate={sway}>
          <defs>
            <radialGradient id="dew" cx="35%" cy="30%" r="70%">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.55" stopColor="#fdf8f1" stopOpacity="0.95" />
              <stop offset="1" stopColor="#e8d6c2" stopOpacity="0.7" />
            </radialGradient>
          </defs>
          <Frond />
        </motion.svg>
      </motion.div>
      <div className="dew-field">
        {DROPS.map((d, i) => (
          <span key={i} className="dew-drift" style={{ '--x': `${d.x}%`, '--y': `${d.y}%`, '--s': `${d.s}px`, '--d': `${d.d}s`, '--delay': `${-d.delay}s`, '--dx': `${d.dx}px` }} />
        ))}
      </div>
      <div className="grain" />
    </div>
  );
}
