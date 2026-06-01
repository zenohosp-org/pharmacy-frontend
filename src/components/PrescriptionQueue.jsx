import { useEffect, useState } from 'react';
import { getPatientPrescriptions } from '../api/pharmacyClient';
import Button from './ui/Button';
import Alert from './shared/Alert';
import './PrescriptionQueue.css';

const FREQUENCY_LABELS = {
  OD: 'Once daily',
  BD: 'Twice daily',
  TDS: 'Thrice daily',
  QID: '4× daily',
  Q4H: 'Every 4h',
  Q6H: 'Every 6h',
  Q8H: 'Every 8h',
  HS: 'At bedtime',
  AC: 'Before meals',
  PC: 'After meals',
  SOS: 'As needed',
  STAT: 'STAT',
};

const ROUTE_LABELS = {
  ORAL: 'Oral',
  IV: 'IV',
  IM: 'IM',
  SC: 'SC',
  TOPICAL: 'Topical',
  INHALED: 'Inhaled',
  OPHTHALMIC: 'Eye',
  OTIC: 'Ear',
  NASAL: 'Nasal',
  RECTAL: 'Rectal',
};

const labelFor = (map, code) => (code && map[code]) || code || '—';

const formatDateTime = (s) => {
  if (!s) return '';
  try {
    return new Date(s).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return s;
  }
};

const creatorName = (c) => {
  if (!c) return '';
  const fn = c.firstName?.trim() || '';
  const ln = c.lastName?.trim() || '';
  return (fn + ' ' + ln).trim();
};

export default function PrescriptionQueue({ patient, encounter, onPickItem }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!patient?.id) {
      setPrescriptions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const admissionId = encounter && encounter.type === 'IPD' ? encounter.id : null;
    getPatientPrescriptions(patient.id, admissionId)
      .then((rows) => { if (!cancelled) setPrescriptions(Array.isArray(rows) ? rows : []); })
      .catch(() => { if (!cancelled) setError('Failed to load prescriptions'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [patient?.id, encounter?.id, encounter?.type, reloadKey]);

  if (!patient) return null;

  const refresh = () => setReloadKey((k) => k + 1);

  return (
    <div className="card card-elevated pq-card">
      <div className="pq-head">
        <div className="pq-head-left">
          <strong className="pq-title">Prescriptions</strong>
          <span className="pq-count">
            {loading ? 'Loading…' : `${prescriptions.length} record${prescriptions.length === 1 ? '' : 's'}`}
          </span>
        </div>
        <Button variant="secondary" size="sm" onClick={refresh} disabled={loading}>Refresh</Button>
      </div>

      <div className="card-body pq-body">
        {error && <Alert tone="error">{error}</Alert>}

        {!loading && !error && prescriptions.length === 0 && (
          <div className="pq-empty">No prescriptions on file for this patient.</div>
        )}

        {prescriptions.map((rx) => {
          const items = Array.isArray(rx.prescriptionItems) ? rx.prescriptionItems : [];
          const hasItems = items.length > 0;
          const isLegacyText = !hasItems && (rx.description || '').trim().length > 0;
          const isIpd = !!rx.admissionId;

          return (
            <div key={rx.id || rx.createdAt} className="pq-rx">
              <div className="pq-rx-head">
                <div className="pq-rx-head-left">
                  <span className={`pq-badge pq-badge--${isIpd ? 'ipd' : 'opd'}`}>{isIpd ? 'IPD' : 'OPD'}</span>
                  {isLegacyText && <span className="pq-badge pq-badge--legacy">Legacy text</span>}
                  <span className="pq-rx-creator">{creatorName(rx.createdBy) || 'Unknown prescriber'}</span>
                  {rx.createdBy?.role && <span className="pq-rx-role">· {rx.createdBy.role}</span>}
                </div>
                <div className="pq-rx-meta">
                  {rx.mrn && <span className="pq-mrn">{rx.mrn}</span>}
                  {formatDateTime(rx.createdAt)}
                </div>
              </div>

              {hasItems && (
                <table className="table pq-table">
                  <thead>
                    <tr>
                      <th>Drug</th>
                      <th>Dose</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Qty</th>
                      <th>Route</th>
                      <th>Instructions</th>
                      <th className="col-right" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => {
                      const inCatalog = !!it.drugId;
                      return (
                        <tr key={it.id}>
                          <td>
                            <div className="pq-drug-name">{it.drugName || '—'}</div>
                            <div className="pq-drug-sub">
                              {[it.drugGeneric, it.drugStrength, it.drugForm].filter(Boolean).join(' · ')}
                            </div>
                            {!inCatalog && (
                              <div className="pq-nodrug-wrap">
                                <span className="pq-badge pq-badge--nodrug">Not in catalog</span>
                              </div>
                            )}
                          </td>
                          <td>{it.dose || '—'}</td>
                          <td>{labelFor(FREQUENCY_LABELS, it.frequency)}</td>
                          <td>{it.durationDays != null ? `${it.durationDays} d` : '—'}</td>
                          <td>{it.quantity ?? '—'}</td>
                          <td>{labelFor(ROUTE_LABELS, it.route)}</td>
                          <td>{it.instructions || '—'}</td>
                          <td className="col-right">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => onPickItem && onPickItem(it, rx)}
                              disabled={!inCatalog || !onPickItem}
                              title={inCatalog ? 'Add to dispense cart' : 'Drug not in catalog — dispense manually'}
                            >
                              Add
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {(rx.description || '').trim().length > 0 && (
                <div className={`pq-notes ${hasItems ? 'pq-notes--bordered' : ''}`}>
                  <span className="pq-notes-label">Doctor's notes</span>
                  {rx.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
