const BASE_URL = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Error ${res.status}: ${text || res.statusText}`)
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  getRecords: () => request('/records'),
  getRecord: (id) => request(`/records/${id}`),
  createRecord: (data) => request('/records', { method: 'POST', body: JSON.stringify(data) }),
  updateRecord: (id, data) => request(`/records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRecord: (id) => request(`/records/${id}`, { method: 'DELETE' }),
  getSuggestions: () => request('/suggestions')
}
