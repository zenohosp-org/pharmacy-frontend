import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ContentLoader from './components/shared/ContentLoader';

// Lazy-loaded pages — each becomes its own chunk, fetched on first visit.
const Login = lazy(() => import('./pages/Login'));
const SsoCallback = lazy(() => import('./pages/SsoCallback'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DrugMaster = lazy(() => import('./pages/DrugMaster'));
const StockDashboard = lazy(() => import('./pages/StockDashboard'));
const CounterSale = lazy(() => import('./pages/CounterSale'));
const SalesLedger = lazy(() => import('./pages/SalesLedger'));
const Dispensing = lazy(() => import('./pages/Dispensing'));
const DispensingQueue = lazy(() => import('./pages/DispensingQueue'));
const DispensingLog = lazy(() => import('./pages/DispensingLog'));

// Reports module
const ReportsIndex = lazy(() => import('./pages/reports/ReportsIndex'));
const SalesSummary = lazy(() => import('./pages/reports/SalesSummary'));
const SalesByDrug = lazy(() => import('./pages/reports/SalesByDrug'));
const PaymentBreakdown = lazy(() => import('./pages/reports/PaymentBreakdown'));
const TopSellers = lazy(() => import('./pages/reports/TopSellers'));
const DrugHistory = lazy(() => import('./pages/reports/DrugHistory'));
const StockValuation = lazy(() => import('./pages/reports/StockValuation'));
const NearExpiry = lazy(() => import('./pages/reports/NearExpiry'));
const StockMovement = lazy(() => import('./pages/reports/StockMovement'));
const DeadStock = lazy(() => import('./pages/reports/DeadStock'));

// Fullscreen fallback for routes rendered outside the layout shell.
const fullscreen = (el) => <Suspense fallback={<ContentLoader fullscreen />}>{el}</Suspense>;

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={fullscreen(<Login />)} />
          <Route path="/sso/callback" element={fullscreen(<SsoCallback />)} />

          {/* Protected shell: Layout (header + sidebar) mounts once.
              Child pages render into Layout's <Outlet/>, which has its own
              Suspense boundary so only the content area shows a loader. */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/pharmacy/dashboard" element={<Dashboard />} />
            <Route path="/pharmacy/drugs" element={<DrugMaster />} />
            <Route path="/pharmacy/stock" element={<StockDashboard />} />
            <Route path="/pharmacy/counter-sale" element={<CounterSale />} />
            <Route path="/pharmacy/sales-ledger" element={<SalesLedger />} />
            <Route path="/sales-ledger" element={<SalesLedger />} />
            <Route path="/pharmacy/dispensing" element={<Dispensing />} />
            <Route path="/pharmacy/dispensing/queue" element={<DispensingQueue />} />
            <Route path="/pharmacy/dispensing/logs" element={<DispensingLog />} />
            <Route path="/pharmacy/reports" element={<ReportsIndex />} />
            <Route path="/pharmacy/reports/sales-summary" element={<SalesSummary />} />
            <Route path="/pharmacy/reports/sales-by-drug" element={<SalesByDrug />} />
            <Route path="/pharmacy/reports/payments" element={<PaymentBreakdown />} />
            <Route path="/pharmacy/reports/top-sellers" element={<TopSellers />} />
            <Route path="/pharmacy/reports/drug-history" element={<DrugHistory />} />
            <Route path="/pharmacy/reports/stock-valuation" element={<StockValuation />} />
            <Route path="/pharmacy/reports/near-expiry" element={<NearExpiry />} />
            <Route path="/pharmacy/reports/stock-movement" element={<StockMovement />} />
            <Route path="/pharmacy/reports/dead-stock" element={<DeadStock />} />
          </Route>

          <Route path="/" element={<Navigate to="/pharmacy/dashboard" />} />
          <Route path="*" element={<Navigate to="/pharmacy/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
