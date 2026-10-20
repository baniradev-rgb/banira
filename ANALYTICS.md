# ANALYTICS — privacy-first measurement plan

**Status: OFF.** `website/site.config.json` → `analytics.mode: "off"`. Nothing is sent anywhere, and the privacy notice says "Analytics: none at present". The build refuses to switch measurement on until `privacy.html` front matter has `"analyticsDisclosed": true`. That flag is set only after the notice has been rewritten and approved by the owner.

## Questions it answers (and nothing else)
| Business question | Event(s) |
|---|---|
| Which pages do visitors use? | `page_view {page}` |
| Which services generate interest? | `cta_click {plan}`, `contact_submitted {topic, plan}` |
| Which calls to action are chosen? | `cta_click {label, to, from}` |
| Do inquiries actually get through? | `contact_submitted`, `contact_failed {reason}`, `contact_invalid {count}`, `contact_preview` |
| Is the demo understood? | `demo_scenario {preset}`, `readiness_score {score}` |
| Theme preference (design input) | `theme_changed {theme}` |

## What it never does
No cookies, no localStorage, no fingerprinting, no user or session IDs, no IP processing in the page, no third-party script. Property values must match `^[\w .:/#%$()+-]{0,80}$`, so free text (names, messages, emails) is dropped in `site.js` before sending. Do Not Track and Global Privacy Control switch it off.

## Payload (sendBeacon, JSON)
`{"e":"cta_click","p":{"label":"Discuss Lead Desk","to":"contact.html","from":"lead-desk","plan":"core"},"path":"/lead-desk.html","ref":"","w":"l"}`, where `w` is a coarse viewport class (s/m/l) and `ref` is the referring host only, and empty for internal navigation.

## Turning it on (owner decision, see DECISION_LOG D-V4-07)
1. Choose a collector that stores only aggregates. Options: a self-hosted endpoint (a serverless function that increments counters), or a cookieless service whose API accepts this payload through a small adapter. Do not paste a vendor's script tag.
2. Update `privacy.html` (what, why, retention, processor), then set `"analyticsDisclosed": true` in its front matter.
3. Set `analytics.mode: "endpoint"` and `analytics.endpoint` in `site.config.json`, then rebuild.
4. Check with `window.BANIRA_DEBUG = true` in the console and a test visit.
