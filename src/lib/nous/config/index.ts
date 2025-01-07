import { settings } from "./settings";
import { Config, Environment } from "./types";
export { Settings } from "./settings";
export { Environment } from "./types";
export type {
  Config,
  LearnConfig,
  ObserveConfig,
  RegistryConfig,
  ServerConfig,
} from "./types";

// Initialize settings with default config
settings.load();

// Export singleton instance
export { settings };

// Export a type-safe getter function
export function getConfig(): Config {
  return settings.getConfig();
}

// Export environment-specific helpers
export function isProduction(): boolean {
  return settings.getConfig().environment === Environment.PROD;
}

export function isDevelopment(): boolean {
  return settings.getConfig().environment === Environment.DEV;
}

export function isStaging(): boolean {
  return settings.getConfig().environment === Environment.STAGING;
}
