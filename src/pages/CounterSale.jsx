import { useState, useEffect } from 'react';
import { getDrugs, getBatches, createCounterSaleBulk } from '../api/pharmacyClient';
import { Link } from 'react-router-dom';

const STORE_ID = '550e8400-e29b-41d4-a716-446655440001';

export default function CounterSale() {
  const [drugs, setDrugs] = useState([]);
  const [drugSearch, setDrugSearch] = useState('');
  const [showDrugDropdown, setShowDrugDropdown] = useState(false);
  const [filteredDrugs, setFilteredDrugs] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showDrugInfo, setShowDrugInfo] = useState(false);
  const [qty, setQty] = useState('');
  const [rate, setRate] = useState('');
  const [gstRate, setGstRate] = useState('9');
  const [discount, setDiscount] = useState('0');
  const [patientPhone, setPatientPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [completedSales, setCompletedSales] = useState([]);

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
    setShowDrugInfo(false);

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
      discount: parseFloat(discount) || 0,
      subtotal,
      gstAmount,
      total,
      schedule: selectedDrug.schedule,
      stripsPerPack: selectedDrug.stripsPerPack,
      unitsPerStrip: selectedDrug.unitsPerStrip
    };

    setCart([...cart, item]);
    setSelectedDrug(null);
    setSelectedBatch(null);
    setDrugSearch('');
    setQty('');
    setRate('');
    setGstRate('9');
    setDiscount('0');
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
      // Create bulk checkout payload
      const bulkPayload = {
        storeId: STORE_ID,
        patientPhone: patientPhone || null,
        paymentMode: paymentMode || 'CASH',
        doctorName: doctorName || null,
        items: cart.map(item => ({
          drugId: item.drugId,
          qty: item.qty,
          rate: item.rate,
          gstRate: item.gstRate,
          discount: item.discount || 0
        }))
      };

      // Single API call for the entire transaction
      const billResponse = await createCounterSaleBulk(bulkPayload);

      const { subtotal, totalGst, total } = calculateCartTotals();
      const saleRecord = {
        id: billResponse.id,
        billNumber: billResponse.billNumber, // Use real bill number from backend
        timestamp: new Date().toLocaleString(),
        patientPhone: patientPhone || 'N/A',
        doctorName: doctorName || 'N/A',
        items: [...cart],
        subtotal,
        totalGst,
        total
      };

      setCompletedSales([saleRecord, ...completedSales]);
      setSuccess(`Billing successful! Bill number: ${saleRecord.billNumber}`);
      setCart([]);
      setPatientPhone('');
      setDoctorName('');
      setTimeout(() => setSuccess(null), 5000);
    } catch (e) {
      setError('Billing failed: ' + e.message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const requiresDoctorName = cart.some(item => ['H1', 'X'].includes(item.schedule));
  const { subtotal, totalGst, total } = calculateCartTotals();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-page)' }}>
      {/* Header */}
      <div style={{
        padding: 'var(--spacing-8)',
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-gray-200)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ marginBottom: 'var(--spacing-2)' }}>Counter Sale</h1>
          <p style={{ margin: 0, color: 'var(--color-gray-600)' }}>
            Dispense drugs and generate GST invoices
          </p>
        </div>
        <Link to="/pharmacy/sales-ledger" className="btn btn-secondary">
          View Sales Ledger
        </Link>
      </div>

      {/* Main Content */}
      <div style={{ padding: 'var(--spacing-8)' }}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-5)' }}>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: 'var(--spacing-5)' }}>
            {success}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-6)' }}>
          {/* LEFT: Drug Selection & Cart */}
          <div>
            {/* Drug Search Card */}
            <div className="card card-elevated" style={{ marginBottom: 'var(--spacing-6)' }}>
              <div className="card-header">
                <h3 style={{ margin: 0 }}>Select Drug</h3>
              </div>
              <div className="card-body">
                {/* Drug Search Input */}
                <div className="form-group" style={{ position: 'relative', marginBottom: 'var(--spacing-5)' }}>
                  <label className="form-label required">Drug Search</label>
                  <input
                    type="text"
                    placeholder="Search by brand or generic name..."
                    value={drugSearch}
                    onChange={(e) => setDrugSearch(e.target.value)}
                    onFocus={() => drugSearch && setShowDrugDropdown(true)}
                    className="form-input"
                  />
                  {showDrugDropdown && filteredDrugs.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'var(--color-white)',
                      border: '1px solid var(--color-gray-200)',
                      borderTop: 'none',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 100,
                      marginTop: '-4px',
                      borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                      boxShadow: 'var(--shadow-md)'
                    }}>
                      {filteredDrugs.map(drug => (
                        <div
                          key={drug.id}
                          onClick={() => handleDrugSelect(drug)}
                          style={{
                            padding: 'var(--spacing-3)',
                            cursor: 'pointer',
                            backgroundColor: selectedDrug?.id === drug.id ? 'var(--color-primary-subtle)' : 'var(--color-white)',
                            borderBottom: '1px solid var(--color-gray-100)',
                            transition: 'background-color var(--transition-fast)'
                          }}
                        >
                          <strong>{drug.brandName}</strong>
                          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)', marginTop: '2px' }}>
                            {drug.genericName}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Drug Info Panel */}
                {selectedDrug && (selectedDrug.purpose || selectedDrug.sideEffects || selectedDrug.saltName || selectedDrug.chemicalClass) && (
                  <div style={{
                    padding: 'var(--spacing-4)',
                    backgroundColor: 'var(--color-info-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: 'var(--spacing-5)',
                    border: '1px solid var(--color-info-light)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  onClick={() => setShowDrugInfo(!showDrugInfo)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showDrugInfo ? 'var(--spacing-3)' : 0 }}>
                      <strong style={{ color: 'var(--color-info-dark)' }}>ℹ️ Drug Info</strong>
                      <span style={{ color: 'var(--color-info-dark)', fontSize: 'var(--fs-lg)' }}>{showDrugInfo ? '▼' : '▶'}</span>
                    </div>
                    {showDrugInfo && (
                      <div style={{ marginTop: 'var(--spacing-3)', fontSize: 'var(--fs-sm)', color: 'var(--color-info-dark)', lineHeight: '1.6' }}>
                        {selectedDrug.saltName && (
                          <div style={{ marginBottom: 'var(--spacing-2)' }}>
                            <strong>Salt:</strong> {selectedDrug.saltName}
                          </div>
                        )}
                        {selectedDrug.chemicalClass && (
                          <div style={{ marginBottom: 'var(--spacing-2)' }}>
                            <strong>Class:</strong> {selectedDrug.chemicalClass}
                          </div>
                        )}
                        {selectedDrug.purpose && (
                          <div style={{ marginBottom: 'var(--spacing-2)' }}>
                            <strong>Purpose:</strong> {selectedDrug.purpose}
                          </div>
                        )}
                        {selectedDrug.sideEffects && (
                          <div style={{ marginBottom: 'var(--spacing-2)' }}>
                            <strong>Side Effects:</strong> {selectedDrug.sideEffects}
                          </div>
                        )}
                        {selectedDrug.stripsPerPack && selectedDrug.unitsPerStrip && (
                          <div>
                            <strong>Packaging:</strong> {selectedDrug.stripsPerPack} strip × {selectedDrug.unitsPerStrip} tablets
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Batch Selection */}
                {selectedDrug && batches.length > 0 && (
                  <div className="form-group" style={{ marginBottom: 'var(--spacing-5)' }}>
                    <label className="form-label required">Select Batch</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                      {batches.map(batch => (
                        <div
                          key={batch.id}
                          onClick={() => handleBatchSelect(batch)}
                          style={{
                            padding: 'var(--spacing-3)',
                            border: selectedBatch?.id === batch.id ? '2px solid var(--color-success)' : '1px solid var(--color-gray-200)',
                            borderRadius: 'var(--radius-lg)',
                            cursor: 'pointer',
                            backgroundColor: selectedBatch?.id === batch.id ? 'var(--color-success-subtle)' : 'var(--color-white)',
                            transition: 'all var(--transition-fast)'
                          }}
                        >
                          <div style={{ fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--spacing-1)' }}>
                            Batch: {batch.batchNumber}
                          </div>
                          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)' }}>
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-5)' }}>
                      <div className="form-group">
                        <label className="form-label required">Quantity</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={qty}
                          onChange={(e) => setQty(e.target.value)}
                          step="0.01"
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label required">Rate</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={rate}
                          onChange={(e) => setRate(e.target.value)}
                          step="0.01"
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-5)' }}>
                      <div className="form-group">
                        <label className="form-label">GST Rate %</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={gstRate}
                          onChange={(e) => setGstRate(e.target.value)}
                          step="0.01"
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Discount ₹</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={discount}
                          onChange={(e) => setDiscount(e.target.value)}
                          step="0.01"
                          className="form-input"
                        />
                      </div>
                    </div>

                    {/* Packaging Label */}
                    {qty && selectedDrug?.stripsPerPack && selectedDrug?.unitsPerStrip && (
                      <div style={{
                        padding: 'var(--spacing-3)',
                        backgroundColor: 'var(--color-info-subtle)',
                        borderLeft: '4px solid var(--color-info)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: 'var(--spacing-5)',
                        fontSize: 'var(--fs-sm)',
                        color: 'var(--color-info-dark)'
                      }}>
                        <strong>{qty} strips</strong> × <strong>{selectedDrug.unitsPerStrip}</strong> = <strong>{(parseFloat(qty) * selectedDrug.unitsPerStrip).toFixed(0)} tablets</strong>
                      </div>
                    )}

                    {/* Rate Preview */}
                    {qty && rate && (
                      <div style={{
                        padding: 'var(--spacing-4)',
                        backgroundColor: 'var(--color-gray-50)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: 'var(--spacing-5)',
                        border: '1px solid var(--color-gray-200)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                          <span style={{ color: 'var(--color-gray-600)' }}>Subtotal:</span>
                          <strong>₹{(parseFloat(qty) * parseFloat(rate)).toFixed(2)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                          <span style={{ color: 'var(--color-gray-600)' }}>GST ({gstRate}%):</span>
                          <strong>₹{((parseFloat(qty) * parseFloat(rate) * parseFloat(gstRate)) / 100).toFixed(2)}</strong>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 'var(--fs-lg)',
                          fontWeight: 'var(--fw-bold)',
                          borderTop: '1px solid var(--color-gray-200)',
                          paddingTop: 'var(--spacing-2)'
                        }}>
                          <span>Total:</span>
                          <span>₹{(parseFloat(qty) * parseFloat(rate) * (1 + parseFloat(gstRate) / 100)).toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleAddToCart}
                      className="btn btn-primary btn-block"
                    >
                      Add to Cart
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Cart Items */}
            {cart.length > 0 && (
              <div className="card card-elevated">
                <div className="card-header">
                  <h3 style={{ margin: 0 }}>Cart ({cart.length} items)</h3>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                  {cart.map(item => (
                    <div
                      key={item.id}
                      style={{
                        padding: 'var(--spacing-3)',
                        backgroundColor: 'var(--color-gray-50)',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px solid var(--color-gray-200)'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--spacing-1)' }}>
                          {item.drugName}
                        </div>
                        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-1)' }}>
                          {item.qty} × ₹{item.rate.toFixed(2)} = ₹{item.total.toFixed(2)}
                        </div>
                        {item.stripsPerPack && item.unitsPerStrip && (
                          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-info)', fontWeight: '500' }}>
                            {item.qty} strips = {(item.qty * item.unitsPerStrip).toFixed(0)} tablets
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="btn btn-danger btn-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Billing Summary */}
          <div>
            <div className="card card-elevated" style={{
              position: 'sticky',
              top: 'var(--spacing-8)'
            }}>
              <div className="card-header">
                <h3 style={{ margin: 0 }}>Bill Summary</h3>
              </div>

              <div className="card-body">
                <div style={{
                  padding: 'var(--spacing-4)',
                  backgroundColor: 'var(--color-gray-50)',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: 'var(--spacing-5)',
                  border: '1px solid var(--color-gray-200)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                    <span style={{ color: 'var(--color-gray-600)' }}>Subtotal:</span>
                    <strong>₹{subtotal.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                    <span style={{ color: 'var(--color-gray-600)' }}>GST:</span>
                    <strong>₹{totalGst.toFixed(2)}</strong>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 'var(--fs-lg)',
                    fontWeight: 'var(--fw-bold)',
                    borderTop: '1px solid var(--color-gray-200)',
                    paddingTop: 'var(--spacing-2)'
                  }}>
                    <span>Total:</span>
                    <span style={{ color: 'var(--color-success)' }}>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--spacing-5)' }}>
                  <label className="form-label">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="form-select"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>

                {requiresDoctorName && (
                  <div className="form-group" style={{
                    padding: 'var(--spacing-3)',
                    backgroundColor: 'var(--color-warning-subtle)',
                    borderLeft: '4px solid var(--color-warning)',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: 'var(--spacing-5)'
                  }}>
                    <label className="form-label" style={{ fontWeight: '600', marginBottom: 'var(--spacing-2)' }}>
                      Doctor Name <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Prescribing doctor's name"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="form-input"
                    />
                    <small style={{ color: 'var(--color-warning-dark)', display: 'block', marginTop: 'var(--spacing-1)' }}>
                      Required for Schedule H1/X drugs
                    </small>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Patient Phone (Optional)</label>
                  <input
                    type="tel"
                    placeholder="Mobile number"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="form-input"
                  />
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading || cart.length === 0 || (requiresDoctorName && !doctorName.trim())}
                  className="btn btn-success btn-block"
                  style={{ marginBottom: 'var(--spacing-3)' }}
                >
                  {loading ? 'Processing...' : '✓ Complete Sale'}
                </button>

                <button
                  onClick={() => {
                    setCart([]);
                    setPatientPhone('');
                    setDoctorName('');
                    setPaymentMode('CASH');
                    setError(null);
                  }}
                  className="btn btn-secondary btn-block"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        {completedSales.length > 0 && (
          <div style={{ marginTop: 'var(--spacing-8)' }}>
            <div className="card card-elevated">
              <div className="card-header">
                <h3 style={{ margin: 0 }}>Recently Completed Sales ({completedSales.length})</h3>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Bill Number</th>
                    <th>Time</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'center' }}>Items</th>
                  </tr>
                </thead>
                <tbody>
                  {completedSales.slice(0, 10).map(sale => (
                    <tr key={sale.id}>
                      <td><strong>{sale.billNumber}</strong></td>
                      <td style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-gray-600)' }}>
                        {sale.timestamp}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'var(--fw-bold)' }}>
                        ₹{sale.total.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-primary">
                          {sale.items.length}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
