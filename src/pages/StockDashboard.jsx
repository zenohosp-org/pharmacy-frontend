import { useState, useEffect } from 'react';
import { getDrugs, getAllStock, getExpiryAlerts, getReorderAlerts, getBatches } from '../api/pharmacyClient';
import PageHeader from '../components/shared/PageHeader';
import ContentLoader from '../components/shared/ContentLoader';
import Alert from '../components/shared/Alert';
import StatusBadge from '../components/shared/StatusBadge';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import './StockDashboard.css';

export default function StockDashboard() {
  const [drugs, setDrugs] = useState([]);
  const [stock, setStock] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [reorderAlerts, setReorderAlerts] = useState([]);
  const [batchDetails, setBatchDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
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

  const loadBatches = async (drug) => {
    if (batchDetails[drug.id]) return;
    try {
      const fetched = await getBatches(drug.id);
      setBatchDetails(prev => ({ ...prev, [drug.id]: fetched }));
    } catch (e) {
      console.error('Failed to fetch batches:', e);
    }
  };

  const statusBadges = (drug) => {
    const hasExpiry = isDrugInExpiryAlert(drug.id);
    const reorder = getDrugReorderAlert(drug.id);
    return (
      <div className="stock-status-cell">
        {hasExpiry && <StatusBadge tone="error">Expiring</StatusBadge>}
        {reorder && <StatusBadge tone="warning">Low Stock</StatusBadge>}
        {!hasExpiry && !reorder && <StatusBadge tone="success">OK</StatusBadge>}
      </div>
    );
  };

  const batchColumns = [
    { header: 'Batch Number', render: (_, b) => <code className="stock-batch-code">{b.batchNumber}</code> },
    { header: 'Expiry Date', render: (_, b) => new Date(b.expiryDate).toLocaleDateString() },
    { header: 'Qty', align: 'right', render: (_, b) => <strong>{b.receivedQty ? parseFloat(b.receivedQty).toFixed(2) : '—'}</strong> },
  ];

  const renderBatches = (drug) => {
    const batches = batchDetails[drug.id] || [];
    return (
      <div className="stock-batch-box">
        <div className="stock-batch-title">Batch Details</div>
        {batches.length === 0 ? (
          <p className="text-muted text-sm">No batches available</p>
        ) : (
          <Table columns={batchColumns} data={batches} />
        )}
      </div>
    );
  };

  const columns = [
    { header: 'Drug', render: (_, d) => (
      <>
        <div className="cell-strong">{d.brandName}</div>
        <div className="cell-muted">{d.genericName}</div>
      </>
    ) },
    { header: 'Total Qty', align: 'right', render: (_, d) => getStockQtyForDrug(d.id).toFixed(2) },
    { header: 'Status', align: 'center', render: (_, d) => statusBadges(d) },
  ];

  if (loading) return <ContentLoader label="Loading stock data…" />;

  return (
    <div>
      <PageHeader title="Stock Dashboard" subtitle="Monitor pharmacy inventory and stock levels" />

      {error && <Alert tone="error" className="section-gap">{error}</Alert>}

      {reorderAlerts.length > 0 && (
        <Alert tone="warning" className="section-gap">
          <strong>⚠️ {reorderAlerts.length} items need reordering</strong>
          <ul className="stock-alert-list">
            {reorderAlerts.map(a => (
              <li key={a.drugId}>{a.drugName}: {a.currentStock} / {a.reorderQty} units</li>
            ))}
          </ul>
        </Alert>
      )}

      {expiryAlerts.length > 0 && (
        <Alert tone="error" className="section-gap">
          <strong>🔴 {expiryAlerts.length} items expiring soon</strong>
          <ul className="stock-alert-list">
            {expiryAlerts.map(b => (
              <li key={b.id}>{getDrugName(b.drugId)}: Expires {new Date(b.expiryDate).toLocaleDateString()}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Card padded={false} title={`Current Stock Levels (${drugs.length})`}>
        <Table
          columns={columns}
          data={drugs}
          emptyMessage="No drugs in catalog"
          renderExpanded={renderBatches}
          onExpand={loadBatches}
        />
      </Card>
    </div>
  );
}
