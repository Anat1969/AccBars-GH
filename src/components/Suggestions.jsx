import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listLibrary } from '../lib/data';
import { ENNEAGRAM } from '../lib/enneagram';
import { asExerciseText, forType } from '../lib/library';
import PracticeCard from './PracticeCard';

// Words in the insight that lean toward a kind of practice.
const LEANS = [
  { re: /גוף|נשימ|לחץ|מתח|עומס/, key: ['all-breath', '6-ground', '5-body'] },
  { re: /בוקר|יום|זמן/, key: ['all-three-lines', '9-first', 'all-map'] },
  { re: /ביקורת|מושלם|טעות/, key: ['1-critic', '1-imperfect'] },
  { re: /לבקש|עזרה|לתת/, key: ['2-ask', '2-need'] },
  { re: /דאג|פחד|חשש/, key: ['6-likely', '6-forecast'] },
];

/** Three practices for this patient's type, with a nudge from what came up in the insight. */
export default function Suggestions({ type, insight, onChoose }) {
  const [own, setOwn] = useState([]);
  const [more, setMore] = useState(false);
  useEffect(() => {
    listLibrary().then(setOwn, () => setOwn([]));
  }, []);
  const list = useMemo(() => {
    const base = forType(type, own);
    const lean = LEANS.filter((l) => l.re.test(insight ?? '')).flatMap((l) => l.key);
    const leaned = base.filter((x) => lean.includes(x.key));
    const rest = base.filter((x) => !lean.includes(x.key));
    return [...leaned, ...rest];
  }, [type, own, insight]);
  const t = ENNEAGRAM.find((x) => x.n === Number(type));
  const shown = more ? list : list.slice(0, 3);

  return (
    <section className="suggestions" aria-label="הצעות מהספרייה">
      <header className="row">
        <span className="label">{t ? `הצעות לטיפוס ${t.n}, ${t.name}` : 'הצעות כלליות. בכרטיס המטופל אפשר לרשום השערת טיפוס.'}</span>
        <span className="spacer" />
        <Link className="btn btn-link" to={type ? `/library?type=${type}` : '/library'} target="_blank">
          הספרייה המלאה
        </Link>
      </header>
      <ul className="practice-grid practice-grid-tight">
        {shown.map((x, i) => (
          <PracticeCard key={x.key} item={x} index={i} chooseLabel="לתרגיל של השבוע" onChoose={(it) => onChoose(asExerciseText(it), it.key)} />
        ))}
      </ul>
      {list.length > 3 && (
        <button className="btn btn-link" onClick={() => setMore((v) => !v)}>
          {more ? 'פחות הצעות' : `עוד ${list.length - 3} הצעות`}
        </button>
      )}
    </section>
  );
}
