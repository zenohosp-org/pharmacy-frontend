import { useEffect, useState, useMemo, useCallback } from 'react';
import { listReturns, syncReturns, verifyReturn, rejectReturn } from '../api/pharmacyClient';
import { useToast } from '../components/ui/Toast';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import Alert from '../components/shared/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import './ReturnsQueue.css';

const fmtTime = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

// HMS reason codes → default put_to. Pharmacist can override in the modal.
// Aligns with the spec:
//   STOCK     → drug is still saleable (wrong drug, order stopped, dose change on unopened strip)
//   QUARANTINE → drug must not re-enter inventory (ineffective, adverse, expiry, wastage)
const REASON_PUT_TO = {
  WRONG_DRUG_DISPENSED: 'STOCK',
  ORDER_STOPPED: 'STOCK',
  DOSE_CHANGE: 'STOCK',
  INEFFECTIVE: 'QUARANTINE',
  ADVERSE_REACTION: 'QUARANTINE',
  EXPIRY_NEAR: 'QUARANTINE',
  WASTAGE_OPENED: 'QUARANTINE',
  WASTAGE_SPILLED: 'QUARANTINE',
};
const defaultPutTo = (reasonCode) => REASON_PUT_TO[reasonCode] || 'STOCK';

export default function ReturnsQueue() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [selected, setSelected] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listReturns('REQUESTED');
      setRows(data);
    } catch (e) {
      console.error(e);
      setError('Could not load return requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  // First load + 30s polling. Stops when the tab is hidden.
  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncReturns();
      toast(`Sync complete — ${res?.inserted ?? 0} new return(s)`, 'success');
      await load();
    } catch (e) {
      toast('Sync failed: ' + (e.response?.data?.message || e.message), 'error');
    } finally {
      setSyncing(false);
    }
  };

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      (r.patientName || '').toLowerCase().includes(q)
      || (r.drugName || '').toLowerCase().includes(q)
      || (r.reasonCode || '').toLowerCase().includes(q)
      || (r.initiatedByName || '').toLowerCase().includes(q),
    );
  }, [rows, filter]);

  const columns = [
    { header: 'Patient', render: (_, r) => (
      <>
        <div className="cell-strong">{r.patientName || '—'}</div>
        <div className="cell-muted">Admission · {r.admissionId?.slice(0, 8) || '—'}</div>
      </>
    ) },
    { header: 'Drug', render: (_, r) => (
      <>
        <div className="cell-strong">{r.drugName || '—'}</div>
        <div className="cell-muted">{[r.drugStrength, r.drugForm, r.dose].filter(Boolean).join(' · ')}</div>
      </>
    ) },
    { header: 'Qty', render: (_, r) => (
      <span className="cell-strong">{r.returnQty ?? '—'}</span>
    ) },
    { header: 'Reason', render: (_, r) => (
      <>
        <StatusBadge tone={defaultPutTo(r.reasonCode) === 'QUARANTINE' ? 'danger' : 'primary'}>
          {r.reasonCode || '—'}
        </StatusBadge>
        {r.reasonNotes && <div className="cell-muted rq-notes">{r.reasonNotes}</div>}
      </>
    ) },
    { header: 'Initiated By', render: (_, r) => r.initiatedByName || '—' },
    { header: 'Time', render: (_, r) => fmtTime(r.initiatedAt || r.createdAt) },
    { header: '', render: (_, r) => (
      <Button size="sm" onClick={() => setSelected(r)}>Review</Button>
    ) },
  ];

  return (
    <div>
      <PageHeader
        title="Return Requests"
        subtitle="Nurses initiate returns on HMS; verify at the pharmacy counter to credit stock and generate a credit note."
        actions={
          <>
            <input
              type="text"
              className="form-input queue-search"
              placeholder="Search patient, drug, reason..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <Button variant="secondary" onClick={handleSync} disabled={syncing || loading}>
              {syncing ? 'Syncing…' : 'Sync from HMS'}
            </Button>
            <Button variant="secondary" onClick={load} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </Button>
          </>
        }
      />

      {error && <Alert tone="error" className="section-gap">{error}</Alert>}

      <Card padded={false}>
        <Table
          columns={columns}
          data={filtered}
          loading={loading}
          emptyMessage="No pending return requests. Click 'Sync from HMS' to pull the latest."
          getRowKey={(r) => r.id}
        />
      </Card>

      {selected && (
        <ReturnReviewModal
          row={selected}
          onClose={() => setSelected(null)}
          onDone={async (msg) => {
            setSelected(null);
            if (msg) toast(msg, 'success');
            await load();
          }}
        />
      )}
    </div>
  );
}

function ReturnReviewModal({ row, onClose, onDone }) {
  const [qty, setQty] = useState(row.returnQty ?? 1);
  const [putTo, setPutTo] = useState(defaultPutTo(row.reasonCode));
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const toast = useToast();

  // HMS validates confirmedQty == requestedQty exactly — any edit below
  // requested means the pharmacist saw something different on the counter
  // and should reject, not partial-confirm. Surface that as a hint.
  const qtyMismatch = Number(qty) !== Number(row.returnQty);

  const handleVerify = async () => {
    setBusy(true); setErr(null);
    try {
      const body = {
        lines: [{
          prescriptionItemId: row.prescriptionItemId,
          qty: Number(qty),
          putTo,
        }],
      };
      const result = await verifyReturn(row.id, body);
      const billPart = result?.creditNoteBillId
        ? ` — credit note created (${result.creditNoteBillId.slice(0, 8)})`
        : '';
      onDone(`Return verified${billPart}`);
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      setErr(`Verify failed: ${msg}`);
      toast(`Verify failed: ${msg}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setErr('Reason is required to reject.');
      return;
    }
    setBusy(true); setErr(null);
    try {
      await rejectReturn(row.id, { reason: rejectReason.trim() });
      onDone('Return rejected — HMS will reverse the qty hold');
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      setErr(`Reject failed: ${msg}`);
      toast(`Reject failed: ${msg}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      title={rejectMode ? 'Reject Return' : 'Verify Return'}
      footer={
        rejectMode ? (
          <>
            <Button variant="secondary" onClick={() => setRejectMode(false)} disabled={busy}>Back</Button>
            <Button variant="danger" onClick={handleReject} disabled={busy || !rejectReason.trim()}>
              {busy ? 'Rejecting…' : 'Confirm Reject'}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setRejectMode(true)} disabled={busy}>Reject</Button>
            <Button onClick={handleVerify} disabled={busy}>
              {busy ? 'Verifying…' : 'Verify Receipt'}
            </Button>
          </>
        )
      }
    >
      <div className="rq-modal-grid">
        <div>
          <div className="rq-modal-label">Patient</div>
          <div className="rq-modal-value">{row.patientName}</div>
        </div>
        <div>
          <div className="rq-modal-label">Drug</div>
          <div className="rq-modal-value">
            {row.drugName}
            <div className="cell-muted">{[row.drugStrength, row.drugForm, row.dose].filter(Boolean).join(' · ')}</div>
          </div>
        </div>
        <div>
          <div className="rq-modal-label">Originally dispensed</div>
          <div className="rq-modal-value">{row.originalDispensedQty ?? '—'}</div>
        </div>
        <div>
          <div className="rq-modal-label">Requested back</div>
          <div className="rq-modal-value">{row.returnQty}</div>
        </div>
        <div>
          <div className="rq-modal-label">Reason</div>
          <div className="rq-modal-value">{row.reasonCode}</div>
          {row.reasonNotes && <div className="cell-muted">{row.reasonNotes}</div>}
        </div>
        <div>
          <div className="rq-modal-label">Initiated by</div>
          <div className="rq-modal-value">{row.initiatedByName || '—'}</div>
        </div>
      </div>

      {!rejectMode && (
        <div className="rq-modal-form">
          <div>
            <label className="form-label">Verified qty</label>
            <input
              type="number"
              min={1}
              max={row.originalDispensedQty ?? row.returnQty}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="form-input"
              disabled={busy}
            />
            {qtyMismatch && (
              <div className="rq-warn">
                HMS only accepts confirmation that matches the requested qty.
                Reject and ask the nurse to re-initiate with the right qty.
              </div>
            )}
          </div>
          <div>
            <label className="form-label">Put to</label>
            <select
              value={putTo}
              onChange={(e) => setPutTo(e.target.value)}
              className="form-input"
              disabled={busy}
            >
              <option value="STOCK">STOCK — back to sellable inventory</option>
              <option value="QUARANTINE">QUARANTINE — audit only, no stock back</option>
            </select>
          </div>
        </div>
      )}

      {rejectMode && (
        <div className="rq-modal-form rq-modal-form--single">
          <label className="form-label">Reason for rejection</label>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="form-input"
            placeholder="e.g. drug not received at counter / damaged / qty mismatch"
            disabled={busy}
          />
        </div>
      )}

      {err && <Alert tone="error" className="rq-modal-err">{err}</Alert>}
    </Modal>
  );
}
