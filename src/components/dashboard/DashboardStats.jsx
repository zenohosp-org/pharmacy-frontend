import { Receipt, Wallet, AlertTriangle, PackageX } from 'lucide-react';
import StatCard from '../ui/StatCard';
import { fmt } from '../../utils/format';

export default function DashboardStats({ todayCount, todayRevenue, expiryCount, lowStockCount }) {
  return (
    <div className="grid grid-4 section-gap">
      <StatCard label="Today's Bills" countTo={todayCount} sub="dispensing records" icon={<Receipt size={22} />} />
      <StatCard label="Today's Revenue" countTo={todayRevenue} format={(n) => `₹${fmt(n)}`} sub="incl. GST" tone="success" icon={<Wallet size={22} />} />
      <StatCard label="Expiry Alerts" countTo={expiryCount} sub="batches expiring ≤30 days" tone={expiryCount > 0 ? 'danger' : 'success'} icon={<AlertTriangle size={22} />} />
      <StatCard label="Low Stock" countTo={lowStockCount} sub="drugs below reorder level" tone={lowStockCount > 0 ? 'warning' : 'success'} icon={<PackageX size={22} />} />
    </div>
  );
}
