import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import SsoCallback from './pages/SsoCallback';
import Dashboard from './pages/Dashboard';
import DrugMaster from './pages/DrugMaster';
import StockDashboard from './pages/StockDashboard';
import CounterSale from './pages/CounterSale';
import SalesLedger from './pages/SalesLedger';
import Dispensing from './pages/Dispensing';
import DispensingQueue from './pages/DispensingQueue';
import WardDispensing from './pages/WardDispensing';
import Reports from './pages/Reports';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/sso/callback" element={<SsoCallback />} />
          <Route path="/pharmacy/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/pharmacy/drugs" element={<ProtectedRoute><Layout><DrugMaster /></Layout></ProtectedRoute>} />
          <Route path="/pharmacy/stock" element={<ProtectedRoute><Layout><StockDashboard /></Layout></ProtectedRoute>} />
          <Route path="/pharmacy/counter-sale" element={<ProtectedRoute><Layout><CounterSale /></Layout></ProtectedRoute>} />
          <Route path="/pharmacy/sales-ledger" element={<ProtectedRoute><Layout><SalesLedger /></Layout></ProtectedRoute>} />
          <Route path="/sales-ledger" element={<ProtectedRoute><Layout><SalesLedger /></Layout></ProtectedRoute>} />
          <Route path="/pharmacy/dispensing" element={<ProtectedRoute><Layout><Dispensing /></Layout></ProtectedRoute>} />
          <Route path="/pharmacy/dispensing/queue" element={<ProtectedRoute><Layout><DispensingQueue /></Layout></ProtectedRoute>} />
          <Route path="/pharmacy/ward-dispensing" element={<ProtectedRoute><Layout><WardDispensing /></Layout></ProtectedRoute>} />
          <Route path="/pharmacy/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/pharmacy/dashboard" />} />
          <Route path="*" element={<Navigate to="/pharmacy/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
