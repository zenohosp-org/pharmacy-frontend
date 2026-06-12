import StatCard from '../ui/StatCard';
import { fmt } from '../../utils/format';

export default function DashboardStats({ todayCount, todayRevenue, expiryCount, lowStockCount }) {
  return (
    <div className="grid grid-4 section-gap">
      <StatCard label="Today's Bills" value={todayCount} sub="dispensing records" icon="🧾" />
      <StatCard label="Today's Revenue" value={`₹${fmt(todayRevenue)}`} sub="incl. GST" icon="💰" tone="success" />
      <StatCard label="Expiry Alerts" value={expiryCount} sub="batches expiring ≤30 days" icon="⚠️" tone={expiryCount > 0 ? 'danger' : 'success'} />
      <StatCard label="Low Stock" value={lowStockCount} sub="drugs below reorder level" icon="📦" tone={lowStockCount > 0 ? 'warning' : 'success'} />
    </div>
  );
}
