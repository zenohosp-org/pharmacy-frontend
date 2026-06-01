import { useState, useEffect } from 'react';
import { getDrugs, updateDrug, deleteDrug, importDrugsExcel } from '../api/pharmacyClient';
import PageHeader from '../components/shared/PageHeader';
import ContentLoader from '../components/shared/ContentLoader';
import Alert from '../components/shared/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import './DrugMaster.css';

const SCHEDULES = ['OTC', 'H', 'H1', 'X'];

const EMPTY_FORM = {
  name: '',
  genericName: '',
  hsnCode: '',
  drugSchedule: '',
  drugReorderQty: '',
  unit: '',
  billingGroup: 'PHARMACY',
  billable: 'YES',
  batchRequired: true,
  expiryRequired: true,
};

export default function DrugMaster() {
  const [drugs, setDrugs] = useState([]);
  const [filteredDrugs, setFilteredDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDrug, setEditingDrug] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const fetchDrugs = async () => {
    try {
      setLoading(true);
      const data = await getDrugs();
      setDrugs(data);
      setError(null);
    } catch (e) {
      setError('Failed to load drugs. Please refresh.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrugs();
  }, []);

  useEffect(() => {
    let filtered = [...drugs];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.name?.toLowerCase().includes(q) ||
        d.genericName?.toLowerCase().includes(q)
      );
    }
    if (selectedSchedule) {
      filtered = filtered.filter(d => d.drugSchedule === selectedSchedule);
    }
    setFilteredDrugs(filtered);
  }, [drugs, searchQuery, selectedSchedule]);

  const openEdit = (drug) => {
    setEditingDrug(drug);
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
    setShowModal(true);
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    setError(null);
    try {
      const result = await importDrugsExcel(file);
      setImportResult(result);
      await fetchDrugs();
    } catch (err) {
      setError('Excel import failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (drugId) => {
    if (!window.confirm('Delete this drug from inventory?')) return;
    try {
      await deleteDrug(drugId);
      await fetchDrugs();
    } catch (e) {
      setError('Failed to delete drug');
      console.error(e);
    }
  };

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
      await updateDrug(editingDrug.id, payload);
      setShowModal(false);
      await fetchDrugs();
    } catch (e) {
      setFormError('Failed to save drug: ' + (e.response?.data?.message || e.message));
    } finally {
      setSaving(false);
    }
  };

  const setField = (key) => (e) => setFormData(p => ({ ...p, [key]: e.target.value }));

  const columns = [
    { header: 'Brand Name', render: (_, d) => <span className="font-semibold">{d.name}</span> },
    { header: 'Generic Name', render: (_, d) => d.genericName || '—' },
    { header: 'HSN Code', render: (_, d) => d.hsnCode || '—' },
    { header: 'Schedule', render: (_, d) => (
      d.drugSchedule
        ? <span className={`drug-schedule-badge drug-schedule-badge--${SCHEDULES.includes(d.drugSchedule) ? d.drugSchedule : 'default'}`}>{d.drugSchedule}</span>
        : '—'
    ) },
    { header: 'Unit', render: (_, d) => d.unit || '—' },
    { header: 'Reorder Qty', render: (_, d) => d.drugReorderQty ?? '—' },
    { header: 'Actions', render: (_, d) => (
      <div className="action-group">
        <Button size="sm" onClick={() => openEdit(d)}>Edit</Button>
        <Button size="sm" variant="danger" onClick={() => handleDelete(d.id)}>Delete</Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader
        title="Drug Master"
        subtitle="Pharmacy drugs are managed as inventory items. Add or edit from here or from Inventory → Product Master."
      />

      {error && <Alert tone="error" className="section-gap">{error}</Alert>}

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search by brand or generic name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input search-input"
        />
        <select
          value={selectedSchedule}
          onChange={(e) => setSelectedSchedule(e.target.value)}
          className="form-select"
        >
          <option value="">All Schedules</option>
          {SCHEDULES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="file-upload-label">
          {importing ? 'Importing...' : 'Import Excel'}
          <input
            type="file"
            accept=".xlsx,.xls"
            className="file-upload-input"
            onChange={handleExcelImport}
            disabled={importing}
          />
        </label>
        <a href="/drug_master_template.xlsx" download className="btn btn-secondary btn-sm">
          Download Template
        </a>
      </div>

      {importResult && (
        <Alert tone="success" className="section-gap">
          Imported {importResult.imported} drug(s).
          {importResult.errors?.length > 0 && (
            <div className="import-errors">
              <strong>{importResult.errors.length} row(s) skipped:</strong>
              <ul>
                {importResult.errors.slice(0, 10).map((err, i) => (
                  <li key={i}>Row {err.row || '?'}: {err.reason || err.error}</li>
                ))}
              </ul>
            </div>
          )}
        </Alert>
      )}

      {loading ? (
        <ContentLoader label="Loading drugs…" />
      ) : (
        <>
          <div className="drug-count">Showing {filteredDrugs.length} of {drugs.length} drugs</div>
          <Card padded={false}>
            <Table columns={columns} data={filteredDrugs} emptyMessage="No drugs found" />
          </Card>
        </>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Edit Drug"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
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
    </div>
  );
}
