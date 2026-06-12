import { useState } from 'react';
import useDrugMaster from '../hooks/useDrugMaster';
import PageHeader from '../components/shared/PageHeader';
import ContentLoader from '../components/shared/ContentLoader';
import Alert from '../components/shared/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import DrugToolbar from '../components/drug-master/DrugToolbar';
import ImportResultAlert from '../components/drug-master/ImportResultAlert';
import DrugEditModal from '../components/drug-master/DrugEditModal';
import { SCHEDULES } from '../components/drug-master/constants';
import './DrugMaster.css';

export default function DrugMaster() {
  const {
    drugs, filteredDrugs, loading, error,
    searchQuery, setSearchQuery,
    selectedSchedule, setSelectedSchedule,
    importing, importResult, importExcel,
    removeDrug, refetch,
  } = useDrugMaster();

  const [showModal, setShowModal] = useState(false);
  const [editingDrug, setEditingDrug] = useState(null);

  const openEdit = (drug) => {
    setEditingDrug(drug);
    setShowModal(true);
  };

  const columns = [
    { header: 'Brand Name', render: (_, d) => <span className="font-semibold">{d.name}</span> },
    { header: 'Generic Name', render: (_, d) => d.genericName || '—' },
    { header: 'HSN Code', render: (_, d) => d.hsnCode || '—' },
    { header: 'Schedule', render: (_, d) => (
      d.drugSchedule
        ? <span className={`drug-schedule-badge drug-schedule-badge--${SCHEDULES.includes(d.drugSchedule) ? d.drugSchedule : 'default'}`}>{d.drugSchedule}</span>
        : '—'
    ) },
    { header: 'Unit', render: (_, d) => d.unit || '—' },
    { header: 'Reorder Qty', render: (_, d) => d.drugReorderQty ?? '—' },
    { header: 'Actions', render: (_, d) => (
      <div className="action-group">
        <Button size="sm" onClick={() => openEdit(d)}>Edit</Button>
        <Button size="sm" variant="danger" onClick={() => removeDrug(d.id)}>Delete</Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader
        title="Drug Master"
        subtitle="Pharmacy drugs are managed as inventory items. Add or edit from here or from Inventory → Product Master."
      />

      {error && <Alert tone="error" className="section-gap">{error}</Alert>}

      <DrugToolbar
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        selectedSchedule={selectedSchedule}
        onSchedule={setSelectedSchedule}
        importing={importing}
        onImport={importExcel}
      />

      <ImportResultAlert result={importResult} />

      {loading ? (
        <ContentLoader label="Loading drugs…" />
      ) : (
        <>
          <div className="drug-count">Showing {filteredDrugs.length} of {drugs.length} drugs</div>
          <Card padded={false}>
            <Table columns={columns} data={filteredDrugs} emptyMessage="No drugs found" />
          </Card>
        </>
      )}

      <DrugEditModal
        open={showModal}
        drug={editingDrug}
        onClose={() => setShowModal(false)}
        onSaved={refetch}
      />
    </div>
  );
}
