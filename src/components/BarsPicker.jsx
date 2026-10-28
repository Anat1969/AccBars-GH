import { useState } from 'react';
import { BARS, VIEWS, barByKey } from '../lib/bars';
import HeadMap from './viz/HeadMap';
import { Swatch } from '../pages/Bars';

/** Mark the bars that were run in this session, on the head itself. */
export default function BarsPicker({ value, onChange }) {
  const [view, setView] = useState('side');
  const [focus, setFocus] = useState(null);
  const toggle = (k) => onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  const all = () => onChange(BARS.map((b) => b.key));
  const f = focus && barByKey(focus);
  return (
    <section className="bars-picker" aria-label="אילו בארס הורצו">
      <header className="row">
        <span className="label">אילו בארס הורצו</span>
        <span className="spacer" />
        <button type="button" className="btn btn-link" onClick={all}>
          כל הבארס
        </button>
        {value.length > 0 && (
          <button type="button" className="btn btn-link" onClick={() => onChange([])}>
            ניקוי
          </button>
        )}
      </header>
      <div className="row" role="group" aria-label="מבט">
        {VIEWS.map((v) => {
          const n = BARS.filter((b) => b.view === v.key && value.includes(b.key)).length;
          return (
            <button type="button" key={v.key} className={`chip chip-quiet ${view === v.key ? 'is-on' : ''}`} aria-pressed={view === v.key} onClick={() => setView(v.key)}>
              {v.name}
              {n ? ` (${n})` : ''}
            </button>
          );
        })}
      </div>
      <div className="picker-split">
        <HeadMap view={view} focus={focus} onFocus={setFocus} selected={value} onPick={toggle} />
        <div className="picker-side">
          <p className="quiet small">{f ? `${f.he}: ${f.theme}` : 'לחיצה על נקודה מסמנת אותה. לחיצה נוספת מבטלת.'}</p>
          <ul className="bar-chips">
            {value.map((k) => {
              const b = barByKey(k);
              return (
                <li key={k}>
                  <button type="button" className="bar-chip is-on" onClick={() => toggle(k)} aria-label={`הסרת ${b.he}`}>
                    <Swatch b={b} />
                    {b.he}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
