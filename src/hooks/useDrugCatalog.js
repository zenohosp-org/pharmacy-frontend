import { useState, useEffect } from 'react';
import { getDrugs } from '../api/pharmacyClient';

// Loads the drug catalog once and exposes a search filter.
// `filterDrug(drug, query)` matches brand, generic or salt name.
export default function useDrugCatalog() {
  const [drugs, setDrugs] = useState([]);

  useEffect(() => {
    getDrugs().then(setDrugs).catch(console.error);
  }, []);

  const filterDrug = (d, q) => {
    const t = q.toLowerCase();
    return d.brandName?.toLowerCase().includes(t) ||
           d.genericName?.toLowerCase().includes(t) ||
           d.saltName?.toLowerCase().includes(t);
  };

  return { drugs, setDrugs, filterDrug };
}
