#!/usr/bin/env node
/** Re-validate a client's config after edits and rebuild its Apps Script files.
 *   node ops/onboarding/validate.js clients/<slug>
 * Exit 0 = valid and built; 2 = problems listed. */
const fs = require('fs');
const path = require('path');
const E = require('../../automations/lead-desk/src/engine.js');
const { build } = require('../../automations/lead-desk/tools/build_apps_script.js');

const dir = process.argv[2];
if (!dir) { console.error('usage: validate.js clients/<slug>'); process.exit(1); }
const cfgPath = path.join(dir, 'config.json');
const config = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const problems = E.checkConfig(config);
if (problems.length) { console.error('Config problems:\n- ' + problems.join('\n- ')); process.exit(2); }
console.log('Config OK. Built:\n' + build(cfgPath, path.join(dir, 'apps-script')).join('\n'));
fs.appendFileSync(path.join(dir, 'onboarding.log'), `${new Date().toISOString()} validate OK, apps-script rebuilt\n`);
