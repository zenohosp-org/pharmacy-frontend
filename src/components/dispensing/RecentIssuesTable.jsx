import Card from '../ui/Card';
import Table from '../ui/Table';
import { fmt } from '../../utils/format';

const columns = [
  { header: 'Bill #', render: (_, s) => <strong>{s.billNumber}</strong> },
  { header: 'Patient', accessor: 'patientName' },
  { header: 'Ward', render: (_, s) => s.ward ?? '—' },
  { header: 'Amount', align: 'right', render: (_, s) => `₹${fmt(s.total)}` },
  { header: 'Time', render: (_, s) => <span className="text-muted text-sm">{s.timestamp}</span> },
];

export default function RecentIssuesTable({ issues }) {
  if (!issues.length) return null;
  return (
    <Card padded={false} title={`Recent dispensing (${issues.length})`} className="dp-recent">
      <Table columns={columns} data={issues} getRowKey={(s, i) => i} />
    </Card>
  );
}
