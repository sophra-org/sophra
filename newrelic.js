"use strict";

exports.config = {
  app_name: ["sophra-api-system"],
  license_key: "${NEW_RELIC_LICENSE_KEY}",
  logging: {
    level: "info",
    filepath: process.env.NEW_RELIC_LOG_PATH || "/app/logs/newrelic_agent.log",
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      "request.headers.cookie",
      "request.headers.authorization",
      "request.headers.proxyAuthorization",
      "request.headers.setCookie*",
      "request.headers.x*",
      "response.headers.cookie",
      "response.headers.authorization",
      "response.headers.proxyAuthorization",
      "response.headers.setCookie*",
      "response.headers.x*",
    ],
  },
  distributed_tracing: {
    enabled: true,
  },
  transaction_tracer: {
    enabled: true,
    transaction_threshold: 4,
    record_sql: "obfuscated",
    explain_threshold: 200,
  },
  error_collector: {
    enabled: true,
    ignore_status_codes: [404],
  },
  rules: {
    name: [
      { pattern: "/api/cortex/*", name: "/api/cortex/:endpoint" },
      { pattern: "/api/nous/*", name: "/api/nous/:endpoint" },
      { pattern: "/api/keys/*", name: "/api/keys/:endpoint" },
      { pattern: "/api/health/*", name: "/api/health/:endpoint" },
      { pattern: "/api/admin/*", name: "/api/admin/:endpoint" },
    ],
  },
  custom_parameters: {
    enabled: true,
    include: ["api.endpoint", "api.service", "api.version"],
  },
  transaction_events: {
    enabled: true,
    max_samples_stored: 10000,
  },
  slow_sql: {
    enabled: true,
  },
};
