// Frontend API client for LUMEN Backend
const API_ = import.meta.env.VITE_API_URL || '/api/lumen';

function getToken(): string | null {
  return localStorage.getItem('lumen_token');
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function fetchApi(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_URL}${path}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `Erreur HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Response is not JSON (e.g. HTML error page from proxy)
        const text = await response.text().catch(() => '');
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          errorMessage = `Le serveur API a retourné une page HTML (status ${response.status}). Vérifiez que le backend est démarré sur le port 9000.`;
        } else if (text) {
          errorMessage = text;
        }
      }
      throw new ApiError(errorMessage, response.status);
    }

    return response.json();
  } catch (error: unknown) {
    if (error instanceof ApiError) throw error;

    // Network errors (fetch threw)
    const err = error as Error;
    if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      throw new ApiError(
        `Impossible de contacter le serveur API (${API_URL}).\n` +
        `Vérifiez que :\n` +
        `1. Le backend est démarré (cd backend && npm run dev)\n` +
        `2. Le proxy Vite est configuré (vite.config.ts)\n` +
        `3. En Docker, utilisez docker-compose up`,
        0
      );
    }
    throw new ApiError(err.message || 'Erreur réseau inconnue', 0);
  }
}

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, password: string, email?: string) =>
    fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    }),

  getMe: () => fetchApi('/auth/me'),
  updateMe: (data: Partial<Record<string, unknown>>) =>
    fetchApi('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// Sites
export const sitesApi = {
  getAll: () => fetchApi('/sites'),
  getById: (id: string) => fetchApi(`/sites/${id}`),
  create: (data: Record<string, unknown>) =>
    fetchApi('/sites', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Record<string, unknown>) =>
    fetchApi(`/sites/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getScadaEnabled: () => fetchApi('/sites/scada/enabled'),
  verifyScada: (serialNumber: string, password: string) =>
    fetchApi('/sites/scada/verify', {
      method: 'POST',
      body: JSON.stringify({ serial_number: serialNumber, password }),
    }),
  updateScadaStatus: (id: string, status: string) =>
    fetchApi(`/sites/${id}/scada/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  updateScadaConfig: (id: string, data: Record<string, unknown>) =>
    fetchApi(`/sites/${id}/scada/config`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// Monitoring
export const monitoringApi = {
  getBySite: (siteId: string, limit?: number, offset?: number) =>
    fetchApi(`/monitoring/site/${siteId}?limit=${limit || 100}&offset=${offset || 0}`),
  getLatest: (siteId: string) => fetchApi(`/monitoring/site/${siteId}/latest`),
  create: (data: Record<string, unknown>) =>
    fetchApi('/monitoring', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getSummary: (siteId: string, period?: string) =>
    fetchApi(`/monitoring/summary/${siteId}?period=${period || '24h'}`),
};
