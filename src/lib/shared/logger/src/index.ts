import { getLogger as getInternalLogger } from "./logger";

// Re-export the internal getLogger with our fancy formatting
export const getLogger = getInternalLogger;

// Create a default logger instance
export const logger = getLogger("default");

// Re-export types
export * from "./logger";
export default logger;

export { LogLevel } from './logger';
