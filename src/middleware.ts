import type NewRelic from "newrelic";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Initialize New Relic only in Node.js environment
let newrelic: typeof NewRelic | undefined;
if (process.env.NODE_ENV === "production") {
  try {
    // Dynamic import to avoid Edge Runtime issues
    newrelic = require("newrelic");
  } catch (error) {
    console.warn("Failed to initialize New Relic:", error);
  }
}

export function middleware(request: NextRequest) {
  if (!newrelic || process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const startTime = performance.now();
  const path = request.nextUrl.pathname;

  try {
    // Start the transaction
    const txnName = `API ${request.method} ${path}`;
    newrelic.setTransactionName(txnName);

    // Add custom attributes
    newrelic.addCustomAttribute("api.endpoint", path);
    newrelic.addCustomAttribute("api.service", path.split("/")[2]); // Gets 'cortex', 'nous', etc.
    newrelic.addCustomAttribute("api.method", request.method);

    // Continue with the request
    const response = NextResponse.next();

    // Add timing
    const duration = performance.now() - startTime;
    newrelic.addCustomAttribute("response.time_ms", duration);

    return response;
  } catch (error) {
    // Record error metrics
    if (error instanceof Error) {
      newrelic.noticeError(error);
    } else {
      newrelic.noticeError(new Error(String(error)));
    }

    // Always continue even if New Relic instrumentation fails
    return NextResponse.next();
  }
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    "/api/cortex/:path*",
    "/api/nous/:path*",
    "/api/keys/:path*",
    "/api/health/:path*",
    "/api/admin/:path*",
  ],
};
