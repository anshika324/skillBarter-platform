const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length'
]);

const normalizeOrigin = (value) => (value || '').trim().replace(/\/$/, '');

const appendQueryParams = (targetUrl, query) => {
  Object.entries(query || {}).forEach(([key, value]) => {
    if (key === 'path' || value == null) return;

    if (Array.isArray(value)) {
      value.forEach((item) => targetUrl.searchParams.append(key, String(item)));
      return;
    }

    targetUrl.searchParams.append(key, String(value));
  });
};

const copyRequestHeaders = (headers = {}) => {
  const outgoing = {};
  Object.entries(headers).forEach(([key, value]) => {
    if (!value) return;
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) return;

    outgoing[key] = value;
  });
  return outgoing;
};

module.exports = async function handler(req, res) {
  try {
    const rawPath = req.query?.path;
    const segments = Array.isArray(rawPath) ? rawPath : rawPath ? [rawPath] : [];

    const backendOrigin = normalizeOrigin(
      process.env.BACKEND_ORIGIN ||
      process.env.RAILWAY_BACKEND_ORIGIN ||
      process.env.VITE_BACKEND_URL ||
      'https://skillbarter-platform-production.up.railway.app'
    );

    const encodedPath = segments.map((segment) => encodeURIComponent(String(segment))).join('/');
    const targetUrl = new URL(`${backendOrigin}/api/${encodedPath}`);
    appendQueryParams(targetUrl, req.query);

    const headers = copyRequestHeaders(req.headers);
    let body;

    if (!['GET', 'HEAD'].includes(req.method)) {
      if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
        body = req.body;
      } else if (req.body != null && Object.keys(req.body).length > 0) {
        body = JSON.stringify(req.body);
        if (!headers['content-type'] && !headers['Content-Type']) {
          headers['content-type'] = 'application/json';
        }
      }
    }

    const upstream = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      body,
      redirect: 'manual'
    });

    res.status(upstream.status);

    upstream.headers.forEach((value, key) => {
      if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) return;
      res.setHeader(key, value);
    });

    const responseText = await upstream.text();
    res.send(responseText);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(502).json({ message: 'Proxy request failed' });
  }
};
