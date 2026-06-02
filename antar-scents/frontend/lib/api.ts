import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('antar_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('antar_token');
      localStorage.removeItem('antar_user');
    }
    return Promise.reject(err);
  }
);

export default api;

export const productsApi = {
  getAll: (params?: Record<string, string | number>) => api.get('/api/products', { params }),
  getBySlug: (slug: string) => api.get(`/api/products/${slug}`),
  create: (data: Record<string, unknown>) => api.post('/api/products', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/api/products/${id}`, data),
  delete: (id: string) => api.delete(`/api/products/${id}`),
  importCsv: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/products/import-csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  importUrl: (url: string) => api.post('/api/products/import-url', { url }),
};

export const categoriesApi = {
  getAll: () => api.get('/api/categories'),
  getAllAdmin: () => api.get('/api/categories/all'),
  create: (data: { name: string; slug: string; sort_order?: number; active?: boolean }) => api.post('/api/categories', data),
  update: (id: string, data: Partial<{ name: string; slug: string; sort_order: number; active: boolean }>) => api.put(`/api/categories/${id}`, data),
  delete: (id: string) => api.delete(`/api/categories/${id}`),
};

export const ordersApi = {
  create: (data: Record<string, unknown>) => api.post('/api/orders', data),
  getAll: (params?: Record<string, string | number>) => api.get('/api/orders', { params }),
  getById: (id: string) => api.get(`/api/orders/${id}`),
  track: (order_number: string, phone: string) => api.get('/api/orders/track', { params: { order_number, phone } }),
  updateStatus: (id: string, order_status: string, admin_notes?: string) => api.put(`/api/orders/${id}/status`, { order_status, admin_notes }),
  markPaid: (id: string) => api.put(`/api/orders/${id}/payment-status`),
  submitMpesaCode: (id: string, mpesa_code: string) => api.post(`/api/orders/${id}/mpesa-code`, { mpesa_code }),
};

export const authApi = {
  register: (data: Record<string, string>) => api.post('/api/auth/register', data),
  login: (email: string, password: string) => api.post('/api/auth/login', { email, password }),
  me: () => api.get('/api/auth/me'),
  changePassword: (current_password: string, new_password: string) => api.post('/api/auth/change-password', { current_password, new_password }),
  resendVerification: () => api.post('/api/auth/resend-verification'),
};

export const settingsApi = {
  getAll: () => api.get('/api/settings'),
  update: (key: string, value: string) => api.put(`/api/settings/${key}`, { value }),
};

export const paymentsApi = {
  stkPush: (phone: string, amount: number, order_id: string) => api.post('/api/payments/mpesa/stk-push', { phone, amount, order_id }),
  initPaystack: (email: string, amount: number, order_id: string) => api.post('/api/payments/paystack/initialize', { email, amount, order_id }),
  verifyPaystack: (reference: string) => api.get(`/api/payments/paystack/verify/${reference}`),
};

export const adminApi = {
  getDashboard: () => api.get('/api/admin/dashboard'),
  getFinances: (from?: string, to?: string) => api.get('/api/admin/finances', { params: { from, to } }),
  getCustomers: (params?: Record<string, string | number>) => api.get('/api/admin/customers', { params }),
};

export const recommendationsApi = {
  get: (product_id: string, user_id?: string, session_id?: string, limit = 8) => api.get('/api/recommendations', { params: { product_id, user_id, session_id, limit } }),
};

export const favouritesApi = {
  getAll: () => api.get('/api/favourites'),
  add: (product_id: string) => api.post('/api/favourites', { product_id }),
  remove: (product_id: string) => api.delete(`/api/favourites/${product_id}`),
};
