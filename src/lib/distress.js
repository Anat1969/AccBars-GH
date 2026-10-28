// Words that may point to distress or risk. A match does not diagnose anything:
// it stops the regular flow and puts a referral in front of the therapist.
const PATTERNS = [
  /אובדנ/,
  /התאבד/,
  /לפגוע ב(עצמ|ה|ו|אחר)/,
  /פגיעה (עצמית|בעצמ)/,
  /לא רוצה לחיות/,
  /לא רוצ(ה|ים) להיות פה/,
  /אין (לי )?טעם לחיות/,
  /לסיים את (ה)?חיים/,
  /רוצה למות/,
  /סכנה מיידית/,
  /אלימות/,
  /מאיימ(ים|ת|ות)? עלי/,
];

export const hasDistressSign = (...texts) => {
  const all = texts.filter(Boolean).join(' ');
  return PATTERNS.some((p) => p.test(all));
};

export const REFERRAL = [
  { who: 'סכנה מיידית לחיים', what: 'מד"א 101, משטרה 100' },
  { who: 'ער"ן, עזרה ראשונה נפשית, בכל שעה', what: '1201' },
  { who: 'סה"ר, סיוע ותמיכה ברשת', what: 'sahar.org.il' },
];
