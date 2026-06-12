import Card from '../ui/Card';
import Table from '../ui/Table';
import Button from '../ui/Button';
import StatusBadge from '../shared/StatusBadge';
import { fmt } from '../../utils/format';

export default function RecentSalesTable({ sales, onPrint }) {
  if (!sales.length) return null;

  const columns = [
    { header: 'Bill #', render: (_, s) => <strong>{s.billNumber}</strong> },
    { header: 'Time', render: (_, s) => <span className="text-muted text-sm">{s.timestamp}</span> },
    { header: 'Amount', align: 'right', render: (_, s) => <strong>₹{fmt(s.total)}</strong> },
    { header: 'Items', align: 'center', render: (_, s) => <StatusBadge tone="primary">{s.items.length}</StatusBadge> },
    { header: 'Print', align: 'center', render: (_, s) => <Button size="sm" variant="secondary" onClick={() => onPrint(s)}>🖨 Print</Button> },
  ];

  return (
    <Card padded={false} title={`Recent sales (${sales.length})`} className="cs-recent">
      <Table columns={columns} data={sales.slice(0, 10)} />
    </Card>
  );
}
