import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createCounterSaleBulk, getGenericAlternatives } from '../api/pharmacyClient';
import useDrugCatalog from '../hooks/useDrugCatalog';
import useBatchPicker from '../hooks/useBatchPicker';
import useCart from '../hooks/useCart';
import { useToast } from '../components/ui/Toast';
import PageHeader from '../components/shared/PageHeader';
import Alert from '../components/shared/Alert';
import DrugSearchCard from '../components/dispensing/DrugSearchCard';
import DrugInfoPanel from '../components/dispensing/DrugInfoPanel';
import LineItemsTable from '../components/dispensing/LineItemsTable';
import BillSummary from '../components/dispensing/BillSummary';
import RecentSalesTable from '../components/dispensing/RecentSalesTable';
import { lineRate } from '../utils/counterSale';
import { printReceipt } from '../utils/printReceipt';
import './CounterSale.css';

export default function CounterSale() {
  const { drugs, filterDrug } = useDrugCatalog();
  const { pending, setPending, loadBatches, clearPending } = useBatchPicker();
  const { cart, addToCart, updateItem, removeItem, clearCart, totals, requiresDoctor } = useCart(lineRate);
  const toast = useToast();

  const [drugSearch, setDrugSearch] = useState('');
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [patientPhone, setPatientPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [completedSales, setCompletedSales] = useState([]);

  const handleDrugSelect = async (drug) => {
    setDrugSearch(`${drug.brandName} (${drug.genericName})`);
    setSelectedDrug(drug);
    setAlternatives([]);

    try {
      const [{ sorted }, altData] = await Promise.all([
        loadBatches(drug.id),
        getGenericAlternatives(drug.id).catch(() => []),
      ]);

      setAlternatives(altData);

      if (sorted.length === 0) {
        setError(null);
        const altNote = altData.some(a => a.inStock)
          ? ' See same-generic alternatives below.'
          : '';
        setNotice(`${drug.brandName} is currently out of stock — no batches available.${altNote}`);
        clearPending();
        return;
      }

      setError(null);
      setNotice(null);
      setPending({
        id: Math.random(),
        drugId: drug.id,
        drugName: drug.brandName,
        drug,
        batch: sorted[0] ?? null,
        batches: sorted,
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

  const handleAddToCart = (item) => {
    if (!item.batch) { setError('No batch available for this drug'); return; }
    if (!(item.qty > 0)) { setError('Enter a valid quantity'); return; }
    setError(null);
    addToCart(item);
    clearPending();
    setDrugSearch('');
    setSelectedDrug(null);
    setAlternatives([]);
  };

  const clearPendingRow = () => {
    clearPending();
    setDrugSearch('');
    setSelectedDrug(null);
    setAlternatives([]);
  };

  // Auto-add the pending row to the cart once a valid quantity is entered.
  useEffect(() => {
    if (pending?.batch && pending.qty > 0) {
      const t = setTimeout(() => handleAddToCart(pending), 100);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const handleCheckout = async () => {
    if (!cart.length) { setError('Cart is empty'); return; }
    if (requiresDoctor && !doctorName.trim()) {
      setError('Doctor name required for Schedule H1/X drugs');
      return;
    }
    setLoading(true); setError(null);
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
      toast(`Bill ${bill.billNumber} created`, 'success');
      clearCart(); setPatientPhone(''); setDoctorName('');
    } catch (e) {
      toast('Billing failed: ' + e.message, 'error');
      setError('Billing failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCart = () => {
    clearCart();
    setPatientPhone('');
    setDoctorName('');
    setPaymentMode('CASH');
    setError(null);
    setNotice(null);
  };

  return (
    <div>
      <PageHeader
        title="POS"
        subtitle="Search drug → batch auto-selected (FEFO, change it from the dropdown if needed) → enter qty → add"
        actions={<Link to="/pharmacy/sales-ledger" className="btn btn-secondary">Sales Ledger</Link>}
      />

      {error && <Alert tone="error" className="section-gap">{error}</Alert>}
      {notice && <Alert tone="info" className="section-gap">{notice}</Alert>}

      <div className="cs-grid">
        {/* ── LEFT ── */}
        <div>
          <DrugSearchCard
            cardClassName="cs-search-card"
            value={drugSearch}
            onChange={setDrugSearch}
            onSelect={handleDrugSelect}
            items={drugs}
            filterFn={filterDrug}
            placeholder="🔍  Search drug by brand, generic or salt name…"
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

          <DrugInfoPanel
            key={selectedDrug?.id}
            drug={selectedDrug}
            alternatives={alternatives}
            defaultAltOpen={!pending}
            onPickAlternative={(alt) => handleDrugSelect(drugs.find(d => d.id === alt.id) || alt)}
          />

          <LineItemsTable
            pending={pending}
            cart={cart}
            onPendingChange={setPending}
            onClearPending={clearPendingRow}
            onCartItemChange={updateItem}
            onRemove={removeItem}
          />
        </div>

        {/* ── RIGHT: bill summary ── */}
        <div>
          <BillSummary
            totals={totals}
            paymentMode={paymentMode}
            onPaymentMode={setPaymentMode}
            requiresDoctor={requiresDoctor}
            doctorName={doctorName}
            onDoctorName={setDoctorName}
            patientPhone={patientPhone}
            onPatientPhone={setPatientPhone}
            loading={loading}
            cartLength={cart.length}
            onCheckout={handleCheckout}
            onClear={handleClearCart}
          />
        </div>
      </div>

      <RecentSalesTable sales={completedSales} onPrint={(sale) => printReceipt(sale, paymentMode)} />
    </div>
  );
}
