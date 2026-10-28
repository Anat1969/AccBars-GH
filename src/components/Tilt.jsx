import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';

/** Leans a surface a few degrees toward the pointer, with a soft highlight where it points. */
export default function Tilt({ children, className = '', max = 4, as = 'div', ...rest }) {
  const still = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 50, damping: 16 });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 50, damping: 16 });
  const glow = useTransform([px, py], ([x, y]) => `radial-gradient(600px circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.5), transparent 45%)`);
  const M = motion[as];
  return (
    <M
      className={`tilt ${className}`}
      style={still ? undefined : { rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onPointerMove={(e) => {
        if (still || e.pointerType === 'touch') return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
      {...rest}
    >
      {children}
      {!still && <motion.span className="tilt-glow" style={{ background: glow }} aria-hidden="true" />}
    </M>
  );
}
