import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMenuItems } from '../components/Menu';
import Page, { LoadError, Loading } from '../components/Page';
import { useToast } from '../components/Toast';
import {
  addGoals,
  createSession,
  deleteGoal,
  deletePatient,
  deleteSession,
  getPatient,
  listExercises,
  listGoals,
  listSessions,
  rotateToken,
  updateExercise,
} from '../lib/data';
import Enneagram from '../components/viz/Enneagram';
import GoalMap from '../components/viz/GoalMap';
import Journey from '../components/viz/Journey';
import PatientBars from '../components/PatientBars';
import { enneagramLabel } from '../lib/enneagram';
import { errText, fmtDate, fmtWhen } from '../lib/format';

export default function PatientCard() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const [patient, goals, sessions, exercises] = await Promise.all([getPatient(id), listGoals(id), listSessions(id), listExercises(id)]);
      setData({ patient, goals, sessions, exercises });
    } catch {
      setFailed(true);
    }
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);

  const shareUrl = data ? `${location.origin}/p/${data.patient.share_token}` : '';

  useMenuItems(
    data
      ? [
          { label: editing ? 'סיום עריכה' : 'מצב עריכה', hint: editing ? 'פעיל' : 'כבוי', pressed: editing, onSelect: () => setEditing((v) => !v) },
          { label: 'עריכת פרטי המטופל', onSelect: () => nav(`/patients/${id}/edit`) },
          {
            label: 'קישור חדש למסך המטופל',
            hint: 'הקישור הקודם יפסיק לעבוד',
            onSelect: async () => {
              if (!confirm('ליצור קישור חדש? הקישור שנשלח קודם יפסיק לעבוד.')) return;
              try {
                const token = await rotateToken(id);
                setData((d) => ({ ...d, patient: { ...d.patient, share_token: token } }));
                toast('נוצר קישור חדש.');
              } catch (e) {
                toast(errText(e), 'error');
              }
            },
          },
          {
            label: 'מחיקת המטופל',
            hint: 'כולל כל הסשנים',
            onSelect: async () => {
              if (!confirm(`למחוק את ${data.patient.full_name} ואת כל הסשנים? אי אפשר לבטל.`)) return;
              try {
                await deletePatient(id);
                toast('המטופל נמחק.');
                nav('/patients');
              } catch (e) {
                toast(errText(e), 'error');
              }
            },
          },
        ]
      : [],
    [data, editing, id],
  );

  const exBySession = useMemo(() => Object.fromEntries((data?.exercises ?? []).filter((e) => e.session_id).map((e) => [e.session_id, e])), [data]);

  if (failed) return <Page><LoadError onRetry={load} /></Page>;
  if (!data) return <Page><Loading /></Page>;
  const { patient, goals, sessions } = data;

  const startSession = async () => {
    setBusy(true);
    try {
      const draft = sessions.find((s) => s.status === 'draft');
      const sid = draft ? draft.id : (await createSession(id)).id;
      nav(`/patients/${id}/sessions/${sid}`);
    } catch (e) {
      toast(errText(e), 'error');
      setBusy(false);
    }
  };

  const addGoal = async (e) => {
    e.preventDefault();
    const text = newGoal.trim();
    if (!text) return;
    try {
      await addGoals([{ patient_id: id, text, position: goals.length }]);
      setNewGoal('');
      load();
    } catch (err) {
      toast(errText(err), 'error');
    }
  };

  const removeGoal = async (g) => {
    if (!confirm('למחוק את היעד?')) return;
    try {
      await deleteGoal(g.id);
      load();
    } catch (err) {
      toast(errText(err), 'error');
    }
  };

  const removeSession = async (s) => {
    if (!confirm(`למחוק את הסשן מ-${fmtDate(s.session_date)}?`)) return;
    try {
      await deleteSession(s.id);
      load();
    } catch (err) {
      toast(errText(err), 'error');
    }
  };

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast('הקישור הועתק. אפשר לשלוח אותו למטופל.');
    } catch {
      prompt('הקישור למסך המטופל:', shareUrl);
    }
  };

  const draft = sessions.find((s) => s.status === 'draft');

  return (
    <Page>
      <Link className="crumb" to="/patients">
        חזרה לרשימה
      </Link>
      <div className={patient.enneagram_type ? 'hero-split' : ''}>
      <section className="hero hero-card">
        <span className="label">כרטיס מטופל</span>
        <h1 className="h-hero">{patient.full_name}</h1>
        <dl className="facts">
          {patient.age != null && (
            <div>
              <dt className="label">גיל</dt>
              <dd>{patient.age}</dd>
            </div>
          )}
          <div>
            <dt className="label">נפתח</dt>
            <dd>{fmtDate(patient.opened_on)}</dd>
          </div>
          {patient.therapist_name && (
            <div>
              <dt className="label">מטפלת</dt>
              <dd>{patient.therapist_name}</dd>
            </div>
          )}
          {patient.phone && (
            <div>
              <dt className="label">טלפון</dt>
              <dd dir="ltr">{patient.phone}</dd>
            </div>
          )}
          {patient.enneagram_type && (
            <div>
              <dt className="label">אניאגרם, השערה</dt>
              <dd>{enneagramLabel(patient.enneagram_type)}</dd>
            </div>
          )}
          <div>
            <dt className="label">סשן הבא</dt>
            <dd>{patient.next_session_at ? fmtWhen(patient.next_session_at) : 'לא נקבע'}</dd>
          </div>
        </dl>
        <div className="row">
          <button className="btn btn-primary" onClick={startSession} disabled={busy}>
            {draft ? 'המשך הסשן הפתוח' : 'סשן חדש'}
          </button>
        </div>
      </section>
      {patient.enneagram_type && <Enneagram active={patient.enneagram_type} size={300} caption="השערת עבודה" />}
      </div>

      {sessions.length > 0 && (
        <section className="card journey-card">
          <span className="label">המסע</span>
          <Journey sessions={sessions} exercises={data.exercises} patientId={id} />
        </section>
      )}
      {sessions.some((x) => x.bars?.length) && <PatientBars sessions={sessions} />}

      <div className="card-grid">
        <section className="card">
          <h2 className="h-section">יעדים</h2>
          <p className="quiet small">בניסוח של המטופל</p>
          {goals.length === 0 ? (
            <p className="quiet">עוד לא נרשמו יעדים.</p>
          ) : (
            <ul className="goals">
              {goals.map((g) => (
                <li key={g.id}>
                  <span>{g.text}</span>
                  {editing && (
                    <button className="btn btn-link btn-danger" onClick={() => removeGoal(g)} aria-label={`מחיקת היעד ${g.text}`}>
                      מחיקה
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {sessions.length > 0 && goals.length > 0 && <GoalMap goals={goals} sessions={sessions} />}
          <form className="inline-add" onSubmit={addGoal}>
            <input value={newGoal} onChange={(e) => setNewGoal(e.target.value)} placeholder="יעד נוסף" aria-label="יעד נוסף" />
            <button className="btn btn-ghost" disabled={!newGoal.trim()}>
              הוספה
            </button>
          </form>
        </section>

        <section className="card card-share">
          <h2 className="h-section">מסך המטופל</h2>
          <p className="quiet small">מסר אחד ותרגיל אחד מהסשן האחרון. בלי מדדים ובלי ציונים.</p>
          <div className="row">
            <button className="btn btn-ghost" onClick={copyShare}>
              העתקת הקישור למטופל
            </button>
            <a className="btn btn-link" href={shareUrl} target="_blank" rel="noreferrer">
              תצוגה
            </a>
          </div>
        </section>
      </div>

      <section className="sessions">
        <h2 className="h-section">סשנים</h2>
        {sessions.length === 0 ? (
          <div className="card card-calm empty">
            <p className="h-quiet">עוד לא נרשם סשן.</p>
            <button className="btn btn-ghost" onClick={startSession} disabled={busy}>
              להתחיל מכאן
            </button>
          </div>
        ) : (
          <ol className="timeline">
            {sessions.map((s, i) => (
              <motion.li key={s.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: Math.min(i, 6) * 0.07 }}>
                <article className="card session-item">
                  <header className="session-head">
                    <span className="label">{fmtDate(s.session_date)}</span>
                    {s.status === 'draft' && <span className="tag">טיוטה</span>}
                    {s.risk_ack_at && <span className="tag tag-risk">נרשמה הפניה</span>}
                    <span className="spacer" />
                    <Link className="btn btn-link" to={`/patients/${id}/sessions/${s.id}`}>
                      {s.status === 'draft' ? 'המשך' : 'פתיחה'}
                    </Link>
                    {editing && (
                      <button className="btn btn-link btn-danger" onClick={() => removeSession(s)}>
                        מחיקה
                      </button>
                    )}
                  </header>
                  {s.summary && <p className="session-summary">{s.summary}</p>}
                  {s.insight && (
                    <p>
                      <span className="label">תובנה</span> {s.insight}
                    </p>
                  )}
                  {!s.summary && !s.insight && s.discussed && <p className="quiet">{s.discussed}</p>}
                  {exBySession[s.id] && <ExerciseLine ex={exBySession[s.id]} onSaved={load} />}
                  {s.open_points && (
                    <p className="quiet small">
                      <span className="label">פתוח לסשן הבא</span> {s.open_points}
                    </p>
                  )}
                </article>
              </motion.li>
            ))}
          </ol>
        )}
      </section>
    </Page>
  );
}

function ExerciseLine({ ex, onSaved }) {
  const toast = useToast();
  const [note, setNote] = useState(ex.done_note ?? '');
  useEffect(() => setNote(ex.done_note ?? ''), [ex.done_note]);
  const save = async () => {
    if ((ex.done_note ?? '') === note.trim()) return;
    try {
      await updateExercise(ex.id, { done_note: note.trim() || null });
      toast('נשמר.');
      onSaved();
    } catch (e) {
      toast(errText(e), 'error');
    }
  };
  return (
    <div className="exercise">
      <p>
        <span className="label">תרגיל לשבוע</span> {ex.description}
      </p>
      <label className="field field-inline">
        <span className="label">מה נעשה בפועל</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} onBlur={save} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
      </label>
    </div>
  );
}
