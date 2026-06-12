import { useState, useEffect, useCallback } from 'react';
import { getRacks, deleteRack, getDefaultStoreId } from '../api/pharmacyClient';

// Rack Master list state: load racks for the default store, search filter, deactivate.
// Create/update is handled by RackEditModal (its own form state).
export default function useRackMaster() {
  const [racks, setRacks] = useState([]);
  const [storeId, setStoreId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRacks = useCallback(async (sid) => {
    try {
      setLoading(true);
      const data = await getRacks(sid);
      setRacks(data);
      setError(null);
    } catch (e) {
      setError('Failed to load racks. Please refresh.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const sid = await getDefaultStoreId();
      setStoreId(sid);
      await fetchRacks(sid);
    })();
  }, [fetchRacks]);

  const refetch = useCallback(() => fetchRacks(storeId), [fetchRacks, storeId]);

  const filteredRacks = racks.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return r.code?.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q);
  });

  const removeRack = async (id) => {
    if (!window.confirm('Deactivate this rack? Batches already assigned to it keep their reference.')) return;
    try {
      await deleteRack(id);
      await refetch();
    } catch (e) {
      setError('Failed to deactivate rack: ' + (e.response?.data?.message || e.message));
      console.error(e);
    }
  };

  return {
    racks, filteredRacks, storeId, loading, error,
    searchQuery, setSearchQuery,
    removeRack, refetch,
  };
}
