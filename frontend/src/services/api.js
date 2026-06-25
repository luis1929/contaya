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

export const api = {
  upload: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await client.post('/documents/upload', form);
    return data;
  },
  getDocuments: async () => {
    const { data } = await client.get('/documents');
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
  getInvoices: async (params = {}) => {
    const { data } = await client.get('/invoices', { params });
    return data;
  },
  getInvoiceSummary: async (params = {}) => {
    const { data } = await client.get('/invoices/summary', { params });
    return data;
  },
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
  getBillers: async () => {
    const { data } = await client.get('/billers');
    return data;
  },
  impersonate: async (billerId) => {
    const { data } = await client.post(`/auth/impersonate/${billerId}`);
    return data;
  },
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
    return data;
  },
};
