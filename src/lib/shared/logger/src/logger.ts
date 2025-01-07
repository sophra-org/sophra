import { Logger } from "@/lib/shared/types";
import path from "path";
import type * as Winston from "winston";

// Dynamic imports for server-side only modules
let winston: typeof Winston;
let Logtail: typeof import("@logtail/node").Logtail;
let LogtailTransport: typeof import("@logtail/winston").LogtailTransport;

// Initialize server-side modules
if (typeof window === "undefined") {
  const importWinston = async () => {
    const winstonModule = await import("winston");
    winston = winstonModule.default;
    const logtailNode = await import("@logtail/node");
    const logtailWinston = await import("@logtail/winston");
    Logtail = logtailNode.Logtail;
    LogtailTransport = logtailWinston.LogtailTransport;

    // Move winston color configuration here
    winston.addColors({
      error: "white bgRed bold",
      warn: "black bgYellow",
      info: "black bgGreen",
      debug: "white bgBlue",
      http: "white bgMagenta",
      verbose: "white bgGray",
      build: "black bgCyan",
      test: "white bgMagenta",
      deploy: "white bgGreen",
      cache: "white bgBlue",
    });
  };
  // Execute the import
  importWinston();
}

// Add turborepo-specific emoji indicators
const LOG_EMOJIS = {
  error: "🚨",
  warn: "⚠️",
  info: "ℹ️",
  debug: "🔍",
  http: "🌐",
  verbose: "📝",
  build: "📦",
  test: "🧪",
  deploy: "🚀",
  cache: "💾",
} as const;

// Enhanced log colors with background colors
const LOG_COLORS = {
  error: "white bgRed bold",
  warn: "black bgYellow",
  info: "black bgGreen",
  debug: "white bgBlue",
  http: "white bgMagenta",
  verbose: "white bgGray",
  build: "black bgCyan",
  test: "white bgMagenta",
  deploy: "white bgGreen",
  cache: "white bgBlue",
} as const;

export interface LoggerConfig {
  service?: string;
  logtailToken?: string;
  environment?: string;
  level?: string;
  silent?: boolean;
  workspace?: string;
}

// Create a browser-safe logger implementation
const createBrowserLogger = (component: string): Logger => {
  let currentLevel = LogLevel.DEBUG;

  const shouldLog = (level: LogLevel): boolean => {
    const levels = {
      [LogLevel.ERROR]: 0,
      [LogLevel.WARN]: 1,
      [LogLevel.INFO]: 2,
      [LogLevel.HTTP]: 3,
      [LogLevel.DEBUG]: 4,
      [LogLevel.VERBOSE]: 5,
      [LogLevel.BUILD]: 6,
      [LogLevel.TEST]: 7,
      [LogLevel.DEPLOY]: 8,
      [LogLevel.CACHE]: 9,
    };
    if (!(level in levels) || !(currentLevel in levels)) {
      return true;
    }
    return levels[level] <= levels[currentLevel as LogLevel];
  };

  const browserLogger = {
    error: (...args: any[]) => shouldLog(LogLevel.ERROR) && console.error(`[${component}]`, ...args),
    warn: (...args: any[]) => shouldLog(LogLevel.WARN) && console.warn(`[${component}]`, ...args),
    info: (...args: any[]) => shouldLog(LogLevel.INFO) && console.info(`[${component}]`, ...args),
    debug: (...args: any[]) => shouldLog(LogLevel.DEBUG) && console.debug(`[${component}]`, ...args),
    http: (...args: any[]) => shouldLog(LogLevel.HTTP) && console.log(`[${component}]`, ...args),
    verbose: (...args: any[]) => shouldLog(LogLevel.VERBOSE) && console.log(`[${component}]`, ...args),
    service: "sophra",
    get level() {
      return currentLevel;
    },
    set level(newLevel: string) {
      currentLevel = newLevel as LogLevel;
    },
  } as Logger;
  return browserLogger;
};

let globalLoggerInstance: Winston.Logger | null = null;

function getCallerFile(): string {
  // Create an error to get the stack trace
  const err = new Error();
  Error.captureStackTrace(err);

  // Parse the stack trace to find the caller
  const stack = err.stack?.split("\n") || [];

  // Find the first line that's not from this file or node internal
  const callerLine = stack.find((line) => {
    return (
      line.includes("at ") &&
      !line.includes("getCallerFile") &&
      !line.includes("getLogger") &&
      !line.includes("Object.<anonymous>")
    );
  });

  if (!callerLine) return "sophra";

  // Extract the file path
  const match =
    callerLine.match(/\((.+?):\d+:\d+\)/) ||
    callerLine.match(/at (.+?):\d+:\d+/);

  if (!match) return "unknown";

  // Get the full path
  const fullPath = match[1];

  // Handle webpack-internal paths
  if (fullPath.includes("webpack-internal")) {
    // Look for src/app or src/lib pattern
    const srcMatch = fullPath.match(
      /src\/(app|lib)\/(.*?)(\/route|\/page|\/index|\.[jt]sx?)/
    );
    if (srcMatch) {
      return srcMatch[2]
        .replace(/^api\//, "") // Remove api prefix
        .replace(/\//g, "."); // Convert slashes to dots
    }
  }

  // For non-webpack paths, use the relative path approach
  const projectRoot = process.cwd();
  const relativePath = path.relative(projectRoot, fullPath);

  return relativePath
    .replace(/\.(js|ts|tsx|jsx)$/, "") // Remove extension
    .replace(/^src\/(app|lib)\//, "") // Remove src/app or src/lib
    .replace(/\/route$/, "") // Remove route suffix
    .replace(/\/(index|page)$/, "") // Remove index/page suffix
    .replace(/\//g, ".") // Convert slashes to dots
    .replace(/^api\./, ""); // Remove api prefix
}

// Modify getLogger to use automatic component detection
export function getLogger(component?: string): Logger {
  const autoComponent = component || getCallerFile();

  // Check if we're in a browser environment
  if (typeof window !== "undefined") {
    return createBrowserLogger(autoComponent);
  }

  // Server-side logging logic
  if (!globalLoggerInstance && winston) {
    const config = {
      service: "sophra",
      environment: process.env.NODE_ENV || "development",
      level: process.env.LOG_LEVEL || "info",
      workspace: process.env.TURBO_WORKSPACE || "unknown",
    };

    const transports: Winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize({ colors: LOG_COLORS }),
          winston.format.simple(),
          winston.format.printf(
            ({ level, message, timestamp, component, ...metadata }) => {
              // Extract the base level without any color codes
              const baseLevel = level.replace(/\u001b\[\d+m/g, "");
              const emoji =
                LOG_EMOJIS[
                  baseLevel.toLowerCase() as keyof typeof LOG_EMOJIS
                ] || "📋";
              const ts = new Date(
                timestamp as string | number | Date
              ).toLocaleTimeString();
              const comp = component || "sophra";

              // Only include metadata if it's not empty and exclude certain fields
              const { service, environment, workspace, ...restMetadata } =
                metadata;
              const metadataStr = Object.keys(restMetadata).length
                ? ` | ${JSON.stringify(restMetadata)}`
                : "";

              return `${emoji} ${ts} [${comp}] ${level}: ${message}${metadataStr}`;
            }
          )
        ),
      }),
    ];

    if (
      process.env.LOGTAIL_TOKEN &&
      process.env.NODE_ENV === "production" &&
      Logtail &&
      LogtailTransport
    ) {
      const logtail = new Logtail(process.env.LOGTAIL_TOKEN);
      transports.push(new LogtailTransport(logtail));
    }

    globalLoggerInstance = winston.createLogger({
      level: config.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat()
      ),
      defaultMeta: {
        service: config.service,
        component: autoComponent,
        environment: config.environment,
        workspace: config.workspace,
      },
      transports,
    }) as Logger;

    (globalLoggerInstance as Logger).service = config.service;
  }

  // If winston isn't initialized yet, return a browser-like logger
  if (!globalLoggerInstance) {
    return createBrowserLogger(autoComponent);
  }

  const childLogger = globalLoggerInstance.child({
    component: autoComponent,
    workspace: process.env.TURBO_WORKSPACE,
  }) as Logger;

  childLogger.service = (globalLoggerInstance as Logger).service;

  return childLogger;
}

// Create a default logger instance
export const logger = getLogger();
export default logger;

export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
  HTTP = "http",
  VERBOSE = "verbose",
  BUILD = "build",
  TEST = "test",
  DEPLOY = "deploy",
  CACHE = "cache",
}
