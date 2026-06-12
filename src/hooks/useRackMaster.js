import { useState, useEffect, useCallback } from 'react';
import { getRacks, deleteRack, getStockByRack, getDefaultStoreId } from '../api/pharmacyClient';

// Rack Master state: load racks + the stock currently stored in each rack
// (grouped by rackId) so the board can show real contents. Create/update is
// handled by RackEditModal.
export default function useRackMaster() {
  const [racks, setRacks] = useState([]);
  const [contentsByRack, setContentsByRack] = useState({});
  const [storeId, setStoreId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (sid) => {
    try {
      setLoading(true);
      const [rackData, stock] = await Promise.all([
        getRacks(sid),
        getStockByRack(sid).catch(() => []),
      ]);
      const grouped = {};
      for (const b of stock) {
        if (!b.rackId) continue;
        (grouped[b.rackId] ||= []).push(b);
      }
      setRacks(rackData);
      setContentsByRack(grouped);
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
      await load(sid);
    })();
  }, [load]);

  const refetch = useCallback(() => load(storeId), [load, storeId]);

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

  return { racks, contentsByRack, storeId, loading, error, removeRack, refetch };
}
