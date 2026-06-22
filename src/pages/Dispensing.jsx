import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { createWardIssue, getDefaultStoreId, getGenericAlternatives } from '../api/pharmacyClient';
import useDrugCatalog from '../hooks/useDrugCatalog';
import useBatchPicker from '../hooks/useBatchPicker';
import useCart from '../hooks/useCart';
import usePatientEncounter from '../hooks/usePatientEncounter';
import useDoctorSearch from '../hooks/useDoctorSearch';
import PrescriptionQueue from '../components/PrescriptionQueue';
import PageHeader from '../components/shared/PageHeader';
import Alert from '../components/shared/Alert';
import DrugSearchCard from '../components/dispensing/DrugSearchCard';
import DrugInfoPanel from '../components/dispensing/DrugInfoPanel';
import PendingDrugRow from '../components/dispensing/PendingDrugRow';
import CartList from '../components/dispensing/CartList';
import PatientPanel from '../components/dispensing/PatientPanel';
import RecentIssuesTable from '../components/dispensing/RecentIssuesTable';
import './Dispensing.css';

export default function Dispensing() {
  const [storeId, setStoreId] = useState('550e8400-e29b-41d4-a716-446655440001');
  const [drugSearch, setDrugSearch] = useState('');
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [completedIssues, setCompletedIssues] = useState([]);

  const { drugs, filterDrug } = useDrugCatalog();
  const { pending, setPending, pendingBatches, loadBatches, clearPending } = useBatchPicker();
  const { cart, addToCart, updateItem, removeItem, clearCart, totals, requiresDoctor } = useCart();
  const patient = usePatientEncounter();
  const doctor = useDoctorSearch();

  const location = useLocation();

  useEffect(() => {
    getDefaultStoreId().then(setStoreId).catch(console.error);
  }, []);

  const handleDrugSelect = async (drug) => {
    setDrugSearch('');
    setSelectedDrug(drug);
    setAlternatives([]);
    try {
      const [{ sorted }, altData] = await Promise.all([
        loadBatches(drug.id),
        getGenericAlternatives(drug.id).catch(() => []),
      ]);
      setAlternatives(altData);
      if (sorted.length === 0) {
        const altNote = altData.some(a => a.inStock) ? ' See same-generic alternatives below.' : '';
        setError(`${drug.brandName} is out of stock — no batches available.${altNote}`);
        clearPending();
        return;
      }
      setError(null);
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
      setError(null);
      setSelectedDrug(drugs.find(d => d.id === item.drugId) || { id: item.drugId, brandName: item.drugName });
      setAlternatives([]);
      getGenericAlternatives(item.drugId).then(setAlternatives).catch(() => setAlternatives([]));
      const { sorted } = await loadBatches(item.drugId);
      if (sorted.length === 0) {
        setError(`${item.drugName} is out of stock — no batches available. Check same-generic alternatives below.`);
      }
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
    } catch (e) {
      console.error(e);
      setError('Could not load stock for the selected drug');
    }
  };

  // Prefill from the pharmacy queue (see /pharmacy/dispensing/queue).
  useEffect(() => {
    const prefill = location.state?.prefill;
    if (!prefill) return;
    patient.prefillPatient(
      { id: prefill.patientId, name: prefill.patientName },
      { id: prefill.admissionId, type: 'IPD', ward: prefill.wardLabel || prefill.roomLabel || '' },
    );
    if (prefill.doctorName) doctor.setDoctor(prefill.doctorName);
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
    addToCart(pending);
    clearPending();
    setSelectedDrug(null);
    setAlternatives([]);
  };

  const handleSubmit = async () => {
    if (!patient.selectedPatient) { setError('Select a patient'); return; }
    if (!patient.encounter) { setError('Patient has no active encounter'); return; }
    if (!cart.length) { setError('Add at least one drug'); return; }
    if (requiresDoctor && !doctor.doctorName.trim()) { setError('Doctor name required for Schedule H1/X drugs'); return; }
    setLoading(true); setError(null);
    try {
      const linkedRxIds = cart.map(i => i.prescriptionId).filter(Boolean);
      const rootRxId = linkedRxIds.length === cart.length && new Set(linkedRxIds).size === 1
        ? linkedRxIds[0]
        : null;

      const payload = {
        storeId,
        patientId: patient.selectedPatient.id,
        hmsEncounterId: patient.encounter.id,
        doctorName: doctor.doctorName || null,
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
        patientName: patient.selectedPatient.name,
        ward: patient.encounter.ward,
        total: totals.total,
        timestamp: new Date().toLocaleString(),
      }, ...prev]);
      setSuccess(`Dispensed — Bill ${bill.billNumber} charged to patient's encounter`);
      if (bill.hmsSyncStatus === 'FAILED') {
        setError('Dispensed, but HMS sync failed — these items may still appear in the IPD queue. Refresh the queue shortly; they clear automatically once HMS is reachable.');
      }
      clearCart(); doctor.clear(); setNotes('');
      setTimeout(() => setSuccess(null), 8000);
    } catch (e) {
      setError('Failed: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

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
          {patient.selectedPatient && (
            <PrescriptionQueue
              patient={patient.selectedPatient}
              encounter={patient.encounter || null}
              onPickItem={handlePickPrescriptionItem}
            />
          )}

          <DrugSearchCard
            cardClassName="dp-search-card"
            value={drugSearch}
            onChange={setDrugSearch}
            onSelect={handleDrugSelect}
            items={drugs}
            filterFn={filterDrug}
            placeholder="Search drug to add…"
            disabled={!patient.selectedPatient || patient.encounter === false}
            hint={
              !patient.selectedPatient
                ? 'Select a patient with an active encounter first'
                : patient.encounter === false
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

          <PendingDrugRow
            pending={pending}
            pendingBatches={pendingBatches}
            onChange={setPending}
            onAdd={handleAddToCart}
            onClear={clearPending}
          />

          <DrugInfoPanel
            key={selectedDrug?.id}
            drug={selectedDrug}
            alternatives={alternatives}
            defaultAltOpen={!pending}
            onPickAlternative={(alt) => handleDrugSelect(drugs.find(d => d.id === alt.id) || alt)}
          />

          <CartList cart={cart} onItemChange={updateItem} onRemove={removeItem} />
        </div>

        {/* RIGHT — patient + submit */}
        <div>
          <PatientPanel
            patient={patient}
            doctor={doctor}
            requiresDoctor={requiresDoctor}
            notes={notes}
            onNotesChange={setNotes}
            total={totals.total}
            hasItems={cart.length > 0}
            loading={loading}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      <RecentIssuesTable issues={completedIssues} />
    </div>
  );
}
