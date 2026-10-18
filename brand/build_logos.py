#!/usr/bin/env python3
"""Build every Banira logo SVG from code (re-run after changing tokens).

Mark: a geometric lowercase "b" — a stem joined to a ring, with a solid node at
the ring's centre. Reads as: the base (stem), the system around it (ring), and
the core it serves (node). No font is needed for the mark.
Wordmark: "banira" outlined from Geist Medium (SIL Open Font License 1.1),
so the SVGs need no installed font.

Usage: python3 brand/build_logos.py <path/to/Geist-Medium.ttf>
"""
import json, sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen

HERE = Path(__file__).parent
OUT = HERE / "logos"
TOK = json.loads((HERE / "tokens.json").read_text())
C = TOK["color"]

# ---- mark geometry on a 64-unit grid -------------------------------------
STROKE = 7
STEM_X, STEM_TOP, STEM_BOT = 17.5, 10, 50.5
RING_CX, RING_CY, RING_R = 32, 37, 13.5
NODE_R = 4.25


def mark(ink, accent, x=0, y=0, s=1.0):
    t = f'transform="translate({x} {y}) scale({s})"'
    return (f'<g {t}>'
            f'<line x1="{STEM_X}" y1="{STEM_TOP}" x2="{STEM_X}" y2="{STEM_BOT}" stroke="{ink}" stroke-width="{STROKE}" stroke-linecap="round"/>'
            f'<circle cx="{RING_CX}" cy="{RING_CY}" r="{RING_R}" fill="none" stroke="{ink}" stroke-width="{STROKE}"/>'
            f'<circle cx="{RING_CX}" cy="{RING_CY}" r="{NODE_R}" fill="{accent}"/>'
            f'</g>')


def wordmark_path(font_path, text="banira", tracking=0.01):
    f = TTFont(font_path)
    gs = f.getGlyphSet()
    cmap = f.getBestCmap()
    upm = f["head"].unitsPerEm
    pen = SVGPathPen(gs)
    x = 0
    for ch in text:
        g = cmap[ord(ch)]
        # flip y: font units are y-up
        tp = TransformPen(pen, (1, 0, 0, -1, x, 0))
        gs[g].draw(tp)
        x += gs[g].width + tracking * upm
    bp = BoundsPen(gs)
    x2 = 0
    for ch in text:
        g = cmap[ord(ch)]
        gs[g].draw(TransformPen(bp, (1, 0, 0, -1, x2, 0)))
        x2 += gs[g].width + tracking * upm
    xmin, ymin, xmax, ymax = bp.bounds
    return pen.getCommands(), (xmin, ymin, xmax, ymax), upm


def svg(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.2f} {h:.2f}" width="{w:.0f}" height="{h:.0f}" role="img" aria-label="{title}">'
            f'<title>{title}</title>{body}</svg>\n')


def main(font_path):
    OUT.mkdir(exist_ok=True)
    d, (xmin, ymin, xmax, ymax), upm = wordmark_path(font_path)
    wm_h = ymax - ymin        # ascender (b) to baseline
    themes = {
        "light": (C["ink"], C["pine"], C["ivory"]),
        "dark": (C["ivory"], C["pine_light"], C["ink"]),
        "mono-ink": (C["ink"], C["ink"], None),
        "mono-ivory": (C["ivory"], C["ivory"], None),
    }
    files = {}
    for name, (ink, acc, bg) in themes.items():
        bgrect = lambda w, h: f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg and name in ("light", "dark") else ""
        # icon (transparent) + app icon (with background)
        files[f"banira-icon-{name}.svg"] = svg(64, 64, mark(ink, acc), "Banira")
        # primary horizontal lockup: mark height 64 units, wordmark x-height aligned
        scale = 40 / wm_h                      # wordmark 40 units tall on the 64 grid
        gap = 24
        wm_w = (xmax - xmin) * scale
        W = 49 + gap + wm_w
        wm = f'<path transform="translate({49 + gap - xmin * scale:.2f} {50.5 - 0 * scale:.2f}) scale({scale:.5f})" d="{d}" fill="{ink}"/>'
        files[f"banira-logo-{name}.svg"] = svg(W, 64, mark(ink, acc) + wm, "Banira")
        # wordmark only
        files[f"banira-wordmark-{name}.svg"] = svg((xmax - xmin) * scale, wm_h * scale,
            f'<path transform="translate({-xmin * scale:.2f} {-ymin * scale:.2f}) scale({scale:.5f})" d="{d}" fill="{ink}"/>', "Banira")
        # secondary stacked lockup with descriptor
        sw = max(wm_w, 120)
        stacked = (mark(ink, acc, x=(sw + 14) / 2 - 31.5, y=0) +
                   f'<path transform="translate({(sw + 14 - wm_w) / 2 - xmin * scale:.2f} {64 + 14 + 40:.2f}) scale({scale:.5f})" d="{d}" fill="{ink}"/>')
        files[f"banira-stacked-{name}.svg"] = svg(sw + 14, 64 + 14 + 44, stacked, "Banira")
    # app / avatar tiles
    for name, (ink, acc, bg) in {"light": themes["light"], "dark": themes["dark"]}.items():
        files[f"banira-app-{name}.svg"] = svg(64, 64, f'<rect width="64" height="64" rx="14" fill="{bg}"/>' + mark(ink, acc, x=7.5, y=6, s=0.8), "Banira")
    # favicon: slightly heavier for 16px legibility, ink tile
    fav = (f'<rect width="64" height="64" rx="14" fill="{C["ink"]}"/>'
           f'<g transform="translate(6 5) scale(0.82)"><line x1="{STEM_X}" y1="{STEM_TOP}" x2="{STEM_X}" y2="{STEM_BOT}" stroke="{C["ivory"]}" stroke-width="9" stroke-linecap="round"/>'
           f'<circle cx="{RING_CX}" cy="{RING_CY}" r="{RING_R}" fill="none" stroke="{C["ivory"]}" stroke-width="9"/>'
           f'<circle cx="{RING_CX}" cy="{RING_CY}" r="5" fill="{C["pine_light"]}"/></g>')
    files["favicon.svg"] = svg(64, 64, fav, "Banira")
    for fn, content in files.items():
        (OUT / fn).write_text(content)
    print(f"wrote {len(files)} files to {OUT}")


if __name__ == "__main__":
    main(sys.argv[1])
