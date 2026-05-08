import { useState, useEffect } from 'react';
import { getDrugs } from '../api/pharmacyClient';

export default function DrugMaster() {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDrugs = async () => {
      try {
        const data = await getDrugs();
        setDrugs(data);
      } catch (e) {
        setError('Failed to load drugs. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetchDrugs();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <h1>Drug Master</h1>
      <p>Manage pharmacy drug inventory</p>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && !error && (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>Brand</th>
              <th>Generic</th>
              <th>HSN Code</th>
              <th>Schedule</th>
              <th>Form</th>
              <th>Strength</th>
            </tr>
          </thead>
          <tbody>
            {drugs.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>No drugs found</td></tr>
            ) : (
              drugs.map(drug => (
                <tr key={drug.id}>
                  <td>{drug.brandName}</td>
                  <td>{drug.genericName}</td>
                  <td>{drug.hsnCode}</td>
                  <td>{drug.schedule}</td>
                  <td>{drug.form}</td>
                  <td>{drug.strength}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
