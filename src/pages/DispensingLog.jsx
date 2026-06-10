import { useState, useEffect } from 'react';
import { getWardDispenseLogs } from '../api/pharmacyClient';
import PageHeader from '../components/shared/PageHeader';
import ContentLoader from '../components/shared/ContentLoader';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import './DispensingLog.css';

const num = (n) => parseFloat(n || 0);

export default function DispensingLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getWardDispenseLogs()
      .then((d) => { if (alive) setLogs(d || []); })
      .catch(console.error)
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const totalItems = logs.reduce((sum, l) => sum + num(l.qty), 0);
  const uniquePatients = new Set(logs.map((l) => l.patientId).filter(Boolean)).size;

  const dash = <span className="dl-muted">—</span>;

  const columns = [
    { header: 'Patient', render: (_, l) => <span className="cell-strong">{l.patientName || dash}</span> },
    { header: 'Room', render: (_, l) => l.room || dash },
    { header: 'Doctor', render: (_, l) => l.doctorName || dash },
    { header: 'Drug', render: (_, l) => l.drugName },
    { header: 'Qty', align: 'right', render: (_, l) => num(l.qty).toFixed(2) },
    { header: 'Dispensed', align: 'center', render: (_, l) => <span className="text-muted text-xs">{new Date(l.dispensedAt).toLocaleString()}</span> },
  ];

  const renderDetails = (l) => (
    <div className="dl-detail">
      <div className="dl-detail-title">Dispense Details</div>
      <div className="dl-detail-grid">
        <div>
          <div className="dl-detail-label">Patient</div>
          <div>{l.patientName || '—'}</div>
        </div>
        <div>
          <div className="dl-detail-label">Room</div>
          <div>{l.room || '—'}</div>
        </div>
        <div>
          <div className="dl-detail-label">Doctor</div>
          <div>{l.doctorName || '—'}</div>
        </div>
        <div>
          <div className="dl-detail-label">Drug</div>
          <div>{l.drugName}</div>
        </div>
        <div>
          <div className="dl-detail-label">Quantity</div>
          <div>{num(l.qty).toFixed(2)}</div>
        </div>
        <div>
          <div className="dl-detail-label">Rate</div>
          <div>₹{num(l.rate).toFixed(2)}</div>
        </div>
        <div>
          <div className="dl-detail-label">Dispensed At</div>
          <div>{new Date(l.dispensedAt).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );

  if (loading) return <ContentLoader label="Loading dispensing logs…" />;

  return (
    <div>
      <PageHeader
        title="Dispensing Logs"
        subtitle="IPD ward-dispensed items by patient, room and doctor"
      />

      <div className="grid grid-4 section-gap">
        <StatCard label="Dispensed Lines" value={logs.length} sub="Ward issue records" icon="📋" />
        <StatCard label="Total Items" value={totalItems.toFixed(2)} sub="Units dispensed" icon="📦" />
        <StatCard label="Patients" value={uniquePatients} sub="Unique patients" icon="🧑" />
      </div>

      <Card padded={false} title={`Ward Dispensing (${logs.length})`}>
        <Table
          columns={columns}
          data={logs}
          emptyMessage="No ward dispensing records yet."
          renderExpanded={renderDetails}
        />
      </Card>
    </div>
  );
}
