/**
 * 📊 Metrics Configuration: Your Monitoring Control Panel!
 *
 * This is where we set up how we want to track our application's health.
 * Like configuring all the dials and gauges on your car's dashboard! 🚗
 *
 * Features:
 * - ⚡ Event loop monitoring
 * - 🗑️ Garbage collection tracking
 * - 🏷️ Application labeling
 * - 📏 Metric prefixing
 * - ⏰ Collection intervals
 *
 * @const {Object} metricsConfig
 * @property {boolean} eventLoopMonitoring - Watch how fast we process tasks
 * @property {boolean} gcMonitoring - Track memory cleanup
 * @property {Object} defaultLabels - Tags for all metrics
 * @property {string} prefix - Start all metric names with this
 * @property {boolean} collectDefaultMetrics - Gather standard stats
 * @property {number} defaultMetricsInterval - How often to check (ms)
 */
export const metricsConfig = {
  eventLoopMonitoring: true,
  gcMonitoring: true,
  defaultLabels: {
    app: "sophra",
    environment: process.env.NODE_ENV || "development",
  },
  prefix: "sophra_",
  collectDefaultMetrics: true,
  defaultMetricsInterval: 10000,
};
