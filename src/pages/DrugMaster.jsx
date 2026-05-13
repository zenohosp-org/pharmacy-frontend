import { useState, useEffect } from 'react';
import { getDrugs, searchDrugs, deleteDrug, importDrugs, importDrugsExcel } from '../api/pharmacyClient';
import AddEditDrugModal from '../components/AddEditDrugModal';
import './DrugMaster.css';

const SCHEDULE_COLORS = {
  OTC: '#4CAF50',
  H: '#FF9800',
  H1: '#F44336',
  X: '#B71C1C'
};

export default function DrugMaster() {
  const [drugs, setDrugs] = useState([]);
  const [filteredDrugs, setFilteredDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDrug, setEditingDrug] = useState(null);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);

  useEffect(() => {
    fetchDrugs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [drugs, searchQuery, selectedSchedule]);

  const fetchDrugs = async () => {
    try {
      setLoading(true);
      const data = await getDrugs();
      setDrugs(data);
      setError(null);
    } catch (e) {
      setError('Failed to load drugs. Please refresh.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...drugs];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.brandName?.toLowerCase().includes(q) ||
        d.genericName?.toLowerCase().includes(q)
      );
    }

    if (selectedSchedule) {
      filtered = filtered.filter(d => d.schedule === selectedSchedule);
    }

    setFilteredDrugs(filtered);
  };

  const handleAddDrug = () => {
    setEditingDrug(null);
    setShowModal(true);
  };

  const handleEditDrug = (drug) => {
    setEditingDrug(drug);
    setShowModal(true);
  };

  const handleDeleteDrug = async (drugId) => {
    if (window.confirm('Are you sure you want to delete this drug?')) {
      try {
        await deleteDrug(drugId);
        await fetchDrugs();
      } catch (e) {
        setError('Failed to delete drug');
        console.error(e);
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingDrug(null);
  };

  const handleModalSave = async () => {
    await fetchDrugs();
    handleModalClose();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const isExcel = /\.(xlsx|xls)$/.test(file.name);
    const isCSV = /\.csv$/.test(file.name);

    try {
      setImportError(null);
      setImportSuccess(null);

      if (isExcel) {
        await handleExcelUpload(file);
      } else if (isCSV) {
        await handleCSVUpload(file);
      } else {
        setImportError('Please upload a CSV or Excel file (.xlsx, .xls)');
      }
    } catch (e) {
      setImportError('Failed to process file: ' + e.message);
      console.error(e);
    }
    event.target.value = '';
  };

  const handleExcelUpload = async (file) => {
    try {
      const result = await importDrugsExcel(file);
      setImportSuccess({
        imported: result.imported?.length || 0,
        errors: [...(result.errors || []), ...(result.parseErrors || [])]
      });

      if (result.imported && result.imported.length > 0) {
        await fetchDrugs();
      }
    } catch (e) {
      setImportError('Failed to import Excel file: ' + e.message);
      console.error(e);
    }
  };

  const handleCSVUpload = async (file) => {
    const text = await file.text();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    if (lines.length < 2) {
      setImportError('CSV must have at least a header row and one data row');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const headerMap = {};
    headers.forEach((h, i) => {
      headerMap[h] = i;
    });

    const drugRequests = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const drug = {
        brandName: values[headerMap['brandName']] || '',
        genericName: values[headerMap['genericName']] || '',
        hsnCode: values[headerMap['hsnCode']] || '',
        schedule: values[headerMap['schedule']] || '',
        category: values[headerMap['category']] || '',
        form: values[headerMap['form']] || '',
        strength: values[headerMap['strength']] || '',
        unit: values[headerMap['unit']] || '',
        reorderQty: parseInt(values[headerMap['reorderQty']]) || 0,
        manufacturerId: values[headerMap['manufacturerId']] || null
      };
      drugRequests.push(drug);
    }

    const result = await importDrugs(drugRequests);
    setImportSuccess({
      imported: result.imported.length,
      errors: result.errors
    });

    if (result.imported.length > 0) {
      await fetchDrugs();
    }
  };

  return (
    <div className="drug-master-container">
      <div className="mb-6">
        <h1 className="page-title">Drug Master</h1>
        <p className="page-subtitle">Manage pharmacy drug inventory</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {importSuccess && (
        <div className="alert alert-success">
          Successfully imported {importSuccess.imported} drugs
          {importSuccess.errors.length > 0 && ` with ${importSuccess.errors.length} errors`}
        </div>
      )}
      {importError && <div className="alert alert-error">{importError}</div>}

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search by brand or generic name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input search-input"
        />

        <select
          value={selectedSchedule}
          onChange={(e) => setSelectedSchedule(e.target.value)}
          className="form-select"
        >
          <option value="">All Schedules</option>
          <option value="OTC">OTC</option>
          <option value="H">H</option>
          <option value="H1">H1</option>
          <option value="X">X</option>
        </select>

        <button onClick={handleAddDrug} className="btn btn-primary">
          Add Drug
        </button>

        <label className="file-upload-label">
          Import Data
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="file-upload-input"
          />
        </label>
      </div>

      {loading && <div>Loading...</div>}
      {!loading && !error && (
        <>
          <div className="drug-count">
            Showing {filteredDrugs.length} of {drugs.length} drugs
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Generic</th>
                  <th>HSN Code</th>
                  <th>Schedule</th>
                  <th>Form</th>
                  <th>Strength</th>
                  <th>Unit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrugs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center">No drugs found</td>
                  </tr>
                ) : (
                  filteredDrugs.map(drug => (
                    <tr key={drug.id}>
                      <td className="font-semibold">{drug.brandName}</td>
                      <td>{drug.genericName}</td>
                      <td>{drug.hsnCode}</td>
                      <td>
                        <span className="drug-schedule-badge" style={{ backgroundColor: SCHEDULE_COLORS[drug.schedule] || '#999' }}>
                          {drug.schedule}
                        </span>
                      </td>
                      <td>{drug.form}</td>
                      <td>{drug.strength}</td>
                      <td>{drug.unit}</td>
                      <td className="action-cell">
                        <div className="action-group">
                          <button onClick={() => handleEditDrug(drug)} className="btn btn-sm btn-primary">
                            Edit
                          </button>
                          <button onClick={() => handleDeleteDrug(drug.id)} className="btn btn-sm btn-danger">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {importSuccess && importSuccess.errors.length > 0 && (
            <div className="error-table-wrapper">
              <h3 className="error-table-title">Import Errors ({importSuccess.errors.length})</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Reason</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {importSuccess.errors.map((err, i) => (
                    <tr key={i}>
                      <td>{err.row}</td>
                      <td>{err.reason}</td>
                      <td>{err.brand && `Brand: ${err.brand}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showModal && (
        <AddEditDrugModal
          drug={editingDrug}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}
