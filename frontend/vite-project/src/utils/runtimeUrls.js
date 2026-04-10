const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

const isBrowser = typeof window !== 'undefined';

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
  const raw = import.meta.env.VITE_API_URL || '/api';
  return normalizeRuntimeUrl(raw);
};

export const getSocketBaseUrl = () => {
  const raw =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    'http://127.0.0.1:5001';
  return normalizeRuntimeUrl(raw);
};
