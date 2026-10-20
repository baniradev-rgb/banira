/* Minimal static file server for local preview and QA (no dependencies).
   Usage: node tools/qa/serve.js <dir> [port]
   Serves 404.html for unknown paths with a 404 status, like most static hosts. */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

function createServer(root) {
  root = path.resolve(root);
  return http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    let file = path.join(root, p);
    if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
    if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
    fs.readFile(file, (err, buf) => {
      if (err) {
        const nf = path.join(root, '404.html');
        res.writeHead(404, { 'Content-Type': TYPES['.html'] });
        return res.end(fs.existsSync(nf) ? fs.readFileSync(nf) : 'Not found');
      }
      const type = TYPES[path.extname(file)] || 'application/octet-stream';
      // compress text like a production static host does (Netlify/Cloudflare serve gzip or brotli)
      if (/text|javascript|json|svg|xml/.test(type) && /gzip/.test(req.headers['accept-encoding'] || '')) {
        res.writeHead(200, { 'Content-Type': type, 'Content-Encoding': 'gzip', 'Cache-Control': 'no-cache', Vary: 'Accept-Encoding' });
        return res.end(zlib.gzipSync(buf));
      }
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
      res.end(buf);
    });
  });
}

module.exports = { createServer };

if (require.main === module) {
  const dir = process.argv[2] || 'website/dist';
  const port = +process.argv[3] || 8080;
  createServer(dir).listen(port, () => console.log('Serving ' + dir + ' at http://localhost:' + port));
}
