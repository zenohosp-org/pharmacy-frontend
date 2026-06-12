import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Table from '../ui/Table';
import { fmt, expiryLabel } from '../../utils/format';

// Read-only view of a rack and the stock currently stored in it, with actions
// to edit the rack or deactivate it.
export default function RackDetailModal({ open, rack, contents, onClose, onEdit, onDeactivate }) {
  if (!rack) return null;

  const columns = [
    { header: 'Medicine', render: (_, b) => (
      <div>
        <div className="cell-strong">{b.drugName || '—'}</div>
        <code className="rack-detail-batch">{b.batchNumber}</code>
      </div>
    ) },
    { header: 'Expiry', render: (_, b) => expiryLabel(b.expiryDate) },
    { header: 'Stock', align: 'right', render: (_, b) => (
      <div>
        <strong>{b.currentUnits != null ? parseFloat(b.currentUnits).toFixed(0) : '0'} u</strong>
        <div className="cell-muted">{b.fullStrips ?? 0} str + {b.looseUnits ?? 0} loose</div>
      </div>
    ) },
    { header: 'Price', align: 'right', render: (_, b) => `₹${fmt(b.sellingPrice)}` },
  ];

  const items = contents || [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Rack ${rack.code}`}
      footer={
        <>
          {rack.isActive && <Button variant="danger" onClick={() => onDeactivate(rack)}>Deactivate</Button>}
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={() => onEdit(rack)}>Edit Rack</Button>
        </>
      }
    >
      <div className="rack-detail-meta">
        {rack.name && <span>{rack.name}</span>}
        <span className={`rack-detail-tag rack-detail-tag--${rack.rackType === 'COLD' ? 'cold' : 'normal'}`}>
          {rack.rackType || 'NORMAL'}
        </span>
        {!rack.isActive && <span className="rack-detail-tag rack-detail-tag--off">Inactive</span>}
        <span className="rack-detail-count">{items.length} batch{items.length === 1 ? '' : 'es'} stored</span>
      </div>

      {items.length === 0 ? (
        <p className="text-muted">No stock stored in this rack yet. Assign a batch's rack from the Stock Dashboard.</p>
      ) : (
        <Table columns={columns} data={items} />
      )}
    </Modal>
  );
}
