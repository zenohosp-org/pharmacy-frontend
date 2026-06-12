import { Link } from 'react-router-dom';
import useDashboardData from '../hooks/useDashboardData';
import PageHeader from '../components/shared/PageHeader';
import ContentLoader from '../components/shared/ContentLoader';
import DashboardStats from '../components/dashboard/DashboardStats';
import AlertCards from '../components/dashboard/AlertCards';
import TodaysTransactionsCard from '../components/dashboard/TodaysTransactionsCard';
import QuickActions from '../components/dashboard/QuickActions';
import './Dashboard.css';

export default function Dashboard() {
  const { loading, expiryAlerts, reorderAlerts, todaySales, todayRevenue, drugName, lineTotal } = useDashboardData();

  if (loading) return <ContentLoader label="Loading dashboard…" />;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        actions={<Link to="/pharmacy/counter-sale" className="btn btn-success">+ New Sale</Link>}
      />

      <DashboardStats
        todayCount={todaySales.length}
        todayRevenue={todayRevenue}
        expiryCount={expiryAlerts.length}
        lowStockCount={reorderAlerts.length}
      />

      <AlertCards expiryAlerts={expiryAlerts} reorderAlerts={reorderAlerts} drugName={drugName} />

      <TodaysTransactionsCard todaySales={todaySales} drugName={drugName} lineTotal={lineTotal} />

      <QuickActions />
    </div>
  );
}
