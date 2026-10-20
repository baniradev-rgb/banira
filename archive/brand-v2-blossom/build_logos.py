#!/usr/bin/env python3
"""Build every Banira logo SVG from code (v2 — "vanilla blossom").

Mark: the vanilla orchid reduced to geometry. Like the real flower it has
three outer sepals and three inner petals (a trimerous bloom), set inside a
fine ring in the manner of a Japanese kamon (family crest). The centre is
left open: the base everything grows from.
Wordmark: "banira" outlined from Geist Regular with wide tracking.
Secondary lockup adds バニラ outlined from Noto Sans CJK JP Light.
Both fonts are SIL OFL 1.1, outlined so the SVGs need no installed font.

Usage: python3 brand/build_logos.py <Geist-Regular.ttf> <NotoSansCJK-Light.ttc>
"""
import json, math, sys
from pathlib import Path
from fontTools.ttLib import TTFont, TTCollection
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen

HERE = Path(__file__).parent
OUT = HERE / "logos"
C = json.loads((HERE / "tokens.json").read_text())["color"]
CX = CY = 32


def petal(length, width, angle, start=0.0):
    """Vesica-like petal from the centre outwards, rotated by `angle` degrees."""
    L, w, s = length, width, start
    d = (f"M0 {-s:.2f} C{w:.2f} {-(s + L * .30):.2f} {w * .82:.2f} {-(s + L * .80):.2f} 0 {-(s + L):.2f} "
         f"C{-w * .82:.2f} {-(s + L * .80):.2f} {-w:.2f} {-(s + L * .30):.2f} 0 {-s:.2f}Z")
    return f'<g transform="translate({CX} {CY}) rotate({angle})"><path d="{d}"/></g>'


def mark(outer, inner, ring=None, x=0, y=0, s=1.0, cls=False):
    """outer/inner/ring = fill colours. cls=True adds class names for web animation."""
    c = (lambda n: f' class="{n}"') if cls else (lambda n: "")
    g = [f'<g transform="translate({x} {y}) scale({s})">']
    if ring:
        g.append(f'<circle{c("bn-ring")} cx="{CX}" cy="{CY}" r="30" fill="none" stroke="{ring}" stroke-width="1.6"/>')
    g.append(f'<g{c("bn-inner")} fill="{inner}">' + "".join(petal(15.5, 6.2, a, 4.2) for a in (60, 180, 300)) + "</g>")
    g.append(f'<g{c("bn-outer")} fill="{outer}">' + "".join(petal(23.5, 8.6, a, 3.6) for a in (0, 120, 240)) + "</g>")
    g.append("</g>")
    return "".join(g)


def outline(font, text, tracking):
    gs = font.getGlyphSet(); cmap = font.getBestCmap(); upm = font["head"].unitsPerEm
    pen, bp, x = SVGPathPen(gs), BoundsPen(gs), 0
    for ch in text:
        g = cmap[ord(ch)]
        gs[g].draw(TransformPen(pen, (1, 0, 0, -1, x, 0)))
        gs[g].draw(TransformPen(bp, (1, 0, 0, -1, x, 0)))
        x += gs[g].width + tracking * upm
    return pen.getCommands(), bp.bounds


def svg(w, h, body, title="Banira"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.2f} {h:.2f}" width="{w:.0f}" height="{h:.0f}" '
            f'role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n')


def main(geist, noto):
    OUT.mkdir(exist_ok=True)
    for f in OUT.glob("*.svg"):
        f.unlink()
    latin = TTFont(geist)
    jp = TTCollection(noto).fonts[0]           # Noto Sans CJK JP
    wd, (wx0, wy0, wx1, wy1) = outline(latin, "banira", 0.06)
    jd, (jx0, jy0, jx1, jy1) = outline(jp, "バニラ", 0.18)
    themes = {
        #            outer        inner                  ring           text
        "light": (C["bean"], C["vanilla"], C["bean"], C["ink"]),
        "dark": (C["vanilla"], C["orchid"], C["vanilla"], C["washi"]),
        "mono-ink": (C["ink"], C["ink"] + "80", C["ink"], C["ink"]),
        "mono-washi": (C["washi"], C["washi"] + "80", C["washi"], C["washi"]),
    }
    files = {}
    wm_h = 30.0                                  # x-height-ish target on the 64 grid
    sc = wm_h / (wy1 - wy0)
    wm_w = (wx1 - wx0) * sc
    js = 11.0 / (jy1 - jy0)
    jw = (jx1 - jx0) * js
    for name, (o, i, r, t) in themes.items():
        files[f"banira-mark-{name}.svg"] = svg(64, 64, mark(o, i))
        files[f"banira-crest-{name}.svg"] = svg(64, 64, mark(o, i, r))
        gap = 20
        word = f'<path transform="translate({64 + gap - wx0 * sc:.2f} {32 + wm_h / 2 - wy1 * sc:.2f}) scale({sc:.5f})" d="{wd}" fill="{t}"/>'
        files[f"banira-logo-{name}.svg"] = svg(64 + gap + wm_w, 64, mark(o, i) + word)
        files[f"banira-wordmark-{name}.svg"] = svg(wm_w, wm_h, f'<path transform="translate({-wx0 * sc:.2f} {-wy0 * sc:.2f}) scale({sc:.5f})" d="{wd}" fill="{t}"/>')
        # secondary stacked lockup: crest, wordmark, katakana
        W = max(wm_w, 96) + 16
        stack = (mark(o, i, r, x=(W - 64) / 2, y=0) +
                 f'<path transform="translate({(W - wm_w) / 2 - wx0 * sc:.2f} {64 + 18 - wy0 * sc:.2f}) scale({sc:.5f})" d="{wd}" fill="{t}"/>' +
                 f'<path transform="translate({(W - jw) / 2 - jx0 * js:.2f} {64 + 18 + wm_h + 12 - jy0 * js:.2f}) scale({js:.5f})" d="{jd}" fill="{t}" fill-opacity=".62"/>')
        files[f"banira-stacked-{name}.svg"] = svg(W, 64 + 18 + wm_h + 12 + 11 + 2, stack)
    for name, bg, o, i in (("dark", C["sumi"], C["vanilla"], C["orchid"]), ("light", C["washi"], C["bean"], C["vanilla"])):
        files[f"banira-app-{name}.svg"] = svg(64, 64, f'<rect width="64" height="64" rx="16" fill="{bg}"/>' + mark(o, i, x=7, y=7, s=50 / 64))
    # favicon: inner petals dropped below 32px for legibility
    fav = (f'<rect width="64" height="64" rx="16" fill="{C["sumi"]}"/><g fill="{C["vanilla"]}">' +
           "".join(petal(25, 11, a, 2).replace(f"translate({CX} {CY})", f"translate({CX} 33)") for a in (0, 120, 240)) + "</g>")
    # bud: single-colour 3-petal glyph for icons, list markers and CSS masks
    files["banira-bud.svg"] = svg(64, 64, '<g fill="currentColor">' + "".join(petal(27, 12, a, 1.5) for a in (0, 120, 240)) + "</g>")
    files["favicon.svg"] = svg(64, 64, fav)
    # web: classed, colour-by-CSS version for animation
    files["banira-mark-web.svg"] = svg(64, 64, mark("currentColor", "currentColor", None, cls=True))
    for fn, content in files.items():
        (OUT / fn).write_text(content)
    print(f"wrote {len(files)} files to {OUT}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
