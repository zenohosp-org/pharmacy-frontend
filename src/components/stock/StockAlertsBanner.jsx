import { useState } from 'react';
import { AlertTriangle, AlertCircle, ChevronRight } from 'lucide-react';
import './StockAlertsBanner.css';

const daysUntil = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);

const expirySeverity = (days) => {
  if (days < 0) return { tone: 'expired', label: 'expired' };
  if (days <= 7) return { tone: 'critical', label: 'critical' };
  if (days <= 30) return { tone: 'warning', label: 'warning' };
  return { tone: 'soon', label: 'soon' };
};

const reorderSeverity = (stock, reorder) => {
  if (stock <= 0) return { tone: 'expired', label: 'out of stock' };
  const ratio = reorder > 0 ? stock / reorder : 1;
  if (ratio < 0.5) return { tone: 'critical', label: 'critical' };
  return { tone: 'warning', label: 'low' };
};

// One collapsible summary card: header (icon · label · count) toggles a detail list.
function AlertCard({ tone, icon: Icon, label, count, children }) {
  const [open, setOpen] = useState(false);
  if (count === 0) return null;
  return (
    <div className={`sa-card sa-card--${tone}`}>
      <button className="sa-card-head" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="sa-card-icon"><Icon size={18} /></span>
        <span className="sa-card-label">{label}</span>
        <span className="sa-card-count">{count}</span>
        <ChevronRight size={16} className={`sa-chevron ${open ? 'is-open' : ''}`} />
      </button>
      {open && <div className="sa-card-detail">{children}</div>}
    </div>
  );
}

// Reorder + near-expiry summary cards shown above the stock table.
export default function StockAlertsBanner({ reorderAlerts, expiryAlerts }) {
  if (reorderAlerts.length === 0 && expiryAlerts.length === 0) return null;

  const sortedReorder = [...reorderAlerts].sort(
    (a, b) => (a.currentStock / (a.reorderQty || 1)) - (b.currentStock / (b.reorderQty || 1))
  );
  const sortedExpiry = [...expiryAlerts].sort(
    (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)
  );

  return (
    <div className="sa-grid section-gap">
      <AlertCard tone="warning" icon={AlertTriangle} label="Low stock" count={reorderAlerts.length}>
        {sortedReorder.map(a => {
          const sev = reorderSeverity(Number(a.currentStock), a.reorderQty);
          return (
            <div className="sa-row" key={a.drugId}>
              <span className="sa-row-name">{a.drugName}</span>
              <span className="sa-row-meta">{Number(a.currentStock).toFixed(0)} / {a.reorderQty} u</span>
              <span className={`sa-pill sa-pill--${sev.tone}`}>{sev.label}</span>
            </div>
          );
        })}
      </AlertCard>

      <AlertCard tone="danger" icon={AlertCircle} label="Expiring soon" count={expiryAlerts.length}>
        {sortedExpiry.map(b => {
          const days = daysUntil(b.expiryDate);
          const sev = expirySeverity(days);
          return (
            <div className="sa-row" key={b.id}>
              <span className="sa-row-name">{b.drugName || 'Unknown drug'}</span>
              <span className="sa-row-meta">{days < 0 ? 'expired' : `in ${days}d`}</span>
              <span className={`sa-pill sa-pill--${sev.tone}`}>{sev.label}</span>
            </div>
          );
        })}
      </AlertCard>
    </div>
  );
}
