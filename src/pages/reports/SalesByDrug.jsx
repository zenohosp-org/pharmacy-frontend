import { useState, useEffect } from 'react';
import { getSalesByDrug } from '../../api/pharmacyClient';
import PageHeader from '../../components/shared/PageHeader';
import DateRangeFilter from '../../components/shared/DateRangeFilter';
import ExportButton from '../../components/shared/ExportButton';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import StatusBadge from '../../components/shared/StatusBadge';
import { inr, num, isoDaysAgo, isoToday } from '../../utils/format';

const SCHEDULES = ['', 'OTC', 'H', 'H1', 'X'];

const columns = [
  { header: 'Drug', render: (_, r) => <span className="cell-strong">{r.drugName || '—'}</span> },
  { header: 'Schedule', render: (_, r) => (r.schedule ? <StatusBadge tone="gray">{r.schedule}</StatusBadge> : '—') },
  { header: 'Qty', align: 'right', render: (_, r) => num(r.qty) },
  { header: 'Revenue', align: 'right', render: (_, r) => <strong>{inr(r.revenue)}</strong> },
  { header: 'GST', align: 'right', render: (_, r) => inr(r.gst) },
  { header: 'COGS', align: 'right', render: (_, r) => inr(r.cogs) },
  { header: 'Profit', align: 'right', render: (_, r) => inr(r.grossProfit) },
  { header: 'Margin', align: 'right', render: (_, r) => `${r.marginPct}%` },
];

const exportCols = [
  { header: 'Drug', value: (r) => r.drugName },
  { header: 'Schedule', value: (r) => r.schedule },
  { header: 'Qty', value: (r) => r.qty },
  { header: 'Revenue', value: (r) => r.revenue },
  { header: 'GST', value: (r) => r.gst },
  { header: 'COGS', value: (r) => r.cogs },
  { header: 'Profit', value: (r) => r.grossProfit },
  { header: 'Margin %', value: (r) => r.marginPct },
];

export default function SalesByDrug() {
  const [from, setFrom] = useState(isoDaysAgo(29));
  const [to, setTo] = useState(isoToday());
  const [schedule, setSchedule] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getSalesByDrug(from, to, schedule)
      .then((d) => { if (alive) setRows(d || []); })
      .catch(console.error)
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [from, to, schedule]);

  const sum = (key) => rows.reduce((a, r) => a + (parseFloat(r[key]) || 0), 0);

  return (
    <div>
      <PageHeader
        title="Sales by Drug"
        subtitle="Revenue, cost and margin per drug"
        actions={<ExportButton columns={exportCols} rows={rows} filename={`sales-by-drug_${from}_${to}`} />}
      />

      <DateRangeFilter from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }}>
        <label className="drf-field">
          <span>Schedule</span>
          <select className="form-select" value={schedule} onChange={(e) => setSchedule(e.target.value)}>
            {SCHEDULES.map((s) => <option key={s} value={s}>{s || 'All'}</option>)}
          </select>
        </label>
      </DateRangeFilter>

      <div className="grid grid-3 section-gap">
        <StatCard label="Revenue" value={inr(sum('revenue'))} sub={`${rows.length} drugs`} icon="💰" tone="success" />
        <StatCard label="Gross Profit" value={inr(sum('grossProfit'))} sub="revenue − COGS" icon="📈" tone="success" />
        <StatCard label="COGS" value={inr(sum('cogs'))} sub="cost of goods sold" icon="📦" />
      </div>

      <Card padded={false} title="Drugs">
        <Table columns={columns} data={rows} loading={loading} emptyMessage="No sales in this period." getRowKey={(r) => r.drugId} />
      </Card>
    </div>
  );
}
