const API_BASE_URL = (import.meta.env?.VITE_API_URL || 'https://web-production-6e1d8.up.railway.app/api').replace(/\/$/, '');
const ERROR_LOG_URL = `${API_BASE_URL}/system/log-error/`;

export interface CatalogErrorInput {
  message: string;
  action: string;
  reason?: string;
  stack?: string;
  status_code?: number;
  request_method?: string;
  request_path?: string;
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export const restaurantTokenFromPath = (pathname: string, search = '') => {
  const token = pathname.split('/').filter(Boolean)[0] || '';
  const candidate = /^(terms|privacy)$/i.test(token)
    ? new URLSearchParams(search).get('restaurant') || ''
    : token;
  return /^[a-z0-9_-]{1,100}$/i.test(candidate) ? candidate : '';
};

const resolveUrl = (input: RequestInfo | URL) => new URL(
  input instanceof Request ? input.url : input.toString(),
  typeof window === 'undefined' ? 'http://localhost' : window.location.origin,
);

export const shouldReportCatalogResponse = (input: RequestInfo | URL, status: number) => {
  if (status < 400) return false;
  const url = resolveUrl(input);
  const api = resolveUrl(API_BASE_URL);
  const log = resolveUrl(ERROR_LOG_URL);
  return url.origin === api.origin
    && url.pathname.startsWith(`${api.pathname.replace(/\/$/, '')}/`)
    && url.pathname.replace(/\/$/, '') !== log.pathname.replace(/\/$/, '');
};

export async function reportCatalogError(error: CatalogErrorInput, nativeFetch: FetchLike = globalThis.fetch.bind(globalThis)) {
  try {
    await nativeFetch(ERROR_LOG_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        ...error,
        source: 'frontend',
        application: 'catalog',
        company_token: restaurantTokenFromPath(window.location.pathname, window.location.search),
        date: new Date().toISOString(),
      }),
    });
  } catch {
    // O cardapio continua funcionando mesmo se a telemetria falhar.
  }
}

export function createCatalogFetch(nativeFetch: FetchLike, reporter: (error: CatalogErrorInput) => unknown = error => reportCatalogError(error, nativeFetch)): FetchLike {
  return async (input, init) => {
    const method = init?.method || (input instanceof Request ? input.method : 'GET');
    const url = resolveUrl(input);
    try {
      const response = await nativeFetch(input, init);
      if (shouldReportCatalogResponse(input, response.status)) {
        void response.clone().json().catch(() => ({})).then((data: Record<string, unknown>) => reporter({
          action: `${method.toUpperCase()} ${url.pathname}`,
          message: `HTTP ${response.status} no cardápio`,
          reason: [data.detail, data.reason, data.code, data.error].filter(value => typeof value === 'string').join(' | '),
          status_code: response.status,
          request_method: method,
          request_path: url.pathname,
        })).catch(() => undefined);
      }
      return response;
    } catch (error) {
      void reporter({
        action: `${method.toUpperCase()} ${url.pathname}`,
        message: 'Falha de rede no cardápio.',
        reason: error instanceof Error ? error.message : 'network_error',
        stack: error instanceof Error ? error.stack : '',
        request_method: method,
        request_path: url.pathname,
      });
      throw error;
    }
  };
}

export function installCatalogErrorReporting() {
  window.fetch = createCatalogFetch(window.fetch.bind(window));
  window.addEventListener('error', event => void reportCatalogError({ action: 'window_error', message: event.message, reason: event.error?.name, stack: event.error?.stack }));
  window.addEventListener('unhandledrejection', event => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason || 'Promise rejeitada'));
    void reportCatalogError({ action: 'unhandled_promise_rejection', message: error.message, reason: error.name, stack: error.stack });
  });
}
