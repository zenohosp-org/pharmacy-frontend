import { useState, useEffect } from 'react';
import { getDrugs, getAllStock, getExpiryAlerts, getReorderAlerts, getBatches } from '../api/pharmacyClient';

// Stock dashboard data + per-drug lookups + lazy batch loading.
export default function useStockOverview() {
  const [drugs, setDrugs] = useState([]);
  const [stock, setStock] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [reorderAlerts, setReorderAlerts] = useState([]);
  const [batchDetails, setBatchDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [drugsData, stockData, expiryData, reorderData] = await Promise.all([
          getDrugs(),
          getAllStock(),
          getExpiryAlerts(30),
          getReorderAlerts(),
        ]);
        setDrugs(drugsData);
        setStock(stockData);
        setExpiryAlerts(expiryData);
        setReorderAlerts(reorderData);
        setError(null);
      } catch (e) {
        setError('Failed to load stock data');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStockQtyForDrug = (drugId) => {
    const entry = stock.find(s => s.drugId === drugId.toString() || s.drugId === drugId);
    return entry ? parseFloat(entry.totalQty) : 0;
  };
  const isDrugInExpiryAlert = (drugId) => expiryAlerts.some(b => b.drugId === drugId);
  const getDrugReorderAlert = (drugId) => reorderAlerts.find(a => a.drugId === drugId);
  const getDrugName = (drugId) => {
    const drug = drugs.find(d => d.id === drugId);
    return drug ? `${drug.brandName} (${drug.genericName})` : drugId;
  };

  const loadBatches = async (drug, force = false) => {
    if (!force && batchDetails[drug.id]) return;
    try {
      const fetched = await getBatches(drug.id);
      setBatchDetails(prev => ({ ...prev, [drug.id]: fetched }));
    } catch (e) {
      console.error('Failed to fetch batches:', e);
    }
  };

  return {
    drugs, expiryAlerts, reorderAlerts, batchDetails, loading, error,
    getStockQtyForDrug, isDrugInExpiryAlert, getDrugReorderAlert, getDrugName, loadBatches,
  };
}
