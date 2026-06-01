import { useState, useEffect } from 'react';
import { getStockLedger } from '../../api/pharmacyClient';
import PageHeader from '../../components/shared/PageHeader';
import DateRangeFilter from '../../components/shared/DateRangeFilter';
import ExportButton from '../../components/shared/ExportButton';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import StatusBadge from '../../components/shared/StatusBadge';
import { num, isoDaysAgo, isoToday } from '../../utils/format';

const moveTone = (t) => (t === 'IN' || t === 'RETURN' ? 'success' : t === 'OUT' ? 'primary' : 'warning');
const dt = (s) => (s ? new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

const columns = [
  { header: 'When', render: (_, r) => dt(r.at) },
  { header: 'Drug', render: (_, r) => <span className="cell-strong">{r.drugName || '—'}</span> },
  { header: 'Batch', render: (_, r) => r.batchNumber || '—' },
  { header: 'Type', render: (_, r) => <StatusBadge tone={moveTone(r.movementType)}>{r.movementType}</StatusBadge> },
  { header: 'Qty', align: 'right', render: (_, r) => num(r.qty) },
  { header: 'Reference', render: (_, r) => r.referenceType || '—' },
  { header: 'Remarks', render: (_, r) => r.remarks || '—' },
];

const exportCols = [
  { header: 'When', value: (r) => dt(r.at) },
  { header: 'Drug', value: (r) => r.drugName },
  { header: 'Batch', value: (r) => r.batchNumber },
  { header: 'Type', value: (r) => r.movementType },
  { header: 'Qty', value: (r) => r.qty },
  { header: 'Reference', value: (r) => r.referenceType },
  { header: 'Remarks', value: (r) => r.remarks },
];

export default function StockMovement() {
  const [from, setFrom] = useState(isoDaysAgo(29));
  const [to, setTo] = useState(isoToday());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getStockLedger(from, to)
      .then((d) => { if (alive) setRows(d || []); })
      .catch(console.error)
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [from, to]);

  return (
    <div>
      <PageHeader
        backTo="/pharmacy/reports"
        title="Stock Movement Ledger"
        subtitle="Every IN / OUT / RETURN / write-off movement"
        actions={<ExportButton columns={exportCols} rows={rows} filename={`stock-movement_${from}_${to}`} />}
      />

      <DateRangeFilter from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />

      <Card padded={false} title={`${rows.length} movement(s)`}>
        <Table columns={columns} data={rows} loading={loading} emptyMessage="No movements in this period." getRowKey={(r, i) => i} />
      </Card>
    </div>
  );
}
