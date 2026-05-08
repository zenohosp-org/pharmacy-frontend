const API_BASE = '/api/pharmacy';

export const getDrugs = async () => {
  const response = await fetch(`${API_BASE}/drugs`);
  return response.json();
};

export const importDrugs = async (drugs) => {
  const response = await fetch(`${API_BASE}/drugs/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(drugs),
  });
  return response.json();
};

export const getStock = async (drugId) => {
  const response = await fetch(`${API_BASE}/stock/${drugId}`);
  return response.json();
};

export const createCounterSale = async (payload) => {
  const response = await fetch(`${API_BASE}/dispensing/counter-sale`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
};
