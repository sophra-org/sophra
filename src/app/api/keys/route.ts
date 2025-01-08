import { prisma } from "../../../lib/shared/database/client";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "./admin.middleware";

// Declare Node.js runtime
export const runtime = "nodejs";

// Generate a secure API key
function generateApiKey(): string {
  return crypto.randomBytes(32).toString("base64url");
}

// Middleware wrapper for all routes
async function withAdminAuth(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  const middlewareResponse = await adminMiddleware(request);
  if (middlewareResponse.status !== 200) {
    return middlewareResponse;
  }
  return handler(request);
}

// Create a new API key
export async function POST(req: NextRequest) {
  return withAdminAuth(req, async (request) => {
    try {
      const body = await request.json();
      const { name, clientId, description, rateLimit, allowedIps, expiresAt } =
        body;

      const apiKey = await prisma.apiKey.create({
        data: {
          key: generateApiKey(),
          name,
          clientId,
          description,
          rateLimit,
          allowedIps,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });

      // Don't return the actual API key in the response list
      const { key, ...rest } = apiKey;
      return NextResponse.json({ key, ...rest }, { status: 201 });
    } catch (error) {
      console.error("Error creating API key:", error);
      return NextResponse.json(
        { error: "Failed to create API key" },
        { status: 500 }
      );
    }
  });
}

// List all API keys (without exposing the actual keys)
export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const apiKeys = await prisma.apiKey.findMany({
        select: {
          id: true,
          name: true,
          clientId: true,
          description: true,
          isActive: true,
          expiresAt: true,
          createdAt: true,
          lastUsedAt: true,
          allowedIps: true,
          rateLimit: true,
          usageCount: true,
        },
      });

      return NextResponse.json(apiKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      return NextResponse.json(
        { error: "Failed to fetch API keys" },
        { status: 500 }
      );
    }
  });
}

// Replace an API key (PUT)
export async function PUT(req: NextRequest) {
  return withAdminAuth(req, async (request) => {
    try {
      const body = await request.json();
      const { id, ...updateData } = body;

      if (!id) {
        return NextResponse.json(
          { error: "API key ID is required" },
          { status: 400 }
        );
      }

      // Generate a new key if requested
      if (updateData.regenerateKey) {
        updateData.key = generateApiKey();
        delete updateData.regenerateKey;
      }

      const apiKey = await prisma.apiKey.update({
        where: { id },
        data: updateData,
      });

      const { key, ...rest } = apiKey;
      return NextResponse.json(rest);
    } catch (error) {
      console.error("Error updating API key:", error);
      return NextResponse.json(
        { error: "Failed to update API key" },
        { status: 500 }
      );
    }
  });
}

// Update an API key (partial update)
export async function PATCH(req: NextRequest) {
  return withAdminAuth(req, async (request) => {
    try {
      const body = await request.json();
      const { id, ...updateData } = body;

      if (!id) {
        return NextResponse.json(
          { error: "API key ID is required" },
          { status: 400 }
        );
      }

      const apiKey = await prisma.apiKey.update({
        where: { id },
        data: updateData,
      });

      const { key, ...rest } = apiKey;
      return NextResponse.json(rest);
    } catch (error) {
      console.error("Error updating API key:", error);
      return NextResponse.json(
        { error: "Failed to update API key" },
        { status: 500 }
      );
    }
  });
}

// Delete an API key
export async function DELETE(req: NextRequest) {
  return withAdminAuth(req, async (request) => {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id) {
        return NextResponse.json(
          { error: "API key ID is required" },
          { status: 400 }
        );
      }

      await prisma.apiKey.delete({
        where: { id },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error deleting API key:", error);
      return NextResponse.json(
        { error: "Failed to delete API key" },
        { status: 500 }
      );
    }
  });
}
