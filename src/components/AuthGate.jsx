import { AnimatePresence, motion } from 'framer-motion';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { configured, supabase } from '../lib/supabase';
import { errText } from '../lib/format';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

const fade = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.8, ease: [0.22, 0.61, 0.36, 1] } };

/**
 * stage: loading | signedOut | recovery | enroll | challenge | notAllowed | ready
 * Data is readable only at aal2, so the gate always ends in a second factor.
 */
export default function AuthGate({ children }) {
  const [stage, setStage] = useState(configured ? 'loading' : 'unconfigured');
  const [session, setSession] = useState(null);

  const resolve = useCallback(async (s) => {
    setSession(s);
    if (!s) return setStage('signedOut');
    try {
      const { data: allowed, error } = await supabase.rpc('accbars_is_allowed');
      if (error) throw error;
      if (!allowed) return setStage('notAllowed');
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === 'aal2') return setStage('ready');
      const { data: f } = await supabase.auth.mfa.listFactors();
      setStage(f?.totp?.some((x) => x.status === 'verified') ? 'challenge' : 'enroll');
    } catch {
      setStage('signedOut');
    }
  }, []);

  useEffect(() => {
    if (!configured) return;
    let recovering = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!recovering) resolve(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') {
        recovering = true;
        setSession(s);
        setStage('recovery');
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setStage('signedOut');
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [resolve]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setStage('signedOut');
  }, []);

  const value = { stage, ready: stage === 'ready', session, signOut, resolve };

  return (
    <Ctx.Provider value={value}>
      {stage === 'ready' ? (
        children
      ) : (
        <main className="page page-narrow">
          <AnimatePresence mode="wait">
            <motion.div key={stage} {...fade}>
              {stage === 'loading' && <p className="quiet center">רגע אחד.</p>}
              {stage === 'unconfigured' && <Notice title="האפליקציה עוד לא מחוברת לשרת" text="חסרים משתני הסביבה של Supabase בפריסה." />}
              {stage === 'signedOut' && <SignIn onDone={resolve} />}
              {stage === 'recovery' && <NewPassword onDone={() => resolve(session)} />}
              {stage === 'enroll' && <Enroll onDone={() => resolve(session)} onCancel={signOut} />}
              {stage === 'challenge' && <Challenge onDone={() => resolve(session)} onCancel={signOut} />}
              {stage === 'notAllowed' && (
                <Notice title="אין לחשבון הזה גישה" text="הכלי פתוח רק למטפלת שהוגדרה בו." action={{ label: 'יציאה', onClick: signOut }} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      )}
    </Ctx.Provider>
  );
}

function Notice({ title, text, action }) {
  return (
    <section className="card card-calm">
      <h1 className="h-display">{title}</h1>
      <p className="quiet">{text}</p>
      {action && (
        <button className="btn btn-ghost" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </section>
  );
}

function SignIn({ onDone }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return setMsg({ tone: 'error', text: errText(error) });
    onDone(data.session);
  };

  const forgot = async () => {
    if (!email.trim()) return setMsg({ tone: 'error', text: 'כתבי קודם את האימייל, ואז לחצי שוב.' });
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/` });
    setBusy(false);
    setMsg(error ? { tone: 'error', text: errText(error) } : { tone: 'ok', text: 'אם האימייל רשום, נשלח אליו קישור לבחירת סיסמה חדשה.' });
  };

  return (
    <section className="card card-calm auth-card">
      <span className="label">כניסה</span>
      <h1 className="h-display">מקום שקט לעבודה</h1>
      <form onSubmit={submit} className="stack">
        <label className="field">
          <span className="label">אימייל</span>
          <input type="email" dir="ltr" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span className="label">סיסמה</span>
          <input type="password" dir="ltr" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {msg && <p className={`msg msg-${msg.tone}`}>{msg.text}</p>}
        <div className="row">
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'נכנסת...' : 'כניסה'}
          </button>
          <button type="button" className="btn btn-link" onClick={forgot} disabled={busy}>
            שחזור סיסמה
          </button>
        </div>
      </form>
    </section>
  );
}

function NewPassword({ onDone }) {
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 10) return setMsg('לפחות עשרה תווים.');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setMsg(errText(error));
    onDone();
  };
  return (
    <section className="card card-calm auth-card">
      <span className="label">סיסמה חדשה</span>
      <h1 className="h-display">בחירת סיסמה</h1>
      <form onSubmit={submit} className="stack">
        <label className="field">
          <span className="label">סיסמה חדשה, לפחות עשרה תווים</span>
          <input type="password" dir="ltr" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </label>
        {msg && <p className="msg msg-error">{msg}</p>}
        <button className="btn btn-primary" disabled={busy}>
          שמירת הסיסמה
        </button>
      </form>
    </section>
  );
}

function CodeInput({ value, onChange }) {
  return (
    <input
      className="code-input"
      dir="ltr"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      pattern="[0-9]{6}"
      aria-label="קוד בן שש ספרות"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
    />
  );
}

function Enroll({ onDone, onCancel }) {
  const [factor, setFactor] = useState(null);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: f } = await supabase.auth.mfa.listFactors();
        for (const old of (f?.all ?? []).filter((x) => x.factor_type === 'totp' && x.status !== 'verified')) {
          await supabase.auth.mfa.unenroll({ factorId: old.id });
        }
        const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `AccBars ${Date.now()}` });
        if (error) throw error;
        setFactor(data);
      } catch (e) {
        setMsg(errText(e));
      }
    })();
  }, []);

  const verify = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    setBusy(false);
    if (error) return setMsg(errText(error));
    onDone();
  };

  return (
    <section className="card card-calm auth-card">
      <span className="label">אימות דו־שלבי, פעם אחת</span>
      <h1 className="h-display">שכבת הגנה נוספת</h1>
      <p className="quiet">המידע כאן רגיש. סרקי את הקוד באפליקציית אימות (כמו Google Authenticator), וכתבי את שש הספרות שמופיעות בה.</p>
      {factor ? (
        <>
          <div className="qr" dangerouslySetInnerHTML={{ __html: decodeQr(factor.totp.qr_code) }} />
          <p className="label secret" dir="ltr">
            {factor.totp.secret}
          </p>
          <form onSubmit={verify} className="stack">
            <CodeInput value={code} onChange={setCode} />
            {msg && <p className="msg msg-error">{msg}</p>}
            <div className="row">
              <button className="btn btn-primary" disabled={busy || code.length !== 6}>
                אישור
              </button>
              <button type="button" className="btn btn-link" onClick={onCancel}>
                יציאה
              </button>
            </div>
          </form>
        </>
      ) : (
        <p className="quiet">{msg || 'מכינה את הקוד.'}</p>
      )}
    </section>
  );
}

function Challenge({ onDone, onCancel }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const verify = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const { data: f } = await supabase.auth.mfa.listFactors();
      const factor = f?.totp?.find((x) => x.status === 'verified');
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
      if (error) throw error;
      onDone();
    } catch (err) {
      setMsg(errText(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="card card-calm auth-card">
      <span className="label">אימות דו־שלבי</span>
      <h1 className="h-display">הקוד מאפליקציית האימות</h1>
      <form onSubmit={verify} className="stack">
        <CodeInput value={code} onChange={setCode} />
        {msg && <p className="msg msg-error">{msg}</p>}
        <div className="row">
          <button className="btn btn-primary" disabled={busy || code.length !== 6}>
            כניסה
          </button>
          <button type="button" className="btn btn-link" onClick={onCancel}>
            יציאה
          </button>
        </div>
      </form>
    </section>
  );
}

// Supabase returns the QR as an SVG data URI; inline it so it scales with the card.
function decodeQr(uri) {
  if (!uri) return '';
  if (uri.startsWith('data:image/svg+xml;utf-8,')) return uri.slice('data:image/svg+xml;utf-8,'.length);
  if (uri.startsWith('data:image/svg+xml;base64,')) return atob(uri.split(',')[1]);
  return `<img alt="קוד לסריקה" src="${uri}" />`;
}
