// Integration test: runs the GENERATED Apps Script project inside a Node VM
// with in-memory fakes for SpreadsheetApp, GmailApp, MailApp, etc.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { build } = require('../tools/build_apps_script.js');

function makeEnv({ dryRun = false, config = null, quota = 90, fetch = null } = {}) {
  const sent = [];       // GmailApp + MailApp sends
  const sheets = {};
  const props = { DRY_RUN: String(dryRun) };
  const threads = {};
  let threadSeq = 0;
  const triggers = [];
  const fakeSheet = (name) => {
    const rows = [];
    return {
      name, rows,
      appendRow: (r) => rows.push(r.slice()),
      setFrozenRows: () => {},
      getDataRange: () => ({ getValues: () => rows.map((r) => r.slice()) }),
      getRange: (row, col) => ({ setValue: (v) => { rows[row - 1][col - 1] = v; } })
    };
  };
  const ss = {
    getSheetByName: (n) => sheets[n] || null,
    insertSheet: (n) => (sheets[n] = fakeSheet(n)),
    getUrl: () => 'https://docs.google.com/spreadsheets/d/fake'
  };
  const send = (kind) => (to, subject, body) => {
    const id = 't' + (++threadSeq);
    threads[id] = { id, subject, to, messages: [{ from: 'business@example.com', body, date: new Date() }] };
    sent.push({ kind, to, subject, body, threadId: id });
  };
  const ctx = {
    console,
    Intl, Date, Math, JSON, Object, Array, String, Number, RegExp, Error,
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null, setProperty: (k, v) => { props[k] = v; } }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, openById: () => ss },
    GmailApp: {
      sendEmail: send('gmail'),
      search: (q) => Object.values(threads).filter((t) => q.includes(t.to)).slice(-1).map((t) => ({ getId: () => t.id })),
      getThreadById: (id) => threads[id] && {
        getId: () => id,
        getMessages: () => threads[id].messages.map((m) => ({ getFrom: () => m.from, getDate: () => m.date, getPlainBody: () => m.body })),
        reply: (body) => { threads[id].messages.push({ from: 'business@example.com', body, date: new Date() }); sent.push({ kind: 'reply', to: threads[id].to, body, threadId: id }); }
      }
    },
    MailApp: { sendEmail: send('mail'), getRemainingDailyQuota: () => env.quota },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, tryLock: () => !env.locked, releaseLock: () => {} }) },
    UrlFetchApp: { fetch: (url, opts) => { env.fetches.push({ url, opts }); return { getContentText: () => JSON.stringify(fetch ? fetch(url, opts) : { success: true }) }; } },
    Utilities: { formatDate: () => '261021-140000' },
    ScriptApp: {
      getProjectTriggers: () => triggers.slice(),
      deleteTrigger: () => {},
      newTrigger: (fn) => { const t = { fn }; const chain = { timeBased: () => chain, everyHours: () => chain, everyDays: () => chain, atHour: () => chain, forForm: () => chain, onFormSubmit: () => chain, create: () => { triggers.push(t); return t; } }; return chain; }
    },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s) => ({ setMimeType: () => s }) }
  };
  const env = { locked: false, quota, fetches: [] };
  vm.createContext(ctx);
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'ld-'));
  let cfgPath = path.join(__dirname, '../examples/config.example.json');
  if (config) { cfgPath = path.join(out, 'cfg.json'); fs.writeFileSync(cfgPath, JSON.stringify(config(JSON.parse(fs.readFileSync(path.join(__dirname, '../examples/config.example.json'), 'utf8'))))); }
  build(cfgPath, out);
  for (const f of ['Engine.gs', 'Config.gs', 'Code.gs']) vm.runInContext(fs.readFileSync(path.join(out, f), 'utf8'), ctx, { filename: f });
  return Object.assign(env, { ctx, sent, sheets, threads, triggers, props });
}

test('setup creates sheets and triggers', () => {
  const env = makeEnv();
  assert.equal(env.ctx.setup(), 'OK');
  assert.ok(env.sheets.Leads && env.sheets.Log);
  assert.deepEqual(env.triggers.map((t) => t.fn).sort(), ['dailyDigest', 'runFollowUps']);
});

test('website POST → lead row, instant reply to lead, alert to owner', () => {
  const env = makeEnv();
  env.ctx.setup();
  const res = env.ctx.doPost({ postData: { type: 'application/json', contents: JSON.stringify({ name: 'Sam Ortiz', email: 'sam@example.com', zip: '02139', message: 'No heat since last night, furnace stopped' }) } });
  assert.match(res, /"ok":true/);
  const leads = env.sheets.Leads.rows;
  assert.equal(leads.length, 2);
  assert.equal(leads[1][3], 'sam@example.com');
  assert.equal(leads[1][9], 'hot');
  assert.equal(env.sent.filter((s) => s.to === 'sam@example.com').length, 1);
  assert.equal(env.sent.filter((s) => s.to === 'owner@northfield-demo.example').length, 1);
  assert.ok(leads[1][16], 'thread id stored');
});

test('Google Form submit works with namedValues', () => {
  const env = makeEnv();
  env.ctx.setup();
  env.ctx.onFormSubmit({ namedValues: { 'Full Name': ['Lee Park'], 'Email Address': ['lee@example.com'], 'Project details': ['Quote for heat pump install'] } });
  assert.equal(env.sheets.Leads.rows[1][6], 'New system installation');
});

test('follow-ups: sends on schedule, stops when lead replies, marks opt-out', () => {
  const env = makeEnv();
  env.ctx.setup();
  env.ctx.doPost({ parameter: { name: 'A One', email: 'a@example.com', message: 'tune-up please' } });
  env.ctx.doPost({ parameter: { name: 'B Two', email: 'b@example.com', message: 'tune-up please' } });
  env.ctx.doPost({ parameter: { name: 'C Three', email: 'c@example.com', message: 'tune-up please' } });
  const rows = env.sheets.Leads.rows;
  // Pretend the leads arrived 2 days ago
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000);
  rows.slice(1).forEach((r) => { r[1] = twoDaysAgo; });
  // B replies normally, C opts out
  env.threads[rows[2][16]].messages.push({ from: 'B Two <b@example.com>', body: 'Thursday works', date: new Date() });
  env.threads[rows[3][16]].messages.push({ from: 'c@example.com', body: 'No thanks, please stop emailing', date: new Date() });
  // A's mailbox sends an out-of-office: must NOT stop follow-ups
  env.threads[rows[1][16]].messages.push({ from: 'a@example.com', body: 'I am out of the office until Monday', date: new Date() });
  const r = env.ctx.runFollowUps();
  assert.deepEqual({ sent: r.sent, stopped: r.stopped, errors: r.errors }, { sent: 1, stopped: 2, errors: 0 });
  const after = env.sheets.Leads.rows;
  assert.equal(after[1][11], 'following-up');
  assert.equal(after[1][13], 1);
  assert.equal(after[2][11], 'replied');
  assert.equal(after[3][11], 'unsubscribed');
  // Running again in the same hour must not double-send
  assert.equal(env.ctx.runFollowUps().sent, 0);
});

test('DRY_RUN sends nothing but still logs and records', () => {
  const env = makeEnv({ dryRun: true });
  env.ctx.setup();
  env.ctx.doPost({ parameter: { name: 'Dry', email: 'dry@example.com', message: 'AC broken' } });
  assert.equal(env.sent.length, 0);
  assert.match(env.sheets.Leads.rows[1][12], /DRY RUN/);
});

test('errors are logged and owner notified at most once per hour', () => {
  const env = makeEnv();
  env.ctx.setup();
  env.ctx.GmailApp.sendEmail = () => { throw new Error('Gmail quota exceeded'); };
  env.ctx.doPost({ parameter: { name: 'E1', email: 'e1@example.com', message: 'AC broken' } });
  env.ctx.doPost({ parameter: { name: 'E2', email: 'e2@example.com', message: 'AC broken' } });
  const errs = env.sheets.Log.rows.filter((r) => r[1] === 'ERROR');
  assert.equal(errs.length, 2);
  assert.equal(env.sent.filter((s) => /Error/.test(s.subject || '')).length, 1);
});

test('build refuses an invalid client config', () => {
  const bad = path.join(os.tmpdir(), 'bad-config.json');
  fs.writeFileSync(bad, JSON.stringify({ business: { name: 'X' } }));
  assert.throws(() => build(bad, fs.mkdtempSync(path.join(os.tmpdir(), 'x-'))), /failed validation/);
});

// ── v1.1 safeguards ──────────────────────────────────────────────────────────
const post = (env, fields) => JSON.parse(env.ctx.doPost({ parameter: fields }));
const H = (name) => ['Lead ID', 'Received', 'Name', 'Email', 'Phone', 'ZIP', 'Service', 'Message', 'Score', 'Tier', 'Urgent', 'Status', 'Auto-reply', 'Follow-ups sent', 'Last follow-up', 'Last reply', 'Thread ID', 'Notes', 'Score reasons', 'Dedupe key', 'Send state', 'Source'].indexOf(name);
const toLead = (env, addr) => env.sent.filter((s) => s.to === addr);

test('doPost answers with the record id only after the row exists', () => {
  const env = makeEnv(); env.ctx.setup();
  const res = post(env, { name: 'Sam Ortiz', email: 'sam@example.com', message: 'No heat since last night' });
  assert.equal(res.ok, true);
  assert.equal(env.sheets.Leads.rows[1][H('Lead ID')], res.id);
});

test('honeypot (company_website) → stored as spam, no reply, no alert, still ok to the bot', () => {
  const env = makeEnv(); env.ctx.setup();
  const res = post(env, { name: 'Bot', email: 'bot@example.com', message: 'Hello there, nice site', company_website: 'http://x.example' });
  assert.equal(res.ok, true);
  assert.equal(env.sheets.Leads.rows[1][H('Status')], 'spam');
  assert.equal(env.sent.length, 0);
});

test('minimum fill time: a form submitted in under min_form_seconds is treated as a bot', () => {
  const env = makeEnv(); env.ctx.setup();
  post(env, { name: 'Fast', email: 'fast@example.com', message: 'Furnace is broken please help', started_at: String(Date.now() - 500) });
  assert.equal(env.sheets.Leads.rows[1][H('Status')], 'spam');
  assert.match(env.sheets.Leads.rows[1][H('Score reasons')], /Bot check/);
  assert.equal(env.sent.length, 0);
  post(env, { name: 'Human', email: 'human@example.com', message: 'Furnace is broken please help', started_at: String(Date.now() - 20000) });
  assert.equal(env.sheets.Leads.rows[2][H('Status')], 'new');
});

test('duplicate submission within 24 h → one record and one reply', () => {
  const env = makeEnv(); env.ctx.setup();
  const a = post(env, { name: 'Sam', email: 'sam@example.com', message: 'AC broken, can you repair it?' });
  const b = post(env, { name: 'Sam', email: 'sam@example.com', message: 'AC  broken, can you repair it?' });
  assert.equal(b.ok, true); assert.equal(b.duplicate, true); assert.equal(b.id, a.id);
  assert.equal(env.sheets.Leads.rows.length, 2);
  assert.equal(toLead(env, 'sam@example.com').length, 1);
});

test('one automatic reply per address per 24 h, even for a different message', () => {
  const env = makeEnv(); env.ctx.setup();
  post(env, { name: 'Sam', email: 'sam@example.com', message: 'AC broken, can you repair it?' });
  post(env, { name: 'Sam', email: 'sam@example.com', message: 'Also, could you quote a new heat pump?' });
  assert.equal(env.sheets.Leads.rows.length, 3, 'both inquiries recorded');
  assert.equal(toLead(env, 'sam@example.com').length, 1, 'only one auto-reply');
  assert.match(env.sheets.Leads.rows[2][H('Auto-reply')], /^held: already replied/);
  assert.ok(env.sent.some((s) => /^\[REPLY HELD\]/.test(s.subject)), 'owner told the reply was held');
});

test('hourly cap and quota reserve hold automatic replies but keep recording', () => {
  const env = makeEnv({ config: (c) => Object.assign(c, { limits: Object.assign({}, c.limits, { per_hour: 2 }) }) }); env.ctx.setup();
  ['a', 'b', 'c'].forEach((x) => post(env, { name: x, email: x + '@example.com', message: 'Furnace broken, need repair' }));
  assert.equal(env.sheets.Leads.rows.length, 4);
  assert.match(env.sheets.Leads.rows[3][H('Auto-reply')], /hourly auto-reply limit/);
  const low = makeEnv({ quota: 5 }); low.ctx.setup();
  post(low, { name: 'Q', email: 'q@example.com', message: 'Furnace broken, need repair' });
  assert.match(low.sheets.Leads.rows[1][H('Auto-reply')], /quota low/);
  assert.equal(toLead(low, 'q@example.com').length, 0);
  assert.ok(low.sent.some((s) => s.to === 'owner@northfield-demo.example'), 'owner alert still goes out');
});

test('formula injection: visitor text starting with = + - @ is stored as plain text', () => {
  const env = makeEnv(); env.ctx.setup();
  post(env, { name: '=HYPERLINK("http://evil.example","x")', email: 'f@example.com', message: '=IMPORTXML("http://evil.example","//a") furnace broken' });
  const row = env.sheets.Leads.rows[1];
  assert.ok(row[H('Name')].startsWith("'="));
  assert.ok(row[H('Message')].startsWith("'="));
});

test('a failed reply marks needs-attention and the owner alert says so', () => {
  const env = makeEnv(); env.ctx.setup();
  env.ctx.GmailApp.sendEmail = () => { throw new Error('Invalid email'); };
  const res = post(env, { name: 'Chris', email: 'chris@example.com', message: 'Thermostat blank, heat will not come on' });
  assert.equal(res.ok, true, 'the inquiry itself was recorded');
  assert.equal(env.sheets.Leads.rows[1][H('Status')], 'needs-attention');
  assert.ok(env.sent.some((s) => /^\[NEEDS ATTENTION\]/.test(s.subject)));
});

test('reply detection matches the exact address (jimbob@ is not bob@)', () => {
  const env = makeEnv(); env.ctx.setup();
  post(env, { name: 'Bob', email: 'bob@example.com', message: 'tune-up please' });
  const row = env.sheets.Leads.rows[1]; row[1] = new Date(Date.now() - 2 * 86400000);
  env.threads[row[H('Thread ID')]].messages.push({ from: 'Jim <jimbob@example.com>', body: 'Sounds good', date: new Date() });
  const r = env.ctx.runFollowUps();
  assert.equal(r.stopped, 0); assert.equal(r.sent, 1);
});

test('an interrupted follow-up send is flagged for a person, never retried', () => {
  const env = makeEnv(); env.ctx.setup();
  post(env, { name: 'Ann', email: 'ann@example.com', message: 'tune-up please' });
  const row = env.sheets.Leads.rows[1]; row[1] = new Date(Date.now() - 2 * 86400000);
  row[H('Send state')] = 'sending 1 ' + (Date.now() - 30 * 60000);
  const before = env.sent.length;
  const r = env.ctx.runFollowUps();
  assert.equal(r.flagged, 1); assert.equal(env.sent.length, before);
  assert.equal(env.sheets.Leads.rows[1][H('Status')], 'needs-attention');
});

test('overlapping follow-up runs: the second run skips instead of double-sending', () => {
  const env = makeEnv(); env.ctx.setup();
  env.locked = true;
  assert.equal(env.ctx.runFollowUps().skipped, true);
});

test('DRY_RUN follow-ups send nothing and use up nothing', () => {
  const env = makeEnv({ dryRun: true }); env.ctx.setup();
  post(env, { name: 'Dee', email: 'dee@example.com', message: 'tune-up please' });
  const row = env.sheets.Leads.rows[1]; row[1] = new Date(Date.now() - 2 * 86400000);
  env.ctx.runFollowUps();
  assert.equal(env.sent.length, 0);
  assert.equal(env.sheets.Leads.rows[1][H('Follow-ups sent')], 0);
});

test('Turnstile: token verified server-side; missing or failed token is rejected without a record', () => {
  const env = makeEnv({ config: (c) => Object.assign(c, { bot_check: 'turnstile' }), fetch: (u, o) => ({ success: o.payload.response === 'good' }) });
  env.props.TURNSTILE_SECRET = 'secret-in-script-properties';
  env.ctx.setup();
  assert.deepEqual(post(env, { name: 'N', email: 'n@example.com', message: 'Furnace broken help' }), { ok: false, error: 'bot-check-missing', retry: false });
  assert.equal(post(env, { name: 'N', email: 'n@example.com', message: 'Furnace broken help', 'cf-turnstile-response': 'bad' }).error, 'bot-check-failed');
  assert.equal(env.sheets.Leads.rows.length, 1);
  assert.equal(post(env, { name: 'N', email: 'n@example.com', message: 'Furnace broken help', 'cf-turnstile-response': 'good' }).ok, true);
  assert.equal(env.fetches[0].opts.payload.secret, 'secret-in-script-properties');
});

test('error emails never contain customer details', () => {
  const env = makeEnv(); env.ctx.setup();
  env.ctx.GmailApp.sendEmail = () => { throw new Error('quota'); };
  post(env, { name: 'Private Person', email: 'private@example.com', message: 'my private message about the furnace' });
  const err = env.sent.find((s) => /^\[Lead Desk\] Error/.test(s.subject));
  assert.ok(err); assert.doesNotMatch(err.body, /private/i);
});

test("Banira's own intake config builds, and a website contact submission is recorded with every answer kept", () => {
  const banira = require('../../../ops/banira-intake/banira-lead-desk.config.json');
  const env = makeEnv({ config: () => banira }); env.ctx.setup();
  const message = 'Topic: A new automation project\nName: Pat Lee\nBusiness: Lee Plumbing\nInterested in: Lead Desk ($490)\n\nWe get about 15 web inquiries a week and miss some.';
  const res = post(env, { name: 'Pat Lee', email: 'pat@example.com', service: 'Lead Desk ($490)', message, source: 'banira website contact form', started_at: String(Date.now() - 60000), company_website: '' });
  assert.equal(res.ok, true);
  const row = env.sheets.Leads.rows[1];
  assert.equal(row[H('Service')], 'Lead Desk');
  assert.match(row[H('Message')], /Lee Plumbing/);
  assert.equal(toLead(env, 'pat@example.com').length, 1);
  assert.ok(env.sent.some((s) => s.to === 'owner@banira.example'));
});

test('manifest asks for external requests only when the Turnstile bot check is on', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'mf-'));
  build(path.join(__dirname, '../examples/config.example.json'), out);
  assert.ok(!JSON.parse(fs.readFileSync(path.join(out, 'appsscript.json'))).oauthScopes.some((s) => /external_request/.test(s)));
});
