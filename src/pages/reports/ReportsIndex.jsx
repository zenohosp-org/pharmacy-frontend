import { Link } from 'react-router-dom';
import PageHeader from '../../components/shared/PageHeader';
import './reports.css';

const CATEGORIES = [
  {
    title: 'Sales',
    reports: [
      { to: 'sales-summary', icon: '📊', title: 'Daily Sales Summary', desc: 'Per-day bills, GST, payment & cash-vs-credit split' },
      { to: 'sales-by-drug', icon: '💊', title: 'Sales by Drug', desc: 'Qty, revenue, GST, COGS & margin per drug' },
      { to: 'payments', icon: '💳', title: 'Payment Breakdown', desc: 'Cash / Card / UPI / IPD-credit split' },
      { to: 'top-sellers', icon: '🏆', title: 'Top Sellers', desc: 'Best-selling drugs by value or quantity' },
    ],
  },
  {
    title: 'Drug-specific',
    reports: [
      { to: 'drug-history', icon: '📈', title: 'Drug Sales History', desc: 'Monthly sales trend for a single drug' },
    ],
  },
  {
    title: 'Inventory',
    reports: [
      { to: 'stock-valuation', icon: '🏦', title: 'Stock Valuation', desc: 'On-hand qty × cost and × MRP, with totals' },
      { to: 'near-expiry', icon: '⏰', title: 'Near-Expiry', desc: 'Batches expiring soon + value-at-risk' },
      { to: 'stock-movement', icon: '🔄', title: 'Stock Movement Ledger', desc: 'IN / OUT / RETURN / write-off history' },
      { to: 'dead-stock', icon: '🪦', title: 'Dead Stock', desc: 'Stock on hand with no recent sale' },
    ],
  },
];

export default function ReportsIndex() {
  return (
    <div>
      <PageHeader title="Reports" subtitle="Sales, drug-specific and inventory reports" />
      {CATEGORIES.map((cat) => (
        <div key={cat.title} className="report-cat">
          <h2 className="report-cat-title">{cat.title}</h2>
          <div className="grid grid-3">
            {cat.reports.map((r) => (
              <Link key={r.to} to={r.to} className="report-card">
                <span className="report-card-icon">{r.icon}</span>
                <div>
                  <div className="report-card-title">{r.title}</div>
                  <div className="report-card-desc">{r.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
