const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const path = require('path');
const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname)));
const BASE_URL = 'https://jsconnect-tv-production.up.railway.app';
function fetchUrl(url, res, redirectCount) {
  if (!redirectCount) redirectCount = 0;
  if (redirectCount > 5) return res.status(500).send('Error');
  const lib = url.startsWith('https') ? https : http;
  const req2 = lib.get(url, {headers:{'User-Agent':'Mozilla/5.0','Accept':'*/*'},timeout:30000}, (proxyRes) => {
    if ([301,302,303,307,308].includes(proxyRes.statusCode)) {
      const loc = proxyRes.headers['location'];
      if (loc) return fetchUrl(loc.startsWith('http') ? loc : new URL(loc,url).toString(), res, redirectCount+1);
    }
    const ct = proxyRes.headers['content-type'] || '';
    const isM3U8 = url.includes('.m3u8') || url.includes('.m3u') || ct.includes('mpegurl');
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Cache-Control','no-cache');
    if (isM3U8) {
      res.setHeader('Content-Type','application/vnd.apple.mpegurl');
      let body = '';
      proxyRes.on('data', c => body += c.toString());
      proxyRes.on('end', () => {
        const base = new URL(url);
        const out = body.split('\n').map(line => {
          const t = line.trim();
          if (!t || t.startsWith('#')) return line;
          try { return BASE_URL+'/proxy?url='+encodeURIComponent(new URL(t,base).toString()); }
          catch { return line; }
        }).join('\n');
        res.send(out);
      });
    } else {
      res.setHeader('Content-Type', ct || 'application/octet-stream');
      proxyRes.pipe(res);
    }
  });
  req2.on('error', e => { if (!res.headersSent) res.status(500).send('Error: '+e.message); });
  req2.on('timeout', () => { req2.destroy(); if (!res.headersSent) res.status(504).send('Timeout'); });
}
app.options('*', (req,res) => { res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Headers','*'); res.setHeader('Access-Control-Allow-Methods','GET,OPTIONS'); res.sendStatus(200); });
app.get('/proxy', (req,res) => { const url = req.query.url; if (!url) return res.status(400).send('URL requerida'); fetchUrl(decodeURIComponent(url),res); });
app.get('/', (req,res) => res.sendFile(path.join(__dirname,'index.html')));
app.listen(process.env.PORT||3000, () => console.log('JS Connect TV OK'));
