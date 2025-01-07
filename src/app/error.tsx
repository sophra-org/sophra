"use client";

import { logger } from "@/lib/shared/logger";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  useEffect(() => {
    logger.error("Unhandled error in app router", {
      error: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <h2 className="mb-4 text-2xl font-bold">Something went wrong!</h2>
          <p className="mb-4 text-gray-600">
            We&apos;re working on fixing this issue.
          </p>
          <button
            onClick={() => reset()}
            className="rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
