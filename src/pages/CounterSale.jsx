import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDrugs, getBatches, createCounterSaleBulk, getDrugAlternatives } from '../api/pharmacyClient';
import SearchDropdown from '../components/SearchDropdown';
import PageHeader from '../components/shared/PageHeader';
import Alert from '../components/shared/Alert';
import StatusBadge from '../components/shared/StatusBadge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import './CounterSale.css';

// ─── tiny helpers ────────────────────────────────────────────────────────────
const fmt = (n) => (parseFloat(n) || 0).toFixed(2);
const expiryLabel = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });

// units-per-strip ratio for a line (default 1 = drug has no strip ratio)
const lineRatio = (item) => item.drug?.unitsPerStrip || 1;
// batch.sellingPrice is stored per base unit; STRIP mode bills per strip (× ratio).
const lineRate = (item) => {
  const sp = item.batch?.sellingPrice ?? 0;
  return item.uom === 'STRIP' ? sp * lineRatio(item) : sp;
};

// Strip/Unit toggle — hidden when the drug has no usable ratio (ratio <= 1).
function UomToggle({ item, onChange }) {
  const ratio = lineRatio(item);
  if (ratio <= 1) return null;
  return (
    <div className="cs-uom">
      {['UNIT', 'STRIP'].map(u => (
        <button
          key={u}
          type="button"
          onClick={() => onChange({ ...item, uom: u })}
          className={`cs-uom-btn ${item.uom === u ? 'cs-uom-btn--active' : ''}`}
        >
          {u === 'UNIT' ? 'Unit' : `Strip ×${ratio}`}
        </button>
      ))}
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────
export default function CounterSale() {
  const [drugs, setDrugs] = useState([]);
  const [drugSearch, setDrugSearch] = useState('');

  // pending row (drug selected, not yet added to cart)
  const [pending, setPending] = useState(null);
  const [, setPendingBatches] = useState([]);

  const [alternatives, setAlternatives] = useState([]);
  const [showAlt, setShowAlt] = useState(false);
  const [showDrugInfo, setShowDrugInfo] = useState(false);

  const [cart, setCart] = useState([]);
  const [patientPhone, setPatientPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [completedSales, setCompletedSales] = useState([]);

  const fetchDrugs = async () => {
    try { setDrugs(await getDrugs()); }
    catch (e) { console.error(e); }
  };

  useEffect(() => { fetchDrugs(); }, []);

  const filterDrug = (d, q) => {
    const t = q.toLowerCase();
    return d.brandName?.toLowerCase().includes(t) ||
           d.genericName?.toLowerCase().includes(t) ||
           d.saltName?.toLowerCase().includes(t);
  };

  const handleDrugSelect = async (drug) => {
    setDrugSearch(`${drug.brandName} (${drug.genericName})`);
    setShowAlt(false);
    setShowDrugInfo(false);
    setAlternatives([]);

    try {
      const [batchData, altData] = await Promise.all([
        getBatches(drug.id),
        getDrugAlternatives(drug.id).catch(() => []),
      ]);

      // sort FEFO — earliest expiry first, filter out zero stock
      const sorted = [...batchData]
        .filter(b => (b.currentQty ?? 1) > 0)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

      setAlternatives(altData);

      if (sorted.length === 0) {
        setError(
          batchData.length === 0
            ? `${drug.brandName} — no batches available (out of stock)`
            : `${drug.brandName} — all batches are out of stock`
        );
        setPending(null);
        setPendingBatches([]);
        setDrugSearch('');
        return;
      }

      setError(null);
      setPendingBatches(sorted);

      const autoFEFO = sorted[0] ?? null;
      setPending({
        id: Math.random(),
        drugId: drug.id,
        drugName: drug.brandName,
        drug,
        batch: autoFEFO,
        qty: '',
        uom: 'UNIT',
        gstRate: 9,
        discount: 0,
        schedule: drug.schedule,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handlePendingChange = (updated) => setPending(updated);

  const handleAddToCart = (item) => {
    if (!item.batch) { setError('No batch available for this drug'); return; }
    if (!(item.qty > 0)) { setError('Enter a valid quantity'); return; }
    setError(null);
    setCart(prev => [...prev, { ...item, id: Math.random() }]);
    setPending(null);
    setPendingBatches([]);
    setDrugSearch('');
  };

  const handleCartItemChange = (updated) => {
    setCart(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  const handleRemove = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const clearPending = () => {
    setPending(null);
    setPendingBatches([]);
    setDrugSearch('');
  };

  // ── totals ──
  const totals = cart.reduce((acc, item) => {
    const sp = lineRate(item);
    const sub = (item.qty || 0) * sp;
    const gstAmt = (sub * (item.gstRate || 0)) / 100;
    const disc = parseFloat(item.discount) || 0;
    acc.subtotal += sub;
    acc.gst += gstAmt;
    acc.discount += disc;
    acc.total += sub + gstAmt - disc;
    return acc;
  }, { subtotal: 0, gst: 0, discount: 0, total: 0 });

  const requiresDoctor = cart.some(i => ['H1', 'X'].includes(i.schedule));

  // ── checkout ──
  const handleCheckout = async () => {
    if (!cart.length) { setError('Cart is empty'); return; }
    if (requiresDoctor && !doctorName.trim()) {
      setError('Doctor name required for Schedule H1/X drugs');
      return;
    }
    setLoading(true); setError(null); setSuccess(null);
    try {
      const payload = {
        patientPhone: patientPhone || null,
        paymentMode,
        doctorName: doctorName || null,
        items: cart.map(i => ({
          drugId: i.drugId,
          batchId: i.batch.id,
          qty: i.qty,
          uom: i.uom || 'UNIT',
          rate: lineRate(i),
          gstRate: i.gstRate,
          discount: i.discount || 0,
        })),
      };
      const bill = await createCounterSaleBulk(payload);
      const record = {
        id: bill.id, billNumber: bill.billNumber,
        timestamp: new Date().toLocaleString(),
        patientPhone: patientPhone || 'Walk-in',
        doctorName: doctorName || '—',
        items: [...cart], ...totals,
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
          const sp = lineRate(i) || i.rate || 0;
          const uomLabel = (i.uom || 'UNIT') === 'STRIP' ? 'strip' : 'unit';
          return `<tr>
            <td>${i.drugName}<br/><small style="color:#888">${i.batch?.batchNumber ?? ''}</small></td>
            <td>${i.qty} ${uomLabel}</td><td>₹${fmt(sp)}</td>
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

  const recentColumns = [
    { header: 'Bill #', render: (_, s) => <strong>{s.billNumber}</strong> },
    { header: 'Time', render: (_, s) => <span className="text-muted text-sm">{s.timestamp}</span> },
    { header: 'Amount', align: 'right', render: (_, s) => <strong>₹{fmt(s.total)}</strong> },
    { header: 'Items', align: 'center', render: (_, s) => <StatusBadge tone="primary">{s.items.length}</StatusBadge> },
    { header: 'Print', align: 'center', render: (_, s) => <Button size="sm" variant="secondary" onClick={() => handlePrint(s)}>🖨 Print</Button> },
  ];

  // pending derived values
  let pendingTotal = 0;
  if (pending) {
    const sp = lineRate(pending);
    const sub = (pending.qty || 0) * sp;
    const gst = (sub * (pending.gstRate || 0)) / 100;
    const disc = parseFloat(pending.discount) || 0;
    pendingTotal = sub + gst - disc;
    // Auto-add when qty > 0
    if (pending.batch && pending.qty > 0) {
      setTimeout(() => handleAddToCart(pending), 100);
    }
  }

  return (
    <div>
      <PageHeader
        title="Counter Sale"
        subtitle="Search drug → batch auto-selected (FEFO) → enter qty → add"
        actions={<Link to="/pharmacy/sales-ledger" className="btn btn-secondary">Sales Ledger</Link>}
      />

      {error && <Alert tone="error" className="section-gap">{error}</Alert>}
      {success && <Alert tone="success" className="section-gap">{success}</Alert>}

      <div className="cs-grid">
        {/* ── LEFT ── */}
        <div>
          {/* search bar */}
          <Card className="cs-search-card">
            <SearchDropdown
              value={drugSearch}
              onChange={setDrugSearch}
              onSelect={handleDrugSelect}
              items={drugs}
              filterFn={filterDrug}
              placeholder="🔍  Search drug by brand, generic or salt name…"
              allowClear={false}
              renderItem={(drug) => (
                <div className="sd-row-between">
                  <div>
                    <strong>{drug.brandName}</strong>
                    <span className="sd-muted">{drug.genericName}</span>
                    {drug.saltName && <span className="sd-muted sd-small">· {drug.saltName}</span>}
                  </div>
                  <span className={`sd-badge sd-badge-${drug.schedule === 'X' ? 'danger' : (drug.schedule === 'H1' || drug.schedule === 'H') ? 'warn' : 'ok'}`}>
                    {drug.schedule}
                  </span>
                </div>
              )}
            />
          </Card>

          {/* drug info + alternatives */}
          {pending?.drug && (
            <div className="cs-info-row">
              {(pending.drug.purpose || pending.drug.saltName) && (
                <div className="cs-info-panel" onClick={() => setShowDrugInfo(v => !v)}>
                  <div className="cs-info-head">
                    <strong>ℹ Drug info</strong>
                    <span>{showDrugInfo ? '▲' : '▼'}</span>
                  </div>
                  {showDrugInfo && (
                    <div className="cs-info-body">
                      {pending.drug.saltName && <div><b>Salt:</b> {pending.drug.saltName}</div>}
                      {pending.drug.chemicalClass && <div><b>Class:</b> {pending.drug.chemicalClass}</div>}
                      {pending.drug.purpose && <div><b>Use:</b> {pending.drug.purpose}</div>}
                      {pending.drug.sideEffects && <div><b>Side effects:</b> {pending.drug.sideEffects}</div>}
                      {pending.drug.stripsPerPack && pending.drug.unitsPerStrip && (
                        <div><b>Pack:</b> {pending.drug.stripsPerPack} strips × {pending.drug.unitsPerStrip} tabs</div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {alternatives.length > 0 && (
                <div className="cs-info-panel cs-info-panel--warn" onClick={() => setShowAlt(v => !v)}>
                  <div className="cs-info-head">
                    <strong>💊 {alternatives.length} alternative{alternatives.length > 1 ? 's' : ''}</strong>
                    <span>{showAlt ? '▲' : '▼'}</span>
                  </div>
                  {showAlt && (
                    <div className="cs-info-body">
                      {alternatives.map((alt, i) => {
                        const altDrug = drugs.find(d => d.id === alt.alternativeDrugId);
                        return altDrug ? (
                          <div key={i} onMouseDown={() => handleDrugSelect(altDrug)} className="cs-alt-item">
                            <div>
                              <div className="cs-alt-name">{altDrug.brandName}</div>
                              <div className="cs-alt-generic">{altDrug.genericName} {alt.reason && `· ${alt.reason}`}</div>
                            </div>
                            <span>→</span>
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
          <Card padded={false} title="Line Items" className="section-gap">
            <div className="card-body">
              {/* Column Headers */}
              <div className="cs-li-head">
                <div className="cs-li-col">Product</div>
                <div className="cs-li-col">GST %</div>
                <div className="cs-li-col">Qty</div>
                <div className="cs-li-col">Price (₹)</div>
                <div className="cs-li-col">Disc (₹)</div>
                <div className="cs-li-col">Total (₹)</div>
                <div />
              </div>

              {/* Pending Row */}
              {pending && (
                <div className="cs-li-row cs-li-row--pending">
                  <div className="cs-product">
                    <input type="text" value={pending.drugName || ''} readOnly className="cs-product-input" />
                    {pending.batch && (
                      <button onClick={clearPending} className="cs-product-clear">×</button>
                    )}
                    <UomToggle item={pending} onChange={handlePendingChange} />
                  </div>

                  <div className="cs-stepper">
                    <button className="cs-stepper-btn" onClick={() => handlePendingChange({ ...pending, gstRate: Math.max(0, (pending.gstRate || 0) - 0.5) })}>−</button>
                    <input type="number" value={pending.gstRate} onChange={(e) => handlePendingChange({ ...pending, gstRate: parseFloat(e.target.value) || 0 })} className="cs-stepper-input" />
                    <button className="cs-stepper-btn" onClick={() => handlePendingChange({ ...pending, gstRate: (pending.gstRate || 0) + 0.5 })}>+</button>
                  </div>

                  <div className="cs-stepper">
                    <button className="cs-stepper-btn" onClick={() => handlePendingChange({ ...pending, qty: Math.max(0, (pending.qty || 0) - 1) })}>−</button>
                    <input type="number" value={pending.qty} onChange={(e) => handlePendingChange({ ...pending, qty: parseFloat(e.target.value) || 0 })} className="cs-stepper-input" />
                    <button className="cs-stepper-btn" onClick={() => handlePendingChange({ ...pending, qty: (pending.qty || 0) + 1 })}>+</button>
                  </div>

                  <div className="cs-price">₹{fmt(lineRate(pending))}</div>

                  <div className="cs-num-box">
                    <input type="number" value={pending.discount} onChange={(e) => handlePendingChange({ ...pending, discount: parseFloat(e.target.value) || 0 })} className="cs-num-input" />
                  </div>

                  <div className="cs-total">₹{fmt(pendingTotal)}</div>

                  <button onClick={clearPending} className="cs-remove-btn">×</button>
                </div>
              )}

              {/* Cart Rows */}
              {cart.map(item => {
                const sp = lineRate(item);
                const sub = (item.qty || 0) * sp;
                const gst = (sub * (item.gstRate || 0)) / 100;
                const disc = parseFloat(item.discount) || 0;
                const tot = sub + gst - disc;

                return (
                  <div key={item.id} className="cs-li-row">
                    <div className="cs-cart-name">
                      {item.drugName}
                      <UomToggle item={item} onChange={handleCartItemChange} />
                    </div>
                    <div className="cs-stepper">
                      <button className="cs-stepper-btn" onClick={() => handleCartItemChange({ ...item, gstRate: Math.max(0, (item.gstRate || 0) - 0.5) })}>−</button>
                      <input type="number" value={item.gstRate} onChange={(e) => handleCartItemChange({ ...item, gstRate: parseFloat(e.target.value) || 0 })} className="cs-stepper-input" />
                      <button className="cs-stepper-btn" onClick={() => handleCartItemChange({ ...item, gstRate: (item.gstRate || 0) + 0.5 })}>+</button>
                    </div>
                    <div className="cs-stepper">
                      <button className="cs-stepper-btn" onClick={() => handleCartItemChange({ ...item, qty: Math.max(0, (item.qty || 0) - 1) })}>−</button>
                      <input type="number" value={item.qty} onChange={(e) => handleCartItemChange({ ...item, qty: parseFloat(e.target.value) || 0 })} className="cs-stepper-input" />
                      <button className="cs-stepper-btn" onClick={() => handleCartItemChange({ ...item, qty: (item.qty || 0) + 1 })}>+</button>
                    </div>
                    <div className="cs-price">₹{fmt(sp)}</div>
                    <div className="cs-num-box">
                      <input type="number" value={item.discount} onChange={(e) => handleCartItemChange({ ...item, discount: parseFloat(e.target.value) || 0 })} className="cs-num-input" />
                    </div>
                    <div className="cs-total">₹{fmt(tot)}</div>
                    <button onClick={() => handleRemove(item.id)} className="cs-remove-btn">×</button>
                  </div>
                );
              })}

              {!pending && (
                <div className="cs-li-empty">Search above to add more drugs</div>
              )}
            </div>
          </Card>
        </div>

        {/* ── RIGHT: bill summary ── */}
        <div>
          <Card padded={false} title="Bill Summary" className="cs-summary">
            <div className="card-body">
              <div className="cs-totals">
                {[
                  ['Subtotal', totals.subtotal],
                  ['GST', totals.gst],
                  totals.discount > 0 ? ['Discount', -totals.discount] : null,
                ].filter(Boolean).map(([label, val]) => (
                  <div key={label} className="cs-totals-row">
                    <span className="cs-totals-label">{label}</span>
                    <strong>{val < 0 ? '-' : ''}₹{fmt(Math.abs(val))}</strong>
                  </div>
                ))}
                <div className="cs-totals-grand">
                  <span>Total</span>
                  <span className="cs-totals-grand-value">₹{fmt(totals.total)}</span>
                </div>
              </div>

              {/* payment mode */}
              <div className="form-group cs-field">
                <label className="form-label">Payment mode</label>
                <div className="cs-pay">
                  {['CASH', 'CARD', 'UPI'].map(m => (
                    <button key={m} onClick={() => setPaymentMode(m)} className={`cs-pay-btn ${paymentMode === m ? 'cs-pay-btn--active' : ''}`}>
                      {m === 'CASH' ? '💵' : m === 'CARD' ? '💳' : '📱'} {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* doctor name — only when H1/X in cart */}
              {requiresDoctor && (
                <div className="cs-doctor">
                  <label className="cs-doctor-label">⚠ Doctor name <span className="text-error">*</span></label>
                  <input type="text" placeholder="Prescribing doctor" value={doctorName} onChange={e => setDoctorName(e.target.value)} className="form-input" />
                  <div className="cs-doctor-hint">Required for Schedule H1/X</div>
                </div>
              )}

              {/* patient phone */}
              <div className="form-group cs-field">
                <label className="form-label">Patient phone (optional)</label>
                <input type="tel" placeholder="Mobile number" value={patientPhone} onChange={e => setPatientPhone(e.target.value)} className="form-input" />
              </div>

              <Button
                variant="success"
                block
                onClick={handleCheckout}
                disabled={loading || !cart.length || (requiresDoctor && !doctorName.trim())}
                className="section-gap"
              >
                {loading ? 'Processing…' : `✓ Complete Sale  ₹${fmt(totals.total)}`}
              </Button>

              <Button
                variant="secondary"
                block
                onClick={() => { setCart([]); setPatientPhone(''); setDoctorName(''); setPaymentMode('CASH'); setError(null); }}
              >
                Clear cart
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* ── recent sales ── */}
      {completedSales.length > 0 && (
        <Card padded={false} title={`Recent sales (${completedSales.length})`} className="cs-recent">
          <Table columns={recentColumns} data={completedSales.slice(0, 10)} />
        </Card>
      )}
    </div>
  );
}
