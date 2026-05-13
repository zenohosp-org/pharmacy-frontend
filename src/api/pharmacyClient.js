const API_BASE = 'http://localhost:8083/api/pharmacy';

export const getDrugs = async () => {
  const response = await fetch(`${API_BASE}/drugs`);
  if (!response.ok) throw new Error('Failed to fetch drugs');
  return response.json();
};

export const createDrug = async (drug) => {
  const response = await fetch(`${API_BASE}/drugs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(drug),
  });
  if (!response.ok) throw new Error('Failed to create drug');
  return response.json();
};

export const updateDrug = async (drugId, drug) => {
  const response = await fetch(`${API_BASE}/drugs/${drugId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(drug),
  });
  if (!response.ok) throw new Error('Failed to update drug');
  return response.json();
};

export const deleteDrug = async (drugId) => {
  const response = await fetch(`${API_BASE}/drugs/${drugId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete drug');
  return response.ok;
};

export const searchDrugs = async (query, schedule) => {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (schedule) params.append('schedule', schedule);
  const response = await fetch(`${API_BASE}/drugs/search?${params}`);
  if (!response.ok) throw new Error('Failed to search drugs');
  return response.json();
};

export const importDrugs = async (drugs) => {
  const response = await fetch(`${API_BASE}/drugs/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(drugs),
  });
  if (!response.ok) throw new Error('Failed to import drugs');
  return response.json();
};

export const importDrugsExcel = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE}/drugs/import-excel`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Failed to import Excel file');
  return response.json();
};

export const getVendors = async () => {
  try {
    const response = await fetch('https://api-inventory.zenohosp.com/api/vendors');
    if (!response.ok) throw new Error('Failed to fetch vendors');
    return response.json();
  } catch (e) {
    console.warn('Vendors API not available, returning empty list');
    return [];
  }
};

export const getStock = async (drugId) => {
  const response = await fetch(`${API_BASE}/stock/${drugId}`);
  if (!response.ok) throw new Error('Failed to fetch stock');
  return response.json();
};

export const getAllStock = async () => {
  const response = await fetch(`${API_BASE}/stock`);
  if (!response.ok) throw new Error('Failed to fetch all stock');
  return response.json();
};

export const receiveStock = async (payload) => {
  const response = await fetch(`${API_BASE}/stock/receive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to receive stock');
  return response.json();
};

export const getBatches = async (drugId) => {
  const response = await fetch(`${API_BASE}/stock/${drugId}/batches`);
  if (!response.ok) throw new Error('Failed to fetch batches');
  return response.json();
};

export const getExpiryAlerts = async (days = 30) => {
  const response = await fetch(`${API_BASE}/stock/expiry-alerts?days=${days}`);
  if (!response.ok) throw new Error('Failed to fetch expiry alerts');
  return response.json();
};

export const getReorderAlerts = async () => {
  const response = await fetch(`${API_BASE}/stock/reorder-alerts`);
  if (!response.ok) throw new Error('Failed to fetch reorder alerts');
  return response.json();
};

export const createCounterSale = async (payload) => {
  const response = await fetch(`${API_BASE}/dispensing/counter-sale`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to create counter sale');
  return response.json();
};

export const createCounterSaleBulk = async (payload) => {
  const response = await fetch(`${API_BASE}/dispensing/counter-sale/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to create bulk counter sale');
  return response.json();
};

export const getCounterSales = async (storeId) => {
  try {
    const response = await fetch(`${API_BASE}/dispensing/counter-sales?storeId=${storeId}`);
    if (response.ok) {
      return response.json();
    }
  } catch (e) {
    console.warn('Counter sales API not available');
  }
  return [];
};

export const getDrugAlternatives = async (drugId) => {
  const response = await fetch(`${API_BASE}/drugs/${drugId}/alternatives`);
  if (!response.ok) throw new Error('Failed to fetch alternatives');
  return response.json();
};

export const addDrugAlternative = async (drugId, alternativeDrugId, reason) => {
  const response = await fetch(`${API_BASE}/drugs/${drugId}/alternatives`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alternativeDrugId, reason }),
  });
  if (!response.ok) throw new Error('Failed to add alternative');
  return response.json();
};
