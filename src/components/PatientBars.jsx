import { useMemo, useState } from 'react';
import { BARS, VIEWS, barByKey } from '../lib/bars';
import { fmtDate } from '../lib/format';
import HeadMap from './viz/HeadMap';

/** Which bars were run across this patient's sessions. A record, not a score. */
export default function PatientBars({ sessions }) {
  const [view, setView] = useState('side');
  const [focus, setFocus] = useState(null);
  const counts = useMemo(() => {
    const c = {};
    for (const s of sessions) for (const k of s.bars ?? []) c[k] = (c[k] ?? 0) + 1;
    return c;
  }, [sessions]);
  const last = sessions.find((s) => s.bars?.length);
  const f = focus && barByKey(focus);
  const when = f ? sessions.filter((s) => s.bars?.includes(f.key)).map((s) => fmtDate(s.session_date)) : [];
  const viewCount = (v) => BARS.filter((b) => b.view === v && counts[b.key]).length;
  return (
    <section className="card patient-bars">
      <span className="label">מפת הבארס של המטופל</span>
      <div className="row" role="group" aria-label="מבט">
        {VIEWS.map((v) => (
          <button key={v.key} className={`chip chip-quiet ${view === v.key ? 'is-on' : ''}`} aria-pressed={view === v.key} onClick={() => setView(v.key)}>
            {v.name}
            {viewCount(v.key) ? ` (${viewCount(v.key)})` : ''}
          </button>
        ))}
      </div>
      <div className="picker-split">
        <HeadMap view={view} focus={focus} onFocus={setFocus} onPick={setFocus} counts={counts} selected={last?.bars ?? []} />
        <div className="picker-side">
          {f ? (
            <>
              <h3 className="h-section">{f.he}</h3>
              <p className="quiet small">{f.theme}</p>
              <p className="small">{when.length ? `הורץ ב-${when.length} סשנים: ${when.join(', ')}` : 'עוד לא הורץ אצל המטופל.'}</p>
            </>
          ) : (
            <p className="quiet small">נקודה גדולה ובהירה יותר הורצה ביותר סשנים. מסגרת כהה מסמנת את הסשן האחרון. מעבר על נקודה מראה מתי הורצה.</p>
          )}
        </div>
      </div>
    </section>
  );
}
