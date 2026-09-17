/**
 * Global API configuration for backend services.
 * In a browser on a live website (any non-localhost domain like Vercel),
 * it will NEVER attempt to call http://localhost:5000, even if NEXT_PUBLIC_API_URL
 * was set in Vercel environment variables, avoiding 'Failed to fetch' errors.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local');

    if (!isLocalhost) {
      const configured = (process.env.NEXT_PUBLIC_API_URL || '').trim();
      // If configured points to localhost or is empty, use native relative Next.js API routes ('')
      if (!configured || configured.includes('localhost') || configured.includes('127.0.0.1')) {
        return '';
      }
      return configured.replace(/\/$/, '');
    }
  }

  const raw = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  if (!raw || raw.includes('localhost') || raw.includes('127.0.0.1')) {
    return '';
  }
  return raw.replace(/\/$/, '');
}

export const API_BASE_URL = getApiBaseUrl();

