#!/usr/bin/env node
/**
 * Banira onboarding: intake answers → client workspace.
 *
 *   node ops/onboarding/onboard.js <intake.json> [--clients-dir clients]
 *
 * Input: one intake submission (website form fields, or Netlify/Lead Desk export row as JSON).
 * Output (clients/<slug>/):
 *   config.json                 Lead Desk config (industry preset + client answers)
 *   messages_for_approval.md    every customer-facing message, rendered with sample data
 *   checklist.md                delivery checklist with status boxes (see OPERATIONS.md)
 *   open_questions.md           what the onboarding call must confirm
 *   apps-script/                generated only when the config passes validation
 *   onboarding.log              what was generated, warnings, validation result
 * Exit codes: 0 ready to build · 3 workspace created but config needs answers · 1 bad input.
 */
const fs = require('fs');
const path = require('path');
const E = require('../../automations/lead-desk/src/engine.js');
const { build } = require('../../automations/lead-desk/tools/build_apps_script.js');
const PRESETS = require('./industry_presets.json');

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function slugify(s) { return String(s || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'client'; }

/** "Mon–Fri 8–6, Sat 9am-1pm" → {mon:[8,18],…}. Unparsed parts are returned as warnings. */
function parseHours(text) {
  const hours = {}; const warnings = [];
  String(text || '').toLowerCase().split(/[,;\n]/).map((s) => s.trim()).filter(Boolean).forEach((part) => {
    const m = part.match(/(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?\s*(?:(?:-|–|to)\s*(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?)?\s*:?\s*(\d{1,2})(?::(\d\d))?\s*(am|pm)?\s*(?:-|–|to)\s*(\d{1,2})(?::(\d\d))?\s*(am|pm)?/);
    if (!m) { warnings.push(`Could not read opening hours "${part}"`); return; }
    const a = DAYS.indexOf(m[1]); const b = m[2] ? DAYS.indexOf(m[2]) : a;
    let o = +m[3] + (m[4] ? +m[4] / 60 : 0); let c = +m[6] + (m[7] ? +m[7] / 60 : 0);
    if (m[5] === 'pm' && o < 12) o += 12;
    if (m[8] === 'pm' && c < 12) c += 12; else if (!m[8] && c <= o) c += 12;
    for (let i = a; i <= (b >= a ? b : a); i++) hours[DAYS[i]] = [o, c];
  });
  return { hours, warnings };
}

function pickIndustry(text) {
  const t = String(text || '').toLowerCase();
  for (const [key, p] of Object.entries(PRESETS.industries)) if (p.match.some((m) => t.includes(m))) return key;
  return 'generic';
}

function servicesFrom(answer, preset) {
  const own = String(answer || '').split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  const services = preset.services.map((s) => ({ ...s, keywords: s.keywords.slice() }));
  own.forEach((label) => {
    const l = label.toLowerCase();
    const hit = services.find((s) => s.label.toLowerCase().includes(l) || l.includes(s.label.toLowerCase()) || s.keywords.some((k) => l.includes(k)));
    if (hit) { if (!hit.keywords.includes(l)) hit.keywords.push(l); }
    else services.push({ key: slugify(label).replace(/-/g, '_'), label: label[0].toUpperCase() + label.slice(1), value: 'medium', keywords: [l], _from_client: true });
  });
  return services;
}

function onboard(intake, clientsDir) {
  const warnings = [];
  const questions = [];
  const need = (k) => { if (!String(intake[k] || '').trim()) throw new Error(`Intake is missing "${k}"`); return String(intake[k]).trim(); };
  const bizName = need('business_name');
  const ownerName = need('name');
  const ownerEmail = need('email').toLowerCase();
  const slug = slugify(bizName);
  const dir = path.join(clientsDir, slug);
  if (fs.existsSync(path.join(dir, 'config.json'))) throw new Error(`Client folder already exists: ${dir} (refusing to overwrite)`);
  fs.mkdirSync(dir, { recursive: true });

  const industry = pickIndustry(intake.industry);
  const preset = PRESETS.industries[industry];
  const { hours, warnings: hw } = parseHours(intake.hours);
  warnings.push(...hw);
  if (!Object.keys(hours).length) questions.push('Opening hours (could not read them from the form).');
  if (intake.mail_system && intake.mail_system !== 'google') questions.push(`Client uses "${intake.mail_system}" email. Lead Desk needs Google: confirm a Google account they can send from, or decline.`);
  if (!intake.phone) questions.push('Business phone number for the urgent reply.');
  questions.push('Booking link (Calendly/Cal.com/Square) or leave blank to remove the line.');
  questions.push('Service area ZIP prefixes (optional).');
  questions.push('Confirm sender mailbox: the Google account that should send replies.');
  if (/more than 50/i.test(intake.weekly_inquiries || '')) questions.push('Volume above 50/week: check Gmail daily send limit (100 consumer / 1,500 Workspace).');

  const config = {
    business: {
      name: bizName, owner_name: ownerName, owner_email: ownerEmail, phone: intake.phone || '',
      timezone: intake.timezone || 'America/New_York', hours,
      booking_url: intake.booking_url || '', response_window: 'within one business day', service_area_zips: [],
      website: intake.website || ''
    },
    services: servicesFrom(intake.services, preset),
    urgency_keywords: Array.from(new Set([...PRESETS.common_urgency, ...preset.urgency])),
    tiers: { hot: 60, warm: 30 },
    follow_up: { days: [1, 3, 7], max_by_tier: { hot: 3, warm: 3, cold: 1 } },
    templates: { ...PRESETS.templates },
    _meta: { industry_preset: industry, plan: intake.plan || 'core', created: new Date().toISOString(), source: 'onboard.js' }
  };
  if (!config.business.booking_url) {
    config.templates.ack = config.templates.ack.replace(/\n\nIf you'd like to pick a time now, you can book here: \{\{booking_url\}\}/, '');
  }
  if (!config.business.phone) config.templates.ack_urgent = config.templates.ack_urgent.replace('please call us now at {{phone}}', 'please reply with the best number to reach you');

  const problems = E.checkConfig(config);
  fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify(config, null, 2));
  fs.writeFileSync(path.join(dir, 'intake.json'), JSON.stringify(intake, null, 2));

  // Render every message with sample data for the client to approve.
  const sampleAt = new Date();
  const sample = (msg) => E.processInquiry({ name: 'Alex Sample', email: 'alex@example.com', message: msg }, config, sampleAt);
  const svc = config.services[0];
  const r = sample(`Hi, I need help with ${svc.label.toLowerCase()}. ${svc.keywords[0]}.`);
  const vars = { first_name: 'Alex', business_name: bizName, owner_name: ownerName, phone: config.business.phone, booking_url: config.business.booking_url, service: svc.label.toLowerCase(), response_window: config.business.response_window, signature: `${ownerName}\n${bizName}${config.business.phone ? '\n' + config.business.phone : ''}` };
  const md = [`# Messages for approval — ${bizName}`, '', 'Every message your customers can receive from Lead Desk, shown with a sample customer ("Alex"). Reply with changes or "approved".', ''];
  for (const k of ['ack', 'ack_after_hours', 'ack_urgent', 'followup_1', 'followup_2', 'followup_3']) {
    if (!config.templates[k]) continue;
    md.push(`## ${{ ack: 'Reply during opening hours', ack_after_hours: 'Reply when closed', ack_urgent: 'Reply to urgent requests', followup_1: 'Follow-up 1 (day 1)', followup_2: 'Follow-up 2 (day 3)', followup_3: 'Follow-up 3 (day 7)' }[k]}`, '', '```', `Subject: ${E.render(config.templates.subject, vars)}`, '', E.render(config.templates[k], vars), '', E.render(config.templates.footer, vars), '```', '');
  }
  md.push('## Owner alert example', '', '```', r.ownerAlert ? r.ownerAlert.subject + '\n\n' + r.ownerAlert.body : '(none)', '```');
  fs.writeFileSync(path.join(dir, 'messages_for_approval.md'), md.join('\n') + '\n');

  fs.writeFileSync(path.join(dir, 'open_questions.md'), `# Confirm on the onboarding call — ${bizName}\n\n` + questions.map((q) => `- [ ] ${q}`).join('\n') + (problems.length ? '\n\n## Config problems to fix\n' + problems.map((p) => `- [ ] ${p}`).join('\n') : '') + '\n');
  const checklist = fs.readFileSync(path.join(__dirname, 'checklist_template.md'), 'utf8').replace(/\{\{business\}\}/g, bizName).replace(/\{\{plan\}\}/g, config._meta.plan).replace(/\{\{date\}\}/g, new Date().toISOString().slice(0, 10));
  fs.writeFileSync(path.join(dir, 'checklist.md'), checklist);

  let built = false;
  if (!problems.length) { build(path.join(dir, 'config.json'), path.join(dir, 'apps-script')); built = true; }
  const log = [`${new Date().toISOString()} onboard ${slug}`, `industry preset: ${industry}`, `services: ${config.services.map((s) => s.label).join(' | ')}`,
    ...warnings.map((w) => 'WARN ' + w), ...problems.map((p) => 'CONFIG ' + p), `apps-script built: ${built}`];
  fs.writeFileSync(path.join(dir, 'onboarding.log'), log.join('\n') + '\n');
  return { dir, slug, industry, problems, warnings, questions, built };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--'));
  const ci = args.indexOf('--clients-dir');
  const clientsDir = ci !== -1 ? args[ci + 1] : path.join(__dirname, '../../clients');
  if (!file) { console.error('usage: onboard.js <intake.json> [--clients-dir dir]'); process.exit(1); }
  try {
    const res = onboard(JSON.parse(fs.readFileSync(file, 'utf8')), clientsDir);
    console.log(`Workspace: ${res.dir}\nPreset: ${res.industry}\nOpen questions: ${res.questions.length}\nConfig problems: ${res.problems.length}\nApps Script built: ${res.built}`);
    process.exit(res.built ? 0 : 3);
  } catch (e) { console.error(e.message); process.exit(1); }
}
module.exports = { onboard, parseHours, pickIndustry, servicesFrom };
