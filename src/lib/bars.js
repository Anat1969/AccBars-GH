// The Access Bars® points as described in a published practitioner chart
// (Access Clearing Tools, "Access Consciousness Bars Chart"). Access Bars® is a mark of Access Consciousness.
// Positions here are schematic, drawn for orientation from the chart's written directions.
// Themes are what the method says each bar relates to. They are not medical or scientific findings.

export const SOURCE = {
  label: 'Access Clearing Tools, מפת Access Consciousness Bars',
  url: 'https://accessclearingtools.wordpress.com/access-consciousness-bars/access-consciousness-bars-chart/',
};

export const GROUPS = [
  { key: 'body', name: 'גוף' },
  { key: 'feel', name: 'רגש' },
  { key: 'make', name: 'יצירה ופעולה' },
  { key: 'aware', name: 'מודעות וזמן' },
];

export const VIEWS = [
  { key: 'side', name: 'מבט מהצד' },
  { key: 'top', name: 'מבט מלמעלה' },
  { key: 'front', name: 'מבט מלפנים' },
];

const CLEAR = null; // the chart marks these bars "clear": drawn as a dew drop
const sym = (dx, y, cx = 150) => [[cx - dx, y], [cx + dx, y]];

const bar = (key, he, en, view, group, color, pts, where, theme, extra = {}) => ({ key, he, en, view, group, color, pts, where, theme, ...extra });

export const BARS = [
  // side view (face to the right of the drawing), viewBox 0 0 400 440
  bar('money', 'כסף', 'Money', 'side', 'make', '#c9a227', [[190, 170]], 'שלוש אצבעות מעל קצה האוזן.', 'היחס לכסף, לקבלה ולנתינה.'),
  bar('awareness', 'מודעות', 'Awareness', 'side', 'aware', CLEAR, [[181, 190]], 'האצבע השנייה מעל האוזן לכיוון הכסף, חצי אצבע אחורה.', 'היכולת לדעת ולשים לב.'),
  bar('control', 'שליטה', 'Control', 'side', 'make', CLEAR, [[172, 178]], 'אצבע אחת אחורה מהכסף, וחצי אצבע מטה.', 'הצורך לשלוט, והאפשרות לשחרר.'),
  bar('creativity', 'יצירתיות', 'Creativity', 'side', 'make', CLEAR, [[146, 170]], 'שלוש אצבעות אחורה מהכסף.', 'יצירה וביטוי.'),
  bar('communication', 'תקשורת', 'Communication', 'side', 'make', CLEAR, [[224, 163]], 'כ-15 עד 30 מעלות קדימה, שתיים וחצי אצבעות לפני הכסף.', 'דיבור, הקשבה וקבלת מסרים.'),
  bar('time-space', 'זמן ומרחב', 'Time & Space', 'side', 'aware', '#5f9d6b', [[232, 144]], 'ארבע אצבעות מעל האוזן, בקו אחד עם התקשורת.', 'היחס לזמן, למרחב ולמציאות.'),
  bar('healing', 'ריפוי', 'Healing', 'side', 'body', '#7cc6c0', [[266, 202]], 'מרכז הרקה.', 'לפי השיטה, קשור לריפוי ולהחלמה.'),
  bar('form-structure', 'צורה ומבנה', 'Form & Structure', 'side', 'make', CLEAR, [[276, 178]], 'ראש הרקה, בגובה זווית העין.', 'סדר, מבנה וגבולות.'),
  bar('hopes-dreams', 'תקוות וחלומות', 'Hopes & Dreams', 'side', 'feel', CLEAR, [[254, 224]], 'מתחת לנקודת הריפוי, בזווית קלה לכיוון האוזן.', 'מה שרוצים שיתממש.'),
  bar('creating-connections', 'יצירת חיבורים', 'Creating Connections', 'side', 'make', CLEAR, [[128, 190]], '45 מעלות מטה ואחורה מהיצירתיות.', 'קשרים בין אנשים ורעיונות.'),
  bar('creating-life-forms', 'יצירת צורות חיים', 'Creating Life Forms', 'side', 'make', CLEAR, [[110, 208]], 'על אותו קו של 45 מעלות, עוד אחורה.', 'צמיחה ויצירה של חיים.'),
  bar('manifestation', 'מעגל ההתממשות', 'Circle of Manifestation', 'side', 'make', CLEAR, [[124, 124]], 'בחלק האחורי העליון של הראש, בגודל ובמקום של כיפה, קוטר של כ-15 ס"מ.', 'הפיכת רעיון למציאות.', { ring: 30 }),
  bar('kindness', 'חסד, הכרת תודה, שלווה ורוגע', 'Kindness, Gratitude, Peace & Calm', 'side', 'feel', CLEAR, [[150, 216], [134, 216], [150, 230], [134, 230]],
    'ארבע אצבעות אחורה מראש האוזן, בגובה אמצע האוזן. שתי האצבעות הראשונות: חסד מלפנים, הכרת תודה מאחור.', 'רכות כלפי עצמי ואחרים, ותחושת שקט.'),
  bar('power-band', 'רצועת הכוח', 'Power Band', 'side', 'make', '#a65a31', [[112, 296]], 'בבסיס הגולגולת, ברוחב הרצועה של המטופל.', 'כוח אישי.', { band: true }),
  bar('implant-band', 'רצועת השתלים', 'Implant Band', 'side', 'aware', 'iridescent', [[170, 250]], 'ישירות מאחורי האוזן.', 'לפי השיטה, דפוסים שנקלטו מבחוץ.'),
  bar('restructuring', 'ארגון מחדש של הגופים', 'Restructuring of Bodies', 'side', 'body', CLEAR, [[214, 176], [176, 228], [138, 270]],
    'אצבע מורה על זמן ומרחב, הזרתות על הקצה העליון של רצועת הכוח, והאצבעות האמצעיות בקו ישר על צידי הראש.', 'לפי השיטה, התארגנות מחדש של הגוף.', { line: true }),

  // top view (nose at the top of the drawing), viewBox 0 0 300 340
  bar('aging', 'הזדקנות', 'Aging', 'top', 'body', '#e2c34a', sym(16, 150), 'בקו של הזווית הפנימית של העין, מעל אמצע האוזן.', 'היחס לגיל ולזמן שעובר בגוף.'),
  bar('body', 'גוף', 'Body', 'top', 'body', '#e39aa8', sym(34, 132), 'בקו של מרכז העין. רץ יחד עם המיניות.', 'היחס לגוף ולצרכיו.', { with: 'sexuality' }),
  bar('sexuality', 'מיניות', 'Sexuality', 'top', 'body', '#5b7fc1', sym(34, 206), 'בקו של מרכז העין. רץ יחד עם הגוף.', 'חיוניות, הנאה ומיניות.', { with: 'body' }),
  bar('reactivation', 'הפעלה מחדש ויצירה מחדש', 'Reactivation & Re-creation', 'top', 'aware', CLEAR, sym(54, 172), 'בקו של הזווית החיצונית של העיניים.', 'התחלה מחדש.'),
  bar('bridging', 'בר הגשר', 'Bridging Bar', 'top', 'body', CLEAR, sym(25, 176), 'נוגע בבארס של ההזדקנות ושל הגוף והמיניות.', 'מחבר בין הזדקנות, גוף ומיניות.'),
  bar('crown-mystar', 'כתר מיסטר', 'Crown of Mystar', 'top', 'aware', CLEAR, [[150, 58]], 'מקיף את קודקוד הראש, בערך בקו השיער מלפנים. נעשה מעל הראש, בלי מגע.', 'נעשה מחוץ לראש, סביב קו השיער.', { crown: true }),

  // front view, viewBox 0 0 300 340
  bar('sadness', 'עצב', 'Sadness', 'front', 'feel', '#6b3f8f', [[112, 158], [188, 158]], 'ממש מעל העיניים. רץ יחד עם השמחה.', 'עצב ואבל.', { with: 'joy' }),
  bar('joy', 'שמחה', 'Joy', 'front', 'feel', '#b9a3d9', [[132, 150], [168, 150]], 'רץ יחד עם העצב, לצידו.', 'שמחה וקלילות.', { with: 'sadness' }),
  bar('tunnels', 'מנהרות זמן ומרחב', 'Tunnels of Time & Space', 'front', 'aware', CLEAR, [[112, 128], [132, 120], [168, 120], [188, 128]], 'שתי נקודות לכל צד, מעל העצב והשמחה.', 'מעבר בין זמנים ומרחבים, לפי השיטה.'),
];

export const POINT_COUNT = BARS.reduce((n, b) => n + b.pts.length, 0);
export const barByKey = (k) => BARS.find((b) => b.key === k);
export const groupName = (k) => GROUPS.find((g) => g.key === k)?.name ?? '';
