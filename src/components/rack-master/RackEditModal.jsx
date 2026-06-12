import { useState, useEffect } from 'react';
import { createRack, updateRack } from '../../api/pharmacyClient';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Alert from '../shared/Alert';
import { rowLabel, defaultRackCode } from './rackGrid';

const RACK_TYPES = ['NORMAL', 'COLD'];
const ROW_OPTIONS = Array.from({ length: 26 }, (_, i) => i); // A..Z

// Create/edit modal for a rack. Position (row/column) drives the grid placement
// and the auto-generated code; both stay editable. Owns its form state.
export default function RackEditModal({ open, rack, storeId, presetRow, presetCol, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (rack) {
      setForm({
        code: rack.code || '',
        name: rack.name || '',
        rackType: rack.rackType || 'NORMAL',
        gridRow: rack.gridRow ?? presetRow ?? 0,
        gridCol: rack.gridCol ?? presetCol ?? 0,
        isActive: rack.isActive ?? true,
      });
    } else {
      const r = presetRow ?? 0;
      const c = presetCol ?? 0;
      setForm({ code: defaultRackCode(r, c), name: '', rackType: 'NORMAL', gridRow: r, gridCol: c, isActive: true });
    }
    setFormError(null);
  }, [open, rack, presetRow, presetCol]);

  const setField = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.code.trim()) { setFormError('Rack code is required'); return; }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        storeId,
        code: form.code.trim(),
        name: form.name.trim() || null,
        rackType: form.rackType,
        gridRow: Number(form.gridRow),
        gridCol: Number(form.gridCol),
        isActive: form.isActive === 'false' ? false : Boolean(form.isActive),
      };
      if (rack) {
        await updateRack(rack.id, payload);
      } else {
        await createRack(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setFormError('Failed to save rack: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={rack ? `Edit Rack ${rack.code}` : 'Add Rack'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="rack-form" disabled={saving}>{saving ? 'Saving…' : (rack ? 'Update Rack' : 'Add Rack')}</Button>
        </>
      }
    >
      {formError && <Alert tone="error" className="section-gap">{formError}</Alert>}
      <form id="rack-form" onSubmit={handleSubmit}>
        <div className="modal-form-row">
          <Select label="Row" value={String(form.gridRow)} onChange={setField('gridRow')}>
            {ROW_OPTIONS.map(i => <option key={i} value={i}>{rowLabel(i)}</option>)}
          </Select>
          <Input label="Column" type="number" min="1" value={Number(form.gridCol) + 1}
            onChange={(e) => setForm(p => ({ ...p, gridCol: Math.max(0, (parseInt(e.target.value, 10) || 1) - 1) }))} />
        </div>
        <div className="modal-form-row">
          <Input label="Code" required value={form.code} onChange={setField('code')} placeholder="e.g. R1-A" maxLength={50} />
          <Select label="Type" value={form.rackType} onChange={setField('rackType')}>
            {RACK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        <Input label="Name / Description" value={form.name} onChange={setField('name')} placeholder="e.g. Front shelf, cold storage" maxLength={150} />
        {rack && (
          <Select label="Status" value={String(form.isActive)} onChange={(e) => setForm(p => ({ ...p, isActive: e.target.value === 'true' }))}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        )}
      </form>
    </Modal>
  );
}
