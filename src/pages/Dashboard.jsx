import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCounterSales, getExpiryAlerts, getReorderAlerts, getDrugs } from '../api/pharmacyClient';

const fmt = (n) => (parseFloat(n) || 0).toFixed(2);

function StatCard({ label, value, sub, color = '#16a34a', icon }) {
  return (
    <div className="card card-elevated" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--color-gray-400)', marginTop: 4 }}>{sub}</div>}
        </div>
        <span style={{ fontSize: 28 }}>{icon}</span>
      </div>
    </div>
  );
}

function AlertRow({ children, type = 'error' }) {
  const bg = type === 'error' ? '#fef2f2' : '#fffbeb';
  const border = type === 'error' ? '#fca5a5' : '#fde68a';
  return (
    <div style={{ padding: '8px 12px', borderRadius: 6, background: bg, border: `1px solid ${border}`, marginBottom: 6, fontSize: 13 }}>
      {children}
    </div>
  );
}

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
      getDrugs()
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

  const today = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.dispensedAt).toDateString() === today);
  const todayRevenue = todaySales.reduce((sum, s) => {
    const sub = parseFloat(s.qty || 0) * parseFloat(s.rate || 0);
    return sum + sub + sub * (parseFloat(s.gstRate || 0) / 100) - (parseFloat(s.discount) || 0);
  }, 0);

  const drugName = (id) => drugMap[id] || id?.slice(0, 8);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-page)' }}>
        <p style={{ color: 'var(--color-gray-400)' }}>Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-page)' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', background: 'var(--color-white)', borderBottom: '1px solid var(--color-gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20 }}>Dashboard</h1>
          <p style={{ margin: 0, color: 'var(--color-gray-500)', fontSize: 13 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <Link to="/pharmacy/counter-sale" className="btn btn-success" style={{ fontWeight: 700 }}>+ New Sale</Link>
      </div>

      <div style={{ padding: '20px 24px' }}>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard label="Today's Bills" value={todaySales.length} sub="dispensing records" icon="🧾" color="var(--color-gray-900)" />
          <StatCard label="Today's Revenue" value={`₹${fmt(todayRevenue)}`} sub="incl. GST" icon="💰" color="#16a34a" />
          <StatCard label="Expiry Alerts" value={expiryAlerts.length} sub="batches expiring ≤30 days" icon="⚠️" color={expiryAlerts.length > 0 ? '#dc2626' : '#16a34a'} />
          <StatCard label="Low Stock" value={reorderAlerts.length} sub="drugs below reorder level" icon="📦" color={reorderAlerts.length > 0 ? '#d97706' : '#16a34a'} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

          {/* Expiry Alerts */}
          <div className="card card-elevated">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 14 }}>Expiry Alerts <span style={{ color: '#dc2626' }}>({expiryAlerts.length})</span></h3>
              <Link to="/pharmacy/stock" style={{ fontSize: 12, color: 'var(--color-primary)' }}>View Stock →</Link>
            </div>
            <div className="card-body" style={{ padding: '12px 16px', maxHeight: 260, overflowY: 'auto' }}>
              {expiryAlerts.length === 0 ? (
                <p style={{ fontSize: 13, color: '#16a34a', margin: 0 }}>No batches expiring within 30 days</p>
              ) : expiryAlerts.slice(0, 10).map(b => (
                <AlertRow key={b.id} type="error">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>{drugName(b.drugId)}</span>
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>
                      Exp {new Date(b.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Batch {b.batchNumber}</div>
                </AlertRow>
              ))}
              {expiryAlerts.length > 10 && <p style={{ fontSize: 12, color: 'var(--color-gray-400)', margin: '8px 0 0' }}>+{expiryAlerts.length - 10} more</p>}
            </div>
          </div>

          {/* Reorder Alerts */}
          <div className="card card-elevated">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 14 }}>Low Stock <span style={{ color: '#d97706' }}>({reorderAlerts.length})</span></h3>
            </div>
            <div className="card-body" style={{ padding: '12px 16px', maxHeight: 260, overflowY: 'auto' }}>
              {reorderAlerts.length === 0 ? (
                <p style={{ fontSize: 13, color: '#16a34a', margin: 0 }}>All drugs adequately stocked</p>
              ) : reorderAlerts.map((a, i) => (
                <AlertRow key={i} type="warning">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{a.drugName || drugName(a.drugId)}</span>
                    <span style={{ color: '#92400e', fontWeight: 700, fontSize: 12 }}>
                      {parseFloat(a.currentStock || 0).toFixed(0)} / {parseFloat(a.reorderQty || 0).toFixed(0)} units
                    </span>
                  </div>
                </AlertRow>
              ))}
            </div>
          </div>
        </div>

        {/* Today's transactions */}
        <div className="card card-elevated">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 14 }}>Today's Transactions ({todaySales.length})</h3>
            <Link to="/pharmacy/sales-ledger" style={{ fontSize: 12, color: 'var(--color-primary)' }}>Full Ledger →</Link>
          </div>
          {todaySales.length === 0 ? (
            <div className="card-body" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-gray-400)', fontSize: 13 }}>
              No sales today yet. <Link to="/pharmacy/counter-sale">Start a sale →</Link>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Drug</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Rate</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th>Type</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {todaySales.slice(0, 15).map(s => {
                  const sub = parseFloat(s.qty || 0) * parseFloat(s.rate || 0);
                  const gst = sub * (parseFloat(s.gstRate || 0) / 100);
                  const total = sub + gst - (parseFloat(s.discount) || 0);
                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500 }}>{drugName(s.drugId)}</td>
                      <td style={{ textAlign: 'right' }}>{parseFloat(s.qty || 0)}</td>
                      <td style={{ textAlign: 'right' }}>₹{fmt(s.rate)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{fmt(total)}</td>
                      <td>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                          background: s.billType === 'HMS_CREDIT' ? '#eff6ff' : '#f0fdf4',
                          color: s.billType === 'HMS_CREDIT' ? '#1d4ed8' : '#166534'
                        }}>
                          {s.billType || 'CASH'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--color-gray-400)' }}>{new Date(s.dispensedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
          {[
            { label: 'Counter Sale', to: '/pharmacy/counter-sale', icon: '🛒', color: '#16a34a' },
            { label: 'Ward Dispensing', to: '/pharmacy/dispensing/queue', icon: '🏥', color: '#1d4ed8' },
            { label: 'Drug Master', to: '/pharmacy/drugs', icon: '💊', color: '#7c3aed' },
          ].map(({ label, to, icon, color }) => (
            <Link key={to} to={to} style={{
              padding: '16px', borderRadius: 10, textDecoration: 'none',
              background: 'var(--color-white)', border: `1px solid ${color}30`,
              display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: '0 1px 4px rgba(0,0,0,.06)', transition: 'box-shadow .15s'
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.12)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.06)'}
            >
              <span style={{ fontSize: 22 }}>{icon}</span>
              <span style={{ fontWeight: 600, fontSize: 13, color }}>{label}</span>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
