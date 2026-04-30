const http = require('http');
const https = require('https');
const url = require('url');

const TARGET = 'http://38.51.233.74:25461';
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const target = TARGET + req.url;
  const u = url.parse(target);

  const options = {
    hostname: u.hostname,
    port: u.port || 80,
    path: u.path,
    method: req.method,
  };

  const proxy = http.request(options, (r) => {
    res.writeHead(r.statusCode, {
      'Content-Type': r.headers['content-type'] || 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    r.pipe(res);
  });

  proxy.on('error', (e) => {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  });

  req.pipe(proxy);
}).listen(PORT, () => console.log('Proxy corriendo en puerto ' + PORT));
