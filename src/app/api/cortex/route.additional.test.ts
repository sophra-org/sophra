import { describe, expect, it } from "vitest";
import { GET, dynamic, revalidate, runtime } from "./route";

describe("Cortex API Route Additional Tests", () => {
  describe("Configuration", () => {
    it("should use Node.js runtime", () => {
      expect(runtime).toBe("nodejs");
    });

    it("should force dynamic rendering", () => {
      expect(dynamic).toBe("force-dynamic");
    });

    it("should disable revalidation", () => {
      expect(revalidate).toBe(0);
    });
  });

  describe("GET Endpoint", () => {
    it("should return successful response", async () => {
      const response = await GET();

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it("should return correct content", async () => {
      const response = await GET();
      const content = await response.text();

      expect(content).toBe("API Route");
    });

    it("should return response with correct headers", async () => {
      const response = await GET();
      const contentType = response.headers.get("content-type");

      // Response.headers.get() returns null if the header is not set
      // Since we don't explicitly set content-type, it should be text/plain
      expect(contentType).toMatch(/text\/plain/);
    });

    it("should be callable multiple times", async () => {
      const response1 = await GET();
      const response2 = await GET();

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      const content1 = await response1.text();
      const content2 = await response2.text();

      expect(content1).toBe("API Route");
      expect(content2).toBe("API Route");
    });

    it("should create new response instance each time", async () => {
      const response1 = await GET();
      const response2 = await GET();

      expect(response1).not.toBe(response2);
    });
  });

  describe("Response Properties", () => {
    it("should have immutable properties", async () => {
      const response = await GET();

      expect(() => {
        // @ts-expect-error - Testing runtime immutability
        response.status = 404;
      }).toThrow();

      expect(response.status).toBe(200);
    });

    it("should be one-time readable", async () => {
      const response = await GET();

      // First read succeeds
      await response.text();

      // Second read fails
      await expect(response.text()).rejects.toThrow();
    });

    it("should handle cloning", async () => {
      const response = await GET();
      const clonedResponse = response.clone();

      const originalContent = await response.text();
      const clonedContent = await clonedResponse.text();

      expect(originalContent).toBe("API Route");
      expect(clonedContent).toBe("API Route");
    });
  });

  describe("Error Handling", () => {
    it("should handle response consumption errors", async () => {
      const response = await GET();

      // Consume as text
      await response.text();

      // Attempt to consume as JSON should fail
      await expect(response.json()).rejects.toThrow(
        "Body has already been read"
      );
    });

    it("should handle invalid response manipulation", async () => {
      const response = await GET();

      // Verify response is a valid Response object
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
      expect(response.headers).toBeInstanceOf(Headers);
      expect(response.body).toBeDefined();
    });

    it("should maintain response integrity under stress", async () => {
      // Create multiple concurrent requests
      const requests = Array(10)
        .fill(null)
        .map(() => GET());
      const responses = await Promise.all(requests);

      // Verify all responses
      const results = await Promise.all(
        responses.map(async (response) => {
          expect(response.status).toBe(200);
          const content = await response.text();
          expect(content).toBe("API Route");
          return content;
        })
      );

      expect(results).toHaveLength(10);
      expect(results.every((content) => content === "API Route")).toBe(true);
    });
  });
});
