import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthGate';
import Page from '../components/Page';
import Enneagram from '../components/viz/Enneagram';
import { ENNEAGRAM } from '../lib/enneagram';
import { LIBRARY, TYPE_HUE } from '../lib/library';

const ease = [0.22, 0.61, 0.36, 1];
const rise = (i = 0) => ({ initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.3 }, transition: { duration: 1.1, delay: i * 0.12, ease } });

const STEPS = [
  { t: 'פתיחה', d: 'מה המטופל מביא היום, ומה נשאר פתוח מהפעם הקודמת.' },
  { t: 'רישום', d: 'מה קרה בסשן, ולאיזה יעד הוא נגע.' },
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

  return (
    <section ref={ref} className="home-hero">
      <motion.div className="hero-art" aria-hidden="true">
        <motion.div className="hero-halo" style={{ y: yBack }} />
        <motion.svg className="hero-frond" viewBox="0 0 520 640" style={{ y: yMid }}>
          <defs>
            <radialGradient id="hh-drop" cx="34%" cy="30%" r="70%">
              <stop offset="0" stopColor="#fff" />
              <stop offset="0.5" stopColor="#fdf7ee" />
              <stop offset="1" stopColor="#d5b393" />
            </radialGradient>
            <linearGradient id="hh-leaf" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8d9c86" stopOpacity="0.85" />
              <stop offset="1" stopColor="#56654f" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <motion.path d="M120 640 C 150 520, 300 430, 330 300 C 350 210, 300 150, 250 150 C 200 150, 185 205, 222 228 C 250 245, 280 222, 268 196"
            fill="none" stroke="var(--stem)" strokeWidth="6" strokeLinecap="round"
            initial={{ pathLength: still ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3.2, ease: 'easeInOut' }} />
          {Array.from({ length: 9 }, (_, i) => {
            const t = i / 9;
            const x = 132 + t * 190 + Math.sin(t * 3) * 14;
            const y = 610 - t * 330;
            const len = 120 * (1 - t * 0.6);
            return (
              <motion.g key={i} initial={{ opacity: 0, scale: 0.2 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.4, delay: still ? 0 : 0.8 + i * 0.18, ease }}
                style={{ originX: `${x}px`, originY: `${y}px` }}>
                <path transform={`translate(${x} ${y}) rotate(${-150 + i * 4})`} d={`M0 0 q ${len * 0.4} ${-len * 0.28} ${len} 0 q ${-len * 0.6} ${len * 0.26} ${-len} 0z`} fill="url(#hh-leaf)" />
                <path transform={`translate(${x} ${y}) rotate(${-25 - i * 3})`} d={`M0 0 q ${len * 0.4} ${-len * 0.28} ${len} 0 q ${-len * 0.6} ${len * 0.26} ${-len} 0z`} fill="url(#hh-leaf)" />
              </motion.g>
            );
          })}
          <motion.circle cx="268" cy="196" fill="url(#hh-drop)" initial={{ r: 0 }} animate={{ r: [0, 22, 18, 22] }}
            transition={{ duration: 7, delay: still ? 0 : 2.6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }} />
          <circle cx="268" cy="196" r="60" fill="#fff6e8" opacity="0.35" style={{ filter: 'blur(18px)' }} />
        </motion.svg>
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
          מקום אחד למטופל, <span className="light-point">למפגש</span> ולתובנה.
        </motion.h1>
        <motion.p className="hero-lead" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4, delay: still ? 0 : 1.5 }}>
          כלי עבודה אישי למטפלת שעובדת עם אניאגרם. רושמת סשן בשישה שלבים, מחזיקה את התמונה המלאה של כל מטופל, ושולחת לו מסר אחד ותרגיל אחד לשבוע.
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

function Pillars() {
  const items = [
    { n: '9', label: 'ידע', title: 'תשעה טיפוסים', d: 'אניאגרם כמסגרת להתבוננות, לא אבחון: כנפיים, קווים, ומה מזמין הקלה.', art: <MiniEnneagram /> },
    { n: '1', label: 'הבנה', title: 'מסע אחד לכל מטופל', d: 'יעדים בניסוח שלו, סשנים כעלים על גבעול, וחוטים שמראים לאן כל מפגש נגע.', art: <MiniFrond /> },
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
          </motion.article>
        ))}
      </div>
    </section>
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
