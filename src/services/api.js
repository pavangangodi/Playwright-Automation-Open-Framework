async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.payload = data;
    throw error;
  }
  return data;
}

export const api = {
  health: () => request('/health'),
  quotePolicy: (draft) => request('/policies/quote', { method: 'POST', body: JSON.stringify(draft) }),
  bindPolicy: (quoteNumber) => request(`/policies/${quoteNumber}/bind`, { method: 'POST' }),
  forms: (quoteNumber) => request(`/policies/${quoteNumber}/forms`),
  searchPolicies: (query) => request(`/policies/search?q=${encodeURIComponent(query)}`),
  previewRating: (draft) => request('/rating/preview', { method: 'POST', body: JSON.stringify(draft) }),
  businessRules: () => request('/business-rules'),
  updateBusinessRule: (id, active) =>
    request(`/business-rules/${id}`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  ratingConfig: () => request('/rating-config')
};
