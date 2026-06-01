import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getDrugs, getBatches, searchHmsPatients, getPatientEncounter, searchHmsDoctors, createWardIssue, getDefaultStoreId } from '../api/pharmacyClient';
import SearchDropdown from '../components/SearchDropdown';
import PrescriptionQueue from '../components/PrescriptionQueue';
import PageHeader from '../components/shared/PageHeader';
import Alert from '../components/shared/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import './Dispensing.css';

const fmt = (n) => (parseFloat(n) || 0).toFixed(2);
const expiryLabel = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });

export default function Dispensing() {
  const [storeId, setStoreId] = useState('550e8400-e29b-41d4-a716-446655440001');
  const [drugs, setDrugs] = useState([]);
  const [drugSearch, setDrugSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [doctorName, setDoctorName] = useState('');
  const [doctorQuery, setDoctorQuery] = useState('');
  const [doctorSelected, setDoctorSelected] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [completedIssues, setCompletedIssues] = useState([]);

  // Patient
  const [patientQuery, setPatientQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [encounter, setEncounter] = useState(null); // null=not loaded, false=none

  // Pending drug row
  const [pending, setPending] = useState(null);
  const [pendingBatches, setPendingBatches] = useState([]);

  const location = useLocation();

  useEffect(() => {
    getDrugs().then(setDrugs).catch(console.error);
    getDefaultStoreId().then(setStoreId).catch(console.error);
  }, []);

  const filterDrug = (d, q) => {
    const t = q.toLowerCase();
    return d.brandName?.toLowerCase().includes(t) || d.genericName?.toLowerCase().includes(t);
  };

  const handlePatientSelect = async (p) => {
    setSelectedPatient(p);
    setPatientQuery(p.name + (p.uhid ? ' · ' + p.uhid : ''));
    setEncounter(null);
    try {
      const enc = await getPatientEncounter(p.id);
      setEncounter(enc || false);
    } catch {
      setEncounter(false);
    }
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setEncounter(null);
    setPatientQuery('');
  };

  const handleDoctorChange = (q) => {
    setDoctorQuery(q);
    setDoctorName(q); // free-text fallback
    setDoctorSelected(false);
  };

  const handleDoctorSelect = (doctor) => {
    setDoctorName(doctor.name);
    setDoctorQuery(doctor.name);
    setDoctorSelected(true);
  };

  const clearDoctor = () => {
    setDoctorName('');
    setDoctorQuery('');
    setDoctorSelected(false);
  };

  const handleDrugSelect = async (drug) => {
    setDrugSearch('');
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
        schedule: drug.schedule,
        prescriptionId: null,
        prescriptionItemId: null,
      });
    } catch (e) { console.error(e); }
  };

  const handlePickPrescriptionItem = async (item, prescription) => {
    if (!item?.drugId) return; // free-text item — pharmacist resolves manually
    try {
      const batches = await getBatches(item.drugId);
      const sorted = batches
        .filter(b => (b.currentQty ?? 1) > 0)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
      setPendingBatches(sorted);
      setPending({
        id: Math.random(),
        drugId: item.drugId,
        drugName: item.drugName,
        batch: sorted[0] ?? null,
        qty: item.quantity && item.quantity > 0 ? item.quantity : 1,
        gstRate: 9,
        discount: 0,
        schedule: null,
        prescriptionId: prescription?.id ?? null,
        prescriptionItemId: item.id ?? null,
      });
      setError(null);
    } catch (e) {
      console.error(e);
      setError('Could not load stock for the selected drug');
    }
  };

  // Prefill from the pharmacy queue (see /pharmacy/dispensing/queue).
  useEffect(() => {
    const prefill = location.state?.prefill;
    if (!prefill) return;
    setSelectedPatient({ id: prefill.patientId, name: prefill.patientName });
    setPatientQuery(prefill.patientName || '');
    setEncounter({
      id: prefill.admissionId,
      type: 'IPD',
      ward: prefill.wardLabel || prefill.roomLabel || '',
    });
    if (prefill.doctorName) {
      setDoctorName(prefill.doctorName);
      setDoctorQuery(prefill.doctorName);
      setDoctorSelected(true);
    }
    const remaining = Math.max(1, (prefill.quantity ?? 1) - (prefill.dispensedQty ?? 0));
    handlePickPrescriptionItem(
      {
        id: prefill.prescriptionItemId,
        drugId: prefill.drugId,
        drugName: prefill.drugName,
        quantity: remaining,
      },
      { id: prefill.recordId },
    );
    window.history.replaceState({}, document.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddToCart = () => {
    if (!pending?.batch) { setError('No batch available'); return; }
    if (!(pending.qty > 0)) { setError('Enter a valid quantity'); return; }
    setError(null);
    setCart(prev => [...prev, { ...pending, id: Math.random() }]);
    setPending(null);
    setPendingBatches([]);
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
      const linkedRxIds = cart.map(i => i.prescriptionId).filter(Boolean);
      const rootRxId = linkedRxIds.length === cart.length && new Set(linkedRxIds).size === 1
        ? linkedRxIds[0]
        : null;

      const payload = {
        storeId: storeId,
        patientId: selectedPatient.id,
        hmsEncounterId: encounter.id,
        doctorName: doctorName || null,
        notes: notes || null,
        prescriptionId: rootRxId,
        items: cart.map(i => ({
          drugId: i.drugId,
          qty: i.qty,
          rate: i.batch.sellingPrice,
          gstRate: i.gstRate,
          discount: i.discount || 0,
          prescriptionItemId: i.prescriptionItemId || null,
        })),
      };
      const bill = await createWardIssue(payload);
      setCompletedIssues(prev => [{
        billNumber: bill.billNumber,
        patientName: selectedPatient.name,
        ward: encounter.ward,
        total: totals.total,
        timestamp: new Date().toLocaleString(),
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

  const recentColumns = [
    { header: 'Bill #', render: (_, s) => <strong>{s.billNumber}</strong> },
    { header: 'Patient', accessor: 'patientName' },
    { header: 'Ward', render: (_, s) => s.ward ?? '—' },
    { header: 'Amount', align: 'right', render: (_, s) => `₹${fmt(s.total)}` },
    { header: 'Time', render: (_, s) => <span className="text-muted text-sm">{s.timestamp}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="IPD Dispensing"
        subtitle="Dispense drugs to an admitted patient — charged to their HMS encounter bill"
      />

      {error && <Alert tone="error" className="section-gap">{error}</Alert>}
      {success && <Alert tone="success" className="section-gap">{success}</Alert>}

      <div className="dp-grid">
        {/* LEFT — drug list */}
        <div>
          {selectedPatient && (
            <PrescriptionQueue
              patient={selectedPatient}
              encounter={encounter || null}
              onPickItem={handlePickPrescriptionItem}
            />
          )}

          <Card className="dp-search-card">
            <SearchDropdown
              value={drugSearch}
              onChange={setDrugSearch}
              onSelect={handleDrugSelect}
              items={drugs}
              filterFn={filterDrug}
              placeholder="Search drug to add…"
              allowClear={false}
              disabled={!selectedPatient || encounter === false}
              hint={
                !selectedPatient
                  ? 'Select a patient with an active encounter first'
                  : encounter === false
                  ? 'No active encounter — dispensing not possible'
                  : undefined
              }
              renderItem={(drug) => (
                <div className="sd-row-between">
                  <div>
                    <strong>{drug.brandName}</strong>
                    <span className="sd-muted">{drug.genericName}</span>
                  </div>
                  <span className={`sd-badge sd-badge-${drug.schedule === 'X' ? 'danger' : drug.schedule === 'H1' ? 'warn' : 'ok'}`}>
                    {drug.schedule}
                  </span>
                </div>
              )}
            />
          </Card>

          {/* Pending row */}
          {pending && (
            <Card className="section-gap">
              <div className="dp-pending">
                <div>
                  <div className="dp-field-label">Drug</div>
                  <div className="dp-pending-name">{pending.drugName}</div>
                  {pendingBatches.length > 1 && (
                    <select
                      value={pending.batch?.id ?? ''}
                      onChange={e => {
                        const b = pendingBatches.find(x => x.id === e.target.value);
                        setPending(p => ({ ...p, batch: b }));
                      }}
                      className="form-select dp-input"
                    >
                      {pendingBatches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.batchNumber} · {expiryLabel(b.expiryDate)} · ₹{fmt(b.sellingPrice)}
                        </option>
                      ))}
                    </select>
                  )}
                  {pendingBatches.length === 1 && (
                    <div className="dp-pending-batch">
                      Batch {pending.batch?.batchNumber} · exp {expiryLabel(pending.batch?.expiryDate)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="dp-field-label">Qty</div>
                  <input type="number" min="1" value={pending.qty} autoFocus
                    onChange={e => setPending(p => ({ ...p, qty: parseFloat(e.target.value) || 0 }))}
                    className="form-input dp-input" />
                </div>
                <div>
                  <div className="dp-field-label">GST %</div>
                  <input type="number" min="0" value={pending.gstRate}
                    onChange={e => setPending(p => ({ ...p, gstRate: parseFloat(e.target.value) || 0 }))}
                    className="form-input dp-input" />
                </div>
                <div>
                  <div className="dp-field-label">Rate</div>
                  <div className="dp-rate">₹{fmt(pending.batch?.sellingPrice)}</div>
                </div>
                <div className="dp-pending-actions">
                  <Button variant="success" size="sm" onClick={handleAddToCart} disabled={!pending.batch || !(pending.qty > 0)}>Add</Button>
                  <Button variant="secondary" size="sm" onClick={() => { setPending(null); setPendingBatches([]); }}>×</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Cart */}
          {cart.length > 0 && (
            <Card padded={false} title={`Items (${cart.length})`}>
              <div className="card-body">
                {cart.map(item => {
                  const sp = item.batch?.sellingPrice ?? 0;
                  const sub = item.qty * sp;
                  const gst = (sub * item.gstRate) / 100;
                  const disc = item.discount || 0;
                  return (
                    <div key={item.id} className="dp-cart-row">
                      <div>
                        <div className="dp-cart-name">{item.drugName}</div>
                        <div className="dp-cart-meta">
                          {item.batch?.batchNumber} · ₹{fmt(sp)}/unit
                          {(item.schedule === 'H1' || item.schedule === 'X') && (
                            <span className="dp-sched-warn">⚠ {item.schedule}</span>
                          )}
                        </div>
                      </div>
                      <input type="number" min="1" value={item.qty}
                        onChange={e => setCart(prev => prev.map(i => i.id === item.id ? { ...i, qty: parseFloat(e.target.value) || 0 } : i))}
                        className="form-input dp-input dp-input-center" />
                      <div className="dp-cart-gst">{item.gstRate}% GST</div>
                      <div className="dp-cart-amount">₹{fmt(sub + gst - disc)}</div>
                      <button onClick={() => handleRemove(item.id)} className="dp-remove">×</button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* RIGHT — patient + submit */}
        <div>
          <Card padded={false} title="Patient" className="dp-summary">
            <div className="card-body">
              {/* Patient search */}
              <div className="form-group dp-field">
                <label className="form-label">Search patient <span className="text-error">*</span></label>
                <SearchDropdown
                  value={patientQuery}
                  onChange={setPatientQuery}
                  onSelect={handlePatientSelect}
                  onClear={clearPatient}
                  selected={!!selectedPatient}
                  searchFn={searchHmsPatients}
                  placeholder="Name, UHID or phone…"
                  renderItem={(p) => (
                    <>
                      <div className="sd-strong">{p.name}</div>
                      <div className="sd-muted sd-small">{p.uhid}{p.ward ? ' · Ward ' + p.ward : ''}</div>
                    </>
                  )}
                />
              </div>

              {/* Encounter status */}
              {selectedPatient && (
                <div className={`dp-enc ${encounter ? 'dp-enc--active' : encounter === false ? 'dp-enc--none' : ''}`}>
                  {encounter === null && <span className="dp-enc-checking-text">Checking encounter…</span>}
                  {encounter === false && <span className="dp-enc-none-text">No active encounter</span>}
                  {encounter && (
                    <>
                      <div className="dp-enc-title">Active {encounter.type}</div>
                      {encounter.ward && <div className="dp-enc-line">Ward: {encounter.ward}</div>}
                      {encounter.doctorName && <div className="dp-enc-line">Dr {encounter.doctorName}</div>}
                    </>
                  )}
                </div>
              )}

              {/* Doctor search */}
              <div className={`form-group dp-field ${requiresDoctor ? 'dp-doctor' : ''}`}>
                <label className={requiresDoctor ? 'dp-doctor-label' : 'form-label'}>
                  {requiresDoctor ? '⚠ Doctor name' : 'Doctor name'}
                  {requiresDoctor && <span className="text-error"> *</span>}
                </label>
                <SearchDropdown
                  value={doctorQuery}
                  onChange={handleDoctorChange}
                  onSelect={handleDoctorSelect}
                  onClear={clearDoctor}
                  selected={doctorSelected}
                  searchFn={searchHmsDoctors}
                  placeholder="Search doctor name…"
                  getKey={(d, i) => d.id ?? `doc-${i}`}
                  renderItem={(d) => (
                    <>
                      <div className="sd-strong">{d.name}</div>
                      {d.specialization && <div className="sd-muted sd-small">{d.specialization}</div>}
                    </>
                  )}
                />
                {requiresDoctor && <div className="dp-doctor-hint">Required for Schedule H1/X</div>}
              </div>

              <div className="form-group dp-field">
                <label className="form-label">Notes</label>
                <input type="text" placeholder="Reason / ward notes" value={notes} onChange={e => setNotes(e.target.value)} className="form-input" />
              </div>

              {cart.length > 0 && (
                <div className="dp-total">
                  <span>Total</span>
                  <span className="dp-total-value">₹{fmt(totals.total)}</span>
                </div>
              )}

              <div className="dp-note">
                Charged to patient's HMS bill — no cash collected at counter.
              </div>

              <Button
                variant="success"
                block
                onClick={handleSubmit}
                disabled={loading || !cart.length || !encounter || (requiresDoctor && !doctorName.trim())}
              >
                {loading ? 'Processing…' : `Dispense  ₹${fmt(totals.total)}`}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent issues */}
      {completedIssues.length > 0 && (
        <Card padded={false} title={`Recent dispensing (${completedIssues.length})`} className="dp-recent">
          <Table columns={recentColumns} data={completedIssues} getRowKey={(s, i) => i} />
        </Card>
      )}
    </div>
  );
}
