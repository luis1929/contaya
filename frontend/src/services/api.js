import axios from 'axios';

const client = axios.create({ baseURL: '/api' });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    
    // Add impersonation headers
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.impersonating && user.biller_id) {
      config.headers['X-Impersonation-Id'] = user.biller_id;
      config.headers['X-Impersonator-Id'] = user.impersonatedBy || user.impersonated_by;
    }
  }
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
<<<<<<< HEAD
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
=======
>>>>>>> 1d55fded9ff5433180cb1a5257998ca0df7ef5ec
  getInvoices: async (params = {}) => {
    const { data } = await client.get('/invoices', { params });
    return data;
  },
  getInvoiceSummary: async (params = {}) => {
    const { data } = await client.get('/invoices/summary', { params });
    return data;
  },
<<<<<<< HEAD

  // Billers
=======
  register: async (name, email, password) => {
    const { data } = await client.post('/auth/register', { name, email, password });
    return data;
  },
  login: async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    return data;
  },
  getMe: async () => {
    const { data } = await client.get('/auth/me');
    return data;
  },
  getCompany: async () => {
    const { data } = await client.get('/company');
    return data;
  },
  updateCompany: async (company) => {
    const { data } = await client.put('/company', company);
    return data;
  },
  getClients: async () => {
    const { data } = await client.get('/clients');
    return data;
  },
  changePassword: async (currentPassword, newPassword) => {
    const { data } = await client.post('/auth/change-password', { currentPassword, newPassword });
    return data;
  },
>>>>>>> 1d55fded9ff5433180cb1a5257998ca0df7ef5ec
  getBillers: async () => {
    const { data } = await client.get('/billers');
    return data;
  },
  updateBiller: async (id, body) => {
    const { data } = await client.put(`/billers/${id}`, body);
    return data;
  },
<<<<<<< HEAD

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
=======
  updateBiller: async (id, payload) => {
    const { data } = await client.put(`/billers/${id}`, payload);
    return data;
  },
  deleteBiller: async (id) => {
    const { data } = await client.delete(`/billers/${id}`);
    return data;
  },
  createBiller: async (payload) => {
    const { data } = await client.post('/billers', payload);
    return data;
  },
  createClient: async (payload) => {
    const { data } = await client.post('/clients', payload);
    return data;
  },
  updateClient: async (id, payload) => {
    const { data } = await client.put(`/clients/${id}`, payload);
    return data;
  },
  deleteClient: async (id) => {
    const { data } = await client.delete(`/clients/${id}`);
    return data;
  },
  createInvoice: async (payload) => {
    const { data } = await client.post('/invoices', payload);
    return data;
  },
  updateInvoice: async (id, payload) => {
    const { data } = await client.put(`/invoices/${id}`, payload);
    return data;
  },
  deleteInvoice: async (id) => {
    const { data } = await client.delete(`/invoices/${id}`);
    return data;
  },
  getDeclarations: async (params = {}) => {
    const { data } = await client.get('/declarations', { params });
    return data;
  },
  getDeclarationsSummary: async (params = {}) => {
    const { data } = await client.get('/declarations/summary', { params });
    return data;
  },
  createDeclaration: async (payload) => {
    const { data } = await client.post('/declarations', payload);
    return data;
  },
  updateDeclaration: async (id, payload) => {
    const { data } = await client.put(`/declarations/${id}`, payload);
    return data;
  },
  deleteDeclaration: async (id) => {
    const { data } = await client.delete(`/declarations/${id}`);
    return data;
  },
  resetPassword: async (email, password) => {
    const { data } = await client.post('/auth/reset-password', { email, password });
>>>>>>> 1d55fded9ff5433180cb1a5257998ca0df7ef5ec
    return data;
  },
};
