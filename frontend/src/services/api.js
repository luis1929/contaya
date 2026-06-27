import axios from 'axios';

const client = axios.create({ baseURL: '/api' });

function getToken() {
  if (localStorage.getItem('impersonating')) {
    return localStorage.getItem('impersonate_token');
  }
  return localStorage.getItem('token');
}

client.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const api = {
  // Auth
  login: async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    return data;
  },
  register: async (name, email, password) => {
    const { data } = await client.post('/auth/register', { name, email, password });
    return data;
  },
  getMe: async () => {
    const { data } = await client.get('/auth/me');
    return data;
  },
  impersonate: async (billerId) => {
    const { data } = await client.post(`/auth/impersonate/${billerId}`);
    return data;
  },
  stopImpersonating() {
    localStorage.removeItem('impersonate_token');
    localStorage.removeItem('impersonating');
  },
  isImpersonating() {
    return !!localStorage.getItem('impersonating');
  },
  getImpersonatingInfo() {
    try { return JSON.parse(localStorage.getItem('impersonating')); } catch { return null; }
  },

  // Documents (advanced)
  upload: async (file, options = {}) => {
    const form = new FormData();
    form.append('file', file);
    if (options.description) form.append('description', options.description);
    if (options.category) form.append('category', options.category);
    if (options.tags) form.append('tags', JSON.stringify(options.tags));
    const { data } = await client.post('/documents/upload', form);
    return data;
  },
  uploadMultiple: async (files) => {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    const { data } = await client.post('/documents/upload-multiple', form);
    return data;
  },
  getDocuments: async (params = {}) => {
    const { data } = await client.get('/documents', { params });
    return data;
  },
  getDocument: async (id) => {
    const { data } = await client.get(`/documents/${id}`);
    return data;
  },
  deleteDocument: async (id) => {
    const { data } = await client.delete(`/documents/${id}`);
    return data;
  },
  downloadDocument: async (id) => {
    const { data } = await client.get(`/documents/${id}/download`, { responseType: 'blob' });
    return data;
  },
  toggleFavorite: async (id, is_favorite) => {
    const { data } = await client.patch(`/documents/${id}/favorite`, { is_favorite });
    return data;
  },
  updateDocumentStatus: async (id, workflow_status) => {
    const { data } = await client.patch(`/documents/${id}/status`, { workflow_status });
    return data;
  },
  // Document notes
  addDocumentNote: async (docId, content) => {
    const { data } = await client.post(`/documents/${docId}/notes`, { content });
    return data;
  },
  getDocumentNotes: async (docId) => {
    const { data } = await client.get(`/documents/${docId}/notes`);
    return data;
  },
  // Document tags
  getTags: async () => {
    const { data } = await client.get('/documents/tags');
    return data;
  },
  createTag: async (name, color) => {
    const { data } = await client.post('/documents/tags', { name, color });
    return data;
  },
  deleteTag: async (id) => {
    const { data } = await client.delete(`/documents/tags/${id}`);
    return data;
  },

  // Invoices
  getInvoices: async (params = {}) => {
    const { data } = await client.get('/invoices', { params });
    return data;
  },
  getInvoiceSummary: async () => {
    const { data } = await client.get('/invoices/summary');
    return data;
  },

  // Billers
  getBillers: async () => {
    const { data } = await client.get('/billers');
    return data;
  },
  updateBiller: async (id, body) => {
    const { data } = await client.put(`/billers/${id}`, body);
    return data;
  },

  // Admin
  getAdminDashboard: async () => {
    const { data } = await client.get('/admin/dashboard');
    return data;
  },
  getAdminBillers: async (params = {}) => {
    const { data } = await client.get('/admin/billers', { params });
    return data;
  },
  createBiller: async (body) => {
    const { data } = await client.post('/admin/billers', body);
    return data;
  },
  updateAdminBiller: async (id, body) => {
    const { data } = await client.put(`/admin/billers/${id}`, body);
    return data;
  },
  deleteAdminBiller: async (id) => {
    const { data } = await client.delete(`/admin/billers/${id}`);
    return data;
  },
  getAuditLog: async (params = {}) => {
    const { data } = await client.get('/admin/audit-log', { params });
    return data;
  },
  getSettings: async () => {
    const { data } = await client.get('/admin/settings');
    return data;
  },
  updateSetting: async (key, value) => {
    const { data } = await client.put('/admin/settings', { key, value });
    return data;
  },
};
