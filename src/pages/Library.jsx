import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMenuItems } from '../components/Menu';
import Page from '../components/Page';
import PracticeCard from '../components/PracticeCard';
import { useToast } from '../components/Toast';
import Enneagram from '../components/viz/Enneagram';
import { addLibraryItem, deleteLibraryItem, listLibrary } from '../lib/data';
import { ENNEAGRAM } from '../lib/enneagram';
import { errText } from '../lib/format';
import { KINDS, LIBRARY } from '../lib/library';

export default function Library() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const type = Number(params.get('type')) || null;
  const kind = params.get('kind') || '';
  const [term, setTerm] = useState('');
  const [own, setOwn] = useState([]);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => listLibrary().then(setOwn, () => setOwn([])), []);
  useEffect(() => {
    load();
  }, [load]);

  const set = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };

  useMenuItems(
    [
      { label: editing ? 'סיום עריכה' : 'מצב עריכה', hint: editing ? 'פעיל' : 'כבוי', pressed: editing, onSelect: () => setEditing((v) => !v) },
      { label: 'תרגיל חדש לספרייה', onSelect: () => setAdding(true) },
    ],
    [editing],
  );

  const all = useMemo(() => [...own, ...LIBRARY], [own]);
  const shown = useMemo(() => {
    const t = term.trim();
    return all.filter(
      (x) =>
        (!type || x.types.includes(type) || !x.types.length) &&
        (!kind || x.kind === kind) &&
        (!t || x.title.includes(t) || (x.invite ?? '').includes(t) || x.steps.some((s) => s.includes(t))),
    );
  }, [all, type, kind, term]);

  const counts = useMemo(() => Object.fromEntries(ENNEAGRAM.map((t) => [t.n, all.filter((x) => x.types.includes(t.n)).length])), [all]);
  const tinfo = ENNEAGRAM.find((t) => t.n === type);

  const remove = async (x) => {
    if (!confirm(`למחוק את "${x.title}" מהספרייה?`)) return;
    try {
      await deleteLibraryItem(x.id);
      load();
    } catch (e) {
      toast(errText(e), 'error');
    }
  };

  return (
    <Page>
      <section className="hero library-hero">
        <div>
          <span className="label">ספריית תרגול</span>
          <h1 className="h-hero">
            תרגיל, משחק, <span className="light-point">חוויה</span>
          </h1>
          <p className="quiet">
            {tinfo ? `לטיפוס ${tinfo.n}, ${tinfo.name}: ${tinfo.core}. וגם מה שמתאים לכולם.` : 'בחירה בנקודה על המעגל מציגה את מה שמתאים לטיפוס. לחיצה על כרטיס הופכת אותו לשלבים.'}
          </p>
          <div className="row filters" role="group" aria-label="סוג">
            {['', ...KINDS].map((k) => (
              <button key={k || 'all'} className={`chip ${kind === k ? 'is-on' : ''}`} aria-pressed={kind === k} onClick={() => set('kind', k)}>
                {k || 'הכול'}
              </button>
            ))}
          </div>
          <label className="field field-search">
            <span className="label">חיפוש</span>
            <input type="search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="מילה מתוך תרגיל" />
          </label>
        </div>
        <div className="library-wheel">
          <Enneagram active={type} counts={counts} onSelect={(n) => set('type', n === type ? '' : String(n))} size={360} caption="כל טיפה היא פריט בספרייה." />
          {type && (
            <button className="btn btn-link" onClick={() => set('type', '')}>
              כל הטיפוסים
            </button>
          )}
        </div>
      </section>

      <p className="label">{shown.length} פריטים</p>
      {shown.length === 0 ? (
        <p className="quiet center">אין פריט שמתאים לחיפוש.</p>
      ) : (
        <ul className="practice-grid">
          {shown.map((x, i) => (
            <PracticeCard key={`${x.key}-${type}-${kind}`} item={x} index={i} onDelete={editing && x.own ? remove : undefined} />
          ))}
        </ul>
      )}

      <AnimatePresence>{adding && <AddItem defaultType={type} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />}</AnimatePresence>
    </Page>
  );
}

function AddItem({ defaultType, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({ title: '', kind: 'תרגיל', types: defaultType ? [defaultType] : [], minutes: '', invite: '', steps: '' });
  const [busy, setBusy] = useState(false);
  const toggle = (n) => setF((x) => ({ ...x, types: x.types.includes(n) ? x.types.filter((t) => t !== n) : [...x.types, n] }));
  const save = async (e) => {
    e.preventDefault();
    if (!f.title.trim()) return toast('חסרה כותרת.', 'error');
    setBusy(true);
    try {
      await addLibraryItem({
        title: f.title.trim(),
        kind: f.kind,
        types: f.types,
        minutes: f.minutes ? Number(f.minutes) : null,
        invite: f.invite.trim() || null,
        steps: f.steps.split('\n').map((s) => s.trim()).filter(Boolean),
      });
      toast('נוסף לספרייה.');
      onSaved();
    } catch (err) {
      toast(errText(err), 'error');
      setBusy(false);
    }
  };
  return (
    <motion.div className="sheet-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} onClick={onClose}>
      <motion.form className="card sheet stack" role="dialog" aria-modal="true" aria-label="תרגיל חדש לספרייה" onSubmit={save} onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}>
        <h2 className="h-display">פריט חדש לספרייה</h2>
        <label className="field">
          <span className="label">כותרת</span>
          <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} autoFocus />
        </label>
        <div className="row" role="group" aria-label="סוג">
          {KINDS.map((k) => (
            <button type="button" key={k} className={`chip ${f.kind === k ? 'is-on' : ''}`} aria-pressed={f.kind === k} onClick={() => setF({ ...f, kind: k })}>
              {k}
            </button>
          ))}
        </div>
        <div className="field">
          <span className="label">לאילו טיפוסים, בלי בחירה מתאים לכולם</span>
          <div className="row">
            {ENNEAGRAM.map((t) => (
              <button type="button" key={t.n} className={`chip ${f.types.includes(t.n) ? 'is-on' : ''}`} aria-pressed={f.types.includes(t.n)} onClick={() => toggle(t.n)}>
                {t.n}, {t.name}
              </button>
            ))}
          </div>
        </div>
        <div className="grid-2">
          <label className="field">
            <span className="label">דקות</span>
            <input type="number" min="1" max="240" value={f.minutes} onChange={(e) => setF({ ...f, minutes: e.target.value })} />
          </label>
          <label className="field">
            <span className="label">למה זה מזמין, במשפט</span>
            <input value={f.invite} onChange={(e) => setF({ ...f, invite: e.target.value })} />
          </label>
        </div>
        <label className="field">
          <span className="label">שלבים, שלב בכל שורה</span>
          <textarea rows={4} value={f.steps} onChange={(e) => setF({ ...f, steps: e.target.value })} />
        </label>
        <div className="row">
          <button className="btn btn-primary" disabled={busy}>
            הוספה לספרייה
          </button>
          <button type="button" className="btn btn-link" onClick={onClose}>
            ביטול
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
