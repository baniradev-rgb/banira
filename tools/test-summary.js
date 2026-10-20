#!/usr/bin/env node
/* Run every test suite and record the real counts in docs/qa/data/test-summary.json.
   The website build prints Lead Desk test counts only from this file, so a number on the site
   is always one that was actually produced by a passing run. A failing suite fails this script. */
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SUITES = { leaddesk: 'automations/lead-desk/tests', onboarding: 'ops/onboarding/tests', site: 'website/tests' };
const out = { date: new Date().toISOString().slice(0, 10), node: process.version };
let failed = false;
for (const [name, dir] of Object.entries(SUITES)) {
  if (!fs.existsSync(path.join(ROOT, dir))) continue;
  const files = fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith('.test.js')).map((f) => path.join(dir, f));
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...files], { cwd: ROOT, encoding: 'utf8', env: Object.assign({}, process.env, { BANIRA_TEST_SUMMARY: '1' }) });
  const num = (k) => +((r.stdout.match(new RegExp('^# ' + k + ' (\\d+)', 'm')) || [])[1] || 0);
  out[name] = { pass: num('pass'), fail: num('fail'), files: files.length };
  process.stdout.write(name.padEnd(11) + ' pass ' + out[name].pass + '  fail ' + out[name].fail + '\n');
  if (r.status !== 0 || out[name].fail) { failed = true; process.stdout.write(r.stdout.split('\n').filter((l) => /^not ok|^\s+(error|expected|actual):/.test(l)).join('\n') + '\n'); }
}
if (failed) { console.error('Tests failed: summary not written.'); process.exit(1); }
fs.mkdirSync(path.join(ROOT, 'docs/qa/data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'docs/qa/data/test-summary.json'), JSON.stringify(out, null, 2) + '\n');
console.log('Wrote docs/qa/data/test-summary.json');
