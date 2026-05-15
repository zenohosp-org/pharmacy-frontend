import { useState, useEffect, useRef } from 'react';
import { getDrugs, getBatches, searchHmsPatients, getPatientEncounter, searchHmsDoctors, createWardIssue } from '../api/pharmacyClient';

const STORE_ID = '550e8400-e29b-41d4-a716-446655440001';
const fmt = (n) => (parseFloat(n) || 0).toFixed(2);
const expiryLabel = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });

export default function Dispensing() {
  const [drugs, setDrugs] = useState([]);
  const [drugSearch, setDrugSearch] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const [cart, setCart] = useState([]);
  const [doctorName, setDoctorName] = useState('');
  const [doctorQuery, setDoctorQuery] = useState('');
  const [doctorResults, setDoctorResults] = useState([]);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const doctorTimer = useRef(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [completedIssues, setCompletedIssues] = useState([]);
  const drugSearchRef = useRef(null);

  // Patient
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [encounter, setEncounter] = useState(null); // null=not loaded, false=none
  const [patientLoading, setPatientLoading] = useState(false);
  const patientTimer = useRef(null);

  // Pending drug row
  const [pending, setPending] = useState(null);
  const [pendingBatches, setPendingBatches] = useState([]);

  useEffect(() => { getDrugs().then(setDrugs).catch(console.error); }, []);

  useEffect(() => {
    if (drugSearch.trim()) {
      const q = drugSearch.toLowerCase();
      setFiltered(drugs.filter(d =>
        d.brandName?.toLowerCase().includes(q) ||
        d.genericName?.toLowerCase().includes(q)
      ));
      setShowDrop(true);
    } else {
      setShowDrop(false);
    }
  }, [drugSearch, drugs]);

  const handlePatientQueryChange = (q) => {
    setPatientQuery(q);
    if (!q.trim()) { setPatientResults([]); return; }
    clearTimeout(patientTimer.current);
    patientTimer.current = setTimeout(async () => {
      setPatientLoading(true);
      try { setPatientResults(await searchHmsPatients(q)); }
      catch (e) { console.error(e); }
      finally { setPatientLoading(false); }
    }, 300);
  };

  const handlePatientSelect = async (p) => {
    setSelectedPatient(p);
    setPatientQuery(p.name + (p.uhid ? ' · ' + p.uhid : ''));
    setPatientResults([]);
    setEncounter(null);
    try {
      const enc = await getPatientEncounter(p.id);
      setEncounter(enc || false);
    } catch (e) {
      setEncounter(false);
    }
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setEncounter(null);
    setPatientQuery('');
    setPatientResults([]);
  };

  const handleDoctorQueryChange = (q) => {
    setDoctorQuery(q);
    setDoctorName(q); // allow free-text fallback if no HMS result picked
    if (!q.trim()) { setDoctorResults([]); return; }
    clearTimeout(doctorTimer.current);
    doctorTimer.current = setTimeout(async () => {
      setDoctorLoading(true);
      try { setDoctorResults(await searchHmsDoctors(q)); }
      catch (e) { console.error(e); }
      finally { setDoctorLoading(false); }
    }, 300);
  };

  const handleDoctorSelect = (doctor) => {
    setDoctorName(doctor.name);
    setDoctorQuery(doctor.name);
    setDoctorResults([]);
  };

  const handleDrugSelect = async (drug) => {
    setDrugSearch('');
    setShowDrop(false);
    try {
      const batches = await getBatches(drug.id);
      const sorted = batches
        .filter(b => (b.currentQty ?? 1) > 0)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
      setPendingBatches(sorted);
      setPending({
        id: Math.random(),
        drugId: drug.id,
        drugName: drug.brandName,
        batch: sorted[0] ?? null,
        qty: 1,
        gstRate: 9,
        discount: 0,
        schedule: drug.schedule
      });
    } catch (e) { console.error(e); }
  };

  const handleAddToCart = () => {
    if (!pending?.batch) { setError('No batch available'); return; }
    if (!(pending.qty > 0)) { setError('Enter a valid quantity'); return; }
    setError(null);
    setCart(prev => [...prev, { ...pending, id: Math.random() }]);
    setPending(null);
    setPendingBatches([]);
    drugSearchRef.current?.focus();
  };

  const handleRemove = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const totals = cart.reduce((acc, item) => {
    const sp = item.batch?.sellingPrice ?? 0;
    const sub = (item.qty || 0) * sp;
    const gst = (sub * (item.gstRate || 0)) / 100;
    const disc = parseFloat(item.discount) || 0;
    acc.total += sub + gst - disc;
    return acc;
  }, { total: 0 });

  const requiresDoctor = cart.some(i => ['H1', 'X'].includes(i.schedule));

  const handleSubmit = async () => {
    if (!selectedPatient) { setError('Select a patient'); return; }
    if (!encounter) { setError('Patient has no active encounter'); return; }
    if (!cart.length) { setError('Add at least one drug'); return; }
    if (requiresDoctor && !doctorName.trim()) { setError('Doctor name required for Schedule H1/X drugs'); return; }
    setLoading(true); setError(null);
    try {
      const payload = {
        storeId: STORE_ID,
        patientId: selectedPatient.id,
        hmsEncounterId: encounter.id,
        doctorName: doctorName || null,
        notes: notes || null,
        items: cart.map(i => ({
          drugId: i.drugId,
          qty: i.qty,
          rate: i.batch.sellingPrice,
          gstRate: i.gstRate,
          discount: i.discount || 0
        }))
      };
      const bill = await createWardIssue(payload);
      setCompletedIssues(prev => [{
        billNumber: bill.billNumber,
        patientName: selectedPatient.name,
        ward: encounter.ward,
        total: totals.total,
        timestamp: new Date().toLocaleString()
      }, ...prev]);
      setSuccess(`Dispensed — Bill ${bill.billNumber} charged to patient's encounter`);
      setCart([]); setDoctorName(''); setNotes('');
      setTimeout(() => setSuccess(null), 8000);
    } catch (e) {
      setError('Failed: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', fontSize: 12, padding: '6px 8px',
    border: '1px solid var(--color-gray-200)',
    borderRadius: 6, background: 'var(--color-white)', outline: 'none'
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-page)' }}>

      <div style={{
        padding: '16px 24px', background: 'var(--color-white)',
        borderBottom: '1px solid var(--color-gray-200)'
      }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>IPD Dispensing</h1>
        <p style={{ margin: 0, color: 'var(--color-gray-500)', fontSize: 13 }}>
          Dispense drugs to an admitted patient — charged to their HMS encounter bill
        </p>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>

          {/* LEFT — drug list */}
          <div>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <div className="card card-elevated">
                <div className="card-body" style={{ padding: '14px 16px' }}>
                  <input
                    ref={drugSearchRef}
                    type="text"
                    placeholder="Search drug to add…"
                    value={drugSearch}
                    onChange={e => setDrugSearch(e.target.value)}
                    onFocus={() => drugSearch && setShowDrop(true)}
                    onBlur={() => setTimeout(() => setShowDrop(false), 180)}
                    className="form-input"
                    style={{ fontSize: 14 }}
                    disabled={!encounter}
                  />
                  {!selectedPatient && (
                    <div style={{ fontSize: 11, color: 'var(--color-gray-400)', marginTop: 6 }}>
                      Select a patient with an active encounter first
                    </div>
                  )}
                  {selectedPatient && encounter === false && (
                    <div style={{ fontSize: 11, color: '#dc2626', marginTop: 6 }}>
                      No active encounter — dispensing not possible
                    </div>
                  )}
                </div>
              </div>
              {showDrop && filtered.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: 'var(--color-white)', border: '1px solid var(--color-gray-200)',
                  borderTop: 'none', maxHeight: 260, overflowY: 'auto', zIndex: 1000,
                  borderRadius: '0 0 10px 10px', boxShadow: '0 8px 24px rgba(0,0,0,.15)'
                }}>
                  {filtered.map(drug => (
                    <div key={drug.id}
                      onMouseDown={() => handleDrugSelect(drug)}
                      style={{
                        padding: '10px 14px', cursor: 'pointer',
                        borderBottom: '1px solid var(--color-gray-100)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0faf5'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <div>
                        <strong style={{ fontSize: 13 }}>{drug.brandName}</strong>
                        <span style={{ fontSize: 12, color: 'var(--color-gray-500)', marginLeft: 8 }}>{drug.genericName}</span>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                        background: drug.schedule === 'X' ? '#fef2f2' : drug.schedule === 'H1' ? '#fff7ed' : '#f0fdf4',
                        color: drug.schedule === 'X' ? '#dc2626' : drug.schedule === 'H1' ? '#c2410c' : '#166534'
                      }}>{drug.schedule}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending row */}
            {pending && (
              <div className="card card-elevated" style={{ marginBottom: 12 }}>
                <div className="card-body" style={{ padding: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-gray-500)', marginBottom: 4 }}>Drug</div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{pending.drugName}</div>
                      {pendingBatches.length > 1 && (
                        <select value={pending.batch?.id ?? ''} onChange={e => {
                          const b = pendingBatches.find(x => x.id === e.target.value);
                          setPending(p => ({ ...p, batch: b }));
                        }} style={{ ...inputStyle, marginTop: 4 }}>
                          {pendingBatches.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.batchNumber} · {expiryLabel(b.expiryDate)} · ₹{fmt(b.sellingPrice)}
                            </option>
                          ))}
                        </select>
                      )}
                      {pendingBatches.length === 1 && (
                        <div style={{ fontSize: 11, color: 'var(--color-gray-400)', marginTop: 2 }}>
                          Batch {pending.batch?.batchNumber} · exp {expiryLabel(pending.batch?.expiryDate)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-gray-500)', marginBottom: 4 }}>Qty</div>
                      <input type="number" min="1" value={pending.qty} autoFocus
                        onChange={e => setPending(p => ({ ...p, qty: parseFloat(e.target.value) || 0 }))}
                        style={inputStyle} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-gray-500)', marginBottom: 4 }}>GST %</div>
                      <input type="number" min="0" value={pending.gstRate}
                        onChange={e => setPending(p => ({ ...p, gstRate: parseFloat(e.target.value) || 0 }))}
                        style={inputStyle} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-gray-500)', marginBottom: 4 }}>Rate</div>
                      <div style={{ fontWeight: 600, fontSize: 14, paddingTop: 6 }}>₹{fmt(pending.batch?.sellingPrice)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, paddingBottom: 2 }}>
                      <button onClick={handleAddToCart}
                        disabled={!pending.batch || !(pending.qty > 0)}
                        className="btn btn-success" style={{ padding: '6px 14px' }}>Add</button>
                      <button onClick={() => { setPending(null); setPendingBatches([]); }}
                        className="btn btn-secondary" style={{ padding: '6px 10px' }}>×</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cart */}
            {cart.length > 0 && (
              <div className="card card-elevated">
                <div className="card-header" style={{ padding: '10px 16px' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-gray-500)' }}>
                    Items ({cart.length})
                  </span>
                </div>
                <div className="card-body" style={{ padding: '8px 16px' }}>
                  {cart.map(item => {
                    const sp = item.batch?.sellingPrice ?? 0;
                    const sub = item.qty * sp;
                    const gst = (sub * item.gstRate) / 100;
                    const disc = item.discount || 0;
                    return (
                      <div key={item.id} style={{
                        display: 'grid', gridTemplateColumns: '2fr 0.7fr 0.6fr 0.8fr auto',
                        gap: 12, alignItems: 'center', padding: '10px 0',
                        borderBottom: '1px solid var(--color-gray-100)'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{item.drugName}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>
                            {item.batch?.batchNumber} · ₹{fmt(sp)}/unit
                            {(item.schedule === 'H1' || item.schedule === 'X') && (
                              <span style={{ marginLeft: 6, color: '#dc2626', fontWeight: 700 }}>⚠ {item.schedule}</span>
                            )}
                          </div>
                        </div>
                        <input type="number" min="1" value={item.qty}
                          onChange={e => setCart(prev => prev.map(i => i.id === item.id ? { ...i, qty: parseFloat(e.target.value) || 0 } : i))}
                          style={{ ...inputStyle, textAlign: 'center' }} />
                        <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--color-gray-500)' }}>{item.gstRate}% GST</div>
                        <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 13 }}>₹{fmt(sub + gst - disc)}</div>
                        <button onClick={() => handleRemove(item.id)}
                          style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>×</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — patient + submit */}
          <div>
            <div className="card card-elevated" style={{ position: 'sticky', top: 20 }}>
              <div className="card-header"><h3 style={{ margin: 0, fontSize: 15 }}>Patient</h3></div>
              <div className="card-body">

                {/* Patient search */}
                <div className="form-group" style={{ marginBottom: 14, position: 'relative' }}>
                  <label className="form-label" style={{ fontSize: 12 }}>Search patient <span style={{ color: '#dc2626' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="Name, UHID or phone…"
                    value={patientQuery}
                    onChange={e => handlePatientQueryChange(e.target.value)}
                    className="form-input"
                    style={{ fontSize: 12, paddingRight: selectedPatient ? 28 : undefined }}
                  />
                  {selectedPatient && (
                    <button onClick={clearPatient} style={{
                      position: 'absolute', right: 8, top: 38, background: 'none', border: 'none',
                      color: '#dc2626', fontSize: 16, cursor: 'pointer'
                    }}>×</button>
                  )}
                  {patientLoading && <div style={{ fontSize: 11, color: 'var(--color-gray-400)', marginTop: 4 }}>Searching…</div>}
                  {patientResults.length > 0 && (
                    <div style={{
                      position: 'absolute', left: 0, right: 0, zIndex: 100,
                      background: 'var(--color-white)', border: '1px solid var(--color-gray-200)',
                      borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,.1)',
                      maxHeight: 200, overflowY: 'auto'
                    }}>
                      {patientResults.map(p => (
                        <div key={p.id}
                          onMouseDown={() => handlePatientSelect(p)}
                          style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 12, borderBottom: '1px solid var(--color-gray-100)' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f0faf5'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ color: 'var(--color-gray-500)', fontSize: 11 }}>{p.uhid}{p.ward ? ' · Ward ' + p.ward : ''}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Encounter status */}
                {selectedPatient && (
                  <div style={{
                    padding: '10px 12px', borderRadius: 8, marginBottom: 14, fontSize: 12,
                    background: encounter ? '#f0fdf4' : encounter === false ? '#fef2f2' : '#fafafa',
                    border: `1px solid ${encounter ? '#86efac' : encounter === false ? '#fca5a5' : 'var(--color-gray-200)'}`
                  }}>
                    {encounter === null && <span style={{ color: 'var(--color-gray-400)' }}>Checking encounter…</span>}
                    {encounter === false && <span style={{ color: '#dc2626', fontWeight: 600 }}>No active encounter</span>}
                    {encounter && (
                      <>
                        <div style={{ fontWeight: 700, color: '#166534' }}>Active {encounter.type}</div>
                        {encounter.ward && <div style={{ color: '#166534' }}>Ward: {encounter.ward}</div>}
                        {encounter.doctorName && <div style={{ color: '#166534' }}>Dr {encounter.doctorName}</div>}
                      </>
                    )}
                  </div>
                )}

                {/* Doctor search */}
                <div className="form-group" style={{
                  marginBottom: 14, position: 'relative',
                  ...(requiresDoctor ? {
                    padding: '10px 12px', borderRadius: 8,
                    background: '#fff7ed', border: '1px solid #fed7aa'
                  } : {})
                }}>
                  <label style={{
                    fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6,
                    color: requiresDoctor ? '#c2410c' : undefined
                  }}>
                    {requiresDoctor ? '⚠ Doctor name' : 'Doctor name'}
                    {requiresDoctor && <span style={{ color: '#dc2626' }}> *</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="Search doctor name…"
                    value={doctorQuery}
                    onChange={e => handleDoctorQueryChange(e.target.value)}
                    onBlur={() => setTimeout(() => setDoctorResults([]), 180)}
                    className="form-input"
                    style={{ fontSize: 12 }}
                  />
                  {doctorLoading && (
                    <div style={{ fontSize: 11, color: 'var(--color-gray-400)', marginTop: 4 }}>Searching…</div>
                  )}
                  {doctorResults.length > 0 && (
                    <div style={{
                      position: 'absolute', left: requiresDoctor ? 12 : 0, right: requiresDoctor ? 12 : 0,
                      zIndex: 100, background: 'var(--color-white)',
                      border: '1px solid var(--color-gray-200)', borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,.1)', maxHeight: 180, overflowY: 'auto'
                    }}>
                      {doctorResults.map((d, i) => (
                        <div key={d.id ?? i}
                          onMouseDown={() => handleDoctorSelect(d)}
                          style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 12, borderBottom: '1px solid var(--color-gray-100)' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f0faf5'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <div style={{ fontWeight: 600 }}>{d.name}</div>
                          {d.specialization && (
                            <div style={{ color: 'var(--color-gray-500)', fontSize: 11 }}>{d.specialization}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {requiresDoctor && (
                    <div style={{ fontSize: 10, color: '#c2410c', marginTop: 4 }}>Required for Schedule H1/X</div>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>Notes</label>
                  <input type="text" placeholder="Reason / ward notes"
                    value={notes} onChange={e => setNotes(e.target.value)}
                    className="form-input" style={{ fontSize: 12 }} />
                </div>

                {cart.length > 0 && (
                  <div style={{
                    padding: '10px 12px', borderRadius: 8, marginBottom: 14,
                    background: 'var(--color-gray-50)', border: '1px solid var(--color-gray-200)',
                    display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800
                  }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--color-success, #16a34a)' }}>₹{fmt(totals.total)}</span>
                  </div>
                )}

                <div style={{
                  fontSize: 11, color: '#1e40af', background: '#eff6ff',
                  border: '1px solid #bfdbfe', borderRadius: 6, padding: '8px 10px', marginBottom: 12
                }}>
                  Charged to patient's HMS bill — no cash collected at counter.
                </div>

                <button onClick={handleSubmit}
                  disabled={loading || !cart.length || !encounter || (requiresDoctor && !doctorName.trim())}
                  className="btn btn-success btn-block"
                  style={{ fontSize: 13, fontWeight: 700 }}>
                  {loading ? 'Processing…' : `Dispense  ₹${fmt(totals.total)}`}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent issues */}
        {completedIssues.length > 0 && (
          <div style={{ marginTop: 24 }} className="card card-elevated">
            <div className="card-header"><h3 style={{ margin: 0, fontSize: 15 }}>Recent dispensing ({completedIssues.length})</h3></div>
            <table className="table">
              <thead>
                <tr><th>Bill #</th><th>Patient</th><th>Ward</th><th style={{ textAlign: 'right' }}>Amount</th><th>Time</th></tr>
              </thead>
              <tbody>
                {completedIssues.map((s, i) => (
                  <tr key={i}>
                    <td><strong>{s.billNumber}</strong></td>
                    <td>{s.patientName}</td>
                    <td>{s.ward ?? '—'}</td>
                    <td style={{ textAlign: 'right' }}>₹{fmt(s.total)}</td>
                    <td style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>{s.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
