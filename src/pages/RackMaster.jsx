import { useState } from 'react';
import useRackMaster from '../hooks/useRackMaster';
import PageHeader from '../components/shared/PageHeader';
import ContentLoader from '../components/shared/ContentLoader';
import Alert from '../components/shared/Alert';
import StatusBadge from '../components/shared/StatusBadge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import RackEditModal from '../components/rack-master/RackEditModal';
import './RackMaster.css';

export default function RackMaster() {
  const {
    filteredRacks, storeId, loading, error,
    searchQuery, setSearchQuery, removeRack, refetch,
  } = useRackMaster();

  const [showModal, setShowModal] = useState(false);
  const [editingRack, setEditingRack] = useState(null);

  const openAdd = () => { setEditingRack(null); setShowModal(true); };
  const openEdit = (rack) => { setEditingRack(rack); setShowModal(true); };

  const columns = [
    { header: 'Code', render: (_, r) => <code className="rack-code">{r.code}</code> },
    { header: 'Name', render: (_, r) => r.name || '—' },
    { header: 'Type', render: (_, r) => r.rackType || '—' },
    { header: 'Status', align: 'center', render: (_, r) => (
      r.isActive ? <StatusBadge tone="success">Active</StatusBadge> : <StatusBadge tone="warning">Inactive</StatusBadge>
    ) },
    { header: 'Actions', render: (_, r) => (
      <div className="action-group">
        <Button size="sm" onClick={() => openEdit(r)}>Edit</Button>
        {r.isActive && <Button size="sm" variant="danger" onClick={() => removeRack(r.id)}>Deactivate</Button>}
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Rack Master" subtitle="Define the physical racks/shelves where pharmacy stock is stored." />

      {error && <Alert tone="error" className="section-gap">{error}</Alert>}

      <div className="rack-toolbar">
        <Input
          className="rack-search"
          placeholder="Search by code or name…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button onClick={openAdd}>Add Rack</Button>
      </div>

      {loading ? (
        <ContentLoader label="Loading racks…" />
      ) : (
        <Card padded={false}>
          <Table columns={columns} data={filteredRacks} emptyMessage="No racks defined yet" />
        </Card>
      )}

      <RackEditModal
        open={showModal}
        rack={editingRack}
        storeId={storeId}
        onClose={() => setShowModal(false)}
        onSaved={refetch}
      />
    </div>
  );
}
