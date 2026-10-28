import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

const IN = 4;
const OUT = 6;
const ROUNDS = 6;

/** One minute of slow breathing: a dew drop grows for four seconds and softens for six. */
export default function Breath({ onClose }) {
  const still = useReducedMotion();
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState('in');

  useEffect(() => {
    const t = setTimeout(
      () => {
        if (phase === 'in') setPhase('out');
        else if (round + 1 >= ROUNDS) setPhase('end');
        else {
          setRound((r) => r + 1);
          setPhase('in');
        }
      },
      (phase === 'in' ? IN : OUT) * 1000,
    );
    return phase === 'end' ? undefined : () => clearTimeout(t);
  }, [phase, round]);

  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const scale = phase === 'in' ? 1.6 : 1;
  return (
    <motion.div className="breath" role="dialog" aria-modal="true" aria-label="רגע של נשימה" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }}>
      <div className="breath-stage">
        <motion.div className="breath-halo" animate={{ scale: still ? 1 : scale * 1.15, opacity: phase === 'in' ? 0.55 : 0.25 }} transition={{ duration: phase === 'in' ? IN : OUT, ease: 'easeInOut' }} />
        <motion.div className="breath-drop" animate={{ scale: still ? 1 : scale }} transition={{ duration: phase === 'in' ? IN : OUT, ease: 'easeInOut' }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.p key={phase} className="h-display breath-word" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
          {phase === 'in' ? 'שאיפה' : phase === 'out' ? 'נשיפה' : 'אפשר לחזור ליום'}
        </motion.p>
      </AnimatePresence>
      <button className="btn btn-ghost" onClick={onClose}>
        {phase === 'end' ? 'סיום' : 'לעצור'}
      </button>
    </motion.div>
  );
}
