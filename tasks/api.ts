// Frontend API client for LUMEN Backend
const API_URL = import.meta.env.VITE_API_URL || '/api/lumen';

function getToken(): string | null {
  return localStorage.getItem('lumen_token');
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

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
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
