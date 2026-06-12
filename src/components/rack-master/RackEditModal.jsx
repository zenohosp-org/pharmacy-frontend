import { useState, useEffect } from 'react';
import { createRack, updateRack } from '../../api/pharmacyClient';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Alert from '../shared/Alert';

const RACK_TYPES = ['NORMAL', 'COLD'];

const EMPTY = { code: '', name: '', rackType: 'NORMAL', isActive: true };

// Create/edit modal for a rack. Owns its form state; calls onSaved() after a successful save.
export default function RackEditModal({ open, rack, storeId, onClose, onSaved }) {
  const [formData, setFormData] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setFormData(rack ? {
      code: rack.code || '',
      name: rack.name || '',
      rackType: rack.rackType || 'NORMAL',
      isActive: rack.isActive ?? true,
    } : EMPTY);
    setFormError(null);
  }, [open, rack]);

  const setField = (key) => (e) => setFormData(p => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!formData.code.trim()) { setFormError('Rack code is required'); return; }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        storeId,
        code: formData.code.trim(),
        name: formData.name.trim() || null,
        rackType: formData.rackType,
        isActive: formData.isActive === 'false' ? false : Boolean(formData.isActive),
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
      title={rack ? 'Edit Rack' : 'Add Rack'}
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
          <Input label="Code" required value={formData.code} onChange={setField('code')} placeholder="e.g. R1-A" maxLength={50} />
          <Select label="Type" value={formData.rackType} onChange={setField('rackType')}>
            {RACK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        <Input label="Name / Description" value={formData.name} onChange={setField('name')} placeholder="e.g. Front shelf, cold storage" maxLength={150} />
        {rack && (
          <Select label="Status" value={String(formData.isActive)} onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.value === 'true' }))}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        )}
      </form>
    </Modal>
  );
}
