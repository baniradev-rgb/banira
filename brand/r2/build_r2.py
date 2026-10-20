"""Banira R2 logo kit builder.

The approved R2 mark (curved vanilla pod + separate seed) reached V4 only as a densely sampled
polyline (~200 points) inside the V3 pages. This script refits that outline to smooth cubic
Bezier curves (Schneider's algorithm), checks the result still matches the approved shape
(raster overlap), outlines the Geist wordmark, and writes the SVG kit.

Usage: python3 -I brand/r2/build_r2.py
Inputs:  brand/r2/source/r2-polyline.txt          (approved header mark, 64-unit grid)
         brand/r2/source/r2-small-polyline.txt    (approved small-size variant from the V3 favicon)
         website/src/static/assets/fonts/Geist-Variable.woff2
Outputs: brand/r2/svg/*.svg, brand/r2/r2-paths.json, brand/r2/FIT_REPORT.md
Raster PNGs (favicon-32, touch icons, OG image) are rendered by brand/r2/render_png.js."""
import json, math, os, re, sys
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(HERE, 'svg')
os.makedirs(OUT, exist_ok=True)


def load_poly(name):
    txt = open(os.path.join(HERE, 'source', name)).read()
    pts = [(float(a), float(b)) for a, b in re.findall(r'(-?\d+\.?\d*)[ ,](-?\d+\.?\d*)', txt.split('|')[0])]
    seed = [float(x) for x in txt.split('|')[1].split()] if '|' in txt else None
    # drop consecutive duplicates and the closing duplicate
    out = []
    for p in pts:
        if not out or math.dist(out[-1], p) > 1e-6:
            out.append(p)
    if math.dist(out[0], out[-1]) < 1e-6:
        out.pop()
    return np.array(out), seed


# ── Schneider curve fitting (Graphics Gems I, "An Algorithm for Automatically Fitting Digitized Curves") ──
def bezier(ctrl, t):
    t = np.asarray(t)[:, None]
    p0, p1, p2, p3 = ctrl
    return ((1 - t) ** 3) * p0 + 3 * ((1 - t) ** 2) * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3


def bezier_d(ctrl, t):
    t = np.asarray(t)[:, None]
    p0, p1, p2, p3 = ctrl
    return 3 * (1 - t) ** 2 * (p1 - p0) + 6 * (1 - t) * t * (p2 - p1) + 3 * t ** 2 * (p3 - p2)


def bezier_dd(ctrl, t):
    t = np.asarray(t)[:, None]
    p0, p1, p2, p3 = ctrl
    return 6 * (1 - t) * (p2 - 2 * p1 + p0) + 6 * t * (p3 - 2 * p2 + p1)


def chord_params(pts):
    d = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))])
    return d / d[-1]


def fit_one(pts, u, t1, t2):
    p0, p3 = pts[0], pts[-1]
    A1 = np.outer(3 * (1 - u) ** 2 * u, t1)
    A2 = np.outer(3 * (1 - u) * u ** 2, t2)
    C = np.array([[np.sum(A1 * A1), np.sum(A1 * A2)], [np.sum(A1 * A2), np.sum(A2 * A2)]])
    tmp = pts - bezier([p0, p0, p3, p3], u)
    X = np.array([np.sum(A1 * tmp), np.sum(A2 * tmp)])
    det = C[0, 0] * C[1, 1] - C[0, 1] * C[1, 0]
    seg = np.linalg.norm(p3 - p0)
    if abs(det) < 1e-12:
        a1 = a2 = seg / 3
    else:
        a1 = (X[0] * C[1, 1] - X[1] * C[0, 1]) / det
        a2 = (C[0, 0] * X[1] - C[1, 0] * X[0]) / det
    if a1 < 1e-6 * seg or a2 < 1e-6 * seg:
        a1 = a2 = seg / 3
    return [p0, p0 + t1 * a1, p3 + t2 * a2, p3]


def reparam(ctrl, pts, u):
    d = bezier(ctrl, u) - pts
    d1, d2 = bezier_d(ctrl, u), bezier_dd(ctrl, u)
    num = np.sum(d * d1, axis=1)
    den = np.sum(d1 * d1, axis=1) + np.sum(d * d2, axis=1)
    with np.errstate(divide='ignore', invalid='ignore'):
        nu = np.where(np.abs(den) > 1e-12, u - num / den, u)
    return np.clip(nu, 0, 1)


def max_err(ctrl, pts, u):
    e = np.linalg.norm(bezier(ctrl, u) - pts, axis=1)
    i = int(np.argmax(e))
    return e[i], i


def unit(v):
    n = np.linalg.norm(v)
    return v / n if n else v


def fit(pts, t1, t2, tol):
    if len(pts) == 2:
        d = np.linalg.norm(pts[1] - pts[0]) / 3
        return [[pts[0], pts[0] + t1 * d, pts[1] + t2 * d, pts[1]]]
    u = chord_params(pts)
    ctrl = fit_one(pts, u, t1, t2)
    err, split = max_err(ctrl, pts, u)
    if err < tol:
        return [ctrl]
    if err < tol * 4:
        for _ in range(20):
            u = reparam(ctrl, pts, u)
            ctrl = fit_one(pts, u, t1, t2)
            err, split = max_err(ctrl, pts, u)
            if err < tol:
                return [ctrl]
    split = min(max(split, 1), len(pts) - 2)
    tc = unit(pts[split - 1] - pts[split + 1])
    return fit(pts[:split + 1], t1, tc, tol) + fit(pts[split:], -tc, t2, tol)


def fit_closed(pts, tol):
    # start the loop mid-way along the longest straight-ish run so the seam is not at a tip
    n = len(pts)
    start = int(np.argmin(pts[:, 1] + 0 * pts[:, 0]))  # placeholder, refined below
    curv = []
    for i in range(n):
        a, b, c = pts[i - 1], pts[i], pts[(i + 1) % n]
        v1, v2 = unit(b - a), unit(c - b)
        curv.append(abs(v1[0] * v2[1] - v1[1] * v2[0]))
    curv = np.array(curv)
    smooth = np.convolve(np.concatenate([curv[-5:], curv, curv[:5]]), np.ones(11) / 11, 'valid')
    start = int(np.argmin(smooth))
    loop = np.concatenate([pts[start:], pts[:start], pts[start:start + 1]])
    t = unit(loop[1] - loop[-2])
    return fit(loop, t, -t, tol)


def path_d(curves, prec=2):
    f = lambda v: ('%.*f' % (prec, v)).rstrip('0').rstrip('.')
    p = curves[0][0]
    d = 'M%s %s' % (f(p[0]), f(p[1]))
    for c in curves:
        d += 'C%s %s %s %s %s %s' % tuple(f(x) for x in (c[1][0], c[1][1], c[2][0], c[2][1], c[3][0], c[3][1]))
    return d + 'Z'


def flatten(curves, steps=40):
    out = []
    for c in curves:
        out.extend(bezier(np.array(c), np.linspace(0, 1, steps, endpoint=False)).tolist())
    return out


def iou(poly_a, poly_b, size=1024, scale=16):
    ims = []
    for poly in (poly_a, poly_b):
        im = Image.new('1', (size, size), 0)
        ImageDraw.Draw(im).polygon([(x * scale, y * scale) for x, y in poly], fill=1)
        ims.append(np.array(im, dtype=bool))
    inter = np.logical_and(*ims).sum()
    union = np.logical_or(*ims).sum()
    return inter / union, np.logical_xor(*ims).sum() / (scale * scale)


def max_deviation(pts, curves):
    """Largest distance from any approved point to the fitted outline (dense sampling)."""
    dense = np.array(flatten(curves, steps=400))
    return float(max(np.min(np.linalg.norm(dense - p, axis=1)) for p in pts))


def bbox(poly):
    a = np.array(poly)
    return a[:, 0].min(), a[:, 1].min(), a[:, 0].max(), a[:, 1].max()


# ── wordmark outlines from Geist ──
def wordmark(text='banira', weight=560, tracking=-0.03):
    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    font = TTFont(os.path.join(ROOT, 'website/src/static/assets/fonts/Geist-Variable.woff2'))
    inst = instancer.instantiateVariableFont(font, {'wght': weight})
    gs = inst.getGlyphSet()
    cmap = inst.getBestCmap()
    upm = inst['head'].unitsPerEm
    hmtx = inst['hmtx']
    x = 0
    pen = SVGPathPen(gs)
    for ch in text:
        g = cmap[ord(ch)]
        tp = TransformPen(pen, (1, 0, 0, -1, x, 0))  # flip y: font units → SVG
        gs[g].draw(tp)
        x += hmtx[g][0] + tracking * upm
    x -= tracking * upm
    os2 = inst['OS/2']
    return pen.getCommands(), x, upm, getattr(os2, 'sxHeight', 0), os2.sTypoAscender


def svg(view, body, label='Banira'):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s" role="img" aria-label="%s"><title>%s</title>%s</svg>\n'
            % (view, label, label, body))


def main():
    report = ['# R2 fit report', '', 'Generated by `brand/r2/build_r2.py`. Overlap is measured by rasterising the approved polyline and the fitted curve at 1024 px (16 px per unit).', '']
    paths = {}
    for key, fname in [('mark', 'r2-polyline.txt'), ('small', 'r2-small-polyline.txt')]:
        pts, seed = load_poly(fname)
        curves = fit_closed(pts, tol=0.025)
        dev = max_deviation(pts, curves)
        d = path_d(curves)
        score, xor_units = iou(pts.tolist(), flatten(curves))
        paths[key] = {'d': d, 'seed': seed, 'segments': len(curves), 'points_in': int(len(pts)), 'iou': round(float(score), 5), 'bytes_before': len(open(os.path.join(HERE, 'source', fname)).read()), 'bytes_after': len(d)}
        report.append('| %s | %d points → %d cubic segments | overlap (IoU) %.3f %% | differing area %.3f unit² of 4096 | path %d → %d bytes |' % (key, len(pts), len(curves), score * 100, xor_units, paths[key]['bytes_before'], len(d)))
        paths[key]['max_point_deviation'] = round(dev, 4)
        report[-1] += ' max point deviation %.3f unit |' % dev
        if score < 0.994 or dev > 0.05:
            print('FIT TOO LOOSE for %s: IoU %.4f, deviation %.3f' % (key, score, dev)); sys.exit(1)
    report.insert(4, '| Variant | Points | Overlap | Difference | Size | Deviation |\n|---|---|---|---|---|---|')
    json.dump(paths, open(os.path.join(HERE, 'r2-paths.json'), 'w'), indent=2)

    m, s = paths['mark'], paths['mark']['seed']
    mark_body = lambda fill: '<path d="%s" fill="%s"/><circle cx="%s" cy="%s" r="%s" fill="%s"/>' % (m['d'], fill, s[0], s[1], s[2], fill)
    sm, ss = paths['small'], paths['small']['seed']
    small_body = lambda fill: '<path d="%s" fill="%s"/><circle cx="%s" cy="%s" r="%s" fill="%s"/>' % (sm['d'], fill, ss[0], ss[1], ss[2], fill)

    for name, fill in [('black', '#000000'), ('white', '#FFFFFF')]:
        open(os.path.join(OUT, 'banira-r2-mark-%s.svg' % name), 'w').write(svg('0 0 64 64', mark_body(fill)))
        open(os.path.join(OUT, 'banira-r2-mark-small-%s.svg' % name), 'w').write(svg('0 0 64 64', small_body(fill)))
    # web component: currentColor + optional seed state colour
    open(os.path.join(OUT, 'banira-r2-mark-web.svg'), 'w').write(
        '<svg class="mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="%s" fill="currentColor"/><circle class="seed" cx="%s" cy="%s" r="%s" fill="var(--seed, currentColor)"/></svg>\n' % (m['d'], s[0], s[1], s[2]))

    # app icons / favicon: small variant on a pure black (or white) tile, mark at ~68 % of tile
    for name, bg, fg in [('dark', '#000000', '#FFFFFF'), ('light', '#FFFFFF', '#000000')]:
        body = '<rect width="64" height="64" rx="14.4" fill="%s"/><g transform="translate(10.24 10.24) scale(.68)">%s</g>' % (bg, small_body(fg))
        open(os.path.join(OUT, 'banira-r2-app-%s.svg' % name), 'w').write(svg('0 0 64 64', body))
    open(os.path.join(OUT, 'favicon.svg'), 'w').write(svg('0 0 64 64',
        '<style>rect{fill:#000}path,circle{fill:#fff}@media (prefers-color-scheme:light){rect{fill:#fff}path,circle{fill:#000}}</style>'
        '<rect width="64" height="64" rx="14.4"/><g transform="translate(8 8) scale(.75)">%s</g>' % small_body('#fff').replace(' fill="#fff"', '')))

    # lockups: mark height 64; wordmark cap/x proportions as on the site (24 px mark : 17 px Geist 560, gap 8.8 px)
    cmds, adv, upm, xh, asc = wordmark()
    k = 64 / 24 * 17 / upm            # font units → lockup units
    gap = 64 / 24 * 8.8
    base = 32 + (xh * k) / 2           # optically centre the x-height on the mark
    width = 64 + gap + adv * k
    for name, fill in [('black', '#000000'), ('white', '#FFFFFF')]:
        body = '%s<path transform="translate(%.2f %.2f) scale(%.5f)" d="%s" fill="%s"/>' % (mark_body(fill), 64 + gap, base, k, cmds, fill)
        open(os.path.join(OUT, 'banira-r2-lockup-%s.svg' % name), 'w').write(svg('0 0 %.2f 64' % width, body))
        wm = '<path transform="translate(0 %.2f) scale(%.5f)" d="%s" fill="%s"/>' % (asc * k, k, cmds, fill)
        open(os.path.join(OUT, 'banira-r2-wordmark-%s.svg' % name), 'w').write(svg('0 0 %.2f %.2f' % (adv * k, asc * k * 1.25), wm))
    report += ['', '## Kit', '', '| File | Use |', '|---|---|',
               '| `banira-r2-mark-{black,white}.svg` | Primary mark, 24 px and up |',
               '| `banira-r2-mark-small-{black,white}.svg` | Optical small-size variant (fuller pod, larger seed) for 16–24 px |',
               '| `banira-r2-lockup-{black,white}.svg` | Mark + Geist 560 wordmark |',
               '| `banira-r2-wordmark-{black,white}.svg` | Text-only contexts |',
               '| `banira-r2-app-{dark,light}.svg` | Avatars, app tiles |',
               '| `favicon.svg` | Browser tab; follows the system theme |',
               '| `banira-r2-mark-web.svg` | Inline website component (`currentColor`, `--seed`) |',
               '', 'Lockup width %.1f units at height 64 (ratio %.2f : 1).' % (width, width / 64)]
    open(os.path.join(HERE, 'FIT_REPORT.md'), 'w').write('\n'.join(report) + '\n')
    print('\n'.join(report[4:8]))


if __name__ == '__main__':
    main()
