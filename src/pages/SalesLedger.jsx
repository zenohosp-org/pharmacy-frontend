import { useState, useEffect } from 'react';
import { getCounterSales, getDrugs } from '../api/pharmacyClient';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  Box,
  Typography
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

export default function SalesLedger() {
  const [sales, setSales] = useState([]);
  const [drugs, setDrugs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesData, drugsData] = await Promise.all([
        getCounterSales(),
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

  const SalesRow = ({ sale }) => {
    const [open, setOpen] = useState(false);
    const subtotal = parseFloat(sale.qty || 0) * parseFloat(sale.rate || 0);
    const gstAmount = subtotal * (parseFloat(sale.gstRate || 0) / 100);
    const total = subtotal + gstAmount;

    return (
      <>
        <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
          <TableCell>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
          <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
            {getDrugName(sale.drugId)}
          </TableCell>
          <TableCell align="right">{parseFloat(sale.qty || 0).toFixed(2)}</TableCell>
          <TableCell align="right">₹{parseFloat(sale.rate || 0).toFixed(2)}</TableCell>
          <TableCell align="right">₹{subtotal.toFixed(2)}</TableCell>
          <TableCell align="right" sx={{ color: 'var(--color-warning-dark)' }}>
            ₹{gstAmount.toFixed(2)}
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 600, color: 'var(--color-success-dark)', fontSize: '1.1em' }}>
            ₹{total.toFixed(2)}
          </TableCell>
          <TableCell sx={{ fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)' }}>
            {new Date(sale.dispensedAt).toLocaleTimeString()}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 2, backgroundColor: 'var(--color-gray-50)', borderRadius: '8px', padding: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, marginBottom: 2 }}>
                  Transaction Details
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--color-gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                      GST Rate
                    </Typography>
                    <Typography sx={{ marginTop: 0.5 }}>{parseFloat(sale.gstRate || 0).toFixed(0)}%</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--color-gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Discount
                    </Typography>
                    <Typography sx={{ marginTop: 0.5 }}>₹{(sale.discount || 0).toFixed(2)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--color-gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Bill Type
                    </Typography>
                    <Typography sx={{ marginTop: 0.5 }}>{sale.billType || 'CASH'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--color-gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Batch ID
                    </Typography>
                    <Typography sx={{ marginTop: 0.5, fontSize: 'var(--fs-xs)' }}>
                      <code style={{ backgroundColor: 'white', padding: '2px 6px', borderRadius: '4px' }}>
                        {sale.batchId?.slice(0, 8)}...
                      </code>
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'var(--color-gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Dispensed At
                    </Typography>
                    <Typography sx={{ marginTop: 0.5 }}>
                      {new Date(sale.dispensedAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  };

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
          <Paper elevation={2} style={{ padding: 'var(--spacing-16) var(--spacing-8)', textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-4)' }}>
              No sales recorded yet
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--color-gray-400)', marginBottom: 'var(--spacing-6)' }}>
              Create your first counter sale to see transactions here
            </Typography>
            <Link to="/pharmacy/counter-sale" className="btn btn-primary">
              Start a Sale
            </Link>
          </Paper>
        ) : (
          <TableContainer component={Paper} elevation={2}>
            <Box sx={{ padding: 2 }}>
              <Typography variant="h6" sx={{ marginBottom: 2, fontWeight: 600 }}>
                Recent Transactions ({sales.length})
              </Typography>
            </Box>
            <Table aria-label="collapsible sales table">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'var(--color-gray-50)' }}>
                  <TableCell sx={{ width: '40px' }} />
                  <TableCell sx={{ fontWeight: 600, fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Drug</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Rate</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Subtotal</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>GST</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Total</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sales.map((sale) => (
                  <SalesRow key={sale.id} sale={sale} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>
    </div>
  );
}
