import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMenu, useMenuItems } from '../components/Menu';
import Page, { LoadError, Loading } from '../components/Page';
import { useToast } from '../components/Toast';
import {
  deleteSession,
  deleteSessionExercise,
  getPatient,
  getSession,
  listExercises,
  updateExercise,
  updatePatient,
  updateSession,
  upsertSessionExercise,
} from '../lib/data';
import { hasDistressSign, REFERRAL } from '../lib/distress';
import { errText, fmtDate, fromLocalInput, toLocalInput } from '../lib/format';

const STEPS = [
  { key: 'brought', title: 'פתיחה', ask: 'מה המטופל מביא היום?' },
  { key: 'discussed', title: 'רישום', ask: 'מה קרה בסשן?' },
  { key: 'insight', title: 'תובנה אחת', ask: 'תובנה אחת שעלתה.' },
  { key: 'exercise', title: 'תרגיל לשבוע', ask: 'תרגיל אחד, קטן וברור, לשבוע הקרוב.' },
  { key: 'summary', title: 'סיכום במשפט אחד', ask: 'מה המטופל לוקח איתו, במשפט אחד.' },
  { key: 'next', title: 'סשן הבא', ask: 'מתי נפגשים, ומה נשאר פתוח.' },
];

const FIELDS = ['session_date', 'brought', 'discussed', 'insight', 'summary', 'open_points', 'next_session_at'];

export default function Session() {
  const { id, sid } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { setStatus } = useMenu();
  const [s, setS] = useState(null);
  const [patient, setPatient] = useState(null);
  const [exercise, setExercise] = useState('');
  const [prevEx, setPrevEx] = useState(null);
  const [prevNote, setPrevNote] = useState('');
  const [step, setStep] = useState(0);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const saved = useRef(null);
  const savedEx = useRef('');
  const timer = useRef();

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const [sess, pat, exs] = await Promise.all([getSession(sid), getPatient(id), listExercises(id)]);
      const own = exs.find((e) => e.session_id === sid);
      const prev = exs.find((e) => e.session_id !== sid) ?? null;
      setS(sess);
      saved.current = sess;
      setPatient(pat);
      setExercise(own?.description ?? '');
      savedEx.current = own?.description ?? '';
      setPrevEx(prev);
      setPrevNote(prev?.done_note ?? '');
      if (sess.status === 'done') setStep(0);
    } catch {
      setFailed(true);
    }
  }, [id, sid]);
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => () => setStatus(''), [setStatus]);

  const persist = useCallback(
    async (next) => {
      const patch = {};
      for (const f of FIELDS) if ((next[f] ?? null) !== (saved.current?.[f] ?? null)) patch[f] = next[f];
      if (next.risk_ack_at !== saved.current?.risk_ack_at) patch.risk_ack_at = next.risk_ack_at;
      if (!Object.keys(patch).length) return;
      setStatus('שומרת...');
      try {
        await updateSession(sid, patch);
        saved.current = { ...saved.current, ...patch };
        setStatus('נשמר');
      } catch {
        setStatus('לא נשמר, כדאי לנסות שוב');
      }
    },
    [sid, setStatus],
  );

  const change = (k, v) => {
    setS((cur) => {
      const next = { ...cur, [k]: v };
      clearTimeout(timer.current);
      timer.current = setTimeout(() => persist(next), 900);
      return next;
    });
  };

  const saveExercise = useCallback(async () => {
    const d = exercise.trim();
    if (d === savedEx.current) return;
    if (d) await upsertSessionExercise({ session_id: sid, patient_id: id, description: d, given_on: s?.session_date });
    else await deleteSessionExercise(sid);
    savedEx.current = d;
  }, [exercise, sid, id, s?.session_date]);

  const savePrevNote = useCallback(async () => {
    if (!prevEx || (prevEx.done_note ?? '') === prevNote.trim()) return;
    await updateExercise(prevEx.id, { done_note: prevNote.trim() || null });
    setPrevEx((p) => ({ ...p, done_note: prevNote.trim() || null }));
  }, [prevEx, prevNote]);

  useMenuItems(
    s
      ? [
          {
            label: 'מחיקת הסשן',
            onSelect: async () => {
              if (!confirm('למחוק את הסשן? אי אפשר לבטל.')) return;
              try {
                await deleteSession(sid);
                nav(`/patients/${id}`);
              } catch (e) {
                toast(errText(e), 'error');
              }
            },
          },
        ]
      : [],
    [Boolean(s), sid, id],
  );

  if (failed) return <Page><LoadError onRetry={load} /></Page>;
  if (!s || !patient) return <Page><Loading /></Page>;

  const risk = hasDistressSign(s.brought, s.discussed, s.insight, s.summary, s.open_points, exercise, prevNote);
  const blocked = risk && !s.risk_ack_at;
  const last = step === STEPS.length - 1;

  const go = async (to) => {
    clearTimeout(timer.current);
    try {
      await Promise.all([persist(s), saveExercise(), savePrevNote()]);
    } catch (e) {
      toast(errText(e), 'error');
    }
    setStep(to);
  };

  const finish = async () => {
    if (blocked) return;
    if (!s.summary?.trim()) {
      toast('חסר סיכום במשפט אחד. זה מה שהמטופל יראה.', 'error');
      return setStep(4);
    }
    setBusy(true);
    clearTimeout(timer.current);
    try {
      await persist(s);
      await Promise.all([saveExercise(), savePrevNote()]);
      await updateSession(sid, { status: 'done' });
      await updatePatient(id, { next_session_at: s.next_session_at ?? null, open_point: s.open_points?.trim() || null });
      toast('הסשן נשמר.');
      nav(`/patients/${id}`);
    } catch (e) {
      toast(errText(e), 'error');
      setBusy(false);
    }
  };

  const cur = STEPS[step];

  return (
    <Page className="page-narrow">
      <Link className="crumb" to={`/patients/${id}`}>
        {patient.full_name}
      </Link>
      <header className="session-title">
        <span className="label">
          סשן, {fmtDate(s.session_date)}
          {s.status === 'done' ? ', הושלם' : ''}
        </span>
        <h1 className="h-display">{patient.full_name}</h1>
      </header>

      <ol className="stepper" aria-label="שלבי הסשן">
        {STEPS.map((st, i) => (
          <li key={st.key}>
            <button className={`step ${i === step ? 'is-current' : ''} ${i < step ? 'is-past' : ''}`} onClick={() => go(i)} aria-current={i === step ? 'step' : undefined}>
              <span className="step-n">{i + 1}</span>
              <span className="step-t">{st.title}</span>
            </button>
          </li>
        ))}
      </ol>

      <AnimatePresence>
        {risk && (
          <motion.section className="card referral" role="alert" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="h-section">עולה כאן סימן אפשרי למצוקה או לסיכון</h2>
            <p>לפני שממשיכים כרגיל: לוודא שאין סכנה מיידית, ולהפנות לגורם מקצועי מתאים.</p>
            <ul className="referral-list">
              {REFERRAL.map((r) => (
                <li key={r.who}>
                  <span className="label">{r.who}</span>
                  <strong dir="ltr">{r.what}</strong>
                </li>
              ))}
            </ul>
            {s.risk_ack_at ? (
              <p className="quiet small">נרשם שהופנה או שנבדק, {fmtDate(s.risk_ack_at)}.</p>
            ) : (
              <label className="check">
                <input type="checkbox" onChange={(e) => e.target.checked && change('risk_ack_at', new Date().toISOString())} />
                <span>בדקתי שאין סכנה מיידית, או הפניתי לגורם מקצועי</span>
              </label>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.section key={cur.key} className="card step-card" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18 }} transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}>
          <span className="label">
            שלב {step + 1} מתוך {STEPS.length}
          </span>
          <h2 className="h-step">{cur.ask}</h2>

          {cur.key === 'brought' && (
            <>
              {(patient.open_point || prevEx) && (
                <div className="carry">
                  {patient.open_point && (
                    <p>
                      <span className="label">נשאר פתוח מהפעם הקודמת</span> {patient.open_point}
                    </p>
                  )}
                  {prevEx && (
                    <>
                      <p>
                        <span className="label">התרגיל מהשבוע</span> {prevEx.description}
                      </p>
                      <label className="field">
                        <span className="label">מה נעשה בפועל</span>
                        <input value={prevNote} onChange={(e) => setPrevNote(e.target.value)} onBlur={() => savePrevNote().catch(() => toast('לא נשמר.', 'error'))} />
                      </label>
                    </>
                  )}
                </div>
              )}
              <TextStep value={s.brought} onChange={(v) => change('brought', v)} />
            </>
          )}
          {cur.key === 'discussed' && <TextStep rows={7} value={s.discussed} onChange={(v) => change('discussed', v)} />}
          {cur.key === 'insight' && <TextStep rows={2} value={s.insight} onChange={(v) => change('insight', v)} />}
          {cur.key === 'exercise' && <TextStep rows={3} value={exercise} onChange={setExercise} onBlur={() => saveExercise().catch(() => toast('לא נשמר.', 'error'))} />}
          {cur.key === 'summary' && (
            <>
              <TextStep rows={2} value={s.summary} onChange={(v) => change('summary', v)} />
              <p className="quiet small">זה המסר שהמטופל יראה במסך שלו.</p>
            </>
          )}
          {cur.key === 'next' && (
            <div className="stack">
              <div className="grid-2">
                <label className="field">
                  <span className="label">תאריך הסשן הזה</span>
                  <input type="date" value={s.session_date ?? ''} onChange={(e) => change('session_date', e.target.value)} />
                </label>
                <label className="field">
                  <span className="label">הסשן הבא</span>
                  <input type="datetime-local" value={toLocalInput(s.next_session_at)} onChange={(e) => change('next_session_at', fromLocalInput(e.target.value))} />
                </label>
              </div>
              <label className="field">
                <span className="label">נקודה פתוחה לסשן הבא</span>
                <textarea rows={2} value={s.open_points ?? ''} onChange={(e) => change('open_points', e.target.value)} />
              </label>
            </div>
          )}

          <div className="row step-nav">
            {step > 0 && (
              <button className="btn btn-link" onClick={() => go(step - 1)}>
                הקודם
              </button>
            )}
            <span className="spacer" />
            {last ? (
              <button className="btn btn-primary" onClick={finish} disabled={busy || blocked}>
                {busy ? 'שומרת...' : 'סיום הסשן'}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => go(step + 1)} disabled={blocked}>
                הבא
              </button>
            )}
          </div>
        </motion.section>
      </AnimatePresence>
    </Page>
  );
}

function TextStep({ value, onChange, onBlur, rows = 4 }) {
  return <textarea className="big-text" rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} autoFocus />;
}
