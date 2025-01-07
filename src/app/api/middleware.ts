import { prisma } from "@/lib/shared/database/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Skip auth for health check endpoint and API key management
  if (
    request.nextUrl.pathname.startsWith("/api/health") ||
    request.nextUrl.pathname.startsWith("/api/keys")
  ) {
    return NextResponse.next();
  }

  const apiKey = request.headers.get("x-api-key");

  // Validate required header
  if (!apiKey) {
    return new NextResponse(
      JSON.stringify({
        error: "Missing required header: x-api-key",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    // Find and validate the API key
    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: {
        key: apiKey,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (!apiKeyRecord) {
      return new NextResponse(
        JSON.stringify({
          error: "Invalid API key",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Check rate limit if configured
    if (apiKeyRecord.rateLimit) {
      // Implement rate limiting logic here if needed
      // For now, we'll just track usage
    }

    // Update usage statistics
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 },
      },
    });

    // Add client info to headers for downstream use
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("x-authenticated-client", apiKeyRecord.clientId);
    headers.set("x-api-key-name", apiKeyRecord.name);

    return new NextResponse(null, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error validating API key:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Error validating API key",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export const config = {
  matcher: "/api/:path*",
};
