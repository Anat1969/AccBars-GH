import { AnimatePresence, motion } from 'framer-motion';
import { createContext, useCallback, useContext, useRef, useState } from 'react';

const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const timer = useRef();
  const show = useCallback((text, tone = 'info') => {
    clearTimeout(timer.current);
    setMsg({ text, tone, id: Date.now() });
    timer.current = setTimeout(() => setMsg(null), 4200);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="toast-wrap" role="status" aria-live="polite">
        <AnimatePresence>
          {msg && (
            <motion.div key={msg.id} className={`toast toast-${msg.tone}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
              {msg.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
