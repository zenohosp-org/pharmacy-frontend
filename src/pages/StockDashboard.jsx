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
    getStockQtyForDrug, isDrugInExpiryAlert, getDrugReorderAlert, loadBatches,
  } = useStockOverview();

  const [editingBatch, setEditingBatch] = useState(null);

  const expiryPill = (d) => {
    const days = Math.ceil((new Date(d) - new Date()) / 86400000);
    const tone = days < 0 ? 'expired' : days <= 30 ? 'danger' : days <= 90 ? 'warn' : 'ok';
    const label = days < 0
      ? 'Expired'
      : new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
    return <span className={`exp-pill exp-pill--${tone}`}>{label}{days >= 0 && days <= 90 ? ` · ${days}d` : ''}</span>;
  };

  const batchColumns = [
    { header: 'Batch Number', render: (_, b) => <code className="stock-batch-code">{b.batchNumber}</code> },
    { header: 'Expiry', render: (_, b) => expiryPill(b.expiryDate) },
    { header: 'Qty', align: 'right', render: (_, b) => <strong>{b.currentUnits != null ? parseFloat(b.currentUnits).toFixed(0) : '—'}<span className="stock-unit"> u</span></strong> },
    { header: 'Strips / Loose', render: (_, b) => (
      <span className="stock-chips">
        <span className="stock-chip stock-chip--strip">{b.fullStrips ?? 0} strips</span>
        <span className="stock-chip stock-chip--loose">{b.looseUnits ?? 0} loose</span>
      </span>
    ) },
    { header: 'Rack', render: (_, b) => b.rackCode ? <span className="stock-chip stock-chip--rack">{b.rackCode}</span> : <span className="text-muted">—</span> },
    { header: '', align: 'right', render: (_, b) => (
      <Button size="sm" variant="secondary" onClick={() => setEditingBatch(b)}>Edit</Button>
    ) },
  ];

  const stockBar = (drug) => {
    const qty = getStockQtyForDrug(drug.id);
    const reorder = drug.drugReorderQty || 0;
    let tone = 'ok';
    let pct = 100;
    if (reorder > 0) {
      pct = Math.max(10, Math.min(100, (qty / (reorder * 2)) * 100));
      tone = qty < reorder ? 'danger' : qty < reorder * 1.5 ? 'warn' : 'ok';
    }
    const bucket = Math.round(pct / 10) * 10; // snap to a width class (no inline styles)
    return (
      <div className="stock-qty">
        <span className="stock-qty-val">{qty.toFixed(0)}<span className="stock-unit"> u</span></span>
        <span className="stock-meter"><span className={`stock-meter-fill stock-meter-fill--${tone} stock-w-${bucket}`} /></span>
      </div>
    );
  };

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
    { header: 'Stock Level', render: (_, d) => stockBar(d) },
    { header: 'Status', align: 'center', render: (_, d) => statusBadges(d) },
  ];

  if (loading) return <ContentLoader label="Loading stock data…" />;

  return (
    <div>
      <PageHeader title="Stock Dashboard" subtitle="Monitor pharmacy inventory and stock levels" />

      {error && <Alert tone="error" className="section-gap">{error}</Alert>}

      <StockAlertsBanner reorderAlerts={reorderAlerts} expiryAlerts={expiryAlerts} />

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
