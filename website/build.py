#!/usr/bin/env python3
"""Build the Banira website from src/ + brand + the Lead Desk engine.

Outputs
  dist/index.html      full standalone page (deploy to Netlify / any static host)
  dist/artifact.html   same content without <!doctype>/<html> wrapper (Claude Artifact preview)
  dist/favicon.svg

Edit site_config.json to set the contact email and the form endpoint:
  form_endpoint = ""        → preview mode (form shows the generated draft, sends nothing)
  form_endpoint = "/"       → Netlify Forms (form is registered via data-netlify)
  form_endpoint = "https://script.google.com/macros/s/…/exec" → Banira's own Lead Desk
"""
import json, re, urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
SRC = (ROOT / "src/index.html").read_text()
SITE = json.loads((ROOT / "site_config.json").read_text())
ENGINE = (REPO / "automations/lead-desk/src/engine.js").read_text()
DEMO = json.loads((REPO / "automations/lead-desk/examples/config.example.json").read_text())
INK, PINE = "#1B1A18", "#2D5A4B"


def themable(svg_text, height):
    s = svg_text.replace(f'stroke="{INK}"', 'stroke="currentColor"').replace(f'fill="{INK}"', 'fill="currentColor"')
    s = s.replace(f'fill="{PINE}"', 'style="fill:var(--accent)"')
    s = re.sub(r'<title>.*?</title>', '', s)
    s = re.sub(r'width="[\d.]+" height="[\d.]+"', f'height="{height}" aria-hidden="true" focusable="false"', s, count=1)
    return s.replace('role="img" aria-label="Banira"', '').strip()


def main():
    logo = (REPO / "brand/logos/banira-logo-light.svg").read_text()
    fav = (REPO / "brand/logos/favicon.svg").read_text().strip()
    html = SRC
    html = html.replace("__LOGO__", themable(logo, 28) + '<span class="hp">Banira</span>')
    html = html.replace("__LOGO_SMALL__", themable(logo, 22))
    html = html.replace("__FAVICON__", urllib.parse.quote(fav))
    html = html.replace("__CONTACT_EMAIL__", SITE.get("contact_email") or "hello@banira (address pending)")
    html = html.replace("/*__ENGINE__*/", ENGINE.replace("</script", "<\\/script"))
    demo = dict(DEMO); demo.pop("_note", None)
    html = html.replace("/*__DEMO_CONFIG__*/null", json.dumps(demo))
    html = html.replace("/*__SITE_CONFIG__*/{}", json.dumps({k: SITE.get(k, "") for k in ("form_endpoint", "contact_email")}))
    left = re.findall(r"__[A-Z_]+__", html)
    if left:
        raise SystemExit(f"Unreplaced placeholders: {left}")
    dist = ROOT / "dist"
    dist.mkdir(exist_ok=True)
    (dist / "artifact.html").write_text(html)
    head_end = html.index("</style>") + len("</style>")
    full = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + html[:head_end] + "\n</head>\n<body>\n" + html[head_end:] + "\n</body>\n</html>\n")
    (dist / "index.html").write_text(full)
    (dist / "favicon.svg").write_text(fav)
    print(f"built dist/index.html ({len(full)//1024} KB) and dist/artifact.html")


if __name__ == "__main__":
    main()
