/**
 * Global API configuration for backend services.
 * Uses NEXT_PUBLIC_API_URL if defined, otherwise defaults to http://localhost:5000.
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');
