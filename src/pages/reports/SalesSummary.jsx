import { useState, useEffect } from 'react';
import { getSalesSummary } from '../../api/pharmacyClient';
import PageHeader from '../../components/shared/PageHeader';
import DateRangeFilter from '../../components/shared/DateRangeFilter';
import ExportButton from '../../components/shared/ExportButton';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import { inr, isoDaysAgo, isoToday } from '../../utils/format';

const columns = [
  { header: 'Date', render: (_, r) => r.date },
  { header: 'Bills', align: 'right', render: (_, r) => r.bills },
  { header: 'Taxable', align: 'right', render: (_, r) => inr(r.taxable) },
  { header: 'GST', align: 'right', render: (_, r) => inr(r.gst) },
  { header: 'Discount', align: 'right', render: (_, r) => inr(r.discount) },
  { header: 'Total', align: 'right', render: (_, r) => <strong>{inr(r.total)}</strong> },
  { header: 'Cash', align: 'right', render: (_, r) => inr(r.cash) },
  { header: 'Card', align: 'right', render: (_, r) => inr(r.card) },
  { header: 'UPI', align: 'right', render: (_, r) => inr(r.upi) },
  { header: 'Credit', align: 'right', render: (_, r) => inr(r.creditSales) },
];

const exportCols = [
  { header: 'Date', value: (r) => r.date },
  { header: 'Bills', value: (r) => r.bills },
  { header: 'Taxable', value: (r) => r.taxable },
  { header: 'GST', value: (r) => r.gst },
  { header: 'Discount', value: (r) => r.discount },
  { header: 'Total', value: (r) => r.total },
  { header: 'Cash', value: (r) => r.cash },
  { header: 'Card', value: (r) => r.card },
  { header: 'UPI', value: (r) => r.upi },
  { header: 'Credit', value: (r) => r.creditSales },
];

export default function SalesSummary() {
  const [from, setFrom] = useState(isoDaysAgo(29));
  const [to, setTo] = useState(isoToday());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getSalesSummary(from, to)
      .then((d) => { if (alive) setRows(d || []); })
      .catch(console.error)
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [from, to]);

  const sum = (key) => rows.reduce((a, r) => a + (parseFloat(r[key]) || 0), 0);
  const totalBills = rows.reduce((a, r) => a + (r.bills || 0), 0);

  return (
    <div>
      <PageHeader
        backTo="/pharmacy/reports"
        title="Daily Sales Summary"
        subtitle="Per-day sales, GST and payment breakdown"
        actions={<ExportButton columns={exportCols} rows={rows} filename={`sales-summary_${from}_${to}`} />}
      />

      <DateRangeFilter from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />

      <div className="grid grid-4 section-gap">
        <StatCard label="Total Sales" value={inr(sum('total'))} sub={`${rows.length} day(s)`} icon="📊" tone="success" />
        <StatCard label="GST Collected" value={inr(sum('gst'))} sub="output tax" icon="📋" tone="warning" />
        <StatCard label="Bills" value={totalBills} sub="invoices" icon="🧾" />
        <StatCard label="IPD Credit" value={inr(sum('creditSales'))} sub="charged to encounters" icon="🏥" />
      </div>

      <Card padded={false} title="By day">
        <Table columns={columns} data={rows} loading={loading} emptyMessage="No sales in this period." getRowKey={(r) => r.date} />
      </Card>
    </div>
  );
}
