const dateFmt = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' });
const longFmt = new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

export const fmtDate = (d) => (d ? dateFmt.format(new Date(d)) : '');
export const fmtWhen = (d) => (d ? longFmt.format(new Date(d)) : '');

/** ISO timestamp to the value a datetime-local input expects, in local time. */
export const toLocalInput = (d) => {
  if (!d) return '';
  const t = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`;
};
export const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);

export const today = () => {
  const t = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
};

export const errText = (e) => {
  const m = String(e?.message || e || '');
  if (/Invalid login credentials/i.test(m)) return 'האימייל או הסיסמה אינם נכונים.';
  if (/Email not confirmed/i.test(m)) return 'האימייל עוד לא אושר. בדקי את תיבת הדואר.';
  if (/Invalid TOTP|invalid.*code|expired/i.test(m)) return 'הקוד אינו נכון או שפג תוקפו. נסי את הקוד הבא.';
  if (/rate limit|too many/i.test(m)) return 'יותר מדי ניסיונות. כדאי לחכות דקה ולנסות שוב.';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'אין חיבור לשרת. בדקי את החיבור לרשת.';
  return 'משהו לא נשמר. כדאי לנסות שוב.';
};
