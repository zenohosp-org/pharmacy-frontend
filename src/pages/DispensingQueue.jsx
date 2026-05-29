import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingPrescriptions } from '../api/pharmacyClient';
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

const statusClass = (s) =>
  s === 'PARTIAL' ? 'queue-status queue-status-partial' : 'queue-status queue-status-pending';

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

  return (
    <div className="queue-container">
      <div className="queue-header">
        <div className="queue-header-text">
          <h1>Ward Dispensing Queue</h1>
          <p>Pending IPD prescriptions across the hospital. Oldest first.</p>
        </div>
        <div className="queue-controls">
          <input
            type="text"
            className="queue-search"
            placeholder="Search patient, drug, ward..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button type="button" className="queue-refresh-btn" onClick={load} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <div className="queue-error">{error}</div>}

      <div className="queue-card">
        {filtered.length === 0 ? (
          <div className="queue-empty">
            {loading ? 'Loading queue...' : 'No pending IPD prescriptions.'}
          </div>
        ) : (
          <table className="queue-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Drug</th>
                <th>Dose / Route</th>
                <th>Qty</th>
                <th>Status</th>
                <th>Prescribed</th>
                <th>Doctor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const remaining = (r.quantity ?? 0) - (r.dispensedQty ?? 0);
                return (
                  <tr key={r.prescriptionItemId}>
                    <td>
                      <div className="queue-cell-strong">{r.patientName}</div>
                      <div className="queue-cell-muted">
                        {[r.roomLabel, r.wardLabel].filter(Boolean).join(' · ')}
                      </div>
                    </td>
                    <td>
                      <div className="queue-cell-strong">{r.drugName}</div>
                      <div className="queue-cell-muted">
                        {[r.drugStrength, r.drugForm].filter(Boolean).join(' · ')}
                      </div>
                    </td>
                    <td>
                      <div>{r.dose || '—'}</div>
                      <div className="queue-cell-muted">
                        {[r.frequency, r.route].filter(Boolean).join(' · ')}
                      </div>
                    </td>
                    <td>
                      <div className="queue-cell-strong">{remaining}</div>
                      <div className="queue-cell-muted">
                        of {r.quantity}
                        {r.dispensedQty > 0 ? ` (${r.dispensedQty} done)` : ''}
                      </div>
                    </td>
                    <td><span className={statusClass(r.status)}>{r.status}</span></td>
                    <td>{fmtTime(r.prescribedAt)}</td>
                    <td>{r.doctorName || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="queue-dispense-btn"
                        onClick={() => dispenseRow(r)}
                      >
                        Dispense
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
