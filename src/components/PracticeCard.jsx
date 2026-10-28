import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { useState } from 'react';
import { ENNEAGRAM } from '../lib/enneagram';
import { TYPE_HUE } from '../lib/library';

/** A practice card that tilts toward the pointer and turns over to show its steps. */
export default function PracticeCard({ item, onChoose, chooseLabel = 'לבחירה', onDelete, index = 0 }) {
  const still = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [5, -5]), { stiffness: 60, damping: 18 });
  const ry = useSpring(useTransform(px, [0, 1], [-6, 6]), { stiffness: 60, damping: 18 });
  const sheen = useTransform([px, py], ([x, y]) => `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.55), rgba(255,255,255,0) 55%)`);
  const hue = TYPE_HUE[item.types[0]] ?? '#7d6a5a';
  const typeNames = item.types.length ? item.types.map((n) => `${n}, ${ENNEAGRAM[n - 1].name}`).join(' | ') : 'לכל הטיפוסים';

  const move = (e) => {
    if (still) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const leave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.li
      className="practice"
      style={{ '--hue': hue }}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, delay: Math.min(index, 8) * 0.06, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <motion.div className="practice-tilt" style={{ rotateX: rx, rotateY: ry }} onPointerMove={move} onPointerLeave={leave}>
        <motion.div className="practice-inner" animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: still ? 0 : 1, ease: [0.22, 0.61, 0.36, 1] }}>
          <button className="practice-face practice-front" onClick={() => setFlipped(true)} aria-label={`${item.title}, להצגת השלבים`} tabIndex={flipped ? -1 : 0}>
            {item.types.length === 1 && <span className="practice-num" aria-hidden="true">{item.types[0]}</span>}
            <span className="practice-kind">{item.kind}</span>
            <span className="practice-title">{item.title}</span>
            {item.invite && <span className="practice-invite">{item.invite}</span>}
            <span className="practice-meta">
              <span>{typeNames}</span>
              {item.minutes ? <span>{item.minutes} דקות</span> : null}
            </span>
            <motion.span className="practice-sheen" style={{ background: sheen }} aria-hidden="true" />
          </button>
          <div className="practice-face practice-back" aria-hidden={!flipped}>
            <span className="practice-kind">{item.title}</span>
            <ol className="practice-steps">
              {item.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            <div className="row">
              {onChoose && (
                <button className="btn btn-primary btn-small" onClick={() => onChoose(item)} tabIndex={flipped ? 0 : -1}>
                  {chooseLabel}
                </button>
              )}
              <button className="btn btn-link" onClick={() => setFlipped(false)} tabIndex={flipped ? 0 : -1}>
                חזרה
              </button>
              {onDelete && (
                <button className="btn btn-link btn-danger" onClick={() => onDelete(item)} tabIndex={flipped ? 0 : -1}>
                  מחיקה
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.li>
  );
}
