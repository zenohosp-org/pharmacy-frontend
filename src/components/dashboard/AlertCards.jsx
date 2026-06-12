import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import AlertRow from '../shared/AlertRow';

// Side-by-side expiry + low-stock alert panels.
export default function AlertCards({ expiryAlerts, reorderAlerts, drugName }) {
  return (
    <div className="grid grid-2 grid-gap-lg section-gap">
      <Card
        padded={false}
        title={<>Expiry Alerts <span className="dash-count-error">({expiryAlerts.length})</span></>}
        action={<Link to="/pharmacy/stock" className="dash-link">View Stock →</Link>}
      >
        <div className="dash-alert-list">
          {expiryAlerts.length === 0 ? (
            <p className="dash-empty">No batches expiring within 30 days</p>
          ) : expiryAlerts.slice(0, 10).map(b => (
            <AlertRow key={b.id} tone="error">
              <div className="alert-row-line">
                <span className="alert-row-name">{drugName(b.drugId)}</span>
                <span className="alert-row-value alert-row-value--error">
                  Exp {new Date(b.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                </span>
              </div>
              <div className="alert-row-meta">Batch {b.batchNumber}</div>
            </AlertRow>
          ))}
          {expiryAlerts.length > 10 && <p className="dash-more">+{expiryAlerts.length - 10} more</p>}
        </div>
      </Card>

      <Card
        padded={false}
        title={<>Low Stock <span className="dash-count-warning">({reorderAlerts.length})</span></>}
      >
        <div className="dash-alert-list">
          {reorderAlerts.length === 0 ? (
            <p className="dash-empty">All drugs adequately stocked</p>
          ) : reorderAlerts.map((a, i) => (
            <AlertRow key={i} tone="warning">
              <div className="alert-row-line">
                <span className="alert-row-name">{a.drugName || drugName(a.drugId)}</span>
                <span className="alert-row-value alert-row-value--warning">
                  {parseFloat(a.currentStock || 0).toFixed(0)} / {parseFloat(a.reorderQty || 0).toFixed(0)} units
                </span>
              </div>
            </AlertRow>
          ))}
        </div>
      </Card>
    </div>
  );
}
