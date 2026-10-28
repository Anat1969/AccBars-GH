import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Page, { LoadError, Loading } from '../components/Page';
import Enneagram from '../components/viz/Enneagram';
import WeekRing from '../components/viz/WeekRing';
import { listPatients } from '../lib/data';
import { fmtWhen } from '../lib/format';

export default function Patients() {
  const [rows, setRows] = useState(null);
  const [failed, setFailed] = useState(false);
  const [term, setTerm] = useState('');

  const load = useCallback(() => {
    setFailed(false);
    listPatients().then(setRows, () => setFailed(true));
  }, []);
  useEffect(load, [load]);

  const shown = useMemo(() => {
    const t = term.trim();
    return (rows ?? []).filter((r) => !t || r.full_name.includes(t));
  }, [rows, term]);

  const next = (rows ?? []).find((r) => r.next_session_at && new Date(r.next_session_at) > new Date());
  const counts = useMemo(() => (rows ?? []).reduce((m, r) => (r.enneagram_type ? { ...m, [r.enneagram_type]: (m[r.enneagram_type] ?? 0) + 1 } : m), {}), [rows]);
  const hasTypes = Object.keys(counts).length > 0;

  return (
    <Page>
      <section className="hero">
        <span className="label">מטופלים</span>
        <h1 className="h-hero">
          {next ? (
            <>
              הסשן הבא: <span className="light-point">{next.full_name}</span>
            </>
          ) : (
            'מה מחכה היום'
          )}
        </h1>
        {next && <p className="quiet">{fmtWhen(next.next_session_at)}</p>}
      </section>

      {rows?.length > 0 && (
        <section className={`dash ${hasTypes ? '' : 'dash-single'}`}>
          <div className="card dash-card">
            <span className="label">השבוע</span>
            <WeekRing patients={rows} />
          </div>
          {hasTypes && (
            <div className="card dash-card">
              <span className="label">מפת האניאגרם של המטופלים</span>
              <Enneagram counts={counts} caption="כל טיפה היא מטופל עם השערת עבודה." />
            </div>
          )}
        </section>
      )}

      <div className="toolbar">
        <label className="field field-search">
          <span className="label">חיפוש לפי שם</span>
          <input type="search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="שם המטופל" />
        </label>
        <Link className="btn btn-primary" to="/patients/new">
          מטופל חדש
        </Link>
      </div>

      {failed ? (
        <LoadError onRetry={load} />
      ) : rows === null ? (
        <Loading />
      ) : rows.length === 0 ? (
        <section className="card card-calm empty">
          <p className="h-quiet">אין עדיין מטופלים.</p>
          <Link className="btn btn-ghost" to="/patients/new">
            להוסיף מטופל ראשון
          </Link>
        </section>
      ) : shown.length === 0 ? (
        <p className="quiet center">אין מטופל בשם הזה.</p>
      ) : (
        <ul className="patient-list">
          {shown.map((p, i) => (
            <motion.li key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: Math.min(i, 8) * 0.06 }}>
              <Link to={`/patients/${p.id}`} className="patient-row card">
                <span className="patient-name">{p.full_name}</span>
                <span className="patient-next">
                  <span className="label">סשן הבא</span>
                  {p.next_session_at ? fmtWhen(p.next_session_at) : 'לא נקבע'}
                </span>
                <span className="patient-open">
                  <span className="label">פתוח</span>
                  {p.open_point || 'אין נקודה פתוחה'}
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </Page>
  );
}
