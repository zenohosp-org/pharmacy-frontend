import { useState, useEffect } from 'react';
import { getTopSellers } from '../../api/pharmacyClient';
import PageHeader from '../../components/shared/PageHeader';
import DateRangeFilter from '../../components/shared/DateRangeFilter';
import ExportButton from '../../components/shared/ExportButton';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import StatusBadge from '../../components/shared/StatusBadge';
import { inr, num, isoDaysAgo, isoToday } from '../../utils/format';

const columns = [
  { header: '#', align: 'right', render: (_, r, ) => r.__rank },
  { header: 'Drug', render: (_, r) => <span className="cell-strong">{r.drugName || '—'}</span> },
  { header: 'Schedule', render: (_, r) => (r.schedule ? <StatusBadge tone="gray">{r.schedule}</StatusBadge> : '—') },
  { header: 'Qty', align: 'right', render: (_, r) => num(r.qty) },
  { header: 'Revenue', align: 'right', render: (_, r) => <strong>{inr(r.revenue)}</strong> },
  { header: 'Profit', align: 'right', render: (_, r) => inr(r.grossProfit) },
];

const exportCols = [
  { header: 'Rank', value: (r) => r.__rank },
  { header: 'Drug', value: (r) => r.drugName },
  { header: 'Qty', value: (r) => r.qty },
  { header: 'Revenue', value: (r) => r.revenue },
  { header: 'Profit', value: (r) => r.grossProfit },
];

export default function TopSellers() {
  const [from, setFrom] = useState(isoDaysAgo(29));
  const [to, setTo] = useState(isoToday());
  const [by, setBy] = useState('value');
  const [limit, setLimit] = useState(10);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getTopSellers(from, to, limit, by)
      .then((d) => { if (alive) setRows((d || []).map((r, i) => ({ ...r, __rank: i + 1 }))); })
      .catch(console.error)
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [from, to, by, limit]);

  return (
    <div>
      <PageHeader
        backTo="/pharmacy/reports"
        title="Top Sellers"
        subtitle="Best-selling drugs for the period"
        actions={<ExportButton columns={exportCols} rows={rows} filename={`top-sellers_${from}_${to}`} />}
      />

      <DateRangeFilter from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }}>
        <label className="drf-field">
          <span>Rank by</span>
          <select className="form-select" value={by} onChange={(e) => setBy(e.target.value)}>
            <option value="value">Revenue</option>
            <option value="qty">Quantity</option>
          </select>
        </label>
        <label className="drf-field">
          <span>Top</span>
          <select className="form-select" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </DateRangeFilter>

      <Card padded={false} title={`Top ${limit} by ${by === 'qty' ? 'quantity' : 'revenue'}`}>
        <Table columns={columns} data={rows} loading={loading} emptyMessage="No sales in this period." getRowKey={(r) => r.drugId} />
      </Card>
    </div>
  );
}
