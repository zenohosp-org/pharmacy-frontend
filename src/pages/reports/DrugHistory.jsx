import { useState, useEffect } from 'react';
import { getDrugs, getDrugHistory } from '../../api/pharmacyClient';
import PageHeader from '../../components/shared/PageHeader';
import DateRangeFilter from '../../components/shared/DateRangeFilter';
import ExportButton from '../../components/shared/ExportButton';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import { inr, num, isoDaysAgo, isoToday, monthLabel } from '../../utils/format';

const columns = [
  { header: 'Month', render: (_, r) => monthLabel(r.year, r.month) },
  { header: 'Qty', align: 'right', render: (_, r) => num(r.qty) },
  { header: 'Revenue', align: 'right', render: (_, r) => <strong>{inr(r.revenue)}</strong> },
];

const exportCols = [
  { header: 'Month', value: (r) => monthLabel(r.year, r.month) },
  { header: 'Qty', value: (r) => r.qty },
  { header: 'Revenue', value: (r) => r.revenue },
];

export default function DrugHistory() {
  const [drugs, setDrugs] = useState([]);
  const [drugId, setDrugId] = useState('');
  const [from, setFrom] = useState(isoDaysAgo(365));
  const [to, setTo] = useState(isoToday());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDrugs().then((d) => {
      setDrugs(d || []);
      if (d?.length && !drugId) setDrugId(d[0].id);
    }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!drugId) return;
    let alive = true;
    setLoading(true);
    getDrugHistory(drugId, from, to)
      .then((d) => { if (alive) setRows(d || []); })
      .catch(console.error)
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [drugId, from, to]);

  const drugName = drugs.find((d) => d.id === drugId)?.brandName || 'drug';

  return (
    <div>
      <PageHeader
        backTo="/pharmacy/reports"
        title="Drug Sales History"
        subtitle="Monthly sales trend for a single drug"
        actions={<ExportButton columns={exportCols} rows={rows} filename={`drug-history_${drugName}`} />}
      />

      <DateRangeFilter from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }}>
        <label className="drf-field">
          <span>Drug</span>
          <select className="form-select" value={drugId} onChange={(e) => setDrugId(e.target.value)}>
            {drugs.map((d) => <option key={d.id} value={d.id}>{d.brandName} ({d.genericName})</option>)}
          </select>
        </label>
      </DateRangeFilter>

      <Card padded={false} title={`${drugName} — monthly`}>
        <Table columns={columns} data={rows} loading={loading} emptyMessage="No sales for this drug in the period." getRowKey={(r) => `${r.year}-${r.month}`} />
      </Card>
    </div>
  );
}
