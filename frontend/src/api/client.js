const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const message = errorBody.detail || errorBody.holdings || `API error: ${response.status}`
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
  }

  return response.json()
}

export const api = {
  getHealth: () => request('/health/'),
  getAssets: () => request('/assets/'),
  getDashboard: () => request('/dashboard/'),
  saveAssets: ({ domestic, foreign, cash }) =>
    request('/assets/', {
      method: 'POST',
      body: JSON.stringify({ domestic, foreign, cash }),
    }),
}
