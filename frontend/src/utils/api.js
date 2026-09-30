import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions

// Categories
export const getCategories = async () => {
  const response = await apiClient.get('/categories');
  return response.data.categories;
};

export const getCategoryBySlug = async (slug) => {
  const response = await apiClient.get(`/categories/${slug}`);
  return response.data;
};

// Products
export const getProducts = async (params = {}) => {
  const response = await apiClient.get('/products', { params });
  return response.data.products;
};

export const getProductById = async (id) => {
  const response = await apiClient.get(`/products/${id}`);
  return response.data;
};

export const getFeaturedProducts = async () => {
  const response = await apiClient.get('/products', { params: { featured: true } });
  return response.data.products;
};

export const getProductsByCategory = async (category, filters = {}) => {
  const params = { category, ...filters };
  const response = await apiClient.get('/products', { params });
  return response.data.products;
};

// Testimonials
export const getTestimonials = async () => {
  const response = await apiClient.get('/testimonials');
  return response.data.testimonials;
};

// Leads/Inquiries
export const submitLead = async (leadData) => {
  const response = await apiClient.post('/leads', leadData);
  return response.data;
};

export const getLeads = async (params = {}) => {
  const response = await apiClient.get('/leads', { params });
  return response.data;
};

export const getLeadById = async (id) => {
  const response = await apiClient.get(`/leads/${id}`);
  return response.data;
};

export const assignLead = async (leadId, assignmentData) => {
  const response = await apiClient.put(`/leads/${leadId}/assign`, assignmentData);
  return response.data;
};

export const updateLeadStatus = async (leadId, status) => {
  const response = await apiClient.put(`/leads/${leadId}/status`, { status });
  return response.data;
};

export const addLeadNote = async (leadId, noteData) => {
  const response = await apiClient.post(`/leads/${leadId}/notes`, noteData);
  return response.data;
};

export const getLeadStats = async (params = {}) => {
  const response = await apiClient.get('/leads/stats/summary', { params });
  return response.data;
};

// Salespeople and their personal website links
export const PUBLIC_SITE_URL = (process.env.REACT_APP_PUBLIC_SITE_URL || 'https://hdefurniture.netlify.app').replace(/\/$/, '');

export const salespersonLink = (code) => `${PUBLIC_SITE_URL}/?ref=${encodeURIComponent(code)}`;

export const getSalespeople = async () => {
  const response = await apiClient.get('/salespeople');
  return response.data.salespeople;
};

export const getSalesperson = async (idOrCode) => {
  const response = await apiClient.get(`/salespeople/${encodeURIComponent(idOrCode)}`);
  return response.data;
};

export const createSalesperson = async (data) => {
  const response = await apiClient.post('/salespeople', data);
  return response.data;
};

export const updateSalesperson = async (id, data) => {
  const response = await apiClient.put(`/salespeople/${id}`, data);
  return response.data;
};

export default apiClient;
