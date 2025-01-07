import { getLogger } from "./src/logger";

// Create and export the default logger instance
export const logger = getLogger("default");

// Re-export everything from the main logger
export * from "./src/logger";
export default logger;
