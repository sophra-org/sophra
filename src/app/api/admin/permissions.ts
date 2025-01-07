type AdminTokenPurpose =
  | "api"
  | "monitoring"
  | "deployment"
  | "backup"
  | "maintenance";

export interface AdminTokenPayload {
  name: string;
  type: "admin";
  purpose?: AdminTokenPurpose;
}

// Map of endpoints to required purposes
const endpointPermissions: Record<string, AdminTokenPurpose[]> = {
  "/api/keys": ["api"],
  "/api/config/search": ["api", "deployment"],
  "/api/config/experiment": ["api", "deployment"],
  "/api/metrics": ["monitoring"],
  "/api/logs": ["monitoring"],
  "/api/maintenance": ["maintenance"],
  "/api/index": ["deployment"],
  "/api/backup": ["backup"],
};

// Extract purpose from token name (e.g., "prod-api-1" -> "api")
function getTokenPurpose(tokenName: string): AdminTokenPurpose | null {
  const parts = tokenName.split("-");
  if (parts.length >= 2) {
    const purpose = parts[1] as AdminTokenPurpose;
    if (isValidPurpose(purpose)) {
      return purpose;
    }
  }
  return null;
}

function isValidPurpose(purpose: string): purpose is AdminTokenPurpose {
  return ["api", "monitoring", "deployment", "backup", "maintenance"].includes(
    purpose
  );
}

// Check if a token has permission for a specific endpoint
export function hasPermission(
  tokenPayload: AdminTokenPayload,
  endpoint: string
): boolean {
  // Get required permissions for the endpoint
  const requiredPurposes = endpointPermissions[endpoint];
  if (!requiredPurposes) {
    return false; // Endpoint not found in permissions map
  }

  // Get token purpose from name
  const tokenPurpose = getTokenPurpose(tokenPayload.name);
  if (!tokenPurpose) {
    return false; // Invalid token name format
  }

  // Check if token purpose matches any required purpose
  return requiredPurposes.includes(tokenPurpose);
}

// Get all endpoints a token has access to
export function getAccessibleEndpoints(
  tokenPayload: AdminTokenPayload
): string[] {
  const tokenPurpose = getTokenPurpose(tokenPayload.name);
  if (!tokenPurpose) {
    return [];
  }

  return Object.entries(endpointPermissions)
    .filter(([_, purposes]) => purposes.includes(tokenPurpose))
    .map(([endpoint]) => endpoint);
}

// Utility to check if a token is a super admin (api tokens have access to everything)
export function isSuperAdmin(tokenPayload: AdminTokenPayload): boolean {
  const tokenPurpose = getTokenPurpose(tokenPayload.name);
  return tokenPurpose === "api";
}
