import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthGate';
import Page from '../components/Page';
import Enneagram from '../components/viz/Enneagram';
import { ENNEAGRAM } from '../lib/enneagram';
import { LIBRARY, TYPE_HUE } from '../lib/library';
import HeadMap from '../components/viz/HeadMap';
import { BARS, VIEWS, barByKey } from '../lib/bars';

const ease = [0.22, 0.61, 0.36, 1];
const rise = (i = 0) => ({ initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.3 }, transition: { duration: 1.1, delay: i * 0.12, ease } });

const STEPS = [
  { t: 'פתיחה', d: 'מה המטופל מביא היום, ומה נשאר פתוח מהפעם הקודמת.' },
  { t: 'רישום', d: 'מה קרה בסשן, אילו בארס הורצו, ולאיזה יעד זה נגע.' },
  { t: 'תובנה אחת', d: 'אחת מספיקה. היא מכוונת את ההמשך.' },
  { t: 'תרגיל לשבוע', d: 'הצעות מהספרייה לפי הטיפוס ולפי מה שעלה בתובנה.' },
  { t: 'סיכום במשפט', d: 'מה המטופל לוקח איתו. זה המסר שהוא יראה.' },
  { t: 'סשן הבא', d: 'מועד, ונקודה פתוחה שתפתח את המפגש הבא.' },
];

export default function Home() {
  const auth = useAuth();
  const ready = auth?.ready;
  return (
    <Page className="page-home">
      <Hero ready={ready} />
      <BarsShowcase />
      <Pillars />
      <Journey />
      <Types />
      <LibraryFan />
      <PatientShowcase />
      <Principles />
      <section className="wrap home-cta">
        <motion.h2 className="h-hero" {...rise()}>
          {ready ? 'המרחב מחכה.' : 'להיכנס למרחב העבודה.'}
        </motion.h2>
        <motion.div className="row" {...rise(1)}>
          <Link className="btn btn-primary btn-large" to="/patients">
            {ready ? 'למטופלים' : 'כניסה'}
          </Link>
          <Link className="btn btn-ghost btn-large" to="/method">
            מפת השיטה
          </Link>
        </motion.div>
      </section>
    </Page>
  );
}

function Hero({ ready }) {
  const ref = useRef(null);
  const still = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const yBack = useTransform(scrollYProgress, [0, 1], [0, still ? 0 : 160]);
  const yMid = useTransform(scrollYProgress, [0, 1], [0, still ? 0 : 90]);
  const yText = useTransform(scrollYProgress, [0, 1], [0, still ? 0 : -60]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const word = 'AccBars'.split('');
  const sideBars = BARS.filter((x) => x.view === 'side');
  const [ci, setCi] = useState(0);
  useEffect(() => {
    if (still) return undefined;
    const t = setInterval(() => setCi((n) => (n + 1) % sideBars.length), 3400);
    return () => clearInterval(t);
  }, [still, sideBars.length]);
  const cycle = sideBars[ci].key;

  return (
    <section ref={ref} className="home-hero">
      <motion.div className="hero-art" aria-hidden="true">
        <motion.div className="hero-halo" style={{ y: yBack }} />
        <motion.div className="hero-head" style={{ y: yMid }}>
          <HeadMap view="side" focus={cycle} />
          <AnimatePresence mode="wait">
            <motion.p key={cycle} className="hero-head-cap" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
              <strong>{barByKey(cycle).he}</strong> {barByKey(cycle).theme}
            </motion.p>
          </AnimatePresence>
        </motion.div>
      </motion.div>

      <motion.div className="hero-text" style={{ y: yText, opacity: fade }}>
        <p className="wordmark" aria-label="AccBars" dir="ltr">
          {word.map((c, i) => (
            <motion.span key={i} aria-hidden="true" initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.4, delay: still ? 0 : 0.2 + i * 0.09, ease }}>
              {c}
            </motion.span>
          ))}
        </p>
        <motion.h1 className="hero-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: still ? 0 : 1, ease }}>
          מרחב העבודה של מטפלת <span className="light-point">Access Bars</span>.
        </motion.h1>
        <motion.p className="hero-lead" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4, delay: still ? 0 : 1.5 }}>
          מפת 32 הנקודות על הראש, רישום של כל סשן ושל הבארס שהורצו בו, מסע לכל מטופל, ומסר אחד ותרגיל אחד לשבוע שבין המפגשים.
        </motion.p>
        <motion.div className="row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: still ? 0 : 1.9 }}>
          <Link className="btn btn-primary btn-large" to="/patients">
            {ready ? 'למטופלים' : 'כניסה'}
          </Link>
          <a className="btn btn-link" href="#what">
            מה יש כאן
          </a>
        </motion.div>
      </motion.div>
      <motion.span className="scroll-cue" aria-hidden="true" animate={still ? {} : { y: [0, 10, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }} />
    </section>
  );
}

function BarsShowcase() {
  const [focus, setFocus] = useState(null);
  const b = focus && barByKey(focus);
  return (
    <section className="wrap showcase">
      <motion.header {...rise()}>
        <span className="label">מפת הבארס</span>
        <h2 className="h-display">שלושה מבטים על הראש, וכל נקודה בצבע שלה במפה.</h2>
        <p className="quiet">מעבר על נקודה מציג את שמה ואת הנושא שלה לפי השיטה.</p>
      </motion.header>
      <div className="showcase-grid">
        {VIEWS.map((v, i) => (
          <motion.div key={v.key} className="card showcase-card" {...rise(i)}>
            <span className="label">{v.name}</span>
            <HeadMap view={v.key} focus={focus} onFocus={setFocus} onPick={setFocus} />
          </motion.div>
        ))}
      </div>
      <div className="showcase-foot">
        <AnimatePresence mode="wait">
          <motion.p key={focus || 'none'} className="showcase-cap" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }}>
            {b ? (
              <>
                <strong>{b.he}</strong> <span dir="ltr">{b.en}</span>. {b.theme} <span className="quiet">{b.where}</span>
              </>
            ) : (
              <span className="quiet">{BARS.length} בארס, בארבע קבוצות: גוף, רגש, יצירה ופעולה, מודעות וזמן.</span>
            )}
          </motion.p>
        </AnimatePresence>
        <Link className="btn btn-ghost" to="/bars">
          למפה המלאה ולתרגול מיקום
        </Link>
      </div>
    </section>
  );
}

function Pillars() {
  const items = [
    { n: '32', label: 'ידע', title: 'מפת הבארס', d: 'כל נקודה על הראש, איפה היא נמצאת ובמה היא עוסקת לפי השיטה, בשלושה מבטים.', art: <MiniHead />, to: '/bars' },
    { n: '9', label: 'הבנה', title: 'מסע ואניאגרם', d: 'סשנים כעלים על גבעול, הבארס שהורצו בכל מפגש, ואניאגרם כמסגרת להתבוננות.', art: <MiniEnneagram />, to: '/method' },
    { n: String(LIBRARY.length), label: 'יישום', title: 'תרגיל, משחק, חוויה', d: 'ספרייה לפי טיפוס, שמציעה בכל סשן את מה שמתאים לו.', art: <MiniCards /> },
  ];
  return (
    <section id="what" className="wrap pillars">
      <motion.header {...rise()}>
        <span className="label">מה זה AccBars</span>
        <h2 className="h-display">ידע, הבנה ויישום, בתוך אותו מרחב.</h2>
      </motion.header>
      <div className="pillar-grid">
        {items.map((x, i) => (
          <motion.article key={x.label} className="card pillar" {...rise(i)}>
            <div className="pillar-art">{x.art}</div>
            <span className="pillar-n">{x.n}</span>
            <span className="label">{x.label}</span>
            <h3 className="h-section">{x.title}</h3>
            <p className="quiet">{x.d}</p>
            {x.to && (
              <Link className="btn btn-link pillar-link" to={x.to}>
                {x.to === '/bars' ? 'למפה המלאה' : 'למפת השיטה'}
              </Link>
            )}
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function MiniHead() {
  const dots = [[62, 40, '#c9a227'], [70, 33, '#5f9d6b'], [84, 52, '#7cc6c0'], [48, 42, '#fbf4ea'], [40, 58, '#fbf4ea'], [56, 64, '#fbf4ea']];
  return (
    <svg viewBox="0 0 120 120">
      <motion.path d="M40 104 C 30 90, 20 80, 22 60 C 24 30, 46 16, 70 18 C 94 20, 104 40, 100 56 L 106 70 L 99 74 C 100 84, 96 92, 82 92 C 80 98, 80 102, 82 104" fill="none" stroke="var(--stem)" strokeWidth="2" strokeLinecap="round"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 2 }} />
      {dots.map(([x, y, c], i) => (
        <motion.circle key={i} cx={x} cy={y} r="4" fill={c} stroke="var(--stem)" strokeWidth="0.8" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.8 + i * 0.15 }} />
      ))}
    </svg>
  );
}

function MiniEnneagram() {
  const pt = (n) => {
    const a = ((n % 9) * 40 - 90) * (Math.PI / 180);
    return [60 + 44 * Math.cos(a), 60 + 44 * Math.sin(a)];
  };
  const poly = (arr) => `M${arr.map((n) => pt(n).join(' ')).join(' L')} Z`;
  return (
    <svg viewBox="0 0 120 120">
      <motion.circle cx="60" cy="60" r="44" fill="none" stroke="var(--stem)" strokeOpacity="0.5" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 2 }} />
      <motion.path d={poly([3, 6, 9])} fill="none" stroke="var(--rust)" strokeOpacity="0.6" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 2, delay: 0.4 }} />
      <motion.path d={poly([1, 4, 2, 8, 5, 7])} fill="none" stroke="var(--stem)" strokeOpacity="0.6" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 2, delay: 0.8 }} />
      {Array.from({ length: 9 }, (_, i) => {
        const [x, y] = pt(i + 1);
        return <circle key={i} cx={x} cy={y} r="4" fill={TYPE_HUE[i + 1]} opacity="0.75" />;
      })}
    </svg>
  );
}
function MiniFrond() {
  return (
    <svg viewBox="0 0 120 120">
      <motion.path d="M110 100 C 80 90, 50 70, 14 30" fill="none" stroke="var(--stem)" strokeWidth="2.5" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 2 }} />
      {[[92, 93], [70, 82], [50, 66], [32, 49]].map(([x, y], i) => (
        <motion.g key={i} initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.6 + i * 0.25 }} style={{ originX: `${x}px`, originY: `${y}px` }}>
          <path transform={`translate(${x} ${y}) rotate(${i % 2 ? -110 : -60})`} d="M0 0 q 8 -6 22 0 q -13 6 -22 0z" fill="#6f7f6b" opacity="0.8" />
          {i % 2 === 0 && <circle cx={x} cy={y} r="3.5" fill="var(--rust-deep)" />}
        </motion.g>
      ))}
    </svg>
  );
}
function MiniCards() {
  return (
    <svg viewBox="0 0 120 120">
      {[-14, 0, 14].map((r, i) => (
        <motion.rect key={i} x="38" y="26" width="44" height="64" rx="8" fill="#fffaf3" stroke={TYPE_HUE[[4, 6, 7][i]]} strokeWidth="1.6"
          initial={{ rotate: 0 }} whileInView={{ rotate: r }} viewport={{ once: true }} transition={{ duration: 1.4, delay: 0.3 + i * 0.15, ease }} style={{ originX: '60px', originY: '100px' }} />
      ))}
    </svg>
  );
}

function Journey() {
  const ref = useRef(null);
  const still = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const p = useSpring(scrollYProgress, { stiffness: 40, damping: 20 });
  const [step, setStep] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setStep(Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length)))));
  const W = 900;
  const nodes = STEPS.map((_, i) => ({ x: W - 70 - (i * (W - 140)) / (STEPS.length - 1), y: 120 - Math.sin((i / (STEPS.length - 1)) * Math.PI) * 60 }));
  const d = `M${nodes.map((n) => `${n.x} ${n.y}`).join(' L')}`;

  return (
    <section ref={ref} className="journey-pin" style={{ height: still ? 'auto' : `${STEPS.length * 70}vh` }}>
      <div className="journey-stick">
        <div className="wrap">
          <span className="label">המסלול של סשן</span>
          <h2 className="h-display">שש תחנות, מסר אחד שיוצא החוצה.</h2>
          <svg className="jp-line" viewBox={`0 0 ${W} 180`} aria-hidden="true">
            <path d={d} fill="none" stroke="var(--line)" strokeWidth="4" strokeLinecap="round" />
            <motion.path d={d} fill="none" stroke="url(#jp-grad)" strokeWidth="5" strokeLinecap="round" style={{ pathLength: still ? 1 : p }} />
            <defs>
              <linearGradient id="jp-grad" x1="1" x2="0">
                <stop offset="0" stopColor="var(--stem)" />
                <stop offset="1" stopColor="var(--rust)" />
              </linearGradient>
            </defs>
            {nodes.map((n, i) => (
              <g key={i}>
                <motion.circle cx={n.x} cy={n.y} animate={{ r: i === step ? 16 : 9 }} transition={{ duration: 0.9 }}
                  fill={i <= step ? '#fffaf2' : 'rgba(255,250,242,0.6)'} stroke={i <= step ? 'var(--rust-deep)' : 'var(--stem)'} strokeWidth="2" />
                <text x={n.x} y={n.y + 44} textAnchor="middle" className={`jp-t ${i === step ? 'is-on' : ''}`}>
                  {STEPS[i].t}
                </text>
              </g>
            ))}
          </svg>
          <AnimatePresence mode="wait">
            <motion.div key={step} className="card card-calm jp-card" initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }} transition={{ duration: 0.8, ease }}>
              <span className="pillar-n">{step + 1}</span>
              <h3 className="h-display">{STEPS[step].t}</h3>
              <p>{STEPS[step].d}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function Types() {
  const [active, setActive] = useState(6);
  const [hold, setHold] = useState(false);
  const still = useReducedMotion();
  useEffect(() => {
    if (still || hold) return undefined;
    const t = setInterval(() => setActive((n) => (n % 9) + 1), 4800);
    return () => clearInterval(t);
  }, [still, hold]);
  const t = ENNEAGRAM.find((x) => x.n === active);
  return (
    <section className="wrap types">
      <div className="types-split">
        <motion.div {...rise()} onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
          <Enneagram active={active} onSelect={(n) => { setHold(true); setActive(n); }} size={440} caption="בחירה בנקודה עוצרת את הסיבוב." />
        </motion.div>
        <motion.div className="types-text" {...rise(1)}>
          <span className="label">תשעה טיפוסים</span>
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }} transition={{ duration: 0.9, ease }}>
              <h2 className="h-hero" style={{ color: `color-mix(in srgb, ${TYPE_HUE[active]} 55%, #2a221d)` }}>
                {t.n}, {t.name}
              </h2>
              <p className="types-core">{t.core}.</p>
              <p className="quiet">רגע של הקלה: {t.ease}.</p>
            </motion.div>
          </AnimatePresence>
          <Link className="btn btn-ghost" to="/method">
            לכל הטיפוסים
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function LibraryFan() {
  const pick = ['4-word', '6-ground', '9-voice', '1-good-enough', '7-taste'].map((k) => LIBRARY.find((x) => x.key === k)).filter(Boolean);
  const still = useReducedMotion();
  const spread = typeof window !== 'undefined' && window.innerWidth < 640 ? 34 : 120;
  return (
    <section className="wrap fan-section">
      <motion.header {...rise()}>
        <span className="label">ספריית התרגול</span>
        <h2 className="h-display">{LIBRARY.length} הזמנות קטנות לשבוע שבין המפגשים.</h2>
        <p className="quiet">כל כרטיס בצבע הטיפוס שלו. בסשן, הספרייה מציעה שלושה, לפי הטיפוס ולפי מה שעלה בתובנה.</p>
      </motion.header>
      <div className="fan" aria-label="דוגמאות מהספרייה">
        {pick.map((x, i) => {
          const r = (i - 2) * 9;
          return (
            <motion.article key={x.key} className="fan-card" style={{ '--hue': TYPE_HUE[x.types[0]], zIndex: 5 - Math.abs(i - 2) }}
              initial={{ rotate: 0, x: 0, y: 40, opacity: 0 }}
              whileInView={{ rotate: still ? 0 : r, x: still ? 0 : (i - 2) * -spread, y: Math.abs(i - 2) * 18, opacity: 1 }}
              whileHover={still ? {} : { y: -24, rotate: r * 0.4, zIndex: 10, transition: { duration: 0.8 } }}
              viewport={{ once: true, amount: 0.4 }} transition={{ duration: 1.4, delay: i * 0.1, ease }}>
              <span className="practice-num" aria-hidden="true">{x.types[0]}</span>
              <span className="practice-kind">{x.kind}</span>
              <span className="practice-title">{x.title}</span>
              <span className="practice-invite">{x.invite}</span>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

function PatientShowcase() {
  const still = useReducedMotion();
  const [phase, setPhase] = useState('in');
  useEffect(() => {
    if (still) return undefined;
    const t = setTimeout(() => setPhase((p) => (p === 'in' ? 'out' : 'in')), phase === 'in' ? 4000 : 6000);
    return () => clearTimeout(t);
  }, [phase, still]);
  const message = 'הלחץ מתחיל לפני הישיבה, ושם אפשר לעצור.';
  return (
    <section className="deep">
      <div className="wrap deep-split">
        <motion.div className="deep-text" {...rise()}>
          <span className="label label-light">מה המטופל רואה</span>
          <h2 className="h-hero">מסר אחד. תרגיל אחד. נשימה.</h2>
          <p>קישור אישי ושקט. בלי מדדים, בלי ציונים ובלי השוואות. רק מה שנאמר במשפט האחרון של הסשן, והתרגיל לשבוע.</p>
          <p className="deep-note">הדוגמה בדיונית.</p>
        </motion.div>
        <motion.div className="phone" {...rise(1)}>
          <div className="phone-screen">
            <span className="label">שלום דנה</span>
            <span className="dew dew-small" aria-hidden="true" />
            <p className="phone-msg">
              {message.split(' ').map((w, i) => (
                <motion.span key={i} initial={{ opacity: 0, filter: 'blur(6px)' }} whileInView={{ opacity: 1, filter: 'blur(0px)' }} viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.6 + i * 0.25 }}>
                  {w}{' '}
                </motion.span>
              ))}
            </p>
            <div className="phone-card">
              <span className="label">תרגיל לשבוע</span>
              <span>שלוש שורות בבוקר לפני המייל.</span>
            </div>
            <div className="phone-breath">
              <motion.span className="phone-drop" animate={{ scale: phase === 'in' ? 1.5 : 1 }} transition={{ duration: phase === 'in' ? 4 : 6, ease: 'easeInOut' }} />
              <AnimatePresence mode="wait">
                <motion.span key={phase} className="phone-word" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }}>
                  {phase === 'in' ? 'שאיפה' : 'נשיפה'}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Principles() {
  const items = [
    ['בלי ציונים', 'אין מדדים שמתחרים במטופל. רק מילים שלו ושל הסשן.'],
    ['מסר אחד', 'מה שיוצא החוצה קצר: הסיכום והתרגיל. כל השאר נשאר אצל המטפלת.'],
    ['עצירה כשצריך', 'כשמופיע ברישום סימן למצוקה, הסשן נעצר ומוצגת הפניה לגורם מקצועי.'],
    ['לא תחליף לטיפול', 'כלי לתיעוד ולהתבוננות. הוא לא מאבחן, לא מרפא ולא מבטיח תוצאות.'],
  ];
  return (
    <section className="wrap principles">
      {items.map(([t, d], i) => (
        <motion.div key={t} className="principle" {...rise(i)}>
          <span className="principle-line" aria-hidden="true" />
          <h3 className="h-section">{t}</h3>
          <p className="quiet">{d}</p>
        </motion.div>
      ))}
    </section>
  );
}
