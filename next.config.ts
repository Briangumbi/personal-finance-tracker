import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevents the app from being embedded in an iframe elsewhere —
          // blocks clickjacking (tricking a logged-in user into clicking
          // an invisible overlaid button).
          { key: "X-Frame-Options", value: "DENY" },
          // Stops the browser from guessing a response's content type from
          // its content, which can otherwise be abused to execute an
          // uploaded/returned file as script.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Sends the full referrer only same-origin; cross-origin requests
          // just get the origin, not the full path/query.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // This app never needs these browser APIs, so disable them
          // outright rather than leaving them available by default.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Vercel already forces HTTPS at the edge; this makes it
          // explicit and tells browsers to remember it.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
