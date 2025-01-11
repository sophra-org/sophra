// Initialize New Relic if enabled
if (process.env.NEW_RELIC_ENABLED !== 'false') {
  require("newrelic");
}

// Import and start the standalone server
const server = require('./server');
