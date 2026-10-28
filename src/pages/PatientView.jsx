import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Breath from '../components/viz/Breath';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { configured } from '../lib/supabase';
import { patientView } from '../lib/data';
import { fmtWhen } from '../lib/format';

const slow = (delay) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 1.4, delay, ease: [0.22, 0.61, 0.36, 1] } });

/** What the patient sees: one message, one exercise. No scores, no comparisons. */
export default function PatientView() {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true });
  const [breath, setBreath] = useState(false);
  const still = useReducedMotion();

  useEffect(() => {
    if (!configured) return setState({ missing: true });
    patientView(token).then(
      (v) => setState(v ? { v } : { missing: true }),
      () => setState({ error: true }),
    );
  }, [token]);

  return (
    <main className="page page-narrow patient-screen">
      {state.loading && <p className="quiet center">רגע אחד.</p>}
      {state.missing && (
        <section className="card card-calm">
          <h1 className="h-display">הקישור אינו פעיל</h1>
          <p className="quiet">אפשר לבקש קישור חדש בסשן הבא.</p>
        </section>
      )}
      {state.error && (
        <section className="card card-calm">
          <p className="quiet">אין חיבור כרגע. אפשר לנסות שוב בעוד רגע.</p>
        </section>
      )}
      {state.v && (
        <>
          <motion.p className="label" {...slow(0.1)}>
            שלום {state.v.first_name}
          </motion.p>
          <motion.section className="message" {...slow(0.4)}>
            <span className="dew" aria-hidden="true" />
            <p className="h-hero message-text" aria-label={state.v.message || 'המסר מהסשן יופיע כאן.'}>
              {(state.v.message || 'המסר מהסשן יופיע כאן.').split(' ').map((w, i) => (
                <motion.span key={i} aria-hidden="true" initial={{ opacity: 0, filter: 'blur(6px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }}
                  transition={{ duration: still ? 0 : 1.2, delay: still ? 0 : 0.6 + i * 0.22, ease: 'easeOut' }}>
                  {w}{' '}
                </motion.span>
              ))}
            </p>
          </motion.section>
          {state.v.exercise && (
            <motion.section className="card card-calm" {...slow(1.1)}>
              <span className="label">תרגיל לשבוע</span>
              <p className="h-quiet">{state.v.exercise}</p>
            </motion.section>
          )}
          <motion.button className="btn btn-ghost" onClick={() => setBreath(true)} {...slow(1.4)}>
            רגע של נשימה
          </motion.button>
          {state.v.next_session_at && (
            <motion.p className="quiet center" {...slow(1.6)}>
              נתראה {fmtWhen(state.v.next_session_at)}
            </motion.p>
          )}
        </>
      )}
      <AnimatePresence>{breath && <Breath onClose={() => setBreath(false)} />}</AnimatePresence>
      <footer className="care-line">
        אם קשה עכשיו: ער"ן <span dir="ltr">1201</span>. בסכנה מיידית: מד"א <span dir="ltr">101</span>.
      </footer>
    </main>
  );
}
