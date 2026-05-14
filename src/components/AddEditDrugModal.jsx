import { useState, useEffect } from 'react';
import { createDrug, updateDrug, getVendors } from '../api/pharmacyClient';
import './AddEditDrugModal.css';

export default function AddEditDrugModal({ drug, onClose, onSave }) {
  const [formData, setFormData] = useState({
    brandName: '',
    genericName: '',
    hsnCode: '',
    schedule: 'OTC',
    category: '',
    form: '',
    strength: '',
    unit: '',
    reorderQty: 0,
    manufacturerId: '',
    purpose: '',
    sideEffects: '',
    chemicalClass: '',
    saltName: '',
    stripsPerPack: '',
    unitsPerStrip: '',
    imageUrl: ''
  });
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVendors();
    if (drug) {
      setFormData({
        brandName: drug.brandName || '',
        genericName: drug.genericName || '',
        hsnCode: drug.hsnCode || '',
        schedule: drug.schedule || 'OTC',
        category: drug.category || '',
        form: drug.form || '',
        strength: drug.strength || '',
        unit: drug.unit || '',
        reorderQty: drug.reorderQty || 0,
        manufacturerId: drug.manufacturerId || '',
        purpose: drug.purpose || '',
        sideEffects: drug.sideEffects || '',
        chemicalClass: drug.chemicalClass || '',
        saltName: drug.saltName || '',
        stripsPerPack: drug.stripsPerPack || '',
        unitsPerStrip: drug.unitsPerStrip || '',
        imageUrl: drug.imageUrl || ''
      });
    }
  }, [drug]);

  const fetchVendors = async () => {
    try {
      const data = await getVendors();
      setVendors(data || []);
    } catch (e) {
      console.error('Failed to fetch vendors:', e);
      setVendors([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['reorderQty', 'stripsPerPack', 'unitsPerStrip'].includes(name) ? (parseInt(value) || 0) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.brandName.trim() || !formData.genericName.trim()) {
        setError('Brand name and generic name are required');
        setLoading(false);
        return;
      }

      if (drug) {
        await updateDrug(drug.id, formData);
      } else {
        await createDrug(formData);
      }
      onSave();
    } catch (e) {
      setError('Failed to save drug: ' + e.message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay active">
      <div className="modal modal-md">
        <div className="modal-header">
          <h2 className="modal-title">{drug ? 'Edit Drug' : 'Add New Drug'}</h2>
        </div>

        {error && <div className="modal-body"><div className="alert alert-error">{error}</div></div>}

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label className="form-label required">Brand Name</label>
              <input
                type="text"
                name="brandName"
                value={formData.brandName}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="e.g., Aspirin"
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Generic Name</label>
              <input
                type="text"
                name="genericName"
                value={formData.genericName}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="e.g., Acetylsalicylic acid"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Manufacturer</label>
              <select
                name="manufacturerId"
                value={formData.manufacturerId}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Select Manufacturer</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">HSN Code</label>
              <input
                type="text"
                name="hsnCode"
                value={formData.hsnCode}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., 3004"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Schedule</label>
              <select
                name="schedule"
                value={formData.schedule}
                onChange={handleChange}
                className="form-select"
              >
                <option value="OTC">OTC</option>
                <option value="H">H</option>
                <option value="H1">H1</option>
                <option value="X">X</option>
              </select>
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Form</label>
                <input
                  type="text"
                  name="form"
                  value={formData.form}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., tablet"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Strength</label>
                <input
                  type="text"
                  name="strength"
                  value={formData.strength}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., 500mg"
                />
              </div>
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Unit</label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., strip"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., antibiotic"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Reorder Quantity</label>
              <input
                type="number"
                name="reorderQty"
                value={formData.reorderQty}
                onChange={handleChange}
                className="form-input"
                placeholder="0"
              />
            </div>

            <hr style={{ margin: '20px 0', opacity: 0.2 }} />
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-gray-700)', marginBottom: '12px' }}>Drug Info</h3>

            <div className="form-group">
              <label className="form-label">Salt Name</label>
              <input
                type="text"
                name="saltName"
                value={formData.saltName}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Paracetamol"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Purpose / Indication</label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Used for fever and pain relief"
                rows="2"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Side Effects</label>
              <textarea
                name="sideEffects"
                value={formData.sideEffects}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Nausea, dizziness in rare cases"
                rows="2"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Chemical Class</label>
              <input
                type="text"
                name="chemicalClass"
                value={formData.chemicalClass}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Analgesic"
              />
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Strips Per Pack</label>
                <input
                  type="number"
                  name="stripsPerPack"
                  value={formData.stripsPerPack}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., 1"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Units Per Strip</label>
                <input
                  type="number"
                  name="unitsPerStrip"
                  value={formData.unitsPerStrip}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., 10"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Image URL</label>
              <input
                type="text"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., https://example.com/image.jpg"
              />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Saving...' : drug ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
