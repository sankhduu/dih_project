/**
 * Global API configuration for backend services.
 * Defaults to '' (relative path) so that all requests hit native Next.js /api routes
 * on whatever domain the app is running (both localhost and live Vercel deployments),
 * avoiding Mixed Content (HTTP on HTTPS) and connection refused errors.
 * If NEXT_PUBLIC_API_URL is explicitly set to an external endpoint, it will use that instead.
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || ''
).replace(/\/$/, '');
