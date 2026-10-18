// Integration test: runs the GENERATED Apps Script project inside a Node VM
// with in-memory fakes for SpreadsheetApp, GmailApp, MailApp, etc.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { build } = require('../tools/build_apps_script.js');

function makeEnv({ dryRun = false } = {}) {
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
    MailApp: { sendEmail: send('mail') },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    Utilities: { formatDate: () => '261021-140000' },
    ScriptApp: {
      getProjectTriggers: () => triggers.slice(),
      deleteTrigger: () => {},
      newTrigger: (fn) => { const t = { fn }; const chain = { timeBased: () => chain, everyHours: () => chain, everyDays: () => chain, atHour: () => chain, forForm: () => chain, onFormSubmit: () => chain, create: () => { triggers.push(t); return t; } }; return chain; }
    },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s) => ({ setMimeType: () => s }) }
  };
  vm.createContext(ctx);
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'ld-'));
  build(path.join(__dirname, '../examples/config.example.json'), out);
  for (const f of ['Engine.gs', 'Config.gs', 'Code.gs']) vm.runInContext(fs.readFileSync(path.join(out, f), 'utf8'), ctx, { filename: f });
  return { ctx, sent, sheets, threads, triggers, props };
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
