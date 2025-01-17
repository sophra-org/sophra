// Initialize New Relic if enabled
if (process.env.NEW_RELIC_ENABLED !== 'false') {
  require("newrelic");
}

const http = require('http');
const path = require('path');

// Provide the directory where Next.js app is located
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.chdir(path.resolve(__dirname));

const next = require('next');
const app = next({ dir: '.', dev: false, conf: { distDir: '.next' } });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  const port = parseInt(process.env.PORT || '3000', 10);
  const hostname = process.env.HOSTNAME || '0.0.0.0';

  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
