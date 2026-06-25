import axios from 'axios';

const client = axios.create({ baseURL: '/api' });

client.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
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
};
