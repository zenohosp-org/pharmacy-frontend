import { useState } from 'react';
import useStockOverview from '../hooks/useStockOverview';
import PageHeader from '../components/shared/PageHeader';
import ContentLoader from '../components/shared/ContentLoader';
import Alert from '../components/shared/Alert';
import StatusBadge from '../components/shared/StatusBadge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import StockAlertsBanner from '../components/stock/StockAlertsBanner';
import BatchEditModal from '../components/stock/BatchEditModal';
import './StockDashboard.css';

export default function StockDashboard() {
  const {
    drugs, expiryAlerts, reorderAlerts, batchDetails, loading, error,
    getStockQtyForDrug, isDrugInExpiryAlert, getDrugReorderAlert, getDrugName, loadBatches,
  } = useStockOverview();

  const [editingBatch, setEditingBatch] = useState(null);

  const batchColumns = [
    { header: 'Batch Number', render: (_, b) => <code className="stock-batch-code">{b.batchNumber}</code> },
    { header: 'Expiry Date', render: (_, b) => new Date(b.expiryDate).toLocaleDateString() },
    { header: 'Qty', align: 'right', render: (_, b) => <strong>{b.currentUnits != null ? parseFloat(b.currentUnits).toFixed(2) : '—'}</strong> },
    { header: 'Strips / Loose', align: 'right', render: (_, b) => `${b.fullStrips ?? 0} str + ${b.looseUnits ?? 0} loose` },
    { header: 'Rack', render: (_, b) => b.rackCode || '—' },
    { header: '', align: 'right', render: (_, b) => (
      <Button size="sm" variant="secondary" onClick={() => setEditingBatch(b)}>Edit</Button>
    ) },
  ];

  const statusBadges = (drug) => {
    const hasExpiry = isDrugInExpiryAlert(drug.id);
    const reorder = getDrugReorderAlert(drug.id);
    return (
      <div className="stock-status-cell">
        {hasExpiry && <StatusBadge tone="error">Expiring</StatusBadge>}
        {reorder && <StatusBadge tone="warning">Low Stock</StatusBadge>}
        {!hasExpiry && !reorder && <StatusBadge tone="success">OK</StatusBadge>}
      </div>
    );
  };

  const renderBatches = (drug) => {
    const batches = batchDetails[drug.id] || [];
    return (
      <div className="stock-batch-box">
        <div className="stock-batch-title">Batch Details</div>
        {batches.length === 0 ? (
          <p className="text-muted text-sm">No batches available</p>
        ) : (
          <Table columns={batchColumns} data={batches} />
        )}
      </div>
    );
  };

  const columns = [
    { header: 'Drug', render: (_, d) => (
      <>
        <div className="cell-strong">{d.brandName}</div>
        <div className="cell-muted">{d.genericName}</div>
      </>
    ) },
    { header: 'Total Qty', align: 'right', render: (_, d) => getStockQtyForDrug(d.id).toFixed(2) },
    { header: 'Status', align: 'center', render: (_, d) => statusBadges(d) },
  ];

  if (loading) return <ContentLoader label="Loading stock data…" />;

  return (
    <div>
      <PageHeader title="Stock Dashboard" subtitle="Monitor pharmacy inventory and stock levels" />

      {error && <Alert tone="error" className="section-gap">{error}</Alert>}

      <StockAlertsBanner reorderAlerts={reorderAlerts} expiryAlerts={expiryAlerts} getDrugName={getDrugName} />

      <Card padded={false} title={`Current Stock Levels (${drugs.length})`}>
        <Table
          columns={columns}
          data={drugs}
          emptyMessage="No drugs in catalog"
          renderExpanded={renderBatches}
          onExpand={loadBatches}
        />
      </Card>

      <BatchEditModal
        open={!!editingBatch}
        batch={editingBatch}
        onClose={() => setEditingBatch(null)}
        onSaved={() => { if (editingBatch) loadBatches({ id: editingBatch.drugId }, true); }}
      />
    </div>
  );
}
