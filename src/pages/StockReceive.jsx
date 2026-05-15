import { useState, useEffect } from 'react';
import { receiveStock } from '../api/pharmacyClient';
import { INVENTORY_API_URL } from '../api/pharmacyClient';
import axios from 'axios';

const STORE_ID = '550e8400-e29b-41d4-a716-446655440001';
const fmt = (n) => (parseFloat(n) || 0).toFixed(2);

const invApi = axios.create({ baseURL: INVENTORY_API_URL, withCredentials: true });

const STATUS_LABEL = { DRAFT: 'Draft', APPROVED: 'Approved', SENT: 'Sent', PARTIALLY_RECEIVED: 'Partial', RECEIVED: 'Received' };
const RECEIVABLE = ['APPROVED', 'SENT', 'PARTIALLY_RECEIVED'];

export default function StockReceive() {
  const [pos, setPos] = useState([]);
  const [poSearch, setPoSearch] = useState('');
  const [showPoDropdown, setShowPoDropdown] = useState(false);
  const [selectedPo, setSelectedPo] = useState(null);
  const [lines, setLines] = useState([]); // one entry per PO item
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [posLoading, setPosLoading] = useState(false);

  useEffect(() => {
    setPosLoading(true);
    invApi.get('/api/inventory/purchase-orders')
      .then(r => setPos(r.data || []))
      .catch(e => console.error('Failed to fetch POs:', e))
      .finally(() => setPosLoading(false));
  }, []);

  const filteredPos = pos.filter(po => {
    if (!RECEIVABLE.includes(po.status)) return false;
    if (!poSearch.trim()) return true;
    const q = poSearch.toLowerCase();
    return po.poNumber?.toLowerCase().includes(q) ||
           po.vendor?.name?.toLowerCase().includes(q);
  });

  const handlePoSelect = (po) => {
    setSelectedPo(po);
    setPoSearch(`${po.poNumber} — ${po.vendor?.name ?? ''}`);
    setShowPoDropdown(false);
    setError(null);
    setSuccess(null);
    // Build one editable line per PO item
    setLines((po.items || []).map(item => ({
      poItemId: item.id,
      drugId: item.inventoryItem?.id,
      drugName: item.inventoryItem?.name ?? 'Unknown',
      orderedQty: parseFloat(item.quantity) || 0,
      receivedQty: parseFloat(item.quantity) || 0,    // pre-fill with ordered qty
      unitPrice: parseFloat(item.unitPrice) || 0,
      batchNumber: item.batchNumber || '',
      expiryDate: item.expiryDate || '',
      mrp: '',
      sellingPrice: fmt(item.unitPrice),               // default selling = purchase
    })));
  };

  const clearPo = () => {
    setSelectedPo(null);
    setPoSearch('');
    setLines([]);
    setError(null);
    setSuccess(null);
  };

  const updateLine = (idx, field, value) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const handleSubmit = async () => {
    const incomplete = lines.find(l => !l.batchNumber.trim() || !l.expiryDate);
    if (incomplete) { setError('Fill batch number and expiry date for every item'); return; }

    setLoading(true); setError(null); setSuccess(null);
    try {
      await Promise.all(lines.map(l => receiveStock({
        drugId: l.drugId,
        storeId: STORE_ID,
        poItemId: l.poItemId,
        batchNumber: l.batchNumber,
        expiryDate: l.expiryDate,
        receivedQty: parseFloat(l.receivedQty),
        purchaseRate: l.unitPrice || null,
        mrp: l.mrp ? parseFloat(l.mrp) : null,
        sellingPrice: l.sellingPrice ? parseFloat(l.sellingPrice) : null,
      })));
      setSuccess(`Stock received for PO ${selectedPo.poNumber} — ${lines.length} item(s) added`);
      clearPo();
    } catch (e) {
      setError('Failed: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', fontSize: 12, padding: '5px 7px',
    border: '1px solid var(--color-gray-200)', borderRadius: 6,
    background: 'var(--color-white)', outline: 'none'
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-page)' }}>

      <div style={{
        padding: '16px 24px', background: 'var(--color-white)',
        borderBottom: '1px solid var(--color-gray-200)'
      }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>Receive Stock</h1>
        <p style={{ margin: 0, color: 'var(--color-gray-500)', fontSize: 13 }}>
          Select a Purchase Order from inventory to receive stock
        </p>
      </div>

      <div style={{ padding: '20px 24px', maxWidth: 960 }}>
        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

        {/* PO selector */}
        <div className="card card-elevated" style={{ marginBottom: 20 }}>
          <div className="card-header"><h3 style={{ margin: 0, fontSize: 15 }}>Purchase Order</h3></div>
          <div className="card-body" style={{ padding: '16px', position: 'relative' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  placeholder={posLoading ? 'Loading POs…' : 'Search by PO number or vendor…'}
                  value={poSearch}
                  onChange={e => { setPoSearch(e.target.value); setShowPoDropdown(true); }}
                  onFocus={() => setShowPoDropdown(true)}
                  onBlur={() => setTimeout(() => setShowPoDropdown(false), 180)}
                  className="form-input"
                  style={{ fontSize: 13 }}
                  disabled={!!selectedPo}
                />
                {showPoDropdown && !selectedPo && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    background: 'var(--color-white)', border: '1px solid var(--color-gray-200)',
                    borderRadius: '0 0 8px 8px', boxShadow: '0 4px 16px rgba(0,0,0,.12)',
                    maxHeight: 240, overflowY: 'auto'
                  }}>
                    {filteredPos.length === 0 ? (
                      <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--color-gray-400)' }}>
                        {pos.filter(p => RECEIVABLE.includes(p.status)).length === 0
                          ? 'No approved POs available'
                          : 'No matching POs'}
                      </div>
                    ) : filteredPos.map(po => (
                      <div key={po.id}
                        onMouseDown={() => handlePoSelect(po)}
                        style={{
                          padding: '10px 14px', cursor: 'pointer',
                          borderBottom: '1px solid var(--color-gray-100)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0faf5'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{po.poNumber}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-gray-500)' }}>
                            {po.vendor?.name} · {po.items?.length ?? 0} items
                            {po.expectedDate ? ` · Expected ${po.expectedDate}` : ''}
                          </div>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                          background: po.status === 'PARTIALLY_RECEIVED' ? '#fff7ed' : '#f0fdf4',
                          color: po.status === 'PARTIALLY_RECEIVED' ? '#c2410c' : '#166534'
                        }}>{STATUS_LABEL[po.status] ?? po.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedPo && (
                <button onClick={clearPo} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                  Change PO
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Line items */}
        {lines.length > 0 && (
          <div className="card card-elevated" style={{ marginBottom: 20 }}>
            <div className="card-header" style={{ padding: '12px 16px' }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>Items — {selectedPo.poNumber}</h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>

              {/* Column headers */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 0.7fr 1.2fr 1fr 0.8fr 0.8fr 0.8fr',
                gap: 8, padding: '8px 16px',
                borderBottom: '2px solid var(--color-gray-200)',
                fontSize: 10, fontWeight: 700, color: 'var(--color-gray-500)',
                textTransform: 'uppercase', letterSpacing: '.04em'
              }}>
                <div>Drug</div>
                <div style={{ textAlign: 'right' }}>Ordered</div>
                <div>Batch No.</div>
                <div>Expiry</div>
                <div style={{ textAlign: 'right' }}>Recv Qty</div>
                <div style={{ textAlign: 'right' }}>MRP ₹</div>
                <div style={{ textAlign: 'right' }}>Sell ₹</div>
              </div>

              {lines.map((line, idx) => (
                <div key={line.poItemId} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 0.7fr 1.2fr 1fr 0.8fr 0.8fr 0.8fr',
                  gap: 8, padding: '10px 16px', alignItems: 'center',
                  borderBottom: '1px solid var(--color-gray-100)'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{line.drugName}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>
                      Purchase rate: ₹{fmt(line.unitPrice)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: 13 }}>{line.orderedQty}</div>

                  <input
                    type="text"
                    placeholder="e.g. B2025-01"
                    value={line.batchNumber}
                    onChange={e => updateLine(idx, 'batchNumber', e.target.value)}
                    style={{ ...inputStyle, borderColor: !line.batchNumber.trim() ? '#fca5a5' : undefined }}
                  />

                  <input
                    type="date"
                    value={line.expiryDate}
                    onChange={e => updateLine(idx, 'expiryDate', e.target.value)}
                    style={{ ...inputStyle, borderColor: !line.expiryDate ? '#fca5a5' : undefined }}
                  />

                  <input
                    type="number" min="0" step="0.01"
                    value={line.receivedQty}
                    onChange={e => updateLine(idx, 'receivedQty', e.target.value)}
                    style={{ ...inputStyle, textAlign: 'right' }}
                  />

                  <input
                    type="number" min="0" step="0.01"
                    placeholder="—"
                    value={line.mrp}
                    onChange={e => updateLine(idx, 'mrp', e.target.value)}
                    style={{ ...inputStyle, textAlign: 'right' }}
                  />

                  <input
                    type="number" min="0" step="0.01"
                    value={line.sellingPrice}
                    onChange={e => updateLine(idx, 'sellingPrice', e.target.value)}
                    style={{ ...inputStyle, textAlign: 'right' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {lines.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={clearPo} className="btn btn-secondary">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn btn-success"
              style={{ fontWeight: 700, minWidth: 160 }}>
              {loading ? 'Receiving…' : `Receive ${lines.length} item${lines.length > 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
