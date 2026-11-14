import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Isolated local verification must not interrupt an existing developer server.
  distDir: process.env.NEXORA_ISOLATED_DEV === "1" ? ".next-qa" : ".next",
  poweredByHeader: false,
  // Development resources and HMR are proxied through the managed HTTPS preview.
  allowedDevOrigins: ["localhost", "127.0.0.1", ...(process.env.MANUS_PROJECT_ID ? ["*.manus.computer"] : [])],
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    const isDevelopment = process.env.NODE_ENV === "development";
    // Managed Preview is embedded over HTTPS. Standalone deployments keep anti-framing protection.
    const managedPreview = Boolean(process.env.MANUS_PROJECT_ID);
    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
          "script-src-attr 'none'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https://d36hbw14aib5lz.cloudfront.net https://files.manuscdn.com",
          "font-src 'self' data:",
          `connect-src 'self'${isDevelopment ? " ws: wss:" : ""}`,
          "frame-src 'none'",
          "media-src 'self' blob:",
          "worker-src 'self' blob:",
          "manifest-src 'self'",
          ...(managedPreview ? [] : ["frame-ancestors 'none'"]),
          "base-uri 'self'",
          "form-action 'self'",
          "object-src 'none'",
          "upgrade-insecure-requests",
        ].join("; "),
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      ...(!managedPreview ? [{
        key: "X-Frame-Options",
        value: "DENY",
      }] : []),
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()",
      },
      {
        key: "Cross-Origin-Opener-Policy",
        value: "same-origin",
      },
      {
        key: "Cross-Origin-Resource-Policy",
        value: "same-origin",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ];

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
