import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import DrugMaster from './pages/DrugMaster';
import StockDashboard from './pages/StockDashboard';
import StockReceive from './pages/StockReceive';
import CounterSale from './pages/CounterSale';
import Dispensing from './pages/Dispensing';
import Reports from './pages/Reports';

function Nav() {
  return (
    <nav className="nav-bar">
      <div className="nav-brand">Pharmacy</div>
      <Link to="/pharmacy/drugs" className="nav-link">Drug Master</Link>
      <Link to="/pharmacy/stock" className="nav-link">Stock Dashboard</Link>
      <Link to="/pharmacy/stock/receive" className="nav-link">Receive Stock</Link>
      <Link to="/pharmacy/counter-sale" className="nav-link">Counter Sale</Link>
      <Link to="/pharmacy/dispensing" className="nav-link">Dispensing</Link>
      <Link to="/pharmacy/reports" className="nav-link">Reports</Link>
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
        <Route path="/pharmacy/stock/receive" element={<StockReceive />} />
        <Route path="/pharmacy/counter-sale" element={<CounterSale />} />
        <Route path="/pharmacy/dispensing" element={<Dispensing />} />
        <Route path="/pharmacy/reports" element={<Reports />} />
        <Route path="/" element={<Navigate to="/pharmacy/drugs" />} />
        <Route path="*" element={<Navigate to="/pharmacy/drugs" />} />
      </Routes>
    </Router>
  );
}
