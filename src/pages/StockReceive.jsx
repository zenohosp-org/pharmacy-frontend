import { useState, useEffect } from 'react';
import { getDrugs, receiveStock } from '../api/pharmacyClient';

export default function StockReceive() {
  const [drugs, setDrugs] = useState([]);
  const [formData, setFormData] = useState({
    drugId: '',
    storeId: '550e8400-e29b-41d4-a716-446655440001',
    batchNumber: '',
    expiryDate: '',
    mrp: '',
    receivedQty: '',
    purchaseRate: '',
    sellingPrice: ''
  });
  const [drugSearch, setDrugSearch] = useState('');
  const [showDrugDropdown, setShowDrugDropdown] = useState(false);
  const [filteredDrugs, setFilteredDrugs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedDrug, setSelectedDrug] = useState(null);

  useEffect(() => {
    fetchDrugs();
  }, []);

  useEffect(() => {
    if (drugSearch.trim()) {
      const q = drugSearch.toLowerCase();
      const filtered = drugs.filter(d =>
        d.brandName?.toLowerCase().includes(q) ||
        d.genericName?.toLowerCase().includes(q)
      );
      setFilteredDrugs(filtered);
      setShowDrugDropdown(true);
    } else {
      setShowDrugDropdown(false);
    }
  }, [drugSearch, drugs]);

  const fetchDrugs = async () => {
    try {
      const data = await getDrugs();
      setDrugs(data);
    } catch (e) {
      console.error('Failed to fetch drugs:', e);
    }
  };

  const handleDrugSelect = (drug) => {
    setSelectedDrug(drug);
    setFormData(prev => ({
      ...prev,
      drugId: drug.id
    }));
    setDrugSearch(`${drug.brandName} (${drug.genericName})`);
    setShowDrugDropdown(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!formData.drugId || !formData.batchNumber || !formData.expiryDate || !formData.receivedQty) {
        setError('All required fields must be filled');
        setLoading(false);
        return;
      }

      const payload = {
        drugId: formData.drugId,
        storeId: formData.storeId,
        batchNumber: formData.batchNumber,
        expiryDate: formData.expiryDate,
        mrp: formData.mrp ? parseFloat(formData.mrp) : null,
        receivedQty: parseFloat(formData.receivedQty),
        purchaseRate: formData.purchaseRate ? parseFloat(formData.purchaseRate) : null,
        sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : null
      };

      await receiveStock(payload);
      setSuccess('Stock received successfully!');
      setFormData({
        drugId: '',
        storeId: '550e8400-e29b-41d4-a716-446655440001',
        batchNumber: '',
        expiryDate: '',
        mrp: '',
        receivedQty: '',
        purchaseRate: '',
        sellingPrice: ''
      });
      setSelectedDrug(null);
      setDrugSearch('');
    } catch (e) {
      setError('Failed to receive stock: ' + e.message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>Receive Stock</h1>
        <p>Add new stock batches to inventory</p>
      </div>

      {error && <div style={{ padding: '12px', color: 'white', backgroundColor: '#d32f2f', marginBottom: '16px', borderRadius: '4px' }}>{error}</div>}
      {success && <div style={{ padding: '12px', color: 'white', backgroundColor: '#388e3c', marginBottom: '16px', borderRadius: '4px' }}>{success}</div>}

      <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto', padding: '24px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <div style={{ marginBottom: '16px', position: 'relative' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Drug *</label>
          <input
            type="text"
            placeholder="Search drug by brand or generic name..."
            value={drugSearch}
            onChange={(e) => setDrugSearch(e.target.value)}
            onFocus={() => drugSearch && setShowDrugDropdown(true)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
          {showDrugDropdown && filteredDrugs.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderTop: 'none',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 10
            }}>
              {filteredDrugs.map(drug => (
                <div
                  key={drug.id}
                  onClick={() => handleDrugSelect(drug)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    backgroundColor: selectedDrug?.id === drug.id ? '#e3f2fd' : 'white',
                    borderBottom: '1px solid #eee'
                  }}
                >
                  <strong>{drug.brandName}</strong> ({drug.genericName})
                </div>
              ))}
            </div>
          )}
          {selectedDrug && <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Selected: {selectedDrug.brandName}</div>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Batch Number *</label>
          <input
            type="text"
            name="batchNumber"
            value={formData.batchNumber}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
            placeholder="e.g., B001"
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Expiry Date *</label>
          <input
            type="date"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Quantity Received *</label>
          <input
            type="number"
            name="receivedQty"
            value={formData.receivedQty}
            onChange={handleChange}
            required
            step="0.01"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
            placeholder="e.g., 100"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>MRP</label>
            <input
              type="number"
              name="mrp"
              value={formData.mrp}
              onChange={handleChange}
              step="0.01"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
              placeholder="Max retail price"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Purchase Rate</label>
            <input
              type="number"
              name="purchaseRate"
              value={formData.purchaseRate}
              onChange={handleChange}
              step="0.01"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
              placeholder="Cost price"
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Selling Price</label>
          <input
            type="number"
            name="sellingPrice"
            value={formData.sellingPrice}
            onChange={handleChange}
            step="0.01"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
            placeholder="Retail price"
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => {
              setFormData({
                drugId: '',
                storeId: '550e8400-e29b-41d4-a716-446655440001',
                batchNumber: '',
                expiryDate: '',
                mrp: '',
                receivedQty: '',
                purchaseRate: '',
                sellingPrice: ''
              });
              setSelectedDrug(null);
              setDrugSearch('');
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ccc',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Receiving...' : 'Receive Stock'}
          </button>
        </div>
      </form>
    </div>
  );
}
