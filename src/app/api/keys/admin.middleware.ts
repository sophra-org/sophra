import { prisma } from "@/lib/shared/database/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function adminMiddleware(request: NextRequest) {
  const adminToken = request.headers.get("x-admin-token");

  if (!adminToken) {
    return NextResponse.json(
      { error: "Missing required header: x-admin-token" },
      { status: 401 }
    );
  }

  try {
    const token = await prisma.adminToken.findFirst({
      where: {
        token: adminToken,
        isActive: true,
      },
    });

    if (!token) {
      return NextResponse.json(
        { error: "Invalid admin token" },
        { status: 401 }
      );
    }

    // Update last used timestamp
    await prisma.adminToken.update({
      where: { id: token.id },
      data: { lastUsedAt: new Date() },
    });

    // Create a new response from the original request
    const response = NextResponse.next();
    response.headers.set("x-admin-token-id", token.id);
    return response;
  } catch (error) {
    console.error("Error validating admin token:", error);
    return NextResponse.json(
      { error: "Error validating admin token" },
      { status: 500 }
    );
  }
}
