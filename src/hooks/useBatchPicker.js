import { useState } from 'react';
import { getBatches } from '../api/pharmacyClient';

// FEFO: earliest-expiry first, drop zero-stock batches.
const fefoSort = (batches) =>
  batches
    .filter(b => (b.currentUnits ?? 1) > 0)
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

// Owns the "pending drug row" state plus shared batch fetch + FEFO sort.
// Callers build their own `pending` object (shapes differ between counter sale
// and ward issue) and decide their own out-of-stock policy from the result.
export default function useBatchPicker() {
  const [pending, setPending] = useState(null);
  const [pendingBatches, setPendingBatches] = useState([]);

  // Fetch + FEFO-sort batches for a drug, store them, and return
  // { sorted, raw } so the caller can detect empty/out-of-stock.
  const loadBatches = async (drugId) => {
    const raw = await getBatches(drugId);
    const sorted = fefoSort(raw);
    setPendingBatches(sorted);
    return { sorted, raw };
  };

  const clearPending = () => {
    setPending(null);
    setPendingBatches([]);
  };

  return { pending, setPending, pendingBatches, setPendingBatches, loadBatches, clearPending };
}
