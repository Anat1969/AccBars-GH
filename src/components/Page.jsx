import { motion } from 'framer-motion';

export default function Page({ children, className = '' }) {
  return (
    <motion.main
      className={`page ${className}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.main>
  );
}

export function Loading() {
  return <p className="quiet center">רגע אחד.</p>;
}

export function LoadError({ onRetry }) {
  return (
    <section className="card card-calm">
      <p className="msg msg-error">לא הצלחנו לטעון את המידע.</p>
      <button className="btn btn-ghost" onClick={onRetry}>
        לנסות שוב
      </button>
    </section>
  );
}
