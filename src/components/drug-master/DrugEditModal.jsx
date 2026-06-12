import { useState, useEffect } from 'react';
import { updateDrug } from '../../api/pharmacyClient';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Alert from '../shared/Alert';
import { SCHEDULES, EMPTY_DRUG_FORM } from './constants';

// Edit modal for a drug. Owns its form state; calls onSaved() after a successful save.
export default function DrugEditModal({ open, drug, onClose, onSaved }) {
  const [formData, setFormData] = useState(EMPTY_DRUG_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!drug) return;
    setFormData({
      name: drug.name || '',
      genericName: drug.genericName || '',
      hsnCode: drug.hsnCode || '',
      drugSchedule: drug.drugSchedule || '',
      drugReorderQty: drug.drugReorderQty ?? '',
      unit: drug.unit || '',
      billingGroup: 'PHARMACY',
      billable: 'YES',
      batchRequired: true,
      expiryRequired: true,
    });
    setFormError(null);
  }, [drug]);

  const setField = (key) => (e) => setFormData(p => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) { setFormError('Brand name is required'); return; }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        ...formData,
        drugReorderQty: formData.drugReorderQty !== '' ? Number(formData.drugReorderQty) : null,
      };
      await updateDrug(drug.id, payload);
      onSaved();
      onClose();
    } catch (err) {
      setFormError('Failed to save drug: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Drug"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="drug-form" disabled={saving}>{saving ? 'Saving…' : 'Update Drug'}</Button>
        </>
      }
    >
      {formError && <Alert tone="error" className="section-gap">{formError}</Alert>}
      <form id="drug-form" onSubmit={handleSubmit}>
        <Input label="Brand Name" required value={formData.name} onChange={setField('name')} placeholder="e.g. Calpol" />
        <Input label="Generic Name" value={formData.genericName} onChange={setField('genericName')} placeholder="e.g. Paracetamol" />
        <div className="modal-form-row">
          <Input label="HSN Code" value={formData.hsnCode} onChange={setField('hsnCode')} placeholder="e.g. 30049099" maxLength={10} />
          <Select label="Schedule" value={formData.drugSchedule} onChange={setField('drugSchedule')}>
            <option value="">— Select —</option>
            {SCHEDULES.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <div className="modal-form-row">
          <Input label="Unit" value={formData.unit} onChange={setField('unit')} placeholder="e.g. Tablet, Vial" />
          <Input label="Reorder Qty" type="number" value={formData.drugReorderQty} onChange={setField('drugReorderQty')} placeholder="e.g. 50" min="0" />
        </div>
      </form>
    </Modal>
  );
}
