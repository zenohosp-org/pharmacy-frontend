import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import DrugMaster from './pages/DrugMaster';
import StockDashboard from './pages/StockDashboard';
import CounterSale from './pages/CounterSale';
import Dispensing from './pages/Dispensing';
import Reports from './pages/Reports';

function Nav() {
  return (
    <nav style={{ padding: '12px 24px', borderBottom: '1px solid #ccc', display: 'flex', gap: '16px' }}>
      <strong>Pharmacy</strong>
      <Link to="/pharmacy/drugs">Drug Master</Link>
      <Link to="/pharmacy/stock">Stock</Link>
      <Link to="/pharmacy/counter-sale">Counter Sale</Link>
      <Link to="/pharmacy/dispensing">Dispensing</Link>
      <Link to="/pharmacy/reports">Reports</Link>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <Nav />
      <Routes>
        <Route path="/pharmacy/drugs" element={<DrugMaster />} />
        <Route path="/pharmacy/stock" element={<StockDashboard />} />
        <Route path="/pharmacy/counter-sale" element={<CounterSale />} />
        <Route path="/pharmacy/dispensing" element={<Dispensing />} />
        <Route path="/pharmacy/reports" element={<Reports />} />
        <Route path="/" element={<Navigate to="/pharmacy/drugs" />} />
        <Route path="*" element={<Navigate to="/pharmacy/drugs" />} />
      </Routes>
    </Router>
  );
}
