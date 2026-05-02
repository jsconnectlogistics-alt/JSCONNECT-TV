const http = require('http');
const https = require('https');
const url = require('url');

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  const target = decodeURIComponent(req.url.slice(1));
  const u = url.parse(target);
  http.get({host:u.hostname,port:u.port,path:u.path}, r => {
    res.writeHead(r.statusCode);
    r.pipe(res);
  }).on('error', e => res.end(e.message));
}).listen(3000);
console.log('Proxy corriendo en http://localhost:3000');
