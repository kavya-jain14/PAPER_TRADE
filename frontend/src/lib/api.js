export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

let refreshPromise = null;

const asUrl = (path) => path.startsWith('http://') || path.startsWith('https://')
  ? path
  : `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;

const isAuthOperation = (url) => /\/api\/auth\/(login|register|verify-email|resend-verification|googlelogin|refresh)/.test(url);

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST', credentials: 'include', headers: { 'X-PaperTrade-Client': 'web' },
    }).finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export async function apiFetch(path, options = {}, retry = true) {
  const url = asUrl(path);
  const method = String(options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});
  if (!['GET', 'HEAD'].includes(method)) headers.set('X-PaperTrade-Client', 'web');
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetch(url, { ...options, method, headers, credentials: 'include' });
  if (response.status !== 401 || !retry || isAuthOperation(url)) return response;
  const refreshed = await refreshSession();
  if (!refreshed.ok) return response;
  return apiFetch(path, options, false);
}

export async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { message: 'Unexpected server response.' }; }
}

export async function hasActiveSession(signal) {
  try {
    const response = await apiFetch('/api/auth/getuser', { signal });
    return response.ok;
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    return false;
  }
}
