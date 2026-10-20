// Run: node --test automations/lead-desk/tests
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../src/engine.js');
const config = require('../examples/config.example.json');

// Tue 21 Oct 2026 14:00 New York (open) and 23:30 (closed)
const OPEN = new Date('2026-10-21T18:00:00Z');
const CLOSED = new Date('2026-10-22T03:30:00Z');

test('example config passes validation', () => {
  assert.deepEqual(E.checkConfig(config), []);
});

test('config validation catches missing fields, bad hours, unknown variables, missing opt-out', () => {
  const bad = JSON.parse(JSON.stringify(config));
  bad.business.owner_email = 'nope';
  bad.business.timezone = 'Mars/Base';
  bad.business.hours.mon = [18, 8];
  bad.templates.ack = 'Hi {{firstname}}';
  bad.templates.footer = 'Thanks';
  delete bad.templates.followup_3;
  const p = E.checkConfig(bad).join('\n');
  for (const s of ['owner_email', 'timezone', 'hours.mon', 'firstname', 'opt out', 'followup_3']) assert.match(p, new RegExp(s));
});

test('normalizes arbitrary form field names', () => {
  const l = E.normalizeLead({ 'Full Name': 'Sam Ortiz', 'Email Address': ' Sam@Example.com ', 'Phone Number': '(555) 123-4567', 'How can we help?': ['AC stopped'] }, OPEN);
  assert.equal(l.firstName, 'Sam');
  assert.equal(l.email, 'sam@example.com');
  assert.equal(l.phoneDigits, '5551234567');
  assert.equal(l.message, 'AC stopped');
});

test('hot urgent repair lead inside service area, during hours', () => {
  const r = E.processInquiry({ name: 'Sam Ortiz', email: 'sam@example.com', phone: '555-123-4567', zip: '02139',
    message: 'Our furnace stopped and we have no heat, two kids at home. Can someone come today please? It is making a loud noise.' }, config, OPEN);
  assert.equal(r.status, 'new');
  assert.equal(r.service.key, 'repair');
  assert.equal(r.urgent, true);
  assert.equal(r.tier, 'hot');
  assert.ok(r.score >= 80, 'score ' + r.score);
  assert.equal(r.reply.template, 'ack_urgent');
  assert.match(r.reply.body, /Hi Sam/);
  assert.match(r.reply.body, /\(555\) 010-4477/);
  assert.match(r.reply.body, /stop/);       // opt-out footer present
  assert.equal(r.followUps.length, 3);
  assert.match(r.ownerAlert.subject, /^\[HOT\]/);
});

test('after-hours template when closed', () => {
  const r = E.processInquiry({ name: 'Lee', email: 'lee@example.com', message: 'Looking for a quote to replace our old AC with a heat pump.' }, config, CLOSED);
  assert.equal(r.openNow, false);
  assert.equal(r.reply.template, 'ack_after_hours');
  assert.equal(r.service.key, 'install');
});

test('out-of-area lead is down-scored and flagged to owner', () => {
  const r = E.processInquiry({ name: 'Kim', email: 'kim@example.com', zip: '90210', message: 'need a tune-up' }, config, OPEN);
  assert.equal(r.inArea, false);
  assert.equal(r.tier, 'cold');
  assert.match(r.ownerAlert.body, /OUTSIDE service area/);
  assert.equal(r.followUps.length, 1);   // cold leads get one follow-up only
});

test('spam is caught and never replied to', () => {
  const r = E.processInquiry({ name: 'Bob', email: 'bob@spam.example', message: 'We offer SEO services and backlinks https://a.example https://b.example' }, config, OPEN);
  assert.equal(r.status, 'spam');
  assert.equal(r.reply, undefined);
  const hp = E.processInquiry({ name: 'X', email: 'x@example.com', message: 'hi', website_url: 'http://bot' }, config, OPEN);
  assert.equal(hp.status, 'spam');
});

test('invalid email: no auto-reply, owner still alerted', () => {
  const r = E.processInquiry({ name: 'Pat', email: 'pat@', phone: '5551112222', message: 'AC broken' }, config, OPEN);
  assert.equal(r.status, 'invalid');
  assert.equal(r.reply, undefined);
  assert.ok(r.ownerAlert);
});

test('phone-only lead gets owner alert telling them to call', () => {
  const r = E.processInquiry({ name: 'Jo', phone: '555 222 3333', message: 'no heat' }, config, OPEN);
  assert.equal(r.status, 'new');
  assert.match(r.ownerAlert.body, /call\/text manually/);
});

test('follow-up scheduler: wait, send, complete, stop', () => {
  const base = { status: 'new', tier: 'warm', followupsSent: 0, receivedAt: OPEN };
  const h = 3600000;
  assert.equal(E.nextFollowUp(base, config, new Date(OPEN.getTime() + 2 * h)).action, 'wait');
  const s1 = E.nextFollowUp(base, config, new Date(OPEN.getTime() + 25 * h));
  assert.deepEqual([s1.action, s1.template], ['send', 'followup_1']);
  const s2 = E.nextFollowUp({ ...base, followupsSent: 1 }, config, new Date(OPEN.getTime() + 49 * h));
  assert.equal(s2.action, 'wait');                     // day 3 not reached yet
  assert.equal(E.nextFollowUp({ ...base, followupsSent: 3 }, config, new Date(OPEN.getTime() + 999 * h)).action, 'complete');
  assert.equal(E.nextFollowUp({ ...base, status: 'replied' }, config, new Date()).action, 'none');
  assert.equal(E.nextFollowUp({ ...base, lastReplyAt: new Date() }, config, new Date()).action, 'stop');
});

test('opt-out detection', () => {
  assert.ok(E.isOptOut('Please STOP emailing me'));
  assert.ok(E.isOptOut('no thanks, found someone'));
  assert.ok(!E.isOptOut('Yes, Thursday works'));
});

test('templates: unknown variables render empty, no leftover braces', () => {
  assert.equal(E.render('Hi {{first_name}}{{nope}}!', { first_name: 'A' }), 'Hi A!');
});

test('opening hours respect timezone and closed days', () => {
  assert.equal(E.isOpen(OPEN, config.business), true);
  assert.equal(E.isOpen(CLOSED, config.business), false);
  assert.equal(E.isOpen(new Date('2026-10-25T16:00:00Z'), config.business), false); // Sunday
});

test('returning-customer hint needs explicit wording (no false positive on "before")', () => {
  const a = E.processInquiry({ name: 'A', email: 'a@example.com', message: 'It made a noise before it stopped' }, config, OPEN);
  assert.ok(!a.reasons.some((r) => /returning/.test(r)));
  const b = E.processInquiry({ name: 'B', email: 'b@example.com', message: 'Last time you serviced our furnace it was great' }, config, OPEN);
  assert.ok(b.reasons.some((r) => /returning/.test(r)));
});

test('auto-replies are not treated as real replies', () => {
  assert.ok(E.isAutoReply('Automatic reply: We got your request', 'I am out of the office until Monday'));
  assert.ok(E.isAutoReply('Undeliverable: We got your request', ''));
  assert.ok(!E.isAutoReply('Re: We got your request', 'Thursday morning works for us'));
});

test('service labels keep acronyms mid-sentence (HVAC, AC) in customer emails', () => {
  assert.equal(E.inSentence('Heating or AC repair'), 'heating or AC repair');
  assert.equal(E.inSentence('HVAC tune-up'), 'HVAC tune-up');
  assert.equal(E.inSentence('New system installation'), 'new system installation');
  const r = E.processInquiry({ name: 'Sam', email: 'sam@example.com', zip: '02139', message: 'Our AC is broken, can you repair it?' }, config, new Date('2026-10-20T18:14:00Z'));
  assert.match(r.reply.body, /about heating or AC repair\./);
});
