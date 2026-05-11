import { useState, useEffect } from 'react';
import { getDrugs, getAllStock, getExpiryAlerts, getReorderAlerts, getBatches } from '../api/pharmacyClient';

export default function StockDashboard() {
  const [drugs, setDrugs] = useState([]);
  const [stock, setStock] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [reorderAlerts, setReorderAlerts] = useState([]);
  const [expandedDrugId, setExpandedDrugId] = useState(null);
  const [batchDetails, setBatchDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [drugsData, stockData, expiryData, reorderData] = await Promise.all([
        getDrugs(),
        getAllStock(),
        getExpiryAlerts(30),
        getReorderAlerts()
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

  const handleExpandRow = async (drugId) => {
    if (expandedDrugId === drugId) {
      setExpandedDrugId(null);
      return;
    }

    try {
      if (!batchDetails[drugId]) {
        const batches = await getBatches(drugId);
        setBatchDetails(prev => ({
          ...prev,
          [drugId]: batches
        }));
      }
      setExpandedDrugId(drugId);
    } catch (e) {
      console.error('Failed to fetch batches:', e);
    }
  };

  const getStockQtyForDrug = (drugId) => {
    const entry = stock.find(s => s.drugId === drugId.toString() || s.drugId === drugId);
    return entry ? parseFloat(entry.totalQty) : 0;
  };

  const isDrugInExpiryAlert = (drugId) => {
    return expiryAlerts.some(b => b.drugId === drugId);
  };

  const getDrugReorderAlert = (drugId) => {
    return reorderAlerts.find(a => a.drugId === drugId);
  };

  const getDrugName = (drugId) => {
    const drug = drugs.find(d => d.id === drugId);
    return drug ? `${drug.brandName} (${drug.genericName})` : drugId;
  };

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-page)' }}>
      {/* Header */}
      <div style={{
        padding: 'var(--spacing-8)',
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-gray-200)'
      }}>
        <h1 style={{ marginBottom: 'var(--spacing-2)' }}>Stock Dashboard</h1>
        <p style={{ margin: 0, color: 'var(--color-gray-600)' }}>
          Monitor pharmacy inventory and stock levels
        </p>
      </div>

      {/* Main Content */}
      <div style={{ padding: 'var(--spacing-8)' }}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-6)' }}>
            {error}
          </div>
        )}

        {reorderAlerts.length > 0 && (
          <div className="alert alert-warning" style={{ marginBottom: 'var(--spacing-6)' }}>
            <strong>⚠️ {reorderAlerts.length} items need reordering</strong>
            <ul style={{ marginBottom: 0, marginTop: 'var(--spacing-3)', paddingLeft: '20px' }}>
              {reorderAlerts.map(alert => (
                <li key={alert.drugId}>{alert.drugName}: {alert.currentStock} / {alert.reorderQty} units</li>
              ))}
            </ul>
          </div>
        )}

        {expiryAlerts.length > 0 && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-6)' }}>
            <strong>🔴 {expiryAlerts.length} items expiring soon</strong>
            <ul style={{ marginBottom: 0, marginTop: 'var(--spacing-3)', paddingLeft: '20px' }}>
              {expiryAlerts.map(batch => (
                <li key={batch.id}>{getDrugName(batch.drugId)}: Expires {new Date(batch.expiryDate).toLocaleDateString()}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Stock Table */}
        <div className="card card-elevated">
          <div className="card-header">
            <h3 style={{ margin: 0 }}>Current Stock Levels</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Drug</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Total Qty</th>
                <th style={{ width: '160px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {drugs.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: 'var(--spacing-6)' }}>No drugs in catalog</td></tr>
              ) : (
                drugs.map(drug => {
                  const qty = getStockQtyForDrug(drug.id);
                  const hasExpiryAlert = isDrugInExpiryAlert(drug.id);
                  const reorderAlert = getDrugReorderAlert(drug.id);

                  return (
                    <tbody key={drug.id}>
                      <tr>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleExpandRow(drug.id)}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '16px',
                              color: 'var(--color-primary)',
                              padding: 0
                            }}
                          >
                            {expandedDrugId === drug.id ? '▼' : '▶'}
                          </button>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--color-gray-900)' }}>{drug.brandName}</strong>
                          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)', marginTop: 'var(--spacing-1)' }}>
                            {drug.genericName}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <strong style={{ fontSize: 'var(--fs-lg)', color: 'var(--color-gray-900)' }}>
                            {qty.toFixed(2)}
                          </strong>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
                            {hasExpiryAlert && (
                              <span className="badge badge-error">Expiring Soon</span>
                            )}
                            {reorderAlert && (
                              <span className="badge badge-warning">Low Stock</span>
                            )}
                            {!hasExpiryAlert && !reorderAlert && (
                              <span className="badge badge-success">✓ OK</span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {expandedDrugId === drug.id && batchDetails[drug.id] && (
                        <tr>
                          <td colSpan="4">
                            <div style={{ padding: 'var(--spacing-5)', backgroundColor: 'var(--color-gray-50)', borderTop: '1px solid var(--color-gray-100)' }}>
                              <h4 style={{ marginTop: 0, marginBottom: 'var(--spacing-4)' }}>Batch Details</h4>
                              {batchDetails[drug.id].length === 0 ? (
                                <p style={{ color: 'var(--color-gray-500)' }}>No batches available</p>
                              ) : (
                                <table className="table" style={{ marginBottom: 0 }}>
                                  <thead>
                                    <tr>
                                      <th>Batch No</th>
                                      <th>Expiry Date</th>
                                      <th style={{ textAlign: 'right' }}>Qty</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {batchDetails[drug.id].map(batch => (
                                      <tr key={batch.id}>
                                        <td><code style={{ backgroundColor: 'var(--color-gray-100)', padding: '2px 6px', borderRadius: 'var(--radius-md)' }}>{batch.batchNumber}</code></td>
                                        <td>{new Date(batch.expiryDate).toLocaleDateString()}</td>
                                        <td style={{ textAlign: 'right' }}>
                                          {batch.receivedQty ? parseFloat(batch.receivedQty).toFixed(2) : '—'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
