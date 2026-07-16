// Base origin for backend calls.
//
// Dev: empty string, so requests use relative paths (`/api/v1`, `/health`) and
// Vite's server.proxy forwards them to VITE_API_URL.
//
// Production: there's no dev proxy, so we prefix with VITE_API_URL (set in the
// Vercel dashboard to the public backend URL). A dashboard env var overrides the
// committed .env, keeping localhost dev-only.
export const API_ORIGIN = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
  : ''
