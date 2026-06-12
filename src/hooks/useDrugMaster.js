import { useState, useEffect } from 'react';
import { getDrugs, deleteDrug, importDrugsExcel } from '../api/pharmacyClient';

// Drug Master list state: load, search/schedule filter, Excel import, delete.
// Edit/save is handled by DrugEditModal (its own form state).
export default function useDrugMaster() {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

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

  useEffect(() => {
    fetchDrugs();
  }, []);

  const filteredDrugs = drugs.filter(d => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!(d.name?.toLowerCase().includes(q) || d.genericName?.toLowerCase().includes(q))) return false;
    }
    if (selectedSchedule && d.drugSchedule !== selectedSchedule) return false;
    return true;
  });

  const importExcel = async (file) => {
    setImporting(true);
    setImportResult(null);
    setError(null);
    try {
      const result = await importDrugsExcel(file);
      setImportResult(result);
      await fetchDrugs();
    } catch (err) {
      setError('Excel import failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setImporting(false);
    }
  };

  const removeDrug = async (drugId) => {
    if (!window.confirm('Delete this drug from inventory?')) return;
    try {
      await deleteDrug(drugId);
      await fetchDrugs();
    } catch (e) {
      setError('Failed to delete drug');
      console.error(e);
    }
  };

  return {
    drugs, filteredDrugs, loading, error,
    searchQuery, setSearchQuery,
    selectedSchedule, setSelectedSchedule,
    importing, importResult, importExcel,
    removeDrug, refetch: fetchDrugs,
  };
}
