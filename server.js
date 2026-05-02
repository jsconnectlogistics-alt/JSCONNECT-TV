const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');

const app = express();
app.use(cors());

const BASE_URL = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : 'https://jsconnect-tv-production.up.railway.app';

function fetchUrl(url, res, redirectCount = 0) {
  if (redirectCount > 5) return res.status(500).send('Demasiadas redirecciones');
  const lib = url.startsWith('https') ? https : http;
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (SmartTV) AppleWebKit/537.36',
      'Accept': '*/*',
      'Connection': 'keep-alive'
    },
    timeout: 30000
  };

  const request = lib.get(url, options, (proxyRes) => {
    if ([301,302,303,307,308].includes(proxyRes.statusCode)) {
      const location = proxyRes.headers['location'];
      if (location) {
        const newUrl = location.startsWith('http') ? location : new URL(location, url).toString();
        return fetchUrl(newUrl, res, redirectCount + 1);
      }
    }

    const contentType = proxyRes.headers['content-type'] || '';
    const isM3U8 = url.includes('.m3u8') || url.includes('.m3u') ||
                   contentType.includes('mpegurl') || contentType.includes('x-mpegurl');

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Cache-Control', 'no-cache');

    if (isM3U8) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      let body = '';
      proxyRes.on('data', chunk => body += chunk.toString());
      proxyRes.on('end', () => {
        try {
          const base = new URL(url);
          const rewritten = body.split('\n').map(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return line;
            try {
              const abs = new URL(trimmed, base).toString();
              return `${BASE_URL}/proxy?url=${encodeURIComponent(abs)}`;
            } catch { return line; }
          }).join('\n');
          res.send(rewritten);
        } catch(e) { res.send(body); }
      });
    } else {
      res.setHeader('Content-Type', contentType || 'application/octet-stream');
      proxyRes.pipe(res);
    }
  });

  request.on('error', (e) => {
    if (!res.headersSent) res.status(500).send('Error: ' + e.message);
  });
  request.on('timeout', () => {
    request.destroy();
    if (!res.headersSent) res.status(504).send('Timeout');
  });
}

app.get('/proxy', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('URL requerida');
  fetchUrl(decodeURIComponent(url), res);
});

app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.sendStatus(200);
});

app.get('/', (req, res) => res.send('JS Connect TV Proxy OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy en puerto ${PORT} - BASE: ${BASE_URL}`));
