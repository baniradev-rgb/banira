// Run: node --test ops/onboarding/tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { onboard, parseHours, pickIndustry } = require('../onboard.js');

const intake = {
  name: 'Jordan Mills', email: 'Jordan@Example.com', business_name: 'Mills Plumbing (TEST)', website: 'example.com',
  industry: 'Plumbing', plan: 'core', mail_system: 'google', weekly_inquiries: '5–20',
  services: 'leak repair, water heaters, sump pumps', hours: 'Mon-Fri 7:30-5, Sat 8am-12pm', timezone: 'America/Chicago', phone: '(555) 010-2000'
};

test('parses common opening-hour formats', () => {
  const { hours, warnings } = parseHours('Mon–Fri 8–6, Sat 9am-1pm, Sun closed');
  assert.deepEqual(hours.mon, [8, 18]);
  assert.deepEqual(hours.fri, [8, 18]);
  assert.deepEqual(hours.sat, [9, 13]);
  assert.equal(warnings.length, 1);   // "Sun closed" flagged, not guessed
  assert.deepEqual(parseHours('Mon-Fri 7:30-5').hours.tue, [7.5, 17]);
});

test('industry detection', () => {
  assert.equal(pickIndustry('HVAC / heating & cooling'), 'hvac');
  assert.equal(pickIndustry('Remodeling / contractor'), 'remodeling');
  assert.equal(pickIndustry('Dog grooming'), 'generic');
});

test('complete intake → valid config, approval doc and Apps Script build', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clients-'));
  const r = onboard(intake, dir);
  assert.equal(r.industry, 'plumbing');
  assert.deepEqual(r.problems, []);
  assert.equal(r.built, true);
  const cfg = JSON.parse(fs.readFileSync(path.join(r.dir, 'config.json'), 'utf8'));
  assert.equal(cfg.business.owner_email, 'jordan@example.com');
  assert.ok(cfg.services.some((s) => s.label === 'Sump pumps' && s._from_client));
  assert.ok(cfg.services.find((s) => s.key === 'leak').keywords.includes('leak repair'));
  assert.ok(!/booking_url/.test(cfg.templates.ack), 'booking line removed when no link');
  for (const f of ['messages_for_approval.md', 'checklist.md', 'open_questions.md', 'onboarding.log', 'apps-script/Engine.gs', 'apps-script/Config.gs', 'apps-script/Code.gs']) {
    assert.ok(fs.existsSync(path.join(r.dir, f)), f);
  }
  const approval = fs.readFileSync(path.join(r.dir, 'messages_for_approval.md'), 'utf8');
  assert.match(approval, /Hi Alex/);
  assert.doesNotMatch(approval, /\{\{/);
  assert.throws(() => onboard(intake, dir), /already exists/);   // never overwrites a client
});

test('incomplete intake → workspace created, build withheld, questions listed', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clients-'));
  const r = onboard({ name: 'A', email: 'a@example.com', business_name: 'Vague Co', hours: 'whenever', mail_system: 'microsoft' }, dir);
  assert.equal(r.built, false);
  assert.ok(r.problems.some((p) => /hours/.test(p)));
  const q = fs.readFileSync(path.join(r.dir, 'open_questions.md'), 'utf8');
  assert.match(q, /microsoft/);
  assert.match(q, /Opening hours/);
});

test('missing required field is rejected', () => {
  assert.throws(() => onboard({ name: 'A', email: 'a@example.com' }, os.tmpdir()), /business_name/);
});
