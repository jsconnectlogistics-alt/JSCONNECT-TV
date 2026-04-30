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
  
  lib.get(url, (proxyRes) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    proxyRes.pipe(res);
  }).on('error', (e) => {
    res.status(500).send('Error: ' + e.message);
  });
});

app.get('/', (req, res) => res.send('JS Connect TV Proxy OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Proxy corriendo en puerto ' + PORT));
