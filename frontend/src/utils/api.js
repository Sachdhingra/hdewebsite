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

export const getLeadStats = async () => {
  const response = await apiClient.get('/leads/stats/summary');
  return response.data;
};

export default apiClient;
