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
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>Stock Dashboard</h1>
        <p>Monitor pharmacy inventory</p>
      </div>

      {error && <div style={{ padding: '12px', color: 'white', backgroundColor: '#d32f2f', marginBottom: '16px', borderRadius: '4px' }}>{error}</div>}

      {reorderAlerts.length > 0 && (
        <div style={{ marginBottom: '24px', padding: '12px', backgroundColor: '#fff3e0', border: '1px solid #ffe0b2', borderRadius: '4px' }}>
          <strong>{reorderAlerts.length} items need reordering</strong>
          <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
            {reorderAlerts.map(alert => (
              <li key={alert.drugId}>{alert.drugName}: {alert.currentStock} / {alert.reorderQty} units</li>
            ))}
          </ul>
        </div>
      )}

      {expiryAlerts.length > 0 && (
        <div style={{ marginBottom: '24px', padding: '12px', backgroundColor: '#ffebee', border: '1px solid #ffcdd2', borderRadius: '4px' }}>
          <strong>{expiryAlerts.length} items expiring soon</strong>
          <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
            {expiryAlerts.map(batch => (
              <li key={batch.id}>{getDrugName(batch.drugId)}: Expires {new Date(batch.expiryDate).toLocaleDateString()}</li>
            ))}
          </ul>
        </div>
      )}

      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '14px' }}>
        <thead style={{ backgroundColor: '#f5f5f5' }}>
          <tr>
            <th style={{ width: '40px' }}></th>
            <th>Drug</th>
            <th style={{ width: '100px' }}>Total Qty</th>
            <th style={{ width: '150px' }}>Alerts</th>
          </tr>
        </thead>
        <tbody>
          {drugs.length === 0 ? (
            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '16px' }}>No drugs in catalog</td></tr>
          ) : (
            drugs.map(drug => {
              const qty = getStockQtyForDrug(drug.id);
              const hasExpiryAlert = isDrugInExpiryAlert(drug.id);
              const reorderAlert = getDrugReorderAlert(drug.id);

              return (
                <tbody key={drug.id}>
                  <tr>
                    <td style={{ textAlign: 'center', cursor: 'pointer' }}>
                      <button
                        onClick={() => handleExpandRow(drug.id)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                      >
                        {expandedDrugId === drug.id ? '▼' : '▶'}
                      </button>
                    </td>
                    <td>
                      <strong>{drug.brandName}</strong>
                      <br />
                      <span style={{ fontSize: '12px', color: '#666' }}>{drug.genericName}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}><strong>{qty.toFixed(2)}</strong></td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {hasExpiryAlert && (
                          <span style={{
                            padding: '2px 8px',
                            backgroundColor: '#F44336',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            Expiring Soon
                          </span>
                        )}
                        {reorderAlert && (
                          <span style={{
                            padding: '2px 8px',
                            backgroundColor: '#FF9800',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            Low Stock
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>

                  {expandedDrugId === drug.id && batchDetails[drug.id] && (
                    <tr>
                      <td colSpan="4">
                        <div style={{ padding: '12px', backgroundColor: '#f9f9f9' }}>
                          <h4 style={{ marginTop: 0 }}>Batch Details</h4>
                          {batchDetails[drug.id].length === 0 ? (
                            <p>No batches available</p>
                          ) : (
                            <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px' }}>
                              <thead style={{ backgroundColor: '#e0e0e0' }}>
                                <tr>
                                  <th>Batch No</th>
                                  <th>Expiry Date</th>
                                  <th style={{ textAlign: 'right' }}>Qty</th>
                                </tr>
                              </thead>
                              <tbody>
                                {batchDetails[drug.id].map(batch => (
                                  <tr key={batch.id}>
                                    <td>{batch.batchNumber}</td>
                                    <td>{new Date(batch.expiryDate).toLocaleDateString()}</td>
                                    <td style={{ textAlign: 'right' }}>
                                      {batch.receivedQty ? parseFloat(batch.receivedQty).toFixed(2) : '?'}
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
  );
}
