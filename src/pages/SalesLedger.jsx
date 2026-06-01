import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCounterSales, getDrugs } from '../api/pharmacyClient';
import PageHeader from '../components/shared/PageHeader';
import ContentLoader from '../components/shared/ContentLoader';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import './SalesLedger.css';

const num = (n) => parseFloat(n || 0);

export default function SalesLedger() {
  const [sales, setSales] = useState([]);
  const [drugs, setDrugs] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesData, drugsData] = await Promise.all([getCounterSales(), getDrugs()]);
      setSales(salesData || []);
      const drugMap = {};
      drugsData.forEach(drug => {
        drugMap[drug.id] = `${drug.brandName} (${drug.genericName})`;
      });
      setDrugs(drugMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getDrugName = (drugId) => drugs[drugId] || `Drug ${drugId?.slice(0, 8)}`;
  const subtotalOf = (s) => num(s.qty) * num(s.rate);
  const gstOf = (s) => subtotalOf(s) * (num(s.gstRate) / 100);
  const totalOf = (s) => subtotalOf(s) + gstOf(s);

  const totalRevenue = sales.reduce((sum, s) => sum + totalOf(s), 0);
  const totalGst = sales.reduce((sum, s) => sum + gstOf(s), 0);
  const totalItems = sales.reduce((sum, s) => sum + num(s.qty), 0);

  const columns = [
    { header: 'Drug', render: (_, s) => <span className="cell-strong">{getDrugName(s.drugId)}</span> },
    { header: 'Qty', align: 'right', render: (_, s) => num(s.qty).toFixed(2) },
    { header: 'Rate', align: 'right', render: (_, s) => `₹${num(s.rate).toFixed(2)}` },
    { header: 'Subtotal', align: 'right', render: (_, s) => `₹${subtotalOf(s).toFixed(2)}` },
    { header: 'GST', align: 'right', render: (_, s) => <span className="sl-gst">₹{gstOf(s).toFixed(2)}</span> },
    { header: 'Total', align: 'right', render: (_, s) => <span className="sl-total">₹{totalOf(s).toFixed(2)}</span> },
    { header: 'Time', align: 'center', render: (_, s) => <span className="text-muted text-xs">{new Date(s.dispensedAt).toLocaleTimeString()}</span> },
  ];

  const renderDetails = (s) => (
    <div className="sl-detail">
      <div className="sl-detail-title">Transaction Details</div>
      <div className="sl-detail-grid">
        <div>
          <div className="sl-detail-label">GST Rate</div>
          <div>{num(s.gstRate).toFixed(0)}%</div>
        </div>
        <div>
          <div className="sl-detail-label">Discount</div>
          <div>₹{num(s.discount).toFixed(2)}</div>
        </div>
        <div>
          <div className="sl-detail-label">Bill Type</div>
          <div>{s.billType || 'CASH'}</div>
        </div>
        <div>
          <div className="sl-detail-label">Batch ID</div>
          <div><code className="sl-code">{s.batchId?.slice(0, 8)}...</code></div>
        </div>
        <div>
          <div className="sl-detail-label">Dispensed At</div>
          <div>{new Date(s.dispensedAt).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );

  if (loading) return <ContentLoader label="Loading sales data…" />;

  return (
    <div>
      <PageHeader
        title="Sales Ledger"
        subtitle="Track all counter sales and transactions"
        actions={<Link to="/pharmacy/counter-sale" className="btn btn-primary">+ New Sale</Link>}
      />

      <div className="grid grid-4 section-gap">
        <StatCard label="Total Sales" value={sales.length} sub="Transactions recorded" icon="📊" />
        <StatCard label="Total Revenue" value={`₹${totalRevenue.toFixed(2)}`} sub="From all sales" icon="💰" tone="success" />
        <StatCard label="Total GST" value={`₹${totalGst.toFixed(2)}`} sub="GST collected" icon="📋" tone="warning" />
        <StatCard label="Total Items" value={totalItems} sub="Units sold" icon="📦" />
      </div>

      <Card padded={false} title={`Recent Transactions (${sales.length})`}>
        <Table
          columns={columns}
          data={sales}
          emptyMessage="No sales recorded yet. Create your first counter sale to see transactions here."
          renderExpanded={renderDetails}
        />
      </Card>
    </div>
  );
}
