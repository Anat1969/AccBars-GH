import { motion } from 'framer-motion';
import { useState } from 'react';
import Page from '../components/Page';
import Cycle from '../components/viz/Cycle';
import Enneagram from '../components/viz/Enneagram';
import Schema from '../components/viz/Schema';
import { ENNEAGRAM, linesOf, wingsOf } from '../lib/enneagram';

const STATIONS = [
  { title: 'פתיחה', what: 'מה המטופל מביא היום, ומה נשאר פתוח מהפעם הקודמת.', why: 'מתחילים ממה שחי עכשיו, לא מהתוכנית.' },
  { title: 'רישום', what: 'מה קרה בסשן, במילים פשוטות.', why: 'הרישום הוא זיכרון משותף, לא דוח.' },
  { title: 'תובנה', what: 'תובנה אחת שעלתה.', why: 'אחת מספיקה. יותר מזה מתפזר.' },
  { title: 'תרגיל', what: 'תרגיל קטן וברור לשבוע.', why: 'משהו שאפשר לעשות גם ביום עמוס.' },
  { title: 'סיכום', what: 'מה המטופל לוקח איתו, במשפט אחד.', why: 'זה המסר שהוא יראה במסך שלו.' },
  { title: 'סשן הבא', what: 'מתי נפגשים, ומה נשאר פתוח.', why: 'הנקודה הפתוחה פותחת את הסשן הבא.' },
];

const reveal = (i) => ({ initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.25 }, transition: { duration: 1, delay: i * 0.1, ease: [0.22, 0.61, 0.36, 1] } });

export default function Method() {
  const [type, setType] = useState(null);
  const t = ENNEAGRAM.find((x) => x.n === type);
  return (
    <Page>
      <section className="hero">
        <span className="label">מפת השיטה</span>
        <h1 className="h-hero">
          ידע, הבנה, <span className="light-point">יישום</span>
        </h1>
        <p className="quiet">איך סשן בנוי, איך האניאגרם משמש מסגרת להתבוננות, ומה נשמר.</p>
      </section>

      <motion.section className="method-block" {...reveal(0)}>
        <header>
          <span className="label">01</span>
          <h2 className="h-display">מחזור הסשן</h2>
          <p className="quiet">שישה שלבים שחוזרים בכל מפגש. הטיפה נעה לאט במעגל, כמו השבוע בין סשן לסשן.</p>
        </header>
        <Cycle stations={STATIONS} />
      </motion.section>

      <motion.section className="method-block" {...reveal(1)}>
        <header>
          <span className="label">02</span>
          <h2 className="h-display">תשעה טיפוסים</h2>
          <p className="quiet">בחירה בנקודה מציגה את הכנפיים, הנקודות הסמוכות, ואת הקווים שמחברים אותה לשתי נקודות נוספות. זו מסגרת להתבוננות, לא אבחון.</p>
        </header>
        <div className="method-split">
          <Enneagram active={type} onSelect={setType} size={420} caption="בחרי נקודה." />
          <div className="type-cards">
            {t ? (
              <motion.article key={t.n} className="card card-calm" initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                <span className="label">טיפוס {t.n}</span>
                <h3 className="h-display">{t.name}</h3>
                <p>{t.core}.</p>
                <p className="quiet">רגע של הקלה: {t.ease}.</p>
                <dl className="facts">
                  <div><dt className="label">כנפיים</dt><dd>{wingsOf(t.n).map((w) => `${w}, ${ENNEAGRAM[w - 1].name}`).join(' | ')}</dd></div>
                  <div><dt className="label">קווים</dt><dd>{linesOf(t.n).map((w) => `${w}, ${ENNEAGRAM[w - 1].name}`).join(' | ')}</dd></div>
                </dl>
              </motion.article>
            ) : (
              <ul className="type-list">
                {ENNEAGRAM.map((x) => (
                  <li key={x.n}>
                    <button className="btn btn-link" onClick={() => setType(x.n)}>
                      {x.n}, {x.name}
                    </button>
                    <span className="quiet small">{x.core}</span>
                  </li>
                ))}
              </ul>
            )}
            {t && (
              <button className="btn btn-link" onClick={() => setType(null)}>
                לכל הטיפוסים
              </button>
            )}
          </div>
        </div>
      </motion.section>

      <motion.section className="method-block" {...reveal(2)}>
        <header>
          <span className="label">03</span>
          <h2 className="h-display">מה נשמר, ולאן הוא זורם</h2>
          <p className="quiet">רק שני חוטים יוצאים אל המטופל: הסיכום והתרגיל. כל השאר נשאר אצל המטפלת.</p>
        </header>
        <div className="card schema-card">
          <Schema />
        </div>
      </motion.section>
    </Page>
  );
}
