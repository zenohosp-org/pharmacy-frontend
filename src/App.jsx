import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DrugMaster from './pages/DrugMaster';
import StockDashboard from './pages/StockDashboard';
import StockReceive from './pages/StockReceive';
import CounterSale from './pages/CounterSale';
import SalesLedger from './pages/SalesLedger';
import Dispensing from './pages/Dispensing';
import Reports from './pages/Reports';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/pharmacy/drugs" element={<Layout><DrugMaster /></Layout>} />
        <Route path="/pharmacy/stock" element={<Layout><StockDashboard /></Layout>} />
        <Route path="/pharmacy/stock/receive" element={<Layout><StockReceive /></Layout>} />
        <Route path="/pharmacy/counter-sale" element={<Layout><CounterSale /></Layout>} />
        <Route path="/pharmacy/sales-ledger" element={<Layout><SalesLedger /></Layout>} />
        <Route path="/sales-ledger" element={<Layout><SalesLedger /></Layout>} />
        <Route path="/pharmacy/dispensing" element={<Layout><Dispensing /></Layout>} />
        <Route path="/pharmacy/reports" element={<Layout><Reports /></Layout>} />
        <Route path="/" element={<Navigate to="/pharmacy/stock" />} />
        <Route path="*" element={<Navigate to="/pharmacy/stock" />} />
      </Routes>
    </Router>
  );
}
