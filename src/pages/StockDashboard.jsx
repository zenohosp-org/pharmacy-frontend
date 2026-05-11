import { useState, useEffect } from 'react';
import { getDrugs, getAllStock, getExpiryAlerts, getReorderAlerts, getBatches } from '../api/pharmacyClient';
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

export default function StockDashboard() {
  const [drugs, setDrugs] = useState([]);
  const [stock, setStock] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [reorderAlerts, setReorderAlerts] = useState([]);
  const [batchDetails, setBatchDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [drugsData, stockData, expiryData, reorderData] = await Promise.all([
        getDrugs(),
        getAllStock(),
        getExpiryAlerts(30),
        getReorderAlerts()
      ]);
      setDrugs(drugsData);
      setStock(stockData);
      setExpiryAlerts(expiryData);
      setReorderAlerts(reorderData);
      setError(null);
    } catch (e) {
      setError('Failed to load stock data');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStockQtyForDrug = (drugId) => {
    const entry = stock.find(s => s.drugId === drugId.toString() || s.drugId === drugId);
    return entry ? parseFloat(entry.totalQty) : 0;
  };

  const isDrugInExpiryAlert = (drugId) => {
    return expiryAlerts.some(b => b.drugId === drugId);
  };

  const getDrugReorderAlert = (drugId) => {
    return reorderAlerts.find(a => a.drugId === drugId);
  };

  const getDrugName = (drugId) => {
    const drug = drugs.find(d => d.id === drugId);
    return drug ? `${drug.brandName} (${drug.genericName})` : drugId;
  };

  const StockRow = ({ drug }) => {
    const [open, setOpen] = useState(false);
    const qty = getStockQtyForDrug(drug.id);
    const hasExpiryAlert = isDrugInExpiryAlert(drug.id);
    const reorderAlert = getDrugReorderAlert(drug.id);
    const batches = batchDetails[drug.id] || [];

    const handleLoadBatches = async () => {
      if (!batchDetails[drug.id]) {
        try {
          const fetchedBatches = await getBatches(drug.id);
          setBatchDetails(prev => ({
            ...prev,
            [drug.id]: fetchedBatches
          }));
        } catch (e) {
          console.error('Failed to fetch batches:', e);
        }
      }
    };

    const handleClick = () => {
      if (!open) {
        handleLoadBatches();
      }
      setOpen(!open);
    };

    return (
      <>
        <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
          <TableCell>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={handleClick}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
          <TableCell component="th" scope="row">
            <div style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
              {drug.brandName}
            </div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)', marginTop: '4px' }}>
              {drug.genericName}
            </div>
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 600, fontSize: 'var(--fs-lg)' }}>
            {qty.toFixed(2)}
          </TableCell>
          <TableCell align="center">
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {hasExpiryAlert && (
                <span className="badge badge-error">Expiring</span>
              )}
              {reorderAlert && (
                <span className="badge badge-warning">Low Stock</span>
              )}
              {!hasExpiryAlert && !reorderAlert && (
                <span className="badge badge-success">OK</span>
              )}
            </div>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 2, backgroundColor: 'var(--color-gray-50)', borderRadius: '8px', padding: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, marginBottom: 2 }}>
                  Batch Details
                </Typography>
                {batches.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'var(--color-gray-500)' }}>
                    No batches available
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size="small" sx={{ backgroundColor: 'white' }}>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'var(--color-gray-50)' }}>
                          <TableCell sx={{ fontWeight: 600, fontSize: 'var(--fs-xs)' }}>Batch Number</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: 'var(--fs-xs)' }}>Expiry Date</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, fontSize: 'var(--fs-xs)' }}>Qty</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {batches.map((batch) => (
                          <TableRow key={batch.id}>
                            <TableCell>
                              <code style={{ backgroundColor: 'var(--color-gray-100)', padding: '2px 6px', borderRadius: '4px', fontSize: 'var(--fs-xs)' }}>
                                {batch.batchNumber}
                              </code>
                            </TableCell>
                            <TableCell>{new Date(batch.expiryDate).toLocaleDateString()}</TableCell>
                            <TableCell align="right">
                              <strong>{batch.receivedQty ? parseFloat(batch.receivedQty).toFixed(2) : '—'}</strong>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-page)' }}>
        <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--fs-lg)' }}>Loading stock data...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-page)' }}>
      {/* Header */}
      <div style={{
        padding: 'var(--spacing-8)',
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-gray-200)'
      }}>
        <h1 style={{ marginBottom: 'var(--spacing-2)' }}>Stock Dashboard</h1>
        <p style={{ margin: 0, color: 'var(--color-gray-600)' }}>
          Monitor pharmacy inventory and stock levels
        </p>
      </div>

      {/* Main Content */}
      <div style={{ padding: 'var(--spacing-8)' }}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-6)' }}>
            {error}
          </div>
        )}

        {reorderAlerts.length > 0 && (
          <div className="alert alert-warning" style={{ marginBottom: 'var(--spacing-6)' }}>
            <strong>⚠️ {reorderAlerts.length} items need reordering</strong>
            <ul style={{ marginBottom: 0, marginTop: 'var(--spacing-3)', paddingLeft: '20px' }}>
              {reorderAlerts.map(alert => (
                <li key={alert.drugId}>{alert.drugName}: {alert.currentStock} / {alert.reorderQty} units</li>
              ))}
            </ul>
          </div>
        )}

        {expiryAlerts.length > 0 && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-6)' }}>
            <strong>🔴 {expiryAlerts.length} items expiring soon</strong>
            <ul style={{ marginBottom: 0, marginTop: 'var(--spacing-3)', paddingLeft: '20px' }}>
              {expiryAlerts.map(batch => (
                <li key={batch.id}>{getDrugName(batch.drugId)}: Expires {new Date(batch.expiryDate).toLocaleDateString()}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Stock Table */}
        {drugs.length === 0 ? (
          <Paper elevation={2} style={{ padding: 'var(--spacing-16) var(--spacing-8)', textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-4)' }}>
              No drugs in catalog
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} elevation={2}>
            <Box sx={{ padding: 2 }}>
              <Typography variant="h6" sx={{ marginBottom: 2, fontWeight: 600 }}>
                Current Stock Levels ({drugs.length})
              </Typography>
            </Box>
            <Table aria-label="collapsible stock table">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'var(--color-gray-50)' }}>
                  <TableCell sx={{ width: '40px' }} />
                  <TableCell sx={{ fontWeight: 600, fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Drug</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Total Qty</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {drugs.map((drug) => (
                  <StockRow key={drug.id} drug={drug} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>
    </div>
  );
}
