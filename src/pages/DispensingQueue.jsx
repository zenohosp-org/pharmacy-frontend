import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingPrescriptions } from '../api/pharmacyClient';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import Alert from '../components/shared/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import './DispensingQueue.css';

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

export default function DispensingQueue() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPendingPrescriptions();
      setRows(data);
    } catch (e) {
      console.error(e);
      setError('Could not load pending prescriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      (r.patientName || '').toLowerCase().includes(q)
      || (r.drugName || '').toLowerCase().includes(q)
      || (r.roomLabel || '').toLowerCase().includes(q)
      || (r.wardLabel || '').toLowerCase().includes(q),
    );
  }, [rows, filter]);

  const dispenseRow = (row) => {
    navigate('/pharmacy/dispensing', { state: { prefill: row } });
  };

  const columns = [
    { header: 'Patient', render: (_, r) => (
      <>
        <div className="cell-strong">{r.patientName}</div>
        <div className="cell-muted">{[r.roomLabel, r.wardLabel].filter(Boolean).join(' · ')}</div>
      </>
    ) },
    { header: 'Drug', render: (_, r) => (
      <>
        <div className="cell-strong">{r.drugName}</div>
        <div className="cell-muted">{[r.drugStrength, r.drugForm].filter(Boolean).join(' · ')}</div>
      </>
    ) },
    { header: 'Dose / Route', render: (_, r) => (
      <>
        <div>{r.dose || '—'}</div>
        <div className="cell-muted">{[r.frequency, r.route].filter(Boolean).join(' · ')}</div>
      </>
    ) },
    { header: 'Qty', render: (_, r) => {
      const remaining = (r.quantity ?? 0) - (r.dispensedQty ?? 0);
      return (
        <>
          <div className="cell-strong">{remaining}</div>
          <div className="cell-muted">
            of {r.quantity}{r.dispensedQty > 0 ? ` (${r.dispensedQty} done)` : ''}
          </div>
        </>
      );
    } },
    { header: 'Status', render: (_, r) => (
      <StatusBadge tone={r.status === 'PARTIAL' ? 'primary' : 'warning'}>{r.status}</StatusBadge>
    ) },
    { header: 'Prescribed', render: (_, r) => fmtTime(r.prescribedAt) },
    { header: 'Doctor', render: (_, r) => r.doctorName || '—' },
    { header: '', render: (_, r) => (
      <Button size="sm" onClick={() => dispenseRow(r)}>Dispense</Button>
    ) },
  ];

  return (
    <div>
      <PageHeader
        title="Ward Dispensing"
        subtitle="Pending IPD prescriptions across the hospital. Oldest first."
        actions={
          <>
            <input
              type="text"
              className="form-input queue-search"
              placeholder="Search patient, drug, ward..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
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
          emptyMessage="No pending IPD prescriptions."
          getRowKey={(r) => r.prescriptionItemId}
        />
      </Card>
    </div>
  );
}
