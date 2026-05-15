import { useState, useEffect, useRef } from 'react';
import { getDrugs, getBatches, createCounterSaleBulk, getDrugAlternatives } from '../api/pharmacyClient';
import { Link } from 'react-router-dom';

const STORE_ID = '550e8400-e29b-41d4-a716-446655440001';

// ─── tiny helpers ────────────────────────────────────────────────────────────
const fmt = (n) => (parseFloat(n) || 0).toFixed(2);
const expiryLabel = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
const daysUntil = (d) => Math.ceil((new Date(d) - Date.now()) / 86400000);

function ExpiryBadge({ date }) {
  const days = daysUntil(date);
  const colour = days <= 30 ? '#dc2626' : days <= 90 ? '#d97706' : '#16a34a';
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 6px',
      borderRadius: 4, background: colour + '18', color: colour,
      border: `1px solid ${colour}40`
    }}>
      {expiryLabel(date)}
    </span>
  );
}

// ─── inline line-item row ────────────────────────────────────────────────────
function LineItemRow({ item, onChange, onAdd, onRemove, batches, isCart }) {
  // isCart = already added row (read-only except qty/discount tweaks)
  const sellingPrice = item.batch?.sellingPrice ?? 0;

  const subtotal = (item.qty || 0) * sellingPrice;
  const gstAmt   = (subtotal * (item.gstRate || 0)) / 100;
  const discAmt  = parseFloat(item.discount) || 0;
  const total    = subtotal + gstAmt - discAmt;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isCart
        ? '2fr 1fr 1fr 0.7fr 0.7fr 0.9fr 36px'
        : '2fr 1.4fr 0.7fr 0.7fr 0.7fr 0.9fr 36px',
      gap: 6, alignItems: 'center',
      padding: '8px 10px',
      background: isCart ? 'var(--color-white)' : 'var(--color-primary-subtle, #f0faf5)',
      borderRadius: 8,
      border: `1px solid ${isCart ? 'var(--color-gray-200)' : 'var(--color-success, #16a34a)'}40`,
      marginBottom: 4
    }}>

      {/* Drug name / batch selector */}
      {isCart ? (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{item.drugName}</div>
          <div style={{ fontSize: 11, color: 'var(--color-gray-500)' }}>
            Batch {item.batch?.batchNumber} &nbsp;
            <ExpiryBadge date={item.batch?.expiryDate} />
            {item.schedule === 'H1' || item.schedule === 'X'
              ? <span style={{ marginLeft: 6, color: '#dc2626', fontWeight: 700, fontSize: 10 }}>
                  ⚠ {item.schedule}
                </span>
              : null}
          </div>
        </div>
      ) : (
        /* batch dropdown — FEFO auto-selected */
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{item.drugName}</div>
          <select
            value={item.batch?.id ?? ''}
            onChange={(e) => {
              const b = batches.find(x => x.id === e.target.value);
              onChange({ ...item, batch: b });
            }}
            style={selectStyle}
          >
            {batches.map(b => (
              <option key={b.id} value={b.id}>
                {b.batchNumber} · exp {expiryLabel(b.expiryDate)} · ₹{fmt(b.sellingPrice)} · {b.currentQty ?? '?'} left
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Rate (read-only from batch) */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 11, color: 'var(--color-gray-400)', marginBottom: 2 }}>Rate</div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>₹{fmt(sellingPrice)}</div>
      </div>

      {/* Qty */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--color-gray-400)', marginBottom: 2 }}>Qty</div>
        <input
          type="number" min="0.01" step="1"
          value={item.qty === '' ? '' : item.qty}
          onChange={(e) => onChange({ ...item, qty: e.target.value === '' ? '' : parseFloat(e.target.value) })}
          style={inputStyle}
          placeholder="0"
          autoFocus={!isCart}
        />
      </div>

      {/* GST % */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--color-gray-400)', marginBottom: 2 }}>GST %</div>
        <input
          type="number" min="0" step="0.01"
          value={item.gstRate}
          onChange={(e) => onChange({ ...item, gstRate: parseFloat(e.target.value) || 0 })}
          style={inputStyle}
          placeholder="9"
        />
      </div>

      {/* Discount ₹ */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--color-gray-400)', marginBottom: 2 }}>Disc ₹</div>
        <input
          type="number" min="0" step="0.01"
          value={item.discount}
          onChange={(e) => onChange({ ...item, discount: parseFloat(e.target.value) || 0 })}
          style={inputStyle}
          placeholder="0"
        />
      </div>

      {/* Total */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 11, color: 'var(--color-gray-400)', marginBottom: 2 }}>Total</div>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-success, #16a34a)' }}>
          ₹{fmt(total)}
        </div>
        {item.gstRate > 0 && (
          <div style={{ fontSize: 10, color: 'var(--color-gray-400)' }}>
            GST ₹{fmt(gstAmt)}
          </div>
        )}
      </div>

      {/* + / × button */}
      {isCart ? (
        <button onClick={() => onRemove(item.id)}
          style={{ ...iconBtn, background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}>
          ×
        </button>
      ) : (
        <button onClick={() => onAdd(item)}
          disabled={!item.batch || !(item.qty > 0)}
          style={{
            ...iconBtn,
            background: (!item.batch || !(item.qty > 0)) ? 'var(--color-gray-100)' : '#dcfce7',
            color:  (!item.batch || !(item.qty > 0)) ? 'var(--color-gray-400)' : '#16a34a',
            borderColor: (!item.batch || !(item.qty > 0)) ? 'var(--color-gray-200)' : '#86efac',
            cursor: (!item.batch || !(item.qty > 0)) ? 'not-allowed' : 'pointer'
          }}>
          +
        </button>
      )}
    </div>
  );
}

const selectStyle = {
  width: '100%', fontSize: 11, padding: '4px 6px',
  border: '1px solid var(--color-gray-200)',
  borderRadius: 6, background: 'var(--color-white)',
  outline: 'none', cursor: 'pointer'
};
const inputStyle = {
  width: '100%', fontSize: 12, padding: '5px 7px',
  border: '1px solid var(--color-gray-200)',
  borderRadius: 6, background: 'var(--color-white)',
  outline: 'none', textAlign: 'right'
};
const iconBtn = {
  width: 32, height: 32, borderRadius: 8,
  border: '1px solid', fontWeight: 700, fontSize: 16,
  cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', flexShrink: 0, transition: 'all .15s'
};

// column header row
function TableHeader({ isCart }) {
  const cols = isCart
    ? ['Drug / Batch', 'Rate', 'Qty', 'GST %', 'Disc ₹', 'Total', '']
    : ['Drug / Batch (FEFO)', 'Rate', 'Qty', 'GST %', 'Disc ₹', 'Total', ''];
  const grid = isCart
    ? '2fr 1fr 1fr 0.7fr 0.7fr 0.9fr 36px'
    : '2fr 1.4fr 0.7fr 0.7fr 0.7fr 0.9fr 36px';
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: grid,
      gap: 6, padding: '5px 10px',
      borderBottom: '2px solid var(--color-gray-200)',
      marginBottom: 6
    }}>
      {cols.map((c, i) => (
        <div key={i} style={{
          fontSize: 10, fontWeight: 700, color: 'var(--color-gray-500)',
          textTransform: 'uppercase', letterSpacing: '.04em',
          textAlign: i >= 4 ? 'right' : i === 3 ? 'center' : 'left'
        }}>{c}</div>
      ))}
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────
export default function CounterSale() {
  const [drugs, setDrugs]             = useState([]);
  const [drugSearch, setDrugSearch]   = useState('');
  const [showDrop, setShowDrop]       = useState(false);
  const [filtered, setFiltered]       = useState([]);

  // pending row (drug selected, not yet added to cart)
  const [pending, setPending]         = useState(null);   // { drugId, drugName, drug, batch, batches, qty, gstRate, discount }
  const [pendingBatches, setPendingBatches] = useState([]);

  const [alternatives, setAlternatives] = useState([]);
  const [showAlt, setShowAlt]           = useState(false);
  const [showDrugInfo, setShowDrugInfo] = useState(false);

  const [cart, setCart]               = useState([]);
  const [patientPhone, setPatientPhone] = useState('');
  const [doctorName, setDoctorName]   = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [success, setSuccess]         = useState(null);
  const [completedSales, setCompletedSales] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => { fetchDrugs(); }, []);

  useEffect(() => {
    if (drugSearch.trim()) {
      const q = drugSearch.toLowerCase();
      setFiltered(drugs.filter(d =>
        d.brandName?.toLowerCase().includes(q) ||
        d.genericName?.toLowerCase().includes(q) ||
        d.saltName?.toLowerCase().includes(q)
      ));
      setShowDrop(true);
    } else {
      setShowDrop(false);
    }
  }, [drugSearch, drugs]);

  const fetchDrugs = async () => {
    try { setDrugs(await getDrugs()); }
    catch (e) { console.error(e); }
  };

  const handleDrugSelect = async (drug) => {
    setDrugSearch(`${drug.brandName} (${drug.genericName})`);
    setShowDrop(false);
    setShowAlt(false);
    setShowDrugInfo(false);
    setAlternatives([]);

    try {
      const [batchData, altData] = await Promise.all([
        getBatches(drug.id),
        getDrugAlternatives(drug.id).catch(() => [])
      ]);

      // sort FEFO — earliest expiry first, filter out zero stock
      const sorted = [...batchData]
        .filter(b => (b.currentQty ?? 1) > 0)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

      setPendingBatches(sorted);
      setAlternatives(altData);

      // ✅ auto-select FEFO batch; rate auto-fills from batch.sellingPrice
      const autoFEFO = sorted[0] ?? null;
      setPending({
        id: Math.random(),           // temp key
        drugId: drug.id,
        drugName: drug.brandName,
        drug,
        batch: autoFEFO,             // ✅ FEFO auto-selected
        qty: '',
        gstRate: 9,
        discount: 0,
        schedule: drug.schedule
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handlePendingChange = (updated) => setPending(updated);

  const handleAddToCart = (item) => {
    if (!item.batch)       { setError('No batch available for this drug'); return; }
    if (!(item.qty > 0))   { setError('Enter a valid quantity'); return; }
    setError(null);
    setCart(prev => [...prev, { ...item, id: Math.random() }]);
    // reset for next drug
    setPending(null);
    setPendingBatches([]);
    setDrugSearch('');
    searchRef.current?.focus();
  };

  const handleCartItemChange = (updated) => {
    setCart(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  const handleRemove = (id) => setCart(prev => prev.filter(i => i.id !== id));

  // ── totals ────────────────────────────────────────────────────────────────
  const totals = cart.reduce((acc, item) => {
    const sp      = item.batch?.sellingPrice ?? 0;
    const sub     = (item.qty || 0) * sp;
    const gstAmt  = (sub * (item.gstRate || 0)) / 100;
    const disc    = parseFloat(item.discount) || 0;
    acc.subtotal += sub;
    acc.gst      += gstAmt;
    acc.discount += disc;
    acc.total    += sub + gstAmt - disc;
    return acc;
  }, { subtotal: 0, gst: 0, discount: 0, total: 0 });

  const requiresDoctor = cart.some(i => ['H1', 'X'].includes(i.schedule));

  // ── checkout ──────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!cart.length) { setError('Cart is empty'); return; }
    if (requiresDoctor && !doctorName.trim()) {
      setError('Doctor name required for Schedule H1/X drugs');
      return;
    }
    setLoading(true); setError(null); setSuccess(null);
    try {
      const payload = {
        storeId: STORE_ID,
        patientPhone: patientPhone || null,
        paymentMode,
        doctorName: doctorName || null,
        items: cart.map(i => ({
          drugId:   i.drugId,
          batchId:  i.batch.id,
          qty:      i.qty,
          rate:     i.batch.sellingPrice,
          gstRate:  i.gstRate,
          discount: i.discount || 0
        }))
      };
      const bill = await createCounterSaleBulk(payload);
      const record = {
        id: bill.id, billNumber: bill.billNumber,
        timestamp: new Date().toLocaleString(),
        patientPhone: patientPhone || 'Walk-in',
        doctorName: doctorName || '—',
        items: [...cart], ...totals
      };
      setCompletedSales(p => [record, ...p]);
      setSuccess(`✓ Bill ${bill.billNumber} created`);
      setCart([]); setPatientPhone(''); setDoctorName('');
      setTimeout(() => setSuccess(null), 6000);
    } catch (e) {
      setError('Billing failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (sale) => {
    const win = window.open('', '', 'width=520,height=800');
    win.document.write(`<html><head><title>${sale.billNumber}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Courier New',monospace;font-size:12px;padding:16px;max-width:380px;margin:auto}
      h2{text-align:center;font-size:16px;letter-spacing:2px;margin-bottom:4px}
      .sub{text-align:center;color:#666;margin-bottom:12px;font-size:11px}
      .row{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px dashed #ddd}
      .row:last-child{border:none}
      table{width:100%;border-collapse:collapse;margin:10px 0}
      th{border-bottom:1px solid #000;padding:4px;font-size:11px;text-align:left}
      td{padding:4px;font-size:11px;border-bottom:1px dashed #eee}
      .tot{font-weight:700;border-top:2px solid #000;padding-top:6px;margin-top:4px}
      .grand{font-size:14px;font-weight:900}
      @media print{body{padding:0}}
    </style></head><body>
    <h2>ZENOPHARMACY</h2>
    <div class="sub">GST Invoice</div>
    <div class="row"><span>Bill #</span><strong>${sale.billNumber}</strong></div>
    <div class="row"><span>Date</span><span>${sale.timestamp}</span></div>
    <div class="row"><span>Payment</span><span>${paymentMode}</span></div>
    ${sale.patientPhone !== 'Walk-in' ? `<div class="row"><span>Phone</span><span>${sale.patientPhone}</span></div>` : ''}
    ${sale.doctorName !== '—' ? `<div class="row"><span>Doctor</span><span>${sale.doctorName}</span></div>` : ''}
    <table>
      <thead><tr><th>Drug</th><th>Qty</th><th>Rate</th><th>Amt</th></tr></thead>
      <tbody>
        ${sale.items.map(i => {
          const sp = i.batch?.sellingPrice ?? i.rate ?? 0;
          return `<tr>
            <td>${i.drugName}<br/><small style="color:#888">${i.batch?.batchNumber ?? ''}</small></td>
            <td>${i.qty}</td><td>₹${fmt(sp)}</td>
            <td>₹${fmt(i.qty * sp)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    <div class="row tot"><span>Subtotal</span><span>₹${fmt(sale.subtotal)}</span></div>
    <div class="row tot"><span>GST</span><span>₹${fmt(sale.gst)}</span></div>
    ${sale.discount > 0 ? `<div class="row tot"><span>Discount</span><span>-₹${fmt(sale.discount)}</span></div>` : ''}
    <div class="row tot grand"><span>TOTAL</span><span>₹${fmt(sale.total)}</span></div>
    <p style="text-align:center;margin-top:14px;font-size:10px;color:#888">Thank you · Printed ${new Date().toLocaleString()}</p>
    </body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 250);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-page)' }}>

      {/* ── header ── */}
      <div style={{
        padding: '16px 24px', background: 'var(--color-white)',
        borderBottom: '1px solid var(--color-gray-200)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20 }}>Counter Sale</h1>
          <p style={{ margin: 0, color: 'var(--color-gray-500)', fontSize: 13 }}>
            Search drug → batch auto-selected (FEFO) → enter qty → add
          </p>
        </div>
        <Link to="/pharmacy/sales-ledger" className="btn btn-secondary">Sales Ledger</Link>
      </div>

      <div style={{ padding: '20px 24px' }}>

        {/* alerts */}
        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

          {/* ── LEFT ── */}
          <div>

            {/* search bar */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <div className="card card-elevated">
                <div className="card-body" style={{ padding: '14px 16px' }}>
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="🔍  Search drug by brand, generic or salt name…"
                    value={drugSearch}
                    onChange={(e) => setDrugSearch(e.target.value)}
                    onFocus={() => drugSearch && setShowDrop(true)}
                    onBlur={() => setTimeout(() => setShowDrop(false), 180)}
                    className="form-input"
                    style={{ fontSize: 14, paddingLeft: 12 }}
                  />
                </div>
              </div>
              {showDrop && filtered.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--color-white)',
                  border: '1px solid var(--color-gray-200)',
                  borderTop: 'none',
                  maxHeight: 280,
                  overflowY: 'auto',
                  zIndex: 1000,
                  borderRadius: '0 0 10px 10px',
                  boxShadow: '0 8px 24px rgba(0,0,0,.15)',
                  marginTop: '-1px'
                }}>
                  {filtered.map(drug => (
                    <div key={drug.id}
                      onMouseDown={() => handleDrugSelect(drug)}
                      style={{
                        padding: '10px 14px', cursor: 'pointer',
                        borderBottom: '1px solid var(--color-gray-100)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-subtle, #f0faf5)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--color-white)'}
                    >
                      <div>
                        <strong style={{ fontSize: 13 }}>{drug.brandName}</strong>
                        <span style={{ fontSize: 12, color: 'var(--color-gray-500)', marginLeft: 8 }}>
                          {drug.genericName}
                        </span>
                        {drug.saltName && (
                          <span style={{ fontSize: 11, color: 'var(--color-gray-400)', marginLeft: 6 }}>
                            · {drug.saltName}
                          </span>
                        )}
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 7px',
                        borderRadius: 4,
                        background: drug.schedule === 'X' ? '#fef2f2'
                          : drug.schedule === 'H1' ? '#fff7ed'
                          : drug.schedule === 'H'  ? '#fefce8'
                          : '#f0fdf4',
                        color: drug.schedule === 'X' ? '#dc2626'
                          : drug.schedule === 'H1' ? '#c2410c'
                          : drug.schedule === 'H'  ? '#854d0e'
                          : '#166534'
                      }}>{drug.schedule}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* drug info + alternatives */}
            {pending?.drug && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                {(pending.drug.purpose || pending.drug.saltName) && (
                  <div style={{
                    flex: 1, padding: '10px 14px', borderRadius: 8,
                    background: 'var(--color-info-subtle, #eff6ff)',
                    border: '1px solid var(--color-info-light, #bfdbfe)',
                    cursor: 'pointer', fontSize: 12
                  }} onClick={() => setShowDrugInfo(v => !v)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ color: 'var(--color-info-dark, #1e40af)' }}>ℹ Drug info</strong>
                      <span>{showDrugInfo ? '▲' : '▼'}</span>
                    </div>
                    {showDrugInfo && (
                      <div style={{ marginTop: 8, lineHeight: 1.6, color: 'var(--color-info-dark, #1e40af)' }}>
                        {pending.drug.saltName    && <div><b>Salt:</b> {pending.drug.saltName}</div>}
                        {pending.drug.chemicalClass && <div><b>Class:</b> {pending.drug.chemicalClass}</div>}
                        {pending.drug.purpose     && <div><b>Use:</b> {pending.drug.purpose}</div>}
                        {pending.drug.sideEffects && <div><b>Side effects:</b> {pending.drug.sideEffects}</div>}
                        {pending.drug.stripsPerPack && pending.drug.unitsPerStrip && (
                          <div><b>Pack:</b> {pending.drug.stripsPerPack} strips × {pending.drug.unitsPerStrip} tabs</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {alternatives.length > 0 && (
                  <div style={{
                    flex: 1, padding: '10px 14px', borderRadius: 8,
                    background: 'var(--color-warning-subtle, #fffbeb)',
                    border: '1px solid var(--color-warning-light, #fde68a)',
                    cursor: 'pointer', fontSize: 12
                  }} onClick={() => setShowAlt(v => !v)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ color: 'var(--color-warning-dark, #92400e)' }}>
                        💊 {alternatives.length} alternative{alternatives.length > 1 ? 's' : ''}
                      </strong>
                      <span>{showAlt ? '▲' : '▼'}</span>
                    </div>
                    {showAlt && (
                      <div style={{ marginTop: 8 }}>
                        {alternatives.map((alt, i) => {
                          const altDrug = drugs.find(d => d.id === alt.alternativeDrugId);
                          return altDrug ? (
                            <div key={i}
                              onMouseDown={() => handleDrugSelect(altDrug)}
                              style={{
                                padding: '6px 8px', borderRadius: 6, marginBottom: 4,
                                background: 'var(--color-white)',
                                border: '1px solid var(--color-warning-light, #fde68a)',
                                cursor: 'pointer', display: 'flex',
                                justifyContent: 'space-between', alignItems: 'center'
                              }}>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 12 }}>{altDrug.brandName}</div>
                                <div style={{ fontSize: 11, color: '#92400e' }}>{altDrug.genericName} {alt.reason && `· ${alt.reason}`}</div>
                              </div>
                              <span style={{ fontSize: 11 }}>→</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── line items section ── */}
            <div className="card card-elevated" style={{ marginBottom: 16 }}>
              <div className="card-header" style={{ padding: '12px 16px' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Line Items
                </span>
              </div>
              <div className="card-body" style={{ padding: '16px' }}>
                {/* Column Headers */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 1fr 0.8fr 50px',
                  gap: 12,
                  marginBottom: 12,
                  paddingBottom: 12,
                  borderBottom: '2px solid var(--color-gray-200)'
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>Product</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>GST %</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>Qty</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>Price (₹)</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>Disc (₹)</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>Total (₹)</div>
                  <div></div>
                </div>

                {/* Pending Row */}
                {pending && (() => {
                  const sp = pending.batch?.sellingPrice ?? 0;
                  const sub = (pending.qty || 0) * sp;
                  const gst = (sub * (pending.gstRate || 0)) / 100;
                  const disc = parseFloat(pending.discount) || 0;
                  const tot = sub + gst - disc;

                  // Auto-add when qty > 0
                  if (pending.batch && pending.qty > 0) {
                    setTimeout(() => handleAddToCart(pending), 100);
                  }

                  return (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 1fr 0.8fr 50px',
                      gap: 12,
                      alignItems: 'center',
                      marginBottom: 12,
                      padding: '12px',
                      border: '1px solid var(--color-success)',
                      borderRadius: 8,
                      background: 'var(--color-success-subtle)'
                    }}>
                      {/* Product field */}
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={pending.drugName || ''}
                          readOnly
                          style={{
                            width: '100%',
                            padding: '8px 32px 8px 12px',
                            border: '1px solid var(--color-gray-300)',
                            borderRadius: 6,
                            background: 'var(--color-white)',
                            fontSize: 14
                          }}
                        />
                        {pending.batch && (
                          <button
                            onClick={() => {
                              setPending(null);
                              setPendingBatches([]);
                              setDrugSearch('');
                              setShowDrop(false);
                            }}
                            style={{
                              position: 'absolute',
                              right: 8,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              color: '#dc2626',
                              fontSize: 18,
                              cursor: 'pointer'
                            }}>
                            ×
                          </button>
                        )}
                      </div>

                      {/* GST % */}
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-gray-300)', borderRadius: 6, background: 'var(--color-white)' }}>
                        <button onClick={() => handlePendingChange({ ...pending, gstRate: Math.max(0, (pending.gstRate || 0) - 0.5) })} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', fontSize: 12 }}>−</button>
                        <input type="number" value={pending.gstRate} onChange={(e) => handlePendingChange({ ...pending, gstRate: parseFloat(e.target.value) || 0 })} style={{ width: '100%', textAlign: 'center', border: 'none', padding: 4, fontSize: 12 }} />
                        <button onClick={() => handlePendingChange({ ...pending, gstRate: (pending.gstRate || 0) + 0.5 })} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', fontSize: 12 }}>+</button>
                      </div>

                      {/* Qty */}
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-gray-300)', borderRadius: 6, background: 'var(--color-white)' }}>
                        <button onClick={() => handlePendingChange({ ...pending, qty: Math.max(0, (pending.qty || 0) - 1) })} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', fontSize: 12 }}>−</button>
                        <input type="number" value={pending.qty} onChange={(e) => handlePendingChange({ ...pending, qty: parseFloat(e.target.value) || 0 })} style={{ width: '100%', textAlign: 'center', border: 'none', padding: 4, fontSize: 12 }} />
                        <button onClick={() => handlePendingChange({ ...pending, qty: (pending.qty || 0) + 1 })} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', fontSize: 12 }}>+</button>
                      </div>

                      {/* Unit Price */}
                      <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 500 }}>₹{fmt(sp)}</div>

                      {/* Discount */}
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-gray-300)', borderRadius: 6, background: 'var(--color-white)' }}>
                        <input type="number" value={pending.discount} onChange={(e) => handlePendingChange({ ...pending, discount: parseFloat(e.target.value) || 0 })} style={{ width: '100%', textAlign: 'right', padding: 4, border: 'none', fontSize: 12 }} />
                      </div>

                      {/* Total */}
                      <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: 'var(--color-success)' }}>₹{fmt(tot)}</div>

                      {/* Clear button */}
                      <button
                        onClick={() => {
                          setPending(null);
                          setPendingBatches([]);
                          setDrugSearch('');
                        }}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 6,
                          background: '#dc2626',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 18,
                          fontWeight: 700
                        }}>
                        ×
                      </button>
                    </div>
                  );
                })()}

                {/* Cart Rows */}
                {cart.map(item => {
                  const sp = item.batch?.sellingPrice ?? 0;
                  const sub = (item.qty || 0) * sp;
                  const gst = (sub * (item.gstRate || 0)) / 100;
                  const disc = parseFloat(item.discount) || 0;
                  const tot = sub + gst - disc;

                  return (
                    <div key={item.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 1fr 0.8fr 50px',
                      gap: 12,
                      alignItems: 'center',
                      marginBottom: 12,
                      padding: '12px',
                      border: '1px solid var(--color-gray-200)',
                      borderRadius: 8,
                      background: 'var(--color-white)'
                    }}>
                      <div style={{ fontWeight: 500 }}>{item.drugName}</div>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-gray-300)', borderRadius: 6, background: 'var(--color-white)' }}>
                        <button onClick={() => handleCartItemChange({ ...item, gstRate: Math.max(0, (item.gstRate || 0) - 0.5) })} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', fontSize: 12 }}>−</button>
                        <input type="number" value={item.gstRate} onChange={(e) => handleCartItemChange({ ...item, gstRate: parseFloat(e.target.value) || 0 })} style={{ width: '100%', textAlign: 'center', border: 'none', padding: 4, fontSize: 12 }} />
                        <button onClick={() => handleCartItemChange({ ...item, gstRate: (item.gstRate || 0) + 0.5 })} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', fontSize: 12 }}>+</button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-gray-300)', borderRadius: 6, background: 'var(--color-white)' }}>
                        <button onClick={() => handleCartItemChange({ ...item, qty: Math.max(0, (item.qty || 0) - 1) })} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', fontSize: 12 }}>−</button>
                        <input type="number" value={item.qty} onChange={(e) => handleCartItemChange({ ...item, qty: parseFloat(e.target.value) || 0 })} style={{ width: '100%', textAlign: 'center', border: 'none', padding: 4, fontSize: 12 }} />
                        <button onClick={() => handleCartItemChange({ ...item, qty: (item.qty || 0) + 1 })} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', fontSize: 12 }}>+</button>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 500 }}>₹{fmt(sp)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-gray-300)', borderRadius: 6, background: 'var(--color-white)' }}>
                        <input type="number" value={item.discount} onChange={(e) => handleCartItemChange({ ...item, discount: parseFloat(e.target.value) || 0 })} style={{ width: '100%', textAlign: 'right', padding: 4, border: 'none', fontSize: 12 }} />
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: 'var(--color-success)' }}>₹{fmt(tot)}</div>
                      <button onClick={() => handleRemove(item.id)} style={{ width: 40, height: 40, borderRadius: 6, background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer', fontSize: 18 }}>×</button>
                    </div>
                  );
                })}

                {/* Auto-focus search when no pending item */}
                {!pending && (
                  <div style={{ marginTop: 12, textAlign: 'center', color: 'var(--color-gray-500)', fontSize: 12 }}>
                    Search above to add more drugs
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── RIGHT: bill summary ── */}
          <div>
            <div className="card card-elevated" style={{ position: 'sticky', top: 20 }}>
              <div className="card-header"><h3 style={{ margin: 0, fontSize: 15 }}>Bill Summary</h3></div>
              <div className="card-body">

                {/* totals block */}
                <div style={{
                  background: 'var(--color-gray-50)',
                  borderRadius: 8, padding: '12px 14px',
                  border: '1px solid var(--color-gray-200)',
                  marginBottom: 16, fontSize: 13
                }}>
                  {[
                    ['Subtotal', totals.subtotal],
                    ['GST',      totals.gst],
                    totals.discount > 0 ? ['Discount', -totals.discount] : null
                  ].filter(Boolean).map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: 'var(--color-gray-500)' }}>{label}</span>
                      <strong>{val < 0 ? '-' : ''}₹{fmt(Math.abs(val))}</strong>
                    </div>
                  ))}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    borderTop: '1px solid var(--color-gray-200)',
                    paddingTop: 8, marginTop: 4,
                    fontSize: 17, fontWeight: 800
                  }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--color-success, #16a34a)' }}>₹{fmt(totals.total)}</span>
                  </div>
                </div>

                {/* payment mode */}
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>Payment mode</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['CASH','CARD','UPI'].map(m => (
                      <button key={m} onClick={() => setPaymentMode(m)}
                        style={{
                          flex: 1, padding: '7px 4px', borderRadius: 7, fontSize: 12,
                          fontWeight: 700, cursor: 'pointer', border: '1px solid',
                          borderColor: paymentMode === m ? 'var(--color-success, #16a34a)' : 'var(--color-gray-200)',
                          background:  paymentMode === m ? 'var(--color-success-subtle, #f0fdf4)' : 'var(--color-white)',
                          color:       paymentMode === m ? 'var(--color-success, #16a34a)' : 'var(--color-gray-600)',
                          transition: 'all .15s'
                        }}>
                        {m === 'CASH' ? '💵' : m === 'CARD' ? '💳' : '📱'} {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* doctor name — only when H1/X in cart */}
                {requiresDoctor && (
                  <div style={{
                    padding: '10px 12px', borderRadius: 8,
                    background: '#fff7ed', border: '1px solid #fed7aa',
                    marginBottom: 14
                  }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#c2410c', display: 'block', marginBottom: 6 }}>
                      ⚠ Doctor name <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input type="text" placeholder="Prescribing doctor"
                      value={doctorName}
                      onChange={e => setDoctorName(e.target.value)}
                      className="form-input" style={{ fontSize: 12 }} />
                    <div style={{ fontSize: 10, color: '#c2410c', marginTop: 4 }}>Required for Schedule H1/X</div>
                  </div>
                )}

                {/* patient phone */}
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>Patient phone (optional)</label>
                  <input type="tel" placeholder="Mobile number"
                    value={patientPhone}
                    onChange={e => setPatientPhone(e.target.value)}
                    className="form-input" style={{ fontSize: 12 }} />
                </div>

                <button onClick={handleCheckout}
                  disabled={loading || !cart.length || (requiresDoctor && !doctorName.trim())}
                  className="btn btn-success btn-block"
                  style={{ marginBottom: 8, fontSize: 14, fontWeight: 700 }}>
                  {loading ? 'Processing…' : `✓ Complete Sale  ₹${fmt(totals.total)}`}
                </button>

                <button onClick={() => { setCart([]); setPatientPhone(''); setDoctorName(''); setPaymentMode('CASH'); setError(null); }}
                  className="btn btn-secondary btn-block" style={{ fontSize: 13 }}>
                  Clear cart
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── recent sales ── */}
        {completedSales.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div className="card card-elevated">
              <div className="card-header">
                <h3 style={{ margin: 0, fontSize: 15 }}>Recent sales ({completedSales.length})</h3>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Bill #</th><th>Time</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'center' }}>Items</th>
                    <th style={{ textAlign: 'center' }}>Print</th>
                  </tr>
                </thead>
                <tbody>
                  {completedSales.slice(0, 10).map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.billNumber}</strong></td>
                      <td style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>{s.timestamp}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{fmt(s.total)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-primary">{s.items.length}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => handlePrint(s)} className="btn btn-sm btn-secondary">
                          🖨 Print
                        </button>
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