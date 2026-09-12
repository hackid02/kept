/** @type {import('next').NextConfig} */
const dev = process.env.NODE_ENV !== "production";
const headers = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Inline script is only the 4-line theme boot; styles are inline by Next/font. No third-party origins at all.
  // 'unsafe-eval' only in dev (React Fast Refresh needs it). Production ships without it.
  { key: "Content-Security-Policy", value: `default-src 'self'; script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'${dev ? " ws:" : ""}; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'${dev ? "" : "; upgrade-insecure-requests"}` },
];
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // og.ts reads assets/fonts/*.woff at render time via a computed path, which the file tracer can't see.
  // Declare them so the serverless bundles for the OG routes include the fonts (they 500 on Vercel otherwise).
  experimental: {
    outputFileTracingIncludes: {
      "/opengraph-image": ["./assets/fonts/*.woff"],
      "/r/[id]/opengraph-image": ["./assets/fonts/*.woff"],
    },
  },
  async headers() { return [{ source: "/(.*)", headers }]; },
};
export default nextConfig;
