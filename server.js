const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');

const app = express();
app.use(cors());

app.get('/proxy', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('URL requerida');

  const lib = url.startsWith('https') ? https : http;

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': '*/*'
    }
  };

  lib.get(url, options, (proxyRes) => {
    const contentType = proxyRes.headers['content-type'] || '';
    const isM3U8 = url.includes('.m3u8') || contentType.includes('mpegurl');

    res.setHeader('Access-Control-Allow-Origin', '*');

    if (isM3U8) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      let body = '';
      proxyRes.on('data', chunk => body += chunk.toString());
      proxyRes.on('end', () => {
        const base = new URL(url);
        const rewritten = body.split('\n').map(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return line;
          try {
            const abs = new URL(trimmed, base).toString();
            return `/proxy?url=${encodeURIComponent(abs)}`;
          } catch {
            return line;
          }
        }).join('\n');
        res.send(rewritten);
      });
    } else {
      res.setHeader('Content-Type', contentType || 'application/octet-stream');
      proxyRes.pipe(res);
    }
  }).on('error', (e) => {
    res.status(500).send('Error: ' + e.message);
  });
});

app.get('/', (req, res) => res.send('JS Connect TV Proxy OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Proxy corriendo en puerto ' + PORT));
