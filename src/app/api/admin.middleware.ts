import { prisma } from "@/lib/shared/database/client";
import * as jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { hasPermission, isSuperAdmin } from "./admin/permissions";

interface AdminTokenPayload {
  name: string;
  type: "admin";
  permissions?: string[];
}

export async function adminMiddleware(request: NextRequest) {
  const adminToken = request.headers.get("x-admin-token");

  if (!adminToken) {
    return NextResponse.json(
      { error: "Missing required header: x-admin-token" },
      { status: 401 }
    );
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    // First verify the token exists in the database
    let tokenRecord;
    try {
      tokenRecord = await prisma.adminToken.findFirst({
        where: {
          token: adminToken,
          isActive: true,
        },
      });
    } catch (error) {
      console.error("Database error while validating admin token:", error);
      throw new Error("Database error");
    }

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Invalid admin token" },
        { status: 401 }
      );
    }

    // Verify and decode the JWT
    const decoded = jwt.decode(adminToken);
    if (!decoded || typeof decoded === 'string') {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 401 }
      );
    }

    const tokenPayload = decoded as AdminTokenPayload;

    // Check permissions for the endpoint
    const endpoint = request.nextUrl.pathname;
    if (
      !isSuperAdmin(tokenPayload) &&
      !hasPermission(tokenPayload, endpoint)
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions for this endpoint" },
        { status: 403 }
      );
    }

    // Update last used timestamp
    try {
      await prisma.adminToken.update({
        where: { id: tokenRecord.id },
        data: { lastUsedAt: new Date() },
      });
    } catch (error) {
      console.error("Database error while updating admin token:", error);
      // Don't throw here since the validation was successful
    }

    // Return success response with token info in headers
    return NextResponse.json(
      {},
      {
        status: 200,
        headers: {
          'x-admin-token-name': tokenPayload.name,
          'x-admin-token-type': tokenPayload.type
        }
      }
    );
  } catch (error) {
    console.error("Error validating admin token:", error);
    return NextResponse.json(
      { error: "Error validating admin token" },
      { status: 500 }
    );
  }
}
