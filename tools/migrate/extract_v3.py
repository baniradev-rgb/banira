"""One-time migration: split the flattened V3 export into V4 build sources.
Usage: python3 -I tools/migrate/extract_v3.py archive/website-v3-static website/src
Pages → src/pages/<name>.html (front-matter JSON comment + <main> inner HTML)
Chrome → src/partials/{header,drawer,footer}.html (from about.html, active state removed)
CSS → src/css/NN-<section>.css split on the top-level section banners."""
import json, os, re, sys, html

src, out = sys.argv[1], sys.argv[2]
os.makedirs(os.path.join(out, 'pages'), exist_ok=True)
os.makedirs(os.path.join(out, 'partials'), exist_ok=True)
os.makedirs(os.path.join(out, 'css'), exist_ok=True)

def meta(s, name, attr='name'):
    m = re.search(r'<meta %s="%s" content="([^"]*)"' % (attr, re.escape(name)), s)
    return html.unescape(m.group(1)) if m else None

DEFAULT = ['site-config', 'site']
for f in sorted(os.listdir(src)):
    if not f.endswith('.html'):
        continue
    s = open(os.path.join(src, f), encoding='utf-8').read()
    name = f[:-5]
    title = html.unescape(re.search(r'<title>(.*?)</title>', s, re.S).group(1))
    hdr = s[s.find('<header'):s.find('</header>')]
    cur = re.search(r'href="([^"]+)" aria-current="page"', hdr)
    scripts = [os.path.basename(x)[:-3] for x in re.findall(r'<script src="assets/js/([^"]+)"', s[s.find('</main>'):])]
    ld = re.search(r'<script type="application/ld\+json">(.*?)</script>', s, re.S)
    fm = {
        'title': title,
        'description': meta(s, 'description'),
        'path': f,
        'nav': cur.group(1) if cur else None,
        'scripts': [x for x in scripts if x not in DEFAULT],
    }
    if ld:
        fm['jsonld'] = json.loads(ld.group(1))
    body = s[s.find('<main id="main" tabindex="-1">') + len('<main id="main" tabindex="-1">'):s.find('</main>')]
    with open(os.path.join(out, 'pages', f), 'w', encoding='utf-8') as fh:
        fh.write('<!--page\n' + json.dumps(fm, ensure_ascii=False, indent=2) + '\n-->\n' + body.strip('\n') + '\n')

a = open(os.path.join(src, 'about.html'), encoding='utf-8').read()
a = a.replace(' aria-current="page"', '')
header = a[a.find('<header'):a.find('</header>') + 9]
drawer = a[a.find('<div class="menu-scrim"'):a.find('<main id="main"')]
footer = a[a.find('<footer'):a.find('</footer>') + 9]
for n, v in [('header', header), ('drawer', drawer), ('footer', footer)]:
    open(os.path.join(out, 'partials', n + '.html'), 'w', encoding='utf-8').write(v.strip() + '\n')

css = open(os.path.join(src, 'assets/css/site.css'), encoding='utf-8').read()
parts = re.split(r'\n(?=/\* ── [a-zA-Z])', css)
for i, p in enumerate(parts):
    m = re.match(r'/\* ── ([a-zA-Z][a-zA-Z -]*?)\s', p)
    label = (m.group(1).strip().lower().replace(' ', '-') if m else 'tokens')
    open(os.path.join(out, 'css', '%02d-%s.css' % (i, label)), 'w', encoding='utf-8').write(p.strip() + '\n')
print('pages:', len(os.listdir(os.path.join(out, 'pages'))), 'css parts:', len(parts))
