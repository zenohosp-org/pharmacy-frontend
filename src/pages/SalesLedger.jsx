import { useState, useEffect } from 'react';
import { getCounterSales, getDrugs } from '../api/pharmacyClient';
import { Link } from 'react-router-dom';

const STORE_ID = '550e8400-e29b-41d4-a716-446655440001';

export default function SalesLedger() {
  const [sales, setSales] = useState([]);
  const [drugs, setDrugs] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedSaleId, setExpandedSaleId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesData, drugsData] = await Promise.all([
        getCounterSales(STORE_ID),
        getDrugs()
      ]);
      setSales(salesData || []);
      const drugMap = {};
      drugsData.forEach(drug => {
        drugMap[drug.id] = `${drug.brandName} (${drug.genericName})`;
      });
      setDrugs(drugMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getDrugName = (drugId) => drugs[drugId] || `Drug ${drugId?.slice(0, 8)}`;

  const totalRevenue = sales.reduce((sum, s) => {
    const subtotal = parseFloat(s.qty || 0) * parseFloat(s.rate || 0);
    const gst = subtotal * (parseFloat(s.gstRate || 0) / 100);
    return sum + subtotal + gst;
  }, 0);

  const totalGst = sales.reduce((sum, s) => {
    const subtotal = parseFloat(s.qty || 0) * parseFloat(s.rate || 0);
    return sum + (subtotal * (parseFloat(s.gstRate || 0) / 100));
  }, 0);

  const totalItems = sales.reduce((sum, s) => sum + parseFloat(s.qty || 0), 0);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-page)' }}>
        <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--fs-lg)' }}>Loading sales data...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-page)' }}>
      {/* Header */}
      <div style={{
        padding: 'var(--spacing-8)',
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-gray-200)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ marginBottom: 'var(--spacing-2)' }}>Sales Ledger</h1>
          <p style={{ margin: 0, color: 'var(--color-gray-600)' }}>
            Track all counter sales and transactions
          </p>
        </div>
        <Link to="/pharmacy/counter-sale" className="btn btn-primary">
          + New Sale
        </Link>
      </div>

      {/* Main Content */}
      <div style={{ padding: 'var(--spacing-8)' }}>
        {/* Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--spacing-6)',
          marginBottom: 'var(--spacing-8)'
        }}>
          {/* Total Sales Card */}
          <div className="card card-elevated">
            <div className="card-body">
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-4)'
              }}>
                <div>
                  <p style={{
                    margin: 0,
                    fontSize: 'var(--fs-sm)',
                    color: 'var(--color-gray-600)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 'var(--fw-semibold)'
                  }}>
                    Total Sales
                  </p>
                </div>
                <span style={{
                  fontSize: '24px',
                  color: 'var(--color-primary)'
                }}>
                  📊
                </span>
              </div>
              <p style={{
                margin: 0,
                fontSize: 'var(--fs-4xl)',
                fontWeight: 'var(--fw-bold)',
                color: 'var(--color-gray-900)'
              }}>
                {sales.length}
              </p>
              <p style={{
                margin: 'var(--spacing-2) 0 0 0',
                fontSize: 'var(--fs-xs)',
                color: 'var(--color-gray-500)'
              }}>
                Transactions recorded
              </p>
            </div>
          </div>

          {/* Total Revenue Card */}
          <div className="card card-elevated">
            <div className="card-body">
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-4)'
              }}>
                <div>
                  <p style={{
                    margin: 0,
                    fontSize: 'var(--fs-sm)',
                    color: 'var(--color-gray-600)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 'var(--fw-semibold)'
                  }}>
                    Total Revenue
                  </p>
                </div>
                <span style={{
                  fontSize: '24px',
                  color: 'var(--color-success)'
                }}>
                  💰
                </span>
              </div>
              <p style={{
                margin: 0,
                fontSize: 'var(--fs-4xl)',
                fontWeight: 'var(--fw-bold)',
                color: 'var(--color-success)'
              }}>
                ₹{totalRevenue.toFixed(2)}
              </p>
              <p style={{
                margin: 'var(--spacing-2) 0 0 0',
                fontSize: 'var(--fs-xs)',
                color: 'var(--color-gray-500)'
              }}>
                From all sales
              </p>
            </div>
          </div>

          {/* Total GST Card */}
          <div className="card card-elevated">
            <div className="card-body">
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-4)'
              }}>
                <div>
                  <p style={{
                    margin: 0,
                    fontSize: 'var(--fs-sm)',
                    color: 'var(--color-gray-600)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 'var(--fw-semibold)'
                  }}>
                    Total GST
                  </p>
                </div>
                <span style={{
                  fontSize: '24px',
                  color: 'var(--color-warning)'
                }}>
                  📋
                </span>
              </div>
              <p style={{
                margin: 0,
                fontSize: 'var(--fs-4xl)',
                fontWeight: 'var(--fw-bold)',
                color: 'var(--color-warning)'
              }}>
                ₹{totalGst.toFixed(2)}
              </p>
              <p style={{
                margin: 'var(--spacing-2) 0 0 0',
                fontSize: 'var(--fs-xs)',
                color: 'var(--color-gray-500)'
              }}>
                GST collected
              </p>
            </div>
          </div>

          {/* Total Items Card */}
          <div className="card card-elevated">
            <div className="card-body">
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-4)'
              }}>
                <div>
                  <p style={{
                    margin: 0,
                    fontSize: 'var(--fs-sm)',
                    color: 'var(--color-gray-600)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 'var(--fw-semibold)'
                  }}>
                    Total Items
                  </p>
                </div>
                <span style={{
                  fontSize: '24px',
                  color: 'var(--color-info)'
                }}>
                  📦
                </span>
              </div>
              <p style={{
                margin: 0,
                fontSize: 'var(--fs-4xl)',
                fontWeight: 'var(--fw-bold)',
                color: 'var(--color-info)'
              }}>
                {totalItems}
              </p>
              <p style={{
                margin: 'var(--spacing-2) 0 0 0',
                fontSize: 'var(--fs-xs)',
                color: 'var(--color-gray-500)'
              }}>
                Units sold
              </p>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        {sales.length === 0 ? (
          <div className="card card-elevated">
            <div style={{
              padding: 'var(--spacing-16) var(--spacing-8)',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: 'var(--fs-lg)',
                color: 'var(--color-gray-500)',
                marginBottom: 'var(--spacing-4)'
              }}>
                No sales recorded yet
              </p>
              <p style={{ color: 'var(--color-gray-400)', marginBottom: 'var(--spacing-6)' }}>
                Create your first counter sale to see transactions here
              </p>
              <Link to="/pharmacy/counter-sale" className="btn btn-primary">
                Start a Sale
              </Link>
            </div>
          </div>
        ) : (
          <div className="card card-elevated">
            <div className="card-header">
              <h3 style={{ margin: 0 }}>Recent Transactions ({sales.length})</h3>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Drug</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Rate</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                  <th style={{ textAlign: 'right' }}>GST</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'center' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => {
                  const subtotal = parseFloat(sale.qty || 0) * parseFloat(sale.rate || 0);
                  const gstAmount = subtotal * (parseFloat(sale.gstRate || 0) / 100);
                  const total = subtotal + gstAmount;

                  return (
                    <tr key={sale.id}>
                      <td>
                        <strong style={{ color: 'var(--color-gray-900)' }}>
                          {getDrugName(sale.drugId)}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {parseFloat(sale.qty || 0).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        ₹{parseFloat(sale.rate || 0).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        ₹{subtotal.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--color-warning-dark)' }}>
                          ₹{gstAmount.toFixed(2)}
                        </span>
                        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)' }}>
                          ({parseFloat(sale.gstRate || 0).toFixed(0)}%)
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: 'var(--fs-lg)', color: 'var(--color-success-dark)' }}>
                          ₹{total.toFixed(2)}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--color-gray-500)', fontSize: 'var(--fs-xs)' }}>
                        {new Date(sale.dispensedAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
