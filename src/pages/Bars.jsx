import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import Page from '../components/Page';
import HeadMap from '../components/viz/HeadMap';
import { BARS, GROUPS, SOURCE, VIEWS, barByKey, groupName } from '../lib/bars';

const ease = [0.22, 0.61, 0.36, 1];
const rise = (i = 0) => ({ initial: { opacity: 0, y: 26 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.25 }, transition: { duration: 1, delay: i * 0.08, ease } });

const SESSION = [
  { t: 'שיחה קצרה', d: 'מה מביאים היום.', w: 10 },
  { t: 'שכיבה בלבוש מלא', d: 'על מיטת טיפולים, בנוחות.', w: 6 },
  { t: 'הרצת הבארס', d: 'מגע עדין מאוד בנקודות, לרוב בזוגות.', w: 64 },
  { t: 'סיום', d: 'רגע של שקט, ומילה על מה שהורגש.', w: 10 },
];

export function Swatch({ b, size = 14 }) {
  const bg = b.color === 'iridescent' ? 'linear-gradient(135deg,#e9b8c9,#b9d6e8,#cfe5b8,#f0d79c)' : b.color || 'radial-gradient(circle at 35% 30%,#fff,#fbf4ea 60%,#dcc4a8)';
  return <span className="swatch" style={{ width: size, height: size, background: bg }} aria-hidden="true" />;
}

export function BarInfo({ b }) {
  if (!b) return <p className="quiet">מעבר על נקודה במפה מציג את שמה, את מיקומה ואת הנושא שלה לפי השיטה.</p>;
  const partner = b.with && barByKey(b.with);
  return (
    <AnimatePresence mode="wait">
      <motion.div key={b.key} className="bar-info" initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.7, ease }}>
        <div className="row">
          <Swatch b={b} size={18} />
          <span className="label" dir="ltr">{b.en}</span>
          <span className="tag">{groupName(b.group)}</span>
        </div>
        <h3 className="h-display">{b.he}</h3>
        <p className="bar-theme">{b.theme}</p>
        <dl className="facts">
          <div>
            <dt className="label">איפה</dt>
            <dd>{b.where}</dd>
          </div>
          {partner && (
            <div>
              <dt className="label">רץ יחד עם</dt>
              <dd>{partner.he}</dd>
            </div>
          )}
          <div>
            <dt className="label">נקודות במפה</dt>
            <dd>{b.pts.length}</dd>
          </div>
        </dl>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Bars() {
  const [view, setView] = useState('side');
  const [focus, setFocus] = useState('money');
  const [group, setGroup] = useState('');
  const mapRef = useRef(null);
  const still = useReducedMotion();
  const b = barByKey(focus);
  const inView = BARS.filter((x) => x.view === view && (!group || x.group === group));

  const show = (key) => {
    const x = barByKey(key);
    setView(x.view);
    setFocus(key);
    mapRef.current?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <Page>
      <section className="hero bars-hero">
        <span className="label" dir="ltr">Access Bars®</span>
        <h1 className="h-hero">
          32 נקודות על <span className="light-point">הראש</span>
        </h1>
        <p className="hero-lead">
          לפי השיטה, שפיתח גארי דאגלס בשנות ה-90 כחלק מ-Access Consciousness, יש על הראש 32 נקודות, ולכל אחת נושא בחיים: כסף, שליטה, יצירתיות, גוף, שמחה ועוד.
          בסשן המטופל שוכב בלבוש מלא, והמטפלת נוגעת בנקודות בעדינות. זה נקרא "להריץ בארס".
        </p>
      </section>

      <section ref={mapRef} className="bars-explorer card">
        <div className="bars-controls">
          <div className="row" role="group" aria-label="מבט">
            {VIEWS.map((v) => (
              <button key={v.key} className={`chip ${view === v.key ? 'is-on' : ''}`} aria-pressed={view === v.key} onClick={() => { setView(v.key); setFocus(BARS.find((x) => x.view === v.key).key); }}>
                {v.name}
              </button>
            ))}
          </div>
          <div className="row" role="group" aria-label="קבוצה">
            {[{ key: '', name: 'כל הקבוצות' }, ...GROUPS].map((g) => (
              <button key={g.key || 'all'} className={`chip chip-quiet ${group === g.key ? 'is-on' : ''}`} aria-pressed={group === g.key} onClick={() => setGroup(g.key)}>
                {g.name}
              </button>
            ))}
          </div>
        </div>
        <div className="bars-split">
          <HeadMap view={view} focus={focus} onFocus={setFocus} onPick={setFocus} dim={(x) => group && x.group !== group} />
          <div className="bars-side">
            <BarInfo b={b} />
            <ul className="bar-chips">
              {inView.map((x) => (
                <li key={x.key}>
                  <button className={`bar-chip ${x.key === focus ? 'is-on' : ''}`} onClick={() => setFocus(x.key)}>
                    <Swatch b={x} />
                    {x.he}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bars-all">
        <motion.header {...rise()}>
          <span className="label">כל הבארס</span>
          <h2 className="h-display">ארבע קבוצות, לצורך התמצאות.</h2>
          <p className="quiet">הקיבוץ שלנו, לא של השיטה. לחיצה על בר מציגה אותו במפה.</p>
        </motion.header>
        <div className="group-grid">
          {GROUPS.map((g, gi) => (
            <motion.article key={g.key} className="card group-card" {...rise(gi)}>
              <h3 className="h-section">{g.name}</h3>
              <ul>
                {BARS.filter((x) => x.group === g.key).map((x) => (
                  <li key={x.key}>
                    <button className="bar-row" onClick={() => show(x.key)}>
                      <Swatch b={x} />
                      <span className="bar-row-name">{x.he}</span>
                      <span className="quiet small">{x.theme}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </section>

      <SessionTimeline />
      <Quiz />

      <section className="card care-note">
        <h2 className="h-section">חשוב לדעת</h2>
        <p>
          Access Bars היא שיטה אלטרנטיבית. התיאורים כאן הם לפי השיטה, ואינם ממצאים מדעיים. השיטה אינה מאבחנת, אינה מרפאת ואינה מחליפה טיפול רפואי או נפשי.
          המיקומים במפה סכמטיים, ונועדו להתמצאות. הלימוד המעשי נעשה בקורס Access Bars.
        </p>
        <p className="quiet small">
          מקור המיקומים: <a href={SOURCE.url} target="_blank" rel="noreferrer">{SOURCE.label}</a>. Access Bars® הוא סימן של Access Consciousness.
        </p>
      </section>
    </Page>
  );
}

function SessionTimeline() {
  const still = useReducedMotion();
  let acc = 0;
  return (
    <section className="timeline-section">
      <motion.header {...rise()}>
        <span className="label">איך נראה סשן</span>
        <h2 className="h-display">שעה עד שעה וחצי, רובה בשקט.</h2>
      </motion.header>
      <div className="session-bar" role="list">
        {SESSION.map((s, i) => {
          const start = acc;
          acc += s.w;
          return (
            <motion.div key={s.t} role="listitem" className={`session-seg seg-${i}`} style={{ insetInlineStart: `${start}%`, width: `${s.w}%` }}
              initial={{ scaleX: still ? 1 : 0, opacity: 0 }} whileInView={{ scaleX: 1, opacity: 1 }} viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1.2, delay: still ? 0 : 0.3 + i * 0.35, ease }} />
          );
        })}
      </div>
      <ol className="session-legend">
        {SESSION.map((s, i) => (
          <motion.li key={s.t} {...rise(i)}>
            <span className={`legend-dot seg-${i}`} aria-hidden="true" />
            <strong>{s.t}</strong>
            <span className="quiet small">{s.d}</span>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

function Quiz() {
  const order = useMemo(() => BARS.map((b) => b.key).sort(() => Math.random() - 0.5), []);
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState(null); // { key, right }
  const target = barByKey(order[i % order.length]);
  const pick = (key) => setAnswer({ key, right: key === target.key });
  const next = () => {
    setAnswer(null);
    setI((n) => n + 1);
  };
  return (
    <section className="quiz card">
      <div className="quiz-head">
        <span className="label">תרגול מיקום</span>
        <h2 className="h-display">
          איפה נמצא הבר <span className="quiz-target">{target.he}</span>?
        </h2>
        <p className="quiet small">לחיצה על נקודה במפה. המפה מוצגת במבט הנכון.</p>
        <AnimatePresence mode="wait">
          {answer && (
            <motion.div key={answer.key + i} className={`msg ${answer.right ? 'msg-ok' : 'msg-error'}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
              {answer.right ? `נכון. ${target.where}` : `זה ${barByKey(answer.key).he}. אפשר לנסות שוב.`}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="row">
          <button className="btn btn-ghost" onClick={next}>
            {answer?.right ? 'הבר הבא' : 'לדלג'}
          </button>
        </div>
      </div>
      <HeadMap view={target.view} focus={answer?.right ? target.key : answer?.key} onPick={pick} label={Boolean(answer)} />
    </section>
  );
}
