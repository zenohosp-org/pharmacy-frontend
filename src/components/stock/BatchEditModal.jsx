import { useState, useEffect } from 'react';
import { updateBatch, getRacks, getDefaultStoreId } from '../../api/pharmacyClient';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Alert from '../shared/Alert';

const toDateInput = (d) => (d ? String(d).slice(0, 10) : '');
const num = (v) => (v !== '' && v !== null && v !== undefined ? Number(v) : null);

// Edit a stock batch. Scalar fields update the batch directly; changing "New Qty"
// writes an ADJUST ledger entry (delta vs current). Owns its form state.
export default function BatchEditModal({ open, batch, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [racks, setRacks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!open || !batch) return;
    setForm({
      batchNumber: batch.batchNumber || '',
      expiryDate: toDateInput(batch.expiryDate),
      mrp: batch.mrp ?? '',
      purchaseRate: batch.purchaseRate ?? '',
      sellingPrice: batch.sellingPrice ?? '',
      rackId: batch.rackId || '',
      newQty: batch.currentUnits ?? '',
    });
    setFormError(null);
    (async () => {
      try {
        const sid = await getDefaultStoreId();
        setRacks(await getRacks(sid));
      } catch (e) {
        console.error('Failed to load racks', e);
      }
    })();
  }, [open, batch]);

  const setField = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        batchNumber: form.batchNumber.trim(),
        expiryDate: form.expiryDate || null,
        mrp: num(form.mrp),
        purchaseRate: num(form.purchaseRate),
        sellingPrice: num(form.sellingPrice),
        rackId: form.rackId || null,
        newQty: num(form.newQty),
        adjustRemarks: 'Manual batch edit',
      };
      await updateBatch(batch.id, payload);
      onSaved();
      onClose();
    } catch (err) {
      setFormError('Failed to save batch: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (!batch) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Batch"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="batch-form" disabled={saving}>{saving ? 'Saving…' : 'Save Batch'}</Button>
        </>
      }
    >
      {formError && <Alert tone="error" className="section-gap">{formError}</Alert>}
      <form id="batch-form" onSubmit={handleSubmit}>
        <div className="modal-form-row">
          <Input label="Batch Number" value={form.batchNumber} onChange={setField('batchNumber')} maxLength={100} />
          <Input label="Expiry Date" type="date" value={form.expiryDate} onChange={setField('expiryDate')} />
        </div>
        <div className="modal-form-row">
          <Input label="MRP" type="number" step="0.01" min="0" value={form.mrp} onChange={setField('mrp')} />
          <Input label="Purchase Rate" type="number" step="0.01" min="0" value={form.purchaseRate} onChange={setField('purchaseRate')} />
          <Input label="Selling Price" type="number" step="0.01" min="0" value={form.sellingPrice} onChange={setField('sellingPrice')} />
        </div>
        <div className="modal-form-row">
          <Select label="Rack" value={form.rackId} onChange={setField('rackId')}>
            <option value="">— Unassigned —</option>
            {racks.map(r => (
              <option key={r.id} value={r.id}>{r.code}{r.name ? ` · ${r.name}` : ''}</option>
            ))}
          </Select>
          <Input label="New Qty (units)" type="number" step="0.01" min="0" value={form.newQty} onChange={setField('newQty')} />
        </div>
        <p className="batch-edit-hint">
          Current stock: <strong>{batch.currentUnits ?? 0} units</strong>
          {' · '}{batch.fullStrips ?? 0} strips + {batch.looseUnits ?? 0} loose.
          Changing New Qty records a stock adjustment.
        </p>
      </form>
    </Modal>
  );
}
