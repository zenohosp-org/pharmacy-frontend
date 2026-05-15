import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8083';
export const INVENTORY_API_URL = import.meta.env.VITE_INVENTORY_API_URL || 'http://localhost:8082';

const inventoryApi = axios.create({
  baseURL: INVENTORY_API_URL,
  withCredentials: true,
});

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      window.location.href = `${API_BASE_URL}/oauth2/authorization/directory`;
    }
    return Promise.reject(error);
  }
);

export const getMe = () => api.get('/api/user/me');

export const logout = () => api.post('/api/auth/logout');

export const getDrugs = async () => {
  const response = await api.get('/api/pharmacy/drugs');
  return response.data;
};

export const createDrug = async (drug) => {
  const response = await api.post('/api/pharmacy/drugs', drug);
  return response.data;
};

export const updateDrug = async (drugId, drug) => {
  const response = await api.put(`/api/pharmacy/drugs/${drugId}`, drug);
  return response.data;
};

export const deleteDrug = async (drugId) => {
  const response = await api.delete(`/api/pharmacy/drugs/${drugId}`);
  return response.data;
};

export const searchDrugs = async (query, schedule) => {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (schedule) params.append('schedule', schedule);
  const response = await api.get(`/api/pharmacy/drugs/search?${params}`);
  return response.data;
};

export const importDrugs = async (drugs) => {
  const response = await api.post('/api/pharmacy/drugs/import', drugs);
  return response.data;
};

export const importDrugsExcel = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/pharmacy/drugs/import-excel', formData);
  return response.data;
};

export const getVendors = async () => {
  try {
    const response = await inventoryApi.get('/api/vendors');
    return response.data;
  } catch {
    console.warn('Vendors API not available, returning empty list');
    return [];
  }
};

// Inventory API — used by pharmacy drug master to create/update/delete drugs as inventory items
export const getInventoryItemTypes = async () => {
  const response = await inventoryApi.get('/api/inventory/item-types');
  return response.data;
};

export const createInventoryItem = async (payload) => {
  const response = await inventoryApi.post('/api/inventory/items', payload);
  return response.data;
};

export const updateInventoryItem = async (id, payload) => {
  const response = await inventoryApi.put(`/api/inventory/items/${id}`, payload);
  return response.data;
};

export const deleteInventoryItem = async (id) => {
  const response = await inventoryApi.delete(`/api/inventory/items/${id}`);
  return response.data;
};

export const getStock = async (drugId) => {
  const response = await api.get(`/api/pharmacy/stock/${drugId}`);
  return response.data;
};

export const getAllStock = async () => {
  const response = await api.get('/api/pharmacy/stock');
  return response.data;
};

export const receiveStock = async (payload) => {
  const response = await api.post('/api/pharmacy/stock/receive', payload);
  return response.data;
};

export const getBatches = async (drugId) => {
  const response = await api.get(`/api/pharmacy/stock/${drugId}/batches`);
  return response.data;
};

export const getExpiryAlerts = async (days = 30) => {
  const response = await api.get(`/api/pharmacy/stock/expiry-alerts?days=${days}`);
  return response.data;
};

export const getReorderAlerts = async () => {
  const response = await api.get('/api/pharmacy/stock/reorder-alerts');
  return response.data;
};

export const createCounterSale = async (payload) => {
  const response = await api.post('/api/pharmacy/dispensing/counter-sale', payload);
  return response.data;
};

export const createCounterSaleBulk = async (payload) => {
  const response = await api.post('/api/pharmacy/dispensing/counter-sale/bulk', payload);
  return response.data;
};

export const getCounterSales = async (storeId) => {
  try {
    const response = await api.get(`/api/pharmacy/dispensing/counter-sales?storeId=${storeId}`);
    return response.data || [];
  } catch {
    console.warn('Counter sales API not available');
    return [];
  }
};

export const getDrugAlternatives = async (drugId) => {
  const response = await api.get(`/api/pharmacy/drugs/${drugId}/alternatives`);
  return response.data;
};

export const addDrugAlternative = async (drugId, alternativeDrugId, reason) => {
  const response = await api.post(`/api/pharmacy/drugs/${drugId}/alternatives`, {
    alternativeDrugId,
    reason,
  });
  return response.data;
};

// HMS integration
export const searchHmsPatients = async (query) => {
  const response = await api.get(`/api/pharmacy/hms/patients?q=${encodeURIComponent(query)}`);
  return response.data;
};

export const searchHmsDoctors = async (query) => {
  const response = await api.get(`/api/pharmacy/hms/doctors?q=${encodeURIComponent(query)}`);
  return response.data;
};

export const getPatientEncounter = async (patientId) => {
  const response = await api.get(`/api/pharmacy/hms/patients/${patientId}/encounter`);
  return response.status === 204 ? null : response.data;
};

export const createWardIssue = async (payload) => {
  const response = await api.post('/api/pharmacy/dispensing/ward-issue', payload);
  return response.data;
};
