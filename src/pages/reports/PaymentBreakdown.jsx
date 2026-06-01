import { useState, useEffect } from 'react';
import { getSalesByPayment } from '../../api/pharmacyClient';
import PageHeader from '../../components/shared/PageHeader';
import DateRangeFilter from '../../components/shared/DateRangeFilter';
import ExportButton from '../../components/shared/ExportButton';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import StatusBadge from '../../components/shared/StatusBadge';
import { inr, isoDaysAgo, isoToday } from '../../utils/format';

const columns = [
  { header: 'Bill Type', render: (_, r) => (
    <StatusBadge tone={r.billType === 'HMS_CREDIT' ? 'primary' : 'success'}>{r.billType || 'CASH'}</StatusBadge>
  ) },
  { header: 'Payment Mode', render: (_, r) => r.paymentMode || '—' },
  { header: 'Bills', align: 'right', render: (_, r) => r.bills },
  { header: 'Total', align: 'right', render: (_, r) => <strong>{inr(r.total)}</strong> },
];

const exportCols = [
  { header: 'Bill Type', value: (r) => r.billType || 'CASH' },
  { header: 'Payment Mode', value: (r) => r.paymentMode || '' },
  { header: 'Bills', value: (r) => r.bills },
  { header: 'Total', value: (r) => r.total },
];

export default function PaymentBreakdown() {
  const [from, setFrom] = useState(isoDaysAgo(29));
  const [to, setTo] = useState(isoToday());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getSalesByPayment(from, to)
      .then((d) => { if (alive) setRows(d || []); })
      .catch(console.error)
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [from, to]);

  const credit = rows.filter((r) => r.billType === 'HMS_CREDIT').reduce((a, r) => a + (parseFloat(r.total) || 0), 0);
  const cash = rows.filter((r) => r.billType !== 'HMS_CREDIT').reduce((a, r) => a + (parseFloat(r.total) || 0), 0);

  return (
    <div>
      <PageHeader
        title="Payment Breakdown"
        subtitle="Sales split by bill type and payment mode"
        actions={<ExportButton columns={exportCols} rows={rows} filename={`payments_${from}_${to}`} />}
      />

      <DateRangeFilter from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />

      <div className="grid grid-2 section-gap">
        <StatCard label="Counter (Cash)" value={inr(cash)} sub="cash / card / UPI" icon="🛒" tone="success" />
        <StatCard label="IPD Credit" value={inr(credit)} sub="charged to encounters" icon="🏥" />
      </div>

      <Card padded={false} title="Split">
        <Table columns={columns} data={rows} loading={loading} emptyMessage="No sales in this period." getRowKey={(r, i) => i} />
      </Card>
    </div>
  );
}
