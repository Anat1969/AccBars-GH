// A working hypothesis the therapist may note. Not a diagnosis and not a test result.
export const ENNEAGRAM = [
  { n: 1, name: 'המתקן' },
  { n: 2, name: 'העוזר' },
  { n: 3, name: 'המשיג' },
  { n: 4, name: 'האינדיבידואליסט' },
  { n: 5, name: 'החוקר' },
  { n: 6, name: 'הנאמן' },
  { n: 7, name: 'המתלהב' },
  { n: 8, name: 'המאתגר' },
  { n: 9, name: 'שוחר השלום' },
];

export const enneagramLabel = (n) => {
  const t = ENNEAGRAM.find((x) => x.n === Number(n));
  return t ? `${t.n}, ${t.name}` : '';
};
