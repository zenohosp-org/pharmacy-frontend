import { useState, useEffect } from 'react';
import { getCounterSales, getExpiryAlerts, getReorderAlerts, getDrugs } from '../api/pharmacyClient';

const lineTotal = (s) => {
  const sub = parseFloat(s.qty || 0) * parseFloat(s.rate || 0);
  return sub + sub * (parseFloat(s.gstRate || 0) / 100) - (parseFloat(s.discount) || 0);
};

// Loads dashboard data (sales + alerts + drug names) and derives today's metrics.
export default function useDashboardData() {
  const [sales, setSales] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [reorderAlerts, setReorderAlerts] = useState([]);
  const [drugMap, setDrugMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCounterSales(),
      getExpiryAlerts(30),
      getReorderAlerts(),
      getDrugs(),
    ]).then(([salesData, expiry, reorder, drugs]) => {
      setSales(salesData || []);
      setExpiryAlerts(expiry || []);
      setReorderAlerts(reorder || []);
      const map = {};
      (drugs || []).forEach(d => { map[d.id] = d.brandName; });
      setDrugMap(map);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.dispensedAt).toDateString() === today);
  const todayRevenue = todaySales.reduce((sum, s) => sum + lineTotal(s), 0);
  const drugName = (id) => drugMap[id] || id?.slice(0, 8);

  return { loading, expiryAlerts, reorderAlerts, todaySales, todayRevenue, drugName, lineTotal };
}
