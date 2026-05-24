import { useEffect, useState } from 'react';
import { getPatientPrescriptions } from '../api/pharmacyClient';

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
  const name = (fn + ' ' + ln).trim();
  return name || '';
};

const headerStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '10px 14px', borderBottom: '1px solid var(--color-gray-100)',
  background: 'var(--color-gray-50)',
};

const badgeStyle = (kind) => {
  const palette = {
    ipd:    { bg: '#eff6ff', fg: '#1e40af', border: '#bfdbfe' },
    opd:    { bg: '#f0fdf4', fg: '#166534', border: '#86efac' },
    legacy: { bg: '#fff7ed', fg: '#c2410c', border: '#fed7aa' },
    nodrug: { bg: '#fef2f2', fg: '#b91c1c', border: '#fecaca' },
  }[kind] || { bg: 'var(--color-gray-50)', fg: 'var(--color-gray-500)', border: 'var(--color-gray-200)' };
  return {
    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4,
    padding: '2px 8px', borderRadius: 999,
    background: palette.bg, color: palette.fg, border: `1px solid ${palette.border}`,
  };
};

const cellStyle = { padding: '8px 10px', fontSize: 12, verticalAlign: 'top' };

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
    <div className="card card-elevated" style={{ marginBottom: 16 }}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <strong style={{ fontSize: 13 }}>Prescriptions</strong>
          <span style={{ fontSize: 11, color: 'var(--color-gray-500)' }}>
            {loading ? 'Loading…' : `${prescriptions.length} record${prescriptions.length === 1 ? '' : 's'}`}
          </span>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: 11 }}
        >
          Refresh
        </button>
      </div>

      <div className="card-body" style={{ padding: '8px 14px' }}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 8, fontSize: 12 }}>{error}</div>
        )}

        {!loading && !error && prescriptions.length === 0 && (
          <div style={{ padding: '16px 4px', fontSize: 12, color: 'var(--color-gray-500)' }}>
            No prescriptions on file for this patient.
          </div>
        )}

        {prescriptions.map((rx) => {
          const items = Array.isArray(rx.prescriptionItems) ? rx.prescriptionItems : [];
          const hasItems = items.length > 0;
          const isLegacyText = !hasItems && (rx.description || '').trim().length > 0;
          const isIpd = !!rx.admissionId;

          return (
            <div
              key={rx.id || rx.createdAt}
              style={{
                border: '1px solid var(--color-gray-200)',
                borderRadius: 8,
                marginBottom: 10,
                overflow: 'hidden',
              }}
            >
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', background: 'var(--color-white)',
                borderBottom: '1px solid var(--color-gray-100)', gap: 10, flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={badgeStyle(isIpd ? 'ipd' : 'opd')}>{isIpd ? 'IPD' : 'OPD'}</span>
                  {isLegacyText && <span style={badgeStyle('legacy')}>Legacy text</span>}
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{creatorName(rx.createdBy) || 'Unknown prescriber'}</span>
                  {rx.createdBy?.role && (
                    <span style={{ fontSize: 11, color: 'var(--color-gray-500)' }}>· {rx.createdBy.role}</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-gray-500)' }}>
                  {rx.mrn && <span style={{ fontFamily: 'monospace', marginRight: 8 }}>{rx.mrn}</span>}
                  {formatDateTime(rx.createdAt)}
                </div>
              </div>

              {hasItems && (
                <table className="table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--color-gray-500)' }}>
                      <th style={cellStyle}>Drug</th>
                      <th style={cellStyle}>Dose</th>
                      <th style={cellStyle}>Frequency</th>
                      <th style={cellStyle}>Duration</th>
                      <th style={cellStyle}>Qty</th>
                      <th style={cellStyle}>Route</th>
                      <th style={cellStyle}>Instructions</th>
                      <th style={{ ...cellStyle, textAlign: 'right' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => {
                      const inCatalog = !!it.drugId;
                      return (
                        <tr key={it.id} style={{ borderTop: '1px solid var(--color-gray-100)' }}>
                          <td style={cellStyle}>
                            <div style={{ fontWeight: 600 }}>{it.drugName || '—'}</div>
                            <div style={{ fontSize: 10, color: 'var(--color-gray-500)' }}>
                              {[it.drugGeneric, it.drugStrength, it.drugForm].filter(Boolean).join(' · ')}
                            </div>
                            {!inCatalog && (
                              <div style={{ marginTop: 4 }}>
                                <span style={badgeStyle('nodrug')}>Not in catalog</span>
                              </div>
                            )}
                          </td>
                          <td style={cellStyle}>{it.dose || '—'}</td>
                          <td style={cellStyle}>{labelFor(FREQUENCY_LABELS, it.frequency)}</td>
                          <td style={cellStyle}>{it.durationDays != null ? `${it.durationDays} d` : '—'}</td>
                          <td style={cellStyle}>{it.quantity ?? '—'}</td>
                          <td style={cellStyle}>{labelFor(ROUTE_LABELS, it.route)}</td>
                          <td style={cellStyle}>{it.instructions || '—'}</td>
                          <td style={{ ...cellStyle, textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => onPickItem && onPickItem(it, rx)}
                              disabled={!inCatalog || !onPickItem}
                              className="btn btn-success"
                              style={{ padding: '4px 10px', fontSize: 11 }}
                              title={inCatalog ? 'Add to dispense cart' : 'Drug not in catalog — dispense manually'}
                            >
                              Add
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {(rx.description || '').trim().length > 0 && (
                <div style={{
                  padding: '8px 12px', fontSize: 12, color: 'var(--color-gray-700)',
                  background: 'var(--color-gray-50)', borderTop: hasItems ? '1px solid var(--color-gray-100)' : 'none',
                  whiteSpace: 'pre-wrap',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-gray-500)', marginRight: 6 }}>
                    Doctor's notes
                  </span>
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
