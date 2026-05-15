import { useState, useEffect } from 'react';
import { getDrugs, getInventoryItemTypes, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '../api/pharmacyClient';
import './DrugMaster.css';

const SCHEDULE_COLORS = {
  OTC: '#4CAF50',
  H: '#FF9800',
  H1: '#F44336',
  X: '#B71C1C'
};

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
  const [pharmacyItemTypeId, setPharmacyItemTypeId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchDrugs();
    resolvePharmacyItemType();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [drugs, searchQuery, selectedSchedule]);

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

  const resolvePharmacyItemType = async () => {
    try {
      const types = await getInventoryItemTypes();
      const parsed = Array.isArray(types) ? types : (types.data || []);
      const pharmacyType = parsed.find(t => t.defaultBillingGroup === 'PHARMACY');
      if (pharmacyType) setPharmacyItemTypeId(pharmacyType.id);
    } catch (e) {
      console.warn('Could not load item types from inventory:', e.message);
    }
  };

  const applyFilters = () => {
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
  };

  const openAdd = () => {
    setEditingDrug(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  };

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

  const handleDelete = async (drugId) => {
    if (!window.confirm('Delete this drug from inventory?')) return;
    try {
      await deleteInventoryItem(drugId);
      await fetchDrugs();
    } catch (e) {
      setError('Failed to delete drug');
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { setFormError('Brand name is required'); return; }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        ...formData,
        itemTypeId: pharmacyItemTypeId || null,
        drugReorderQty: formData.drugReorderQty !== '' ? Number(formData.drugReorderQty) : null,
        isActive: true,
      };
      if (editingDrug) {
        await updateInventoryItem(editingDrug.id, payload);
      } else {
        await createInventoryItem(payload);
      }
      setShowModal(false);
      await fetchDrugs();
    } catch (e) {
      setFormError('Failed to save drug: ' + (e.response?.data?.message || e.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="drug-master-container">
      <div className="mb-6">
        <h1 className="page-title">Drug Master</h1>
        <p className="page-subtitle">Pharmacy drugs are managed as inventory items. Add or edit from here or from Inventory → Product Master.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

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
          <option value="OTC">OTC</option>
          <option value="H">H</option>
          <option value="H1">H1</option>
          <option value="X">X</option>
        </select>
        <button onClick={openAdd} className="btn btn-primary">
          Add Drug
        </button>
      </div>

      {loading && <div>Loading...</div>}
      {!loading && !error && (
        <>
          <div className="drug-count">
            Showing {filteredDrugs.length} of {drugs.length} drugs
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Brand Name</th>
                  <th>Generic Name</th>
                  <th>HSN Code</th>
                  <th>Schedule</th>
                  <th>Unit</th>
                  <th>Reorder Qty</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrugs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center">No drugs found</td>
                  </tr>
                ) : (
                  filteredDrugs.map(drug => (
                    <tr key={drug.id}>
                      <td className="font-semibold">{drug.name}</td>
                      <td>{drug.genericName || '—'}</td>
                      <td>{drug.hsnCode || '—'}</td>
                      <td>
                        {drug.drugSchedule
                          ? <span className="drug-schedule-badge" style={{ backgroundColor: SCHEDULE_COLORS[drug.drugSchedule] || '#999' }}>{drug.drugSchedule}</span>
                          : '—'}
                      </td>
                      <td>{drug.unit || '—'}</td>
                      <td>{drug.drugReorderQty ?? '—'}</td>
                      <td className="action-cell">
                        <div className="action-group">
                          <button onClick={() => openEdit(drug)} className="btn btn-sm btn-primary">Edit</button>
                          <button onClick={() => handleDelete(drug.id)} className="btn btn-sm btn-danger">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal" style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', width: '100%', maxWidth: '480px', margin: '16px' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '1.125rem', fontWeight: 600 }}>
              {editingDrug ? 'Edit Drug' : 'Add Drug'}
            </h2>
            {formError && <div className="alert alert-error" style={{ marginBottom: '12px' }}>{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '0.875rem' }}>Brand Name *</label>
                  <input type="text" className="form-input" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Calpol" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '0.875rem' }}>Generic Name</label>
                  <input type="text" className="form-input" value={formData.genericName} onChange={e => setFormData(p => ({ ...p, genericName: e.target.value }))} placeholder="e.g. Paracetamol" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '0.875rem' }}>HSN Code</label>
                    <input type="text" className="form-input" value={formData.hsnCode} onChange={e => setFormData(p => ({ ...p, hsnCode: e.target.value }))} placeholder="e.g. 30049099" maxLength={10} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '0.875rem' }}>Schedule</label>
                    <select className="form-select" value={formData.drugSchedule} onChange={e => setFormData(p => ({ ...p, drugSchedule: e.target.value }))}>
                      <option value="">— Select —</option>
                      <option value="OTC">OTC</option>
                      <option value="H">H</option>
                      <option value="H1">H1</option>
                      <option value="X">X</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '0.875rem' }}>Unit</label>
                    <input type="text" className="form-input" value={formData.unit} onChange={e => setFormData(p => ({ ...p, unit: e.target.value }))} placeholder="e.g. Tablet, Vial" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '0.875rem' }}>Reorder Qty</label>
                    <input type="number" className="form-input" value={formData.drugReorderQty} onChange={e => setFormData(p => ({ ...p, drugReorderQty: e.target.value }))} placeholder="e.g. 50" min="0" />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : (editingDrug ? 'Update Drug' : 'Add Drug')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
