import Card from '../ui/Card';
import Button from '../ui/Button';
import { fmt, expiryLabel } from '../../utils/format';

// The "pending" drug row in IPD dispensing — batch select + qty + GST + add.
export default function PendingDrugRow({ pending, pendingBatches, onChange, onAdd, onClear }) {
  if (!pending) return null;
  const set = (patch) => onChange({ ...pending, ...patch });

  return (
    <Card className="section-gap">
      <div className="dp-pending">
        <div>
          <div className="dp-field-label">Drug</div>
          <div className="dp-pending-name">{pending.drugName}</div>
          {pendingBatches.length > 1 && (
            <select
              value={pending.batch?.id ?? ''}
              onChange={e => set({ batch: pendingBatches.find(x => x.id === e.target.value) })}
              className="form-select dp-input"
            >
              {pendingBatches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber} · {expiryLabel(b.expiryDate)} · ₹{fmt(b.sellingPrice)}
                </option>
              ))}
            </select>
          )}
          {pendingBatches.length === 1 && (
            <div className="dp-pending-batch">
              Batch {pending.batch?.batchNumber} · exp {expiryLabel(pending.batch?.expiryDate)}
            </div>
          )}
        </div>
        <div>
          <div className="dp-field-label">Qty</div>
          <input type="number" min="1" value={pending.qty} autoFocus
            onChange={e => set({ qty: parseFloat(e.target.value) || 0 })}
            className="form-input dp-input" />
        </div>
        <div>
          <div className="dp-field-label">GST %</div>
          <input type="number" min="0" value={pending.gstRate}
            onChange={e => set({ gstRate: parseFloat(e.target.value) || 0 })}
            className="form-input dp-input" />
        </div>
        <div>
          <div className="dp-field-label">Rate</div>
          <div className="dp-rate">₹{fmt(pending.batch?.sellingPrice)}</div>
        </div>
        <div className="dp-pending-actions">
          <Button variant="success" size="sm" onClick={onAdd} disabled={!pending.batch || !(pending.qty > 0)}>Add</Button>
          <Button variant="secondary" size="sm" onClick={onClear}>×</Button>
        </div>
      </div>
    </Card>
  );
}
