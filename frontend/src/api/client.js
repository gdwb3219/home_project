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
  getAssets: ({ version } = {}) => {
    const params = new URLSearchParams()
    if (version != null) params.set('version', String(version))
    const query = params.toString()
    return request(`/assets/${query ? `?${query}` : ''}`)
  },
  getSnapshotAssets: (version) => request(`/snapshots/${version}/`),
  getSnapshots: () => request('/snapshots/'),
  getDashboard: ({ version, snapshotId } = {}) => {
    const params = new URLSearchParams()
    if (version != null) params.set('version', String(version))
    if (snapshotId) params.set('snapshot_id', snapshotId)
    const query = params.toString()
    return request(`/dashboard/${query ? `?${query}` : ''}`)
  },
  saveAssets: ({ domestic, etf, foreign, cash, gold }) =>
    request('/assets/', {
      method: 'POST',
      body: JSON.stringify({ domestic, etf, foreign, cash, gold }),
    }),
  updateSnapshotAssets: (version, { domestic, etf, foreign, cash, gold, usd_krw_rate }) =>
    request(`/snapshots/${version}/`, {
      method: 'PUT',
      body: JSON.stringify({ domestic, etf, foreign, cash, gold, usd_krw_rate }),
    }),
}
