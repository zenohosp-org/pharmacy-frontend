import { useState, useEffect } from 'react';
import { getDrugs, getBatches, createCounterSale } from '../api/pharmacyClient';

const STORE_ID = '550e8400-e29b-41d4-a716-446655440001';

export default function CounterSale() {
  const [drugs, setDrugs] = useState([]);
  const [drugSearch, setDrugSearch] = useState('');
  const [showDrugDropdown, setShowDrugDropdown] = useState(false);
  const [filteredDrugs, setFilteredDrugs] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [qty, setQty] = useState('');
  const [rate, setRate] = useState('');
  const [gstRate, setGstRate] = useState('9');
  const [patientPhone, setPatientPhone] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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

  const handleDrugSelect = async (drug) => {
    setSelectedDrug(drug);
    setDrugSearch(`${drug.brandName} (${drug.genericName})`);
    setShowDrugDropdown(false);
    setSelectedBatch(null);
    setBatches([]);
    setRate(drug.sellingPrice ? drug.sellingPrice.toString() : '');

    try {
      const batchData = await getBatches(drug.id);
      setBatches(batchData);
    } catch (e) {
      console.error('Failed to fetch batches:', e);
    }
  };

  const handleBatchSelect = (batch) => {
    setSelectedBatch(batch);
  };

  const calculateTotal = () => {
    const q = parseFloat(qty) || 0;
    const r = parseFloat(rate) || 0;
    const g = parseFloat(gstRate) || 0;
    const subtotal = q * r;
    const gstAmount = (subtotal * g) / 100;
    return { subtotal, gstAmount, total: subtotal + gstAmount };
  };

  const handleAddToCart = () => {
    setError(null);

    if (!selectedDrug) {
      setError('Please select a drug');
      return;
    }
    if (!selectedBatch) {
      setError('Please select a batch');
      return;
    }
    if (!qty || parseFloat(qty) <= 0) {
      setError('Please enter valid quantity');
      return;
    }
    if (!rate || parseFloat(rate) <= 0) {
      setError('Please enter valid rate');
      return;
    }

    const { subtotal, gstAmount, total } = calculateTotal();

    const item = {
      id: Math.random(),
      drugId: selectedDrug.id,
      drugName: selectedDrug.brandName,
      batchId: selectedBatch.id,
      batchNumber: selectedBatch.batchNumber,
      expiryDate: selectedBatch.expiryDate,
      qty: parseFloat(qty),
      rate: parseFloat(rate),
      gstRate: parseFloat(gstRate),
      subtotal,
      gstAmount,
      total
    };

    setCart([...cart, item]);
    setSelectedDrug(null);
    setSelectedBatch(null);
    setDrugSearch('');
    setQty('');
    setRate('');
    setGstRate('9');
  };

  const handleRemoveFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const calculateCartTotals = () => {
    let subtotal = 0, totalGst = 0;
    cart.forEach(item => {
      subtotal += item.subtotal;
      totalGst += item.gstAmount;
    });
    return { subtotal, totalGst, total: subtotal + totalGst };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      for (const item of cart) {
        await createCounterSale({
          drugId: item.drugId,
          storeId: STORE_ID,
          qty: item.qty,
          rate: item.rate,
          gstRate: item.gstRate,
          patientPhone: patientPhone || null,
          paymentMode: 'CASH'
        });
      }

      setSuccess(`Billing successful! Bill number will be printed.`);
      setCart([]);
      setPatientPhone('');
      setTimeout(() => setSuccess(null), 5000);
    } catch (e) {
      setError('Billing failed: ' + e.message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, totalGst, total } = calculateCartTotals();

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>Counter Sale</h1>
        <p>Dispense drugs and generate GST invoices</p>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          color: 'white',
          backgroundColor: '#d32f2f',
          marginBottom: '16px',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '12px',
          color: 'white',
          backgroundColor: '#388e3c',
          marginBottom: '16px',
          borderRadius: '4px'
        }}>
          {success}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* LEFT: Drug Selection & Cart */}
        <div>
          {/* Drug Search */}
          <div style={{
            padding: '24px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <h3>Select Drug</h3>

            <div style={{ marginBottom: '16px', position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Drug Search *</label>
              <input
                type="text"
                placeholder="Search by brand or generic name..."
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
            </div>

            {/* Batch Selection */}
            {selectedDrug && batches.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Select Batch *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {batches.map(batch => (
                    <div
                      key={batch.id}
                      onClick={() => handleBatchSelect(batch)}
                      style={{
                        padding: '12px',
                        border: selectedBatch?.id === batch.id ? '2px solid #4CAF50' : '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        backgroundColor: selectedBatch?.id === batch.id ? '#f0f7f0' : 'white'
                      }}
                    >
                      <div style={{ fontWeight: 'bold' }}>
                        Batch: {batch.batchNumber}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Expiry: {new Date(batch.expiryDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Qty & Rate */}
            {selectedDrug && selectedBatch && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Qty *</label>
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Rate *</label>
                    <input
                      type="number"
                      placeholder="Rate per unit"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>GST Rate %</label>
                  <input
                    type="number"
                    placeholder="GST %"
                    value={gstRate}
                    onChange={(e) => setGstRate(e.target.value)}
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Rate Preview */}
                {qty && rate && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Subtotal:</span>
                      <strong>₹{(parseFloat(qty) * parseFloat(rate)).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>GST ({gstRate}%):</span>
                      <strong>₹{((parseFloat(qty) * parseFloat(rate) * parseFloat(gstRate)) / 100).toFixed(2)}</strong>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      borderTop: '1px solid #ddd',
                      paddingTop: '8px'
                    }}>
                      <span>Total:</span>
                      <span>₹{(parseFloat(qty) * parseFloat(rate) * (1 + parseFloat(gstRate) / 100)).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAddToCart}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Add to Cart
                </button>
              </div>
            )}
          </div>

          {/* Cart Items */}
          {cart.length > 0 && (
            <div style={{
              padding: '24px',
              border: '1px solid #ddd',
              borderRadius: '8px'
            }}>
              <h3>Cart ({cart.length} items)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cart.map(item => (
                  <div
                    key={item.id}
                    style={{
                      padding: '12px',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>{item.drugName}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {item.qty} × ₹{item.rate.toFixed(2)} = ₹{item.total.toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Totals & Checkout */}
        <div>
          <div style={{
            padding: '24px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            position: 'sticky',
            top: '24px'
          }}>
            <h3>Bill Summary</h3>

            <div style={{
              padding: '16px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Subtotal:</span>
                <strong>₹{subtotal.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>GST:</span>
                <strong>₹{totalGst.toFixed(2)}</strong>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '18px',
                fontWeight: 'bold',
                borderTop: '1px solid #ddd',
                paddingTop: '8px'
              }}>
                <span>Total:</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Patient Phone (optional)</label>
              <input
                type="tel"
                placeholder="Mobile number"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: cart.length === 0 ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              {loading ? 'Processing...' : 'Complete Sale & Print Invoice'}
            </button>

            <button
              onClick={() => {
                setCart([]);
                setPatientPhone('');
                setError(null);
              }}
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '8px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
