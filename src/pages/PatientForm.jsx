import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Page, { Loading } from '../components/Page';
import { useToast } from '../components/Toast';
import { addGoals, createPatient, getPatient, updatePatient } from '../lib/data';
import { ENNEAGRAM } from '../lib/enneagram';
import { errText, today } from '../lib/format';

const EMPTY = { full_name: '', age: '', phone: '', opened_on: today(), therapist_name: '', enneagram_type: '', goals: '' };

export default function PatientForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const nav = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(editing ? null : EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    getPatient(id).then(
      (p) =>
        setForm({
          full_name: p.full_name ?? '',
          age: p.age ?? '',
          phone: p.phone ?? '',
          opened_on: p.opened_on ?? today(),
          therapist_name: p.therapist_name ?? '',
          enneagram_type: p.enneagram_type ?? '',
        }),
      () => toast('לא הצלחנו לטעון את הפרטים.', 'error'),
    );
  }, [editing, id, toast]);

  if (!form) return <Page><Loading /></Page>;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) return toast('חסר שם מלא.', 'error');
    setBusy(true);
    const row = {
      full_name: form.full_name.trim(),
      age: form.age === '' ? null : Number(form.age),
      phone: form.phone.trim() || null,
      opened_on: form.opened_on || today(),
      therapist_name: form.therapist_name.trim() || null,
      enneagram_type: form.enneagram_type === '' ? null : Number(form.enneagram_type),
    };
    try {
      if (editing) {
        await updatePatient(id, row);
        toast('הפרטים נשמרו.');
        nav(`/patients/${id}`);
      } else {
        const { id: newId } = await createPatient(row);
        const goals = form.goals
          .split('\n')
          .map((g) => g.trim())
          .filter(Boolean)
          .map((text, position) => ({ patient_id: newId, text, position }));
        if (goals.length) await addGoals(goals);
        toast('המטופל נוסף.');
        nav(`/patients/${newId}`);
      }
    } catch (err) {
      toast(errText(err), 'error');
      setBusy(false);
    }
  };

  return (
    <Page className="page-narrow">
      <Link className="crumb" to={editing ? `/patients/${id}` : '/patients'}>
        {editing ? 'חזרה לכרטיס' : 'חזרה לרשימה'}
      </Link>
      <h1 className="h-display">{editing ? 'עריכת פרטים' : 'מטופל חדש'}</h1>
      <form className="card stack" onSubmit={submit}>
        <label className="field">
          <span className="label">שם מלא</span>
          <input required value={form.full_name} onChange={set('full_name')} autoFocus />
        </label>
        <div className="grid-2">
          <label className="field">
            <span className="label">גיל</span>
            <input type="number" min="0" max="130" inputMode="numeric" value={form.age} onChange={set('age')} />
          </label>
          <label className="field">
            <span className="label">טלפון, לא מוצג ברשימה</span>
            <input type="tel" dir="ltr" value={form.phone} onChange={set('phone')} />
          </label>
          <label className="field">
            <span className="label">תאריך פתיחה</span>
            <input type="date" value={form.opened_on} onChange={set('opened_on')} />
          </label>
          <label className="field">
            <span className="label">מטפלת אחראית</span>
            <input value={form.therapist_name} onChange={set('therapist_name')} />
          </label>
        </div>
        <label className="field">
          <span className="label">טיפוס אניאגרם, השערת עבודה</span>
          <select value={form.enneagram_type} onChange={set('enneagram_type')}>
            <option value="">עוד לא ברור</option>
            {ENNEAGRAM.map((t) => (
              <option key={t.n} value={t.n}>
                {t.n}, {t.name}
              </option>
            ))}
          </select>
        </label>
        {!editing && (
          <label className="field">
            <span className="label">יעדים, בניסוח של המטופל. יעד בכל שורה</span>
            <textarea rows={4} value={form.goals} onChange={set('goals')} />
          </label>
        )}
        <div className="row">
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'שומרת...' : editing ? 'שמירה' : 'הוספת המטופל'}
          </button>
          <Link className="btn btn-link" to={editing ? `/patients/${id}` : '/patients'}>
            ביטול
          </Link>
        </div>
      </form>
    </Page>
  );
}
