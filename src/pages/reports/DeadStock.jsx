import { useState, useEffect } from 'react';
import { getDeadStock } from '../../api/pharmacyClient';
import PageHeader from '../../components/shared/PageHeader';
import ExportButton from '../../components/shared/ExportButton';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import { inr, num } from '../../utils/format';

const dt = (s) => (s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : 'Never');

const columns = [
  { header: 'Drug', render: (_, r) => <span className="cell-strong">{r.drugName || '—'}</span> },
  { header: 'Batch', render: (_, r) => r.batchNumber },
  { header: 'Qty', align: 'right', render: (_, r) => num(r.qty) },
  { header: 'Cost Value', align: 'right', render: (_, r) => <strong>{inr(r.costValue)}</strong> },
  { header: 'Last Sale', render: (_, r) => dt(r.lastSaleAt) },
];

const exportCols = [
  { header: 'Drug', value: (r) => r.drugName },
  { header: 'Batch', value: (r) => r.batchNumber },
  { header: 'Qty', value: (r) => r.qty },
  { header: 'Cost Value', value: (r) => r.costValue },
  { header: 'Last Sale', value: (r) => dt(r.lastSaleAt) },
];

export default function DeadStock() {
  const [days, setDays] = useState(90);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getDeadStock(days)
      .then((d) => { if (alive) setRows(d || []); })
      .catch(console.error)
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [days]);

  const lockedValue = rows.reduce((a, r) => a + (parseFloat(r.costValue) || 0), 0);

  return (
    <div>
      <PageHeader
        title="Dead Stock"
        subtitle="Stock on hand with no sale in the chosen window"
        actions={<ExportButton columns={exportCols} rows={rows} filename={`dead-stock_${days}d`} />}
      />

      <div className="date-range-filter">
        <label className="drf-field">
          <span>No sale in</span>
          <select className="form-select" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[30, 60, 90, 180, 365].map((n) => <option key={n} value={n}>{n} days</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-2 section-gap">
        <StatCard label="Capital Locked" value={inr(lockedValue)} sub="in non-moving stock" icon="🪦" tone="danger" />
        <StatCard label="Batches" value={rows.length} sub="non-moving" icon="📦" tone="warning" />
      </div>

      <Card padded={false} title="Non-moving batches">
        <Table columns={columns} data={rows} loading={loading} emptyMessage="No dead stock 🎉" getRowKey={(r) => r.batchId} />
      </Card>
    </div>
  );
}
