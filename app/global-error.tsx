"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-white">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: "1rem",
            padding: "1.5rem",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#0f172a" }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#64748b", maxWidth: "28rem" }}>
            An unexpected error occurred. Please refresh the page.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.625rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              borderRadius: "0.75rem",
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
