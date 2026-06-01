import { useState, useEffect } from 'react';
import { getNearExpiry } from '../../api/pharmacyClient';
import PageHeader from '../../components/shared/PageHeader';
import ExportButton from '../../components/shared/ExportButton';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import StatusBadge from '../../components/shared/StatusBadge';
import { inr, num } from '../../utils/format';

const expiryTone = (days) => (days <= 30 ? 'error' : days <= 60 ? 'warning' : 'gray');

const columns = [
  { header: 'Drug', render: (_, r) => <span className="cell-strong">{r.drugName || '—'}</span> },
  { header: 'Batch', render: (_, r) => r.batchNumber },
  { header: 'Expiry', render: (_, r) => r.expiryDate },
  { header: 'Days', align: 'right', render: (_, r) => (
    <StatusBadge tone={expiryTone(r.daysToExpiry)}>{r.daysToExpiry < 0 ? 'expired' : `${r.daysToExpiry}d`}</StatusBadge>
  ) },
  { header: 'Qty', align: 'right', render: (_, r) => num(r.qty) },
  { header: 'Value at Risk', align: 'right', render: (_, r) => <strong>{inr(r.costValue)}</strong> },
];

const exportCols = [
  { header: 'Drug', value: (r) => r.drugName },
  { header: 'Batch', value: (r) => r.batchNumber },
  { header: 'Expiry', value: (r) => r.expiryDate },
  { header: 'Days To Expiry', value: (r) => r.daysToExpiry },
  { header: 'Qty', value: (r) => r.qty },
  { header: 'Value at Risk', value: (r) => r.costValue },
];

export default function NearExpiry() {
  const [days, setDays] = useState(90);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getNearExpiry(days)
      .then((d) => { if (alive) setRows(d || []); })
      .catch(console.error)
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [days]);

  const valueAtRisk = rows.reduce((a, r) => a + (parseFloat(r.costValue) || 0), 0);

  return (
    <div>
      <PageHeader
        title="Near-Expiry"
        subtitle="Batches expiring soon, with value at risk"
        actions={<ExportButton columns={exportCols} rows={rows} filename={`near-expiry_${days}d`} />}
      />

      <div className="date-range-filter">
        <label className="drf-field">
          <span>Window</span>
          <select className="form-select" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[30, 60, 90, 180].map((n) => <option key={n} value={n}>{n} days</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-2 section-gap">
        <StatCard label="Value at Risk" value={inr(valueAtRisk)} sub={`expiring ≤ ${days} days`} icon="⏰" tone="danger" />
        <StatCard label="Batches" value={rows.length} sub="near expiry" icon="📦" tone="warning" />
      </div>

      <Card padded={false} title="Batches">
        <Table columns={columns} data={rows} loading={loading} emptyMessage="No batches expiring in this window." getRowKey={(r) => r.batchId} />
      </Card>
    </div>
  );
}
