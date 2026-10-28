// A frame for reflection the therapist may note. Not a diagnosis and not a test result.
export const ENNEAGRAM = [
  { n: 1, name: 'המתקן', core: 'שואף לנכון ולמדויק', ease: 'כשמותר גם לא להיות מושלם' },
  { n: 2, name: 'העוזר', core: 'מחובר דרך הנתינה לאחרים', ease: 'כשמותר גם לבקש לעצמו' },
  { n: 3, name: 'המשיג', core: 'מכוון ליעד ולהצלחה', ease: 'כשהערך לא תלוי בהישג' },
  { n: 4, name: 'האינדיבידואליסט', core: 'מחפש משמעות וייחוד', ease: 'כשמה שיש כאן כבר מספיק' },
  { n: 5, name: 'החוקר', core: 'מבין דרך התבוננות וידע', ease: 'כשאפשר להשתתף גם בלי לדעת הכול' },
  { n: 6, name: 'הנאמן', core: 'מחפש ביטחון ויציבות', ease: 'כשיש אמון בקרקע שמתחת' },
  { n: 7, name: 'המתלהב', core: 'נמשך לאפשרויות ולחוויה', ease: 'כשאפשר להישאר עם מה שקורה עכשיו' },
  { n: 8, name: 'המאתגר', core: 'מגן, ישיר ומחזיק כוח', ease: 'כשמותר גם להיות רך' },
  { n: 9, name: 'שוחר השלום', core: 'מחפש הרמוניה ושקט', ease: 'כשהקול שלו נשמע גם הוא' },
];

// The classic figure: the triangle 3-6-9 and the hexad 1-4-2-8-5-7.
export const TRIANGLE = [3, 6, 9];
export const HEXAD = [1, 4, 2, 8, 5, 7];

export const linesOf = (n) => {
  const tri = TRIANGLE.indexOf(n);
  if (tri >= 0) return [TRIANGLE[(tri + 1) % 3], TRIANGLE[(tri + 2) % 3]];
  const i = HEXAD.indexOf(n);
  return [HEXAD[(i + 1) % 6], HEXAD[(i + 5) % 6]];
};
export const wingsOf = (n) => [n === 1 ? 9 : n - 1, n === 9 ? 1 : n + 1];

export const enneagramLabel = (n) => {
  const t = ENNEAGRAM.find((x) => x.n === Number(n));
  return t ? `${t.n}, ${t.name}` : '';
};
