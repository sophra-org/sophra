import { describe, it, expect } from "vitest";
import {
hasPermission,
getAccessibleEndpoints,
isSuperAdmin,
AdminTokenPayload,
} from "./permissions";

describe("permissions", () => {
describe("hasPermission", () => {
    it("should return true for valid token with required purpose", () => {
        const tokenPayload: AdminTokenPayload = { name: "prod-api-1", type: "admin" };
        expect(hasPermission(tokenPayload, "/api/keys")).toBe(true);
    });

    it("should return false for valid token without required purpose", () => {
        const tokenPayload: AdminTokenPayload = { name: "prod-monitoring-1", type: "admin" };
        expect(hasPermission(tokenPayload, "/api/keys")).toBe(false);
    });

    it("should return false for invalid token name format", () => {
        const tokenPayload: AdminTokenPayload = { name: "invalid-token", type: "admin" };
        expect(hasPermission(tokenPayload, "/api/keys")).toBe(false);
    });

    it("should return false for endpoint not in permissions map", () => {
        const tokenPayload: AdminTokenPayload = { name: "prod-api-1", type: "admin" };
        expect(hasPermission(tokenPayload, "/api/unknown")).toBe(false);
    });
});

describe("getAccessibleEndpoints", () => {
    it("should return all endpoints for a valid token with 'api' purpose", () => {
        const tokenPayload: AdminTokenPayload = { name: "prod-api-1", type: "admin" };
        const endpoints = getAccessibleEndpoints(tokenPayload);
        expect(endpoints).toEqual([
            "/api/keys",
            "/api/config/search",
            "/api/config/experiment",
        ]);
    });

    it("should return empty array for invalid token name format", () => {
        const tokenPayload: AdminTokenPayload = { name: "invalid-token", type: "admin" };
        const endpoints = getAccessibleEndpoints(tokenPayload);
        expect(endpoints).toEqual([]);
    });

    it("should return correct endpoints for a valid token with 'monitoring' purpose", () => {
        const tokenPayload: AdminTokenPayload = { name: "prod-monitoring-1", type: "admin" };
        const endpoints = getAccessibleEndpoints(tokenPayload);
        expect(endpoints).toEqual(["/api/metrics", "/api/logs"]);
    });
});

describe("isSuperAdmin", () => {
    it("should return true for a token with 'api' purpose", () => {
        const tokenPayload: AdminTokenPayload = { name: "prod-api-1", type: "admin" };
        expect(isSuperAdmin(tokenPayload)).toBe(true);
    });

    it("should return false for a token without 'api' purpose", () => {
        const tokenPayload: AdminTokenPayload = { name: "prod-monitoring-1", type: "admin" };
        expect(isSuperAdmin(tokenPayload)).toBe(false);
    });

    it("should return false for invalid token name format", () => {
        const tokenPayload: AdminTokenPayload = { name: "invalid-token", type: "admin" };
        expect(isSuperAdmin(tokenPayload)).toBe(false);
    });
});
});