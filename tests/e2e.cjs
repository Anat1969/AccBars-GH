// End-to-end check against `vite preview`, with every Supabase call mocked in memory.
// Run: npm run build:test && npm run preview & node tests/e2e.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:4173';
const SB = 'https://mock.supabase.test';
const MENU_JS = process.env.AI_MENU_JS; // optional local copy of ai-menu.js
const SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

let failures = 0;
const ok = (cond, name) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) failures++;
};

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const USER_ID = '11111111-1111-4111-8111-111111111111';
const jwt = (aal) => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: USER_ID, role: 'authenticated', aal, amr: [{ method: 'password', timestamp: 1 }], exp: 4102444800 })}.sig`;
const sessionFor = (aal) => ({
  access_token: jwt(aal),
  refresh_token: 'r',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: 4102444800,
  user: { id: USER_ID, aud: 'authenticated', role: 'authenticated', email: 'therapist@example.test', factors: [] },
});

function makeDb() {
  const uid = () => crypto.randomUUID();
  return { accbars_patients: [], accbars_goals: [], accbars_sessions: [], accbars_exercises: [], accbars_library: [], uid };
}

async function mockSupabase(page, db, log) {
  await page.route(`${SB}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();
    const body = req.postData() ? JSON.parse(req.postData()) : null;
    log.push({ method, path: url.pathname, search: url.search, body });
    const json = (status, data) => route.fulfill({ status, contentType: 'application/json', body: data === undefined ? '' : JSON.stringify(data) });

    // auth
    if (url.pathname === '/auth/v1/token') return json(200, sessionFor('aal1'));
    if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204 });
    if (url.pathname === '/auth/v1/recover') return json(200, {});
    if (url.pathname === '/auth/v1/user') return json(200, sessionFor('aal1').user);
    if (url.pathname === '/auth/v1/factors' && method === 'POST')
      return json(200, { id: 'f1', type: 'totp', totp: { qr_code: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>', secret: 'SECRET', uri: 'otpauth://x' } });
    if (/\/auth\/v1\/factors\/f1\/challenge$/.test(url.pathname)) return json(200, { id: 'c1', expires_at: 4102444800 });
    if (/\/auth\/v1\/factors\/f1\/verify$/.test(url.pathname)) return json(200, sessionFor('aal2'));

    // rpc
    if (url.pathname === '/rest/v1/rpc/accbars_is_allowed') return json(200, true);
    if (url.pathname === '/rest/v1/rpc/accbars_rotate_token') {
      const p = db.accbars_patients.find((x) => x.id === body.p_patient);
      p.share_token = 'b'.repeat(36);
      return json(200, p.share_token);
    }
    if (url.pathname === '/rest/v1/rpc/accbars_patient_view') {
      const p = db.accbars_patients.find((x) => x.share_token === body.p_token);
      if (!p) return json(200, []);
      const s = db.accbars_sessions.filter((x) => x.patient_id === p.id && x.status === 'done' && x.summary).at(-1);
      const e = db.accbars_exercises.filter((x) => x.patient_id === p.id).at(-1);
      return json(200, [{ first_name: p.full_name.split(' ')[0], message: s?.summary ?? null, exercise: e?.description ?? null, next_session_at: p.next_session_at }]);
    }

    // tables
    const table = url.pathname.replace('/rest/v1/', '');
    const rows = db[table];
    if (!rows) return json(404, { message: 'no table' });
    const filters = [...url.searchParams].filter(([k, v]) => v.startsWith('eq.')).map(([k, v]) => [k, v.slice(3)]);
    const match = (r) => filters.every(([k, v]) => String(r[k]) === v);
    const single = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
    const out = (list) => (single ? json(list.length ? 200 : 406, list[0] ?? { message: 'none' }) : json(200, list));

    if (method === 'GET') return out(rows.filter(match));
    if (method === 'POST') {
      const list = Array.isArray(body) ? body : [body];
      const conflict = url.searchParams.get('on_conflict');
      const created = list.map((r) => {
        const existing = conflict && rows.find((x) => x[conflict] === r[conflict]);
        if (existing) return Object.assign(existing, r);
        const row = { id: db.uid(), therapist_id: USER_ID, created_at: new Date().toISOString(), ...defaults(table), ...r };
        rows.push(row);
        return row;
      });
      return out(created);
    }
    if (method === 'PATCH') {
      const hit = rows.filter(match);
      hit.forEach((r) => Object.assign(r, body));
      return out(hit);
    }
    if (method === 'DELETE') {
      for (const r of rows.filter(match)) rows.splice(rows.indexOf(r), 1);
      return json(204);
    }
    return json(400, {});
  });
}

function defaults(table) {
  if (table === 'accbars_patients') return { share_token: 'a'.repeat(36), opened_on: '2026-09-15', next_session_at: null, open_point: null };
  if (table === 'accbars_sessions') return { status: 'draft', session_date: '2026-10-28', risk_ack_at: null, goal_ids: [], bars: [] };
  return {};
}

async function menu(page, label) {
  await page.locator('ai-menu .logo').click();
  await page.locator('ai-menu').getByText(label, { exact: true }).first().click();
}

(async () => {
  const browser = await chromium.launch();
  const errors = [];

  // ---------- 1. sign in, enroll second factor ----------
  {
    const ctx = await browser.newContext({ locale: 'he-IL' });
    const page = await ctx.newPage();
    if (MENU_JS) await page.route('https://appofapp-gh.vercel.app/ai-menu.js', (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(MENU_JS, 'utf8') }));
    const db = makeDb();
    const log = [];
    await mockSupabase(page, db, log);
    page.on('pageerror', (e) => errors.push(e.message));
    // public home explains the product before any sign-in
    await page.goto(BASE);
    await page.getByText('מרחב העבודה של מטפלת').waitFor();
    ok(await page.locator('.wordmark').isVisible(), 'home shows the AccBars wordmark');
    ok(await page.getByText('מה זה AccBars').isVisible(), 'home explains what AccBars is');
    ok(!log.some((l) => l.path.startsWith('/rest/v1/accbars_')), 'home reads no patient data');
    await page.waitForTimeout(2600);
    await page.screenshot({ path: path.join(SHOTS, '10-home.png') });
    // pinned journey follows the scroll
    const pin = page.locator('.journey-pin');
    await pin.scrollIntoViewIfNeeded();
    const box = await pin.boundingBox();
    const top = await page.evaluate(() => scrollY);
    await page.evaluate((y) => scrollTo(0, y), top + box.y + box.height * 0.62);
    await page.waitForTimeout(1500);
    ok(await page.locator('.jp-card h3').innerText() === 'סיכום במשפט', 'journey moves to step 5 with the scroll');
    await page.screenshot({ path: path.join(SHOTS, '11-home-journey.png') });
    const first = await page.locator('.types-text h2').innerText();
    await page.locator('.types').scrollIntoViewIfNeeded();
    await page.waitForTimeout(5200);
    ok((await page.locator('.types-text h2').innerText()) !== first, 'enneagram highlight moves on its own');
    await page.locator('.deep').scrollIntoViewIfNeeded();
    await page.waitForTimeout(3200);
    await page.screenshot({ path: path.join(SHOTS, '12-home-deep.png') });
    await page.locator('.fan').scrollIntoViewIfNeeded();
    await page.waitForTimeout(2200);
    await page.screenshot({ path: path.join(SHOTS, '13-home-fan.png') });
    ok(await page.locator('.showcase .headmap').count() === 3, 'home shows the three head views');
    // the public bars page
    await page.goto(BASE + '/bars');
    await page.getByText('32 נקודות על').waitFor();
    await page.locator('.bars-explorer .hm-bar[aria-label="שליטה, Control"] circle').last().hover();
    await page.locator('.bar-info').getByRole('heading', { name: 'שליטה' }).waitFor();
    ok(await page.locator('.bar-info').getByText('אצבע אחת אחורה מהכסף').isVisible(), 'hovering a bar shows its place');
    await page.locator('.bars-controls').getByRole('button', { name: 'מבט מלמעלה' }).click();
    await page.locator('.bars-explorer .hm-bar[aria-label="גוף, Body"]').waitFor();
    ok(true, 'top view shows its bars');
    await page.locator('.bars-controls').getByRole('button', { name: 'רגש' }).click();
    ok(await page.locator('.bars-side .bar-chip').count() === 0, 'group filter narrows the view list (no feeling bars on top)');
    await page.locator('.bars-controls').getByRole('button', { name: 'כל הקבוצות' }).click();
    await page.locator('.group-card').getByRole('button', { name: /עצב/ }).click();
    await page.locator('.bar-info').getByRole('heading', { name: 'עצב' }).waitFor();
    ok(await page.locator('.bars-controls').getByRole('button', { name: 'מבט מלפנים' }).getAttribute('aria-pressed') === 'true', 'list item opens its view on the map');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(SHOTS, '14-bars.png') });
    const target = (await page.locator('.quiz-target').innerText()).trim();
    await page.locator('.quiz').scrollIntoViewIfNeeded();
    await page.locator(`.quiz .hm-bar[aria-label^="${target},"] circle`).last().click();
    await page.locator('.quiz .msg-ok').waitFor();
    ok(true, 'quiz: the right point is accepted');
    await page.getByRole('button', { name: 'הבר הבא' }).click();
    const t2 = (await page.locator('.quiz-target').innerText()).trim();
    const wrong = await page.locator(`.quiz .hm-bar:not([aria-label^="${t2},"])`).first();
    await wrong.locator('circle').last().click();
    await page.locator('.quiz .msg-error').waitFor();
    ok(true, 'quiz: a wrong point invites another try');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SHOTS, '15-quiz.png') });
    ok(await page.getByText('אינם ממצאים מדעיים').isVisible(), 'bars page states it is the method, not science');
    await page.goto(BASE);
    await page.getByText('מרחב העבודה של מטפלת').waitFor();
    await page.locator('.home-cta').getByRole('link', { name: 'כניסה' }).click();
    await page.getByText('מקום שקט לעבודה').waitFor();
    ok(page.url().endsWith('/patients'), 'home entry leads to sign-in');
    await page.locator('ai-menu .logo').waitFor();
    ok(true, 'A&I logo button on the sign-in screen');
    await page.getByLabel('אימייל').fill('therapist@example.test');
    await page.getByLabel('סיסמה').fill('long-password-1');
    await page.getByRole('button', { name: 'שחזור סיסמה' }).click();
    await page.locator('.msg-ok').waitFor();
    ok(log.some((l) => l.path === '/auth/v1/recover'), 'password recovery request sent');
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(SHOTS, '00-signin.png') });
    await page.getByRole('button', { name: 'כניסה' }).click();
    await page.getByText('אין עדיין מטופלים.').waitFor();
    ok(log.some((l) => l.path === '/auth/v1/token' && l.search.includes('grant_type=password')), 'password sign-in request sent');
    ok(true, 'password alone opens the app, no forced second factor');
    // the second factor is optional, from the A&I menu
    await menu(page, 'הפעלת אימות דו־שלבי');
    await page.getByText('שכבת הגנה נוספת').waitFor();
    await page.locator('.qr svg').waitFor();
    ok(!(await page.locator('.qr').innerText()).includes('data:'), 'TOTP QR code shown as an image');
    await page.getByRole('button', { name: 'לא עכשיו' }).click();
    await page.getByText('אין עדיין מטופלים.').waitFor();
    ok(true, 'second factor can be skipped');
    await menu(page, 'הפעלת אימות דו־שלבי');
    await page.getByLabel('קוד בן שש ספרות').fill('123456');
    await page.getByRole('button', { name: 'אישור' }).click();
    await page.getByText('אין עדיין מטופלים.').waitFor();
    ok(log.some((l) => l.path.endsWith('/verify') && l.body.code === '123456'), 'TOTP verify request sent with the code');
    await page.screenshot({ path: path.join(SHOTS, '01-empty.png'), fullPage: true });
    await ctx.close();
  }

  // ---------- 2. main flow, already at aal2 ----------
  const ctx = await browser.newContext({ locale: 'he-IL', viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript((s) => localStorage.setItem('accbars-auth', s), JSON.stringify(sessionFor('aal2')));
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
  const page = await ctx.newPage();
  if (MENU_JS) await page.route('https://appofapp-gh.vercel.app/ai-menu.js', (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(MENU_JS, 'utf8') }));
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());
  const db = makeDb();
  const log = [];
  await mockSupabase(page, db, log);

  await page.goto(BASE + '/patients');
  await page.getByText('אין עדיין מטופלים.').waitFor();
  ok(await page.locator('ai-menu .logo').isVisible(), 'A&I logo button in the top bar');
  ok(!(await page.locator('header >> text=העתקת קישור').first().isVisible().catch(() => false)), 'no loose development buttons in the bar');
  ok((await page.locator('header a.brand').getAttribute('href')) === '/', 'app name links home');

  // new patient
  await page.getByRole('link', { name: 'להוסיף מטופל ראשון' }).click();
  await page.getByLabel('שם מלא').fill('דנה ל.');
  await page.getByLabel('גיל').fill('38');
  await page.getByLabel('טלפון, לא מוצג ברשימה').fill('050-0000000');
  await page.getByLabel('מטפלת אחראית').fill('נועה');
  await page.getByLabel('טיפוס אניאגרם, השערת עבודה').selectOption('6');
  await page.getByLabel(/יעדים/).fill('להרגיש פחות לחוצה לפני ישיבות עבודה\nלזהות מתי אני נכנסת לעומס');
  await page.getByRole('button', { name: 'הוספת המטופל' }).click();
  await page.getByText('עוד לא נרשם סשן.').waitFor();
  const insert = log.find((l) => l.method === 'POST' && l.path.endsWith('accbars_patients'));
  ok(insert && insert.body.full_name === 'דנה ל.' && insert.body.age === 38 && insert.body.enneagram_type === 6, 'patient insert carries the form values');
  ok(db.accbars_goals.length === 2, 'two goals saved');
  ok(await page.locator('dd', { hasText: '6, הנאמן' }).isVisible(), 'enneagram hypothesis shown on the card');
  await page.screenshot({ path: path.join(SHOTS, '02-card-empty.png'), fullPage: true });

  // goals: add
  await page.getByLabel('יעד נוסף').fill('לקבוע זמן קבוע לעצמי בשבוע');
  await page.getByRole('button', { name: 'הוספה' }).click();
  await page.getByText('לקבוע זמן קבוע לעצמי בשבוע').waitFor();
  ok(db.accbars_goals.length === 3, 'goal added');

  // edit mode inside the A&I menu, delete a goal
  await menu(page, 'מצב עריכה');
  await page.getByRole('button', { name: 'מחיקת היעד לקבוע זמן קבוע לעצמי בשבוע' }).click();
  await page.waitForFunction(() => !document.body.innerText.includes('לקבוע זמן קבוע לעצמי בשבוע'));
  ok(db.accbars_goals.length === 2, 'goal deleted from edit mode');
  await menu(page, 'סיום עריכה');

  // share link
  await page.getByRole('button', { name: 'העתקת הקישור למטופל' }).click();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  ok(clip.endsWith('/p/' + 'a'.repeat(36)), 'patient link copied');
  await menu(page, 'קישור חדש למסך המטופל');
  await page.waitForTimeout(400);
  ok(log.some((l) => l.path.endsWith('accbars_rotate_token')), 'rotate token request sent');

  // session
  await page.getByRole('button', { name: 'סשן חדש' }).click();
  await page.getByText('מה המטופל מביא היום?').waitFor();
  ok(db.accbars_sessions.length === 1, 'draft session created');
  ok(!log.some((l) => l.method === 'DELETE' && l.path.endsWith('accbars_exercises')), 'no exercise delete while none exists');
  await page.locator('textarea.big-text').fill('עומס לפני ישיבות');
  await page.getByRole('button', { name: 'הבא', exact: true }).click();
  await page.getByText('מה קרה בסשן?').waitFor();
  await page.locator('textarea.big-text').fill('התמקדות בעומס לפני ישיבות.');
  await page.getByRole('button', { name: 'להרגיש פחות לחוצה לפני ישיבות עבודה' }).click();
  await page.waitForTimeout(1300);
  ok((db.accbars_sessions[0].goal_ids ?? []).length === 1, 'goal chip saved on the session');
  await page.locator('.bars-picker .hm-bar[aria-label="כסף, Money"] circle').last().click();
  await page.locator('.bars-picker .hm-bar[aria-label="ריפוי, Healing"] circle').last().click();
  await page.locator('.bars-picker').getByRole('button', { name: 'מבט מלפנים' }).click();
  await page.waitForTimeout(900);
  await page.locator('.bars-picker .hm-bar[aria-label="שמחה, Joy"] circle').last().click();
  await page.waitForTimeout(1300);
  ok(JSON.stringify(db.accbars_sessions[0].bars) === JSON.stringify(['money', 'healing', 'joy']), 'bars run in the session are saved');
  await page.locator('.bars-picker').getByRole('button', { name: 'הסרת ריפוי' }).click();
  await page.waitForTimeout(1300);
  ok(db.accbars_sessions[0].bars.length === 2, 'a bar can be unmarked');
  // distress sign stops the flow
  await page.locator('textarea.big-text').fill('התמקדות בעומס. אמרה שהיא לא רוצה לחיות ככה.');
  await page.getByText('עולה כאן סימן אפשרי למצוקה או לסיכון').waitFor();
  ok(await page.getByRole('button', { name: 'הבא', exact: true }).isDisabled(), 'distress sign blocks the next step');
  ok(await page.getByText('1201').first().isVisible(), 'referral number shown');
  await page.getByLabel('בדקתי שאין סכנה מיידית, או הפניתי לגורם מקצועי').click();
  ok(await page.getByRole('button', { name: 'הבא', exact: true }).isEnabled(), 'acknowledging the referral unblocks');
  await page.getByRole('button', { name: 'הבא', exact: true }).click();
  await page.getByText('תובנה אחת שעלתה.').waitFor();
  await page.locator('textarea.big-text').fill('הלחץ מתחיל לפני הישיבה.');
  await page.getByRole('button', { name: 'הבא', exact: true }).click();
  await page.getByText('תרגיל אחד, קטן וברור, לשבוע הקרוב.').waitFor();
  // suggestions follow the patient's type (6)
  await page.getByText('הצעות לטיפוס 6, הנאמן').waitFor();
  ok(await page.locator('.suggestions .practice').count() === 3, 'three suggestions for the type');
  await page.locator('.suggestions .practice-front').first().click();
  await page.waitForTimeout(1200);
  await page.locator('.suggestions').getByRole('button', { name: 'לתרגיל של השבוע' }).first().click();
  ok((await page.locator('textarea.big-text').inputValue()).startsWith('קרקע'), 'the insight ("לחץ") leads the suggestions, and choosing one fills the exercise');
  await page.getByRole('button', { name: 'הבא', exact: true }).click();
  await page.getByText('מה המטופל לוקח איתו, במשפט אחד.').waitFor();
  ok(db.accbars_exercises[0]?.library_key === '6-ground', 'exercise keeps its library source');
  await page.getByRole('button', { name: 'הקודם' }).click();
  await page.getByText('תרגיל אחד, קטן וברור, לשבוע הקרוב.').waitFor();
  await page.locator('textarea.big-text').fill('שלוש שורות בבוקר לפני המייל.');
  await page.getByRole('button', { name: 'הבא', exact: true }).click();
  await page.getByText('מה המטופל לוקח איתו, במשפט אחד.').waitFor();
  ok(db.accbars_exercises.length === 1 && db.accbars_exercises[0].description === 'שלוש שורות בבוקר לפני המייל.' && !db.accbars_exercises[0].library_key, 'typed exercise replaces the suggestion');
  await page.getByRole('button', { name: 'הבא', exact: true }).click();
  // finish without summary jumps back
  await page.getByLabel('נקודה פתוחה לסשן הבא').fill('האם התרגיל של שלוש השורות נשמר');
  const soon = new Date(Date.now() + 2 * 864e5);
  const soonVal = `${soon.getFullYear()}-${String(soon.getMonth() + 1).padStart(2, '0')}-${String(soon.getDate()).padStart(2, '0')}T10:00`;
  await page.getByLabel('הסשן הבא').fill(soonVal);
  await page.getByRole('button', { name: 'סיום הסשן' }).click();
  await page.getByText('מה המטופל לוקח איתו, במשפט אחד.').waitFor();
  ok(true, 'finish without summary returns to the summary step');
  await page.locator('textarea.big-text').fill('הלחץ מתחיל לפני הישיבה, ושם אפשר לעצור.');
  // stepper jumps
  await page.locator('.uf-node').nth(5).click();
  await page.waitForTimeout(1200);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: path.join(SHOTS, '03-session.png') });
  await page.getByRole('button', { name: 'סיום הסשן' }).click();
  await page.getByText('הסשן נשמר.').waitFor();
  await page.locator('.session-item').first().waitFor();
  const s = db.accbars_sessions[0];
  ok(s.status === 'done' && s.summary.startsWith('הלחץ מתחיל') && s.insight && s.discussed && s.brought && s.risk_ack_at, 'session saved with every step');
  const p = db.accbars_patients[0];
  ok(p.open_point === 'האם התרגיל של שלוש השורות נשמר' && p.next_session_at, 'next session and open point moved to the patient');
  ok(await page.getByText('נרשמה הפניה').isVisible(), 'referral tag in history');
  ok(await page.locator('.journey .jr-leaf').count() === 1, 'journey shows one leaf for the session');
  ok(await page.locator('.patient-bars').isVisible(), 'patient bars map on the card');
  await page.locator('.patient-bars').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1800);
  await page.locator('.patient-bars .hm-bar[aria-label="כסף, Money"]').focus();
  await page.locator('.patient-bars').getByText('הורץ ב-1 סשנים').waitFor();
  ok(true, 'patient bars map tells when a bar was run');
  ok(await page.locator('.goal-map path').count() === 1, 'goal map draws one thread');
  ok(await page.locator('.enneagram').first().isVisible(), 'enneagram on the card');
  await page.waitForTimeout(1500);
  await page.locator('.journey .jr-leaf').first().click();
  await page.getByText('מה המטופל מביא היום?').waitFor();
  ok(true, 'journey leaf opens the session');
  await page.goBack();
  await page.locator('.session-item').first().waitFor();

  // done note on the exercise
  await page.getByLabel('מה נעשה בפועל').fill('נעשה בשלושה בקרים');
  await page.getByLabel('מה נעשה בפועל').press('Enter');
  await page.waitForTimeout(400);
  ok(db.accbars_exercises[0].done_note === 'נעשה בשלושה בקרים', 'exercise done note saved');
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: path.join(SHOTS, '04-card.png') });

  // edit details from the A&I menu
  await menu(page, 'עריכת פרטי המטופל');
  await page.getByLabel('גיל').fill('39');
  await page.getByRole('button', { name: 'שמירה' }).click();
  await page.getByText('הפרטים נשמרו.').waitFor();
  ok(db.accbars_patients[0].age === 39, 'details edited');

  // list
  await page.locator('header a.brand').click();
  await page.getByText('מרחב העבודה של מטפלת').waitFor();
  ok(await page.locator('.hero-text').getByRole('link', { name: 'למטופלים' }).isVisible(), 'signed-in home offers the way in');
  await page.locator('.topnav').getByRole('link', { name: 'מטופלים' }).click();
  await page.getByText('הסשן הבא:').waitFor();
  ok(await page.getByText('האם התרגיל של שלוש השורות נשמר').isVisible(), 'open point shown in list');
  ok(await page.locator('.week-ring .wr-drop').count() === 1, 'week ring shows the coming session');
  ok(await page.locator('.dash .enneagram').isVisible(), 'patients enneagram map on home');
  ok(!(await page.getByText('050-0000000').isVisible().catch(() => false)), 'phone hidden in list');
  await page.getByLabel('חיפוש לפי שם').fill('אין כזה');
  ok(await page.getByText('אין מטופל בשם הזה.').isVisible(), 'search with no match');
  await page.getByLabel('חיפוש לפי שם').fill('דנה');
  ok(await page.locator('.patient-row').count() === 1, 'search by name');
  await page.screenshot({ path: path.join(SHOTS, '05-list.png'), fullPage: true });

  // library
  await page.getByRole('link', { name: 'ספרייה' }).click();
  await page.getByText('תרגיל, משחק,').waitFor();
  const total = await page.locator('.practice').count();
  ok(total === 40, `library shows every built-in item (${total})`);
  await page.locator('.filters').getByRole('button', { name: 'משחק' }).click();
  await page.waitForTimeout(600);
  ok(await page.locator('.practice').count() === 10, 'kind filter keeps the games');
  ok(page.url().includes('kind='), 'filter is in the link');
  await page.locator('.library-wheel .en-point[aria-label="8, המאתגר"] circle').last().click();
  await page.waitForTimeout(800);
  ok(await page.locator('.practice').count() === 2, 'type filter: the type game and the shared one');
  await page.locator('.practice-front').first().click();
  await page.waitForTimeout(1300);
  ok(await page.locator('.practice-back').first().getByText('חזרה').isVisible(), 'card turns over to its steps');
  await page.locator('.filters').getByRole('button', { name: 'הכול' }).click();
  await page.getByRole('button', { name: 'כל הטיפוסים' }).click();
  await page.getByLabel('חיפוש').fill('קרקע');
  await page.waitForTimeout(600);
  ok(await page.locator('.practice').count() === 1, 'library search');
  await page.getByLabel('חיפוש').fill('');
  await menu(page, 'תרגיל חדש לספרייה');
  await page.getByLabel('כותרת').fill('הליכה שקטה');
  await page.locator('.sheet').getByRole('button', { name: '6, הנאמן' }).click();
  await page.getByLabel('שלבים, שלב בכל שורה').fill('ללכת לאט\nלספור צעדים');
  await page.getByRole('button', { name: 'הוספה לספרייה' }).click();
  await page.getByText('נוסף לספרייה.').waitFor();
  ok(db.accbars_library.length === 1 && db.accbars_library[0].steps.length === 2 && db.accbars_library[0].types[0] === 6, 'own item saved');
  await page.locator('.practice-title', { hasText: 'הליכה שקטה' }).waitFor();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(SHOTS, '09-library.png') });
  await menu(page, 'מצב עריכה');
  await page.locator('.practice-front', { hasText: 'הליכה שקטה' }).click();
  await page.waitForTimeout(1200);
  await page.locator('.practice-back').first().getByRole('button', { name: 'מחיקה' }).click();
  await page.waitForTimeout(800);
  ok(db.accbars_library.length === 0, 'own item deleted in edit mode');
  await menu(page, 'סיום עריכה');

  // method map
  await page.getByRole('link', { name: 'השיטה' }).click();
  await page.getByText('מחזור הסשן').waitFor();
  await page.locator('.cy-station circle').nth(3).click();
  await page.locator('.cycle-card').getByText('תרגיל קטן וברור לשבוע.').waitFor();
  ok(true, 'cycle station opens its card');
  await page.locator('.method-block .en-point').nth(5).scrollIntoViewIfNeeded();
  await page.locator('.en-point[aria-label="6, הנאמן"] circle').last().click();
  await page.locator('.type-cards').getByText('מחפש ביטחון ויציבות.').waitFor();
  ok(true, 'enneagram point opens the type card');
  await page.getByRole('button', { name: 'לכל הטיפוסים' }).click();
  ok(await page.locator('.type-list li').count() === 9, 'back to all nine types');
  await page.locator('.schema').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(SHOTS, '07-method.png'), fullPage: true });
  await page.locator('.topnav').getByRole('link', { name: 'מטופלים' }).click();
  await page.getByText('הסשן הבא:').waitFor();

  // patient screen
  const pv = await ctx.newPage();
  if (MENU_JS) await pv.route('https://appofapp-gh.vercel.app/ai-menu.js', (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(MENU_JS, 'utf8') }));
  await mockSupabase(pv, db, log);
  pv.on('pageerror', (e) => errors.push(e.message));
  await pv.goto(`${BASE}/p/${'b'.repeat(36)}`);
  await pv.getByText('הלחץ מתחיל לפני הישיבה, ושם אפשר לעצור.').waitFor();
  ok(await pv.getByText('שלום דנה').isVisible(), 'patient screen greets by first name');
  ok(await pv.getByText('שלוש שורות בבוקר לפני המייל.').isVisible(), 'patient screen shows the exercise');
  ok(await pv.getByText(/ער"ן/).isVisible(), 'patient screen shows the care line');
  await pv.waitForTimeout(3000);
  await pv.screenshot({ path: path.join(SHOTS, '06-patient.png'), fullPage: true });
  await pv.getByRole('button', { name: 'רגע של נשימה' }).click();
  await pv.getByText('שאיפה').waitFor();
  await pv.getByText('נשיפה').waitFor({ timeout: 8000 });
  ok(true, 'breathing moves from in to out');
  await pv.waitForTimeout(1500);
  await pv.screenshot({ path: path.join(SHOTS, '08-breath.png') });
  await pv.getByRole('button', { name: 'לעצור' }).click();
  await pv.locator('.breath').waitFor({ state: 'detached', timeout: 5000 });
  ok(true, 'breathing closes');
  await pv.goto(`${BASE}/p/${'a'.repeat(36)}`);
  await pv.getByText('הקישור אינו פעיל').waitFor();
  ok(true, 'old link is inactive after rotation');

  // mobile: no horizontal scroll on every screen
  const m = await browser.newContext({ locale: 'he-IL', viewport: { width: 375, height: 760 }, isMobile: true, hasTouch: true });
  await m.addInitScript((s) => localStorage.setItem('accbars-auth', s), JSON.stringify(sessionFor('aal2')));
  const mp = await m.newPage();
  if (MENU_JS) await mp.route('https://appofapp-gh.vercel.app/ai-menu.js', (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(MENU_JS, 'utf8') }));
  await mockSupabase(mp, db, log);
  mp.on('pageerror', (e) => errors.push(e.message));
  for (const [name, url, wait] of [
    ['home', '/', 'מרחב העבודה של מטפלת'],
    ['list', '/patients', 'דנה ל.'],
    ['card', `/patients/${p.id}`, 'סשנים'],
    ['session', `/patients/${p.id}/sessions/${s.id}`, 'מה המטופל מביא היום?'],
    ['new', '/patients/new', 'מטופל חדש'],
    ['method', '/method', 'מחזור הסשן'],
    ['bars', '/bars', '32 נקודות על'],
    ['library', '/library', 'תרגיל, משחק,'],
    ['patient', `/p/${'b'.repeat(36)}`, 'שלום דנה'],
  ]) {
    await mp.goto(BASE + url);
    await mp.getByText(wait).first().waitFor();
    await mp.waitForTimeout(900);
    const over = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(over <= 0, `mobile ${name}: no horizontal scroll (${over}px)`);
    await mp.screenshot({ path: path.join(SHOTS, `m-${name}.png`), fullPage: true });
  }

  // delete patient from the A&I menu
  await page.goto(`${BASE}/patients/${p.id}`);
  await page.getByRole('heading', { name: 'סשנים' }).waitFor();
  await menu(page, 'מחיקת המטופל');
  await page.getByText('אין עדיין מטופלים.').waitFor();
  ok(db.accbars_patients.length === 0, 'patient deleted');

  // sign out
  await menu(page, 'יציאה מהחשבון');
  await page.getByText('מקום שקט לעבודה').waitFor();
  ok(log.some((l) => l.path === '/auth/v1/logout'), 'sign-out request sent');

  // installability
  const cdp = await ctx.newCDPSession(page);
  await page.goto(BASE);
  await page.waitForTimeout(1500);
  const inst = await cdp.send('Page.getInstallabilityErrors');
  ok(inst.installabilityErrors.length === 0, `installable (${JSON.stringify(inst.installabilityErrors)})`);

  ok(errors.length === 0, `no page errors ${errors.join(' | ')}`);
  await browser.close();
  console.log(failures ? `\n${failures} failed` : '\nall passed');
  process.exit(failures ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
