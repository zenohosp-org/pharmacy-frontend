import Alert from '../shared/Alert';

// Reorder + near-expiry alert banners shown above the stock table.
export default function StockAlertsBanner({ reorderAlerts, expiryAlerts, getDrugName }) {
  return (
    <>
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
    </>
  );
}
