#!/usr/bin/env python3
"""Build the Banira website from src/ + brand + the Lead Desk engine.

Sources
  src/head.html   <title>, meta, fonts, all CSS (tokens + animation)
  src/body.html   page markup + demo/intake script
  src/fx.js       decorative effects (blossom canvas, glows, tilt, count-up)

Outputs
  dist/index.html      full standalone page (deploy to Netlify / any static host)
  dist/artifact.html   same content without <!doctype>/<html> wrapper (Claude Artifact preview)
  dist/favicon.svg

site_config.json: form_endpoint "" = preview (no send) · "/" = Netlify Forms · Apps Script /exec URL = Banira's Lead Desk.
"""
import json, re, urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
LOGOS = REPO / "brand/logos"
SITE = json.loads((ROOT / "site_config.json").read_text())
ENGINE = (REPO / "automations/lead-desk/src/engine.js").read_text()
DEMO = json.loads((REPO / "automations/lead-desk/examples/config.example.json").read_text())


def inner(svg_text):
    """Contents of an <svg> element, minus <title>."""
    body = re.search(r"<svg[^>]*>(.*)</svg>", svg_text, re.S).group(1)
    return re.sub(r"<title>.*?</title>", "", body)


def viewbox(svg_text):
    return re.search(r'viewBox="([^"]+)"', svg_text).group(1)


def main():
    mark_src = (LOGOS / "banira-mark-web.svg").read_text()
    word_src = (LOGOS / "banira-wordmark-light.svg").read_text()
    bud_src = (LOGOS / "banira-bud.svg").read_text()
    fav = (LOGOS / "favicon.svg").read_text().strip()

    mark = (f'<svg class="mark" viewBox="{viewbox(mark_src)}" aria-hidden="true" focusable="false">'
            f'{inner(mark_src).replace("currentColor", "currentColor")}</svg>')
    word = (f'<svg class="word" viewBox="{viewbox(word_src)}" aria-hidden="true" focusable="false">'
            f'{inner(word_src).replace("#171A2E", "currentColor")}</svg><span class="hp">Banira</span>')
    bud_paths = inner(bud_src)
    bud_mask = urllib.parse.quote(bud_src.replace("currentColor", "#000").strip())

    html = (ROOT / "src/head.html").read_text() + "\n" + (ROOT / "src/body.html").read_text()
    html += "\n<script>\n" + (ROOT / "src/fx.js").read_text() + "</script>\n"
    html = html.replace("__MARK__", mark).replace("__WORDMARK__", word)
    html = html.replace("__BUD_PATHS__", bud_paths).replace("__BUD_MASK__", bud_mask)
    html = html.replace("__FAVICON__", urllib.parse.quote(fav))
    html = html.replace("__CONTACT_EMAIL__", SITE.get("contact_email") or "hello@banira (address pending)")
    html = html.replace("/*__ENGINE__*/", ENGINE.replace("</script", "<\\/script"))
    demo = dict(DEMO); demo.pop("_note", None)
    html = html.replace("/*__DEMO_CONFIG__*/null", json.dumps(demo))
    html = html.replace("/*__SITE_CONFIG__*/{}", json.dumps({k: SITE.get(k, "") for k in ("form_endpoint", "contact_email")}))
    left = re.findall(r"__[A-Z_]{3,}__", html)
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
