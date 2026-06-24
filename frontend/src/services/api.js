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
  getInvoices: async () => {
    const { data } = await client.get('/invoices');
    return data;
  },
  getInvoiceSummary: async () => {
    const { data } = await client.get('/invoices/summary');
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
};
