import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Table from '../ui/Table';
import StatusBadge from '../shared/StatusBadge';
import { fmt } from '../../utils/format';

export default function TodaysTransactionsCard({ todaySales, drugName, lineTotal }) {
  const columns = [
    { header: 'Drug', render: (_, s) => <span className="font-semibold">{drugName(s.drugId)}</span> },
    { header: 'Qty', align: 'right', render: (_, s) => parseFloat(s.qty || 0) },
    { header: 'Rate', align: 'right', render: (_, s) => `₹${fmt(s.rate)}` },
    { header: 'Total', align: 'right', render: (_, s) => <span className="font-semibold">₹{fmt(lineTotal(s))}</span> },
    { header: 'Type', render: (_, s) => <StatusBadge tone={s.billType === 'HMS_CREDIT' ? 'primary' : 'success'}>{s.billType || 'CASH'}</StatusBadge> },
    { header: 'Time', render: (_, s) => <span className="text-muted text-sm">{new Date(s.dispensedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span> },
  ];

  return (
    <Card
      padded={false}
      className="section-gap"
      title={`Today's Transactions (${todaySales.length})`}
      action={<Link to="/pharmacy/sales-ledger" className="dash-link">Full Ledger →</Link>}
    >
      {todaySales.length === 0 ? (
        <div className="dash-empty-state">
          No sales today yet. <Link to="/pharmacy/counter-sale">Start a sale →</Link>
        </div>
      ) : (
        <Table columns={columns} data={todaySales.slice(0, 15)} />
      )}
    </Card>
  );
}
