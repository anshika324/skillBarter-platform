const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

const isBrowser = typeof window !== 'undefined';
const isVercelHost = () => isBrowser && window.location.hostname.endsWith('.vercel.app');

const shouldUpgradeToHttps = (hostname) => {
  if (!isBrowser) return false;
  return window.location.protocol === 'https:' && !LOCAL_HOSTS.has(hostname);
};

export const normalizeRuntimeUrl = (value) => {
  if (!value) return value;
  if (value.startsWith('/')) return value;

  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'http:' && shouldUpgradeToHttps(parsed.hostname)) {
      parsed.protocol = 'https:';
    }
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return value;
  }
};

export const getApiBaseUrl = () => {
  // On Vercel, prefer same-origin API proxy to avoid client-side DNS issues on some networks.
  if (isVercelHost()) {
    return '/api';
  }

  const raw = import.meta.env.VITE_API_URL || '/api';
  const normalized = normalizeRuntimeUrl(raw);

  // If a full backend origin is provided without an API path, default to `/api`.
  // This prevents common deployment misconfigurations.
  if (normalized && !normalized.startsWith('/')) {
    try {
      const parsed = new URL(normalized);
      if (!parsed.pathname || parsed.pathname === '/') {
        parsed.pathname = '/api';
        return parsed.toString().replace(/\/$/, '');
      }
    } catch {
      return normalized;
    }
  }

  return normalized;
};

export const getSocketBaseUrl = () => {
  const raw =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    'http://127.0.0.1:5001';
  return normalizeRuntimeUrl(raw);
};
