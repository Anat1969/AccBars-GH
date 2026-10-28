import { motion, useReducedMotion } from 'framer-motion';

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

export default function Backdrop() {
  const still = useReducedMotion();
  const sway = still ? {} : { rotate: [0, 1.2, 0, -0.8, 0], transition: { duration: 26, repeat: Infinity, ease: 'easeInOut' } };
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="glow glow-a" />
      <div className="glow glow-b" />
      <svg className="fern fern-far" viewBox="0 0 600 820" preserveAspectRatio="xMidYMid slice">
        <Frond drops={false} />
      </svg>
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
      <div className="grain" />
    </div>
  );
}
