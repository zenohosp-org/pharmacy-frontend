import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCounterSales, getExpiryAlerts, getReorderAlerts, getDrugs } from '../api/pharmacyClient';
import PageHeader from '../components/shared/PageHeader';
import ContentLoader from '../components/shared/ContentLoader';
import AlertRow from '../components/shared/AlertRow';
import StatusBadge from '../components/shared/StatusBadge';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import './Dashboard.css';

const fmt = (n) => (parseFloat(n) || 0).toFixed(2);

const QUICK_ACTIONS = [
  { label: 'Counter Sale', to: '/pharmacy/counter-sale', icon: '🛒', tone: 'success' },
  { label: 'IPD Dispensing', to: '/pharmacy/dispensing/queue', icon: '🏥', tone: 'primary' },
  { label: 'Drug Master', to: '/pharmacy/drugs', icon: '💊', tone: 'info' },
];

export default function Dashboard() {
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

  if (loading) return <ContentLoader label="Loading dashboard…" />;

  const today = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.dispensedAt).toDateString() === today);
  const todayRevenue = todaySales.reduce((sum, s) => {
    const sub = parseFloat(s.qty || 0) * parseFloat(s.rate || 0);
    return sum + sub + sub * (parseFloat(s.gstRate || 0) / 100) - (parseFloat(s.discount) || 0);
  }, 0);

  const drugName = (id) => drugMap[id] || id?.slice(0, 8);
  const lineTotal = (s) => {
    const sub = parseFloat(s.qty || 0) * parseFloat(s.rate || 0);
    return sub + sub * (parseFloat(s.gstRate || 0) / 100) - (parseFloat(s.discount) || 0);
  };

  const txColumns = [
    { header: 'Drug', render: (_, s) => <span className="font-semibold">{drugName(s.drugId)}</span> },
    { header: 'Qty', align: 'right', render: (_, s) => parseFloat(s.qty || 0) },
    { header: 'Rate', align: 'right', render: (_, s) => `₹${fmt(s.rate)}` },
    { header: 'Total', align: 'right', render: (_, s) => <span className="font-semibold">₹{fmt(lineTotal(s))}</span> },
    { header: 'Type', render: (_, s) => <StatusBadge tone={s.billType === 'HMS_CREDIT' ? 'primary' : 'success'}>{s.billType || 'CASH'}</StatusBadge> },
    { header: 'Time', render: (_, s) => <span className="text-muted text-sm">{new Date(s.dispensedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        actions={<Link to="/pharmacy/counter-sale" className="btn btn-success">+ New Sale</Link>}
      />

      {/* Stat cards */}
      <div className="grid grid-4 section-gap">
        <StatCard label="Today's Bills" value={todaySales.length} sub="dispensing records" icon="🧾" />
        <StatCard label="Today's Revenue" value={`₹${fmt(todayRevenue)}`} sub="incl. GST" icon="💰" tone="success" />
        <StatCard label="Expiry Alerts" value={expiryAlerts.length} sub="batches expiring ≤30 days" icon="⚠️" tone={expiryAlerts.length > 0 ? 'danger' : 'success'} />
        <StatCard label="Low Stock" value={reorderAlerts.length} sub="drugs below reorder level" icon="📦" tone={reorderAlerts.length > 0 ? 'warning' : 'success'} />
      </div>

      {/* Alert panels */}
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

      {/* Today's transactions */}
      <Card
        padded={false}
        className="section-gap"
        title={`Today's Transactions (${todaySales.length})`}
        action={<Link to="/pharmacy/sales-ledger" className="dash-link">Full Ledger →</Link>}
      >
        {todaySales.length === 0 ? (
          <div className="dash-empty-state">
            No sales today yet. <Link to="/pharmacy/counter-sale">Start a sale →</Link>
          </div>
        ) : (
          <Table columns={txColumns} data={todaySales.slice(0, 15)} />
        )}
      </Card>

      {/* Quick actions */}
      <div className="grid grid-3 quick-actions">
        {QUICK_ACTIONS.map(({ label, to, icon, tone }) => (
          <Link key={to} to={to} className={`quick-action quick-action--${tone}`}>
            <span className="quick-action-icon">{icon}</span>
            <span className="quick-action-label">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
