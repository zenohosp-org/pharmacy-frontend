import { useState, useEffect } from 'react';
import { getStockValuation } from '../../api/pharmacyClient';
import PageHeader from '../../components/shared/PageHeader';
import ExportButton from '../../components/shared/ExportButton';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import { inr, num } from '../../utils/format';

const columns = [
  { header: 'Drug', render: (_, r) => <span className="cell-strong">{r.drugName || '—'}</span> },
  { header: 'Batch', render: (_, r) => r.batchNumber },
  { header: 'Expiry', render: (_, r) => r.expiryDate },
  { header: 'Qty', align: 'right', render: (_, r) => num(r.qty) },
  { header: 'Cost', align: 'right', render: (_, r) => inr(r.purchaseRate) },
  { header: 'MRP', align: 'right', render: (_, r) => inr(r.mrp) },
  { header: 'Cost Value', align: 'right', render: (_, r) => <strong>{inr(r.costValue)}</strong> },
  { header: 'Retail Value', align: 'right', render: (_, r) => inr(r.retailValue) },
];

const exportCols = [
  { header: 'Drug', value: (r) => r.drugName },
  { header: 'Batch', value: (r) => r.batchNumber },
  { header: 'Expiry', value: (r) => r.expiryDate },
  { header: 'Qty', value: (r) => r.qty },
  { header: 'Cost', value: (r) => r.purchaseRate },
  { header: 'MRP', value: (r) => r.mrp },
  { header: 'Cost Value', value: (r) => r.costValue },
  { header: 'Retail Value', value: (r) => r.retailValue },
];

export default function StockValuation() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getStockValuation()
      .then((d) => { if (alive) setRows(d || []); })
      .catch(console.error)
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const sum = (key) => rows.reduce((a, r) => a + (parseFloat(r[key]) || 0), 0);

  return (
    <div>
      <PageHeader
        backTo="/pharmacy/reports"
        title="Stock Valuation"
        subtitle="On-hand stock valued at cost and MRP"
        actions={<ExportButton columns={exportCols} rows={rows} filename="stock-valuation" />}
      />

      <div className="grid grid-3 section-gap">
        <StatCard label="Cost Value" value={inr(sum('costValue'))} sub="capital in stock" icon="🏦" />
        <StatCard label="Retail Value" value={inr(sum('retailValue'))} sub="at MRP" icon="🏷️" tone="success" />
        <StatCard label="Batches" value={rows.length} sub="with stock on hand" icon="📦" />
      </div>

      <Card padded={false} title="Batches">
        <Table columns={columns} data={rows} loading={loading} emptyMessage="No stock on hand." getRowKey={(r) => r.batchId} />
      </Card>
    </div>
  );
}
