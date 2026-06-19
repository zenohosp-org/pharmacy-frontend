import { useState, Suspense, useMemo } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import ContentLoader from './shared/ContentLoader';
import Header from './Header';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, ShoppingCart, History,
    ChevronDown, ChevronRight, Pill, FileText,
    Menu as MenuIcon, X as XIcon,
    Activity, BarChart2, Boxes, BookOpen, LayoutGrid, ArrowUpRight,
    ClipboardList, Receipt, CreditCard, TrendingUp,
    PieChart, AlertTriangle, ArrowLeftRight, PackageX, Coins, Settings,
    RotateCcw
} from 'lucide-react';

const EXTERNAL_APPS = [
    { label: 'HMS',       href: 'https://hms.zenohosp.com',       icon: Activity },
    { label: 'Finance',   href: 'https://finance.zenohosp.com',   icon: BarChart2 },
    { label: 'Inventory', href: 'https://inventory.zenohosp.com', icon: Boxes },
    { label: 'Directory', href: 'https://directory.zenohosp.com', icon: BookOpen },
    { label: 'Assets',    href: 'https://asset.zenohosp.com',     icon: LayoutGrid },
];

const WARD_LINKS_BASE = [
    { to: '/pharmacy/dispensing/queue', label: 'Pending Prescriptions', icon: ClipboardList },
    { to: '/pharmacy/dispensing/logs',  label: 'Dispensing History',    icon: History },
];
const RETURNS_LINK = { to: '/pharmacy/returns', label: 'Return Requests', icon: RotateCcw };
// Role-gated visibility for the Returns Queue. The backend @PreAuthorize
// matches this list (PHARMACIST, PHARMACY_ADMIN, SUPER_ADMIN — uppercase) so
// even if the sidebar entry slips through, the call surface is the same.
const RETURNS_ROLES = new Set(['pharmacist', 'pharmacy_admin', 'super_admin']);
const SALES_REPORT_LINKS = [
    { to: '/pharmacy/reports/sales-summary', label: 'Sales Summary',     icon: FileText },
    { to: '/pharmacy/reports/sales-by-drug', label: 'Sales by Drug',     icon: Pill },
    { to: '/pharmacy/reports/payments',      label: 'Payment Breakdown', icon: CreditCard },
    { to: '/pharmacy/reports/top-sellers',   label: 'Top Sellers',       icon: TrendingUp },
    { to: '/pharmacy/reports/drug-history',  label: 'Drug History',      icon: History },
];
const STOCK_REPORT_LINKS = [
    { to: '/pharmacy/reports/stock-valuation', label: 'Stock Valuation', icon: Coins },
    { to: '/pharmacy/reports/near-expiry',     label: 'Near Expiry',     icon: AlertTriangle },
    { to: '/pharmacy/reports/stock-movement',  label: 'Stock Movement',  icon: ArrowLeftRight },
    { to: '/pharmacy/reports/dead-stock',      label: 'Dead Stock',      icon: PackageX },
];
const SETTINGS_LINKS = [
    { to: '/pharmacy/drugs', label: 'Drug Master', icon: Pill },
    { to: '/pharmacy/racks', label: 'Rack Master', icon: LayoutGrid },
];

export default function Layout() {
    const location = useLocation();
    const { user } = useAuth();
    const wardLinks = useMemo(() => {
        // Insert Return Requests between Pending Prescriptions and Dispensing History
        // when the operator has a role that can act on a return.
        if (!RETURNS_ROLES.has(user?.role)) return WARD_LINKS_BASE;
        return [WARD_LINKS_BASE[0], RETURNS_LINK, WARD_LINKS_BASE[1]];
    }, [user?.role]);
    const [sidebarOpen, setSidebarOpen] = useState(false);   // mobile drawer
    const [collapsed, setCollapsed] = useState(false);       // desktop icon rail
    const [dispensingOpen, setDispensingOpen] = useState(
        location.pathname.startsWith('/pharmacy/dispensing') || location.pathname.startsWith('/pharmacy/returns')
    );
    const [salesReportsOpen, setSalesReportsOpen] = useState(
        SALES_REPORT_LINKS.some(l => location.pathname.startsWith(l.to))
    );
    const [stockReportsOpen, setStockReportsOpen] = useState(
        STOCK_REPORT_LINKS.some(l => location.pathname.startsWith(l.to))
    );
    const [settingsOpen, setSettingsOpen] = useState(
        SETTINGS_LINKS.some(l => location.pathname.startsWith(l.to))
    );

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
    const groupActive = (links) => links.some(l => isActive(l.to));

    // Top-level link — full row when expanded, centered icon when collapsed.
    const TopLink = ({ to, icon: Icon, label }) => (
        <Link
            to={to}
            title={collapsed ? label : undefined}
            className={`sidebar-link ${collapsed ? 'is-icon-only' : ''} ${isActive(to) ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
        >
            <Icon className="sidebar-icon" size={18} />
            {!collapsed && <span>{label}</span>}
        </Link>
    );

    const SubLink = ({ to, icon: Icon, label }) => (
        <Link
            to={to}
            className={`sidebar-link sidebar-submenu-link ${isActive(to) ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
        >
            <Icon className="sidebar-icon" size={15} />
            {label}
        </Link>
    );

    // Accordion — collapses to a single icon that re-opens the rail when clicked.
    const Accordion = ({ open, setOpen, icon: Icon, label, links }) => {
        if (collapsed) {
            return (
                <button
                    type="button"
                    title={label}
                    className={`sidebar-link sidebar-submenu-toggle is-icon-only ${groupActive(links) ? 'active' : ''}`}
                    onClick={() => { setCollapsed(false); setOpen(true); }}
                >
                    <Icon className="sidebar-icon" size={18} />
                </button>
            );
        }
        return (
            <div className="sidebar-subsection">
                <button type="button" onClick={() => setOpen(o => !o)} className="sidebar-link sidebar-submenu-toggle">
                    <div className="sidebar-submenu-inner">
                        <Icon className="sidebar-icon" size={18} />
                        {label}
                    </div>
                    {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>
                {open && (
                    <div className="sidebar-submenu">
                        {links.map(l => <SubLink key={l.to} {...l} />)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`app-layout ${collapsed ? 'is-collapsed' : ''}`}>
            {/* Mobile Header */}
            <header className="app-header">
                <div className="app-logo">
                    <Pill size={22} />
                    <span>ZenoPharmacy</span>
                </div>
                <div className="header-right">
                    <div className="user-menu">
                        <span className="header-welcome">Pharmacy</span>
                    </div>
                    <button className="btn btn-icon btn-ghost" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? <XIcon size={18} /> : <MenuIcon size={18} />}
                    </button>
                </div>
            </header>

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''} ${collapsed ? 'is-collapsed' : ''}`}>
                <div className="sidebar-brand">
                    <Pill size={20} className="sidebar-brand-icon" />
                    {!collapsed && <span className="sidebar-brand-text">ZenoPharmacy</span>}
                </div>

                <nav className="sidebar-nav">
                    <ul className="sidebar-menu">
                        {/* Dashboard */}
                        <li>
                            <TopLink to="/pharmacy/dashboard" icon={LayoutDashboard} label="Dashboard" />
                        </li>

                        {/* Sales & Dispensing — Counter Sale + Ward Dispensing + Sales Ledger */}
                        <li className="sidebar-section">
                            {!collapsed && <div className="sidebar-section-title">Sales & Dispensing</div>}
                            <TopLink to="/pharmacy/counter-sale" icon={ShoppingCart} label="POS" />
                            <Accordion
                                open={dispensingOpen}
                                setOpen={setDispensingOpen}
                                icon={ClipboardList}
                                label="Ward Dispensing"
                                links={wardLinks}
                            />
                            <TopLink to="/pharmacy/sales-ledger" icon={Receipt} label="Sales Ledger" />
                        </li>

                        {/* Inventory — Stock on hand */}
                        <li className="sidebar-section">
                            {!collapsed && <div className="sidebar-section-title">Inventory</div>}
                            <TopLink to="/pharmacy/stock" icon={Boxes} label="Stock on Hand" />
                        </li>

                        {/* Reports — grouped Sales & Stock analytics */}
                        <li className="sidebar-section">
                            {!collapsed && <div className="sidebar-section-title">Reports</div>}
                            <Accordion
                                open={salesReportsOpen}
                                setOpen={setSalesReportsOpen}
                                icon={BarChart2}
                                label="Sales Reports"
                                links={SALES_REPORT_LINKS}
                            />
                            <Accordion
                                open={stockReportsOpen}
                                setOpen={setStockReportsOpen}
                                icon={PieChart}
                                label="Stock Reports"
                                links={STOCK_REPORT_LINKS}
                            />
                        </li>

                        {/* Settings — masters & one-time setup */}
                        <li className="sidebar-section">
                            <Accordion
                                open={settingsOpen}
                                setOpen={setSettingsOpen}
                                icon={Settings}
                                label="Settings"
                                links={SETTINGS_LINKS}
                            />
                        </li>

                    </ul>
                </nav>

                {/* Other Apps — fixed footer; the nav scrolls underneath it */}
                <div className="sidebar-footer">
                    {!collapsed && <div className="sidebar-section-title sidebar-apps-title">Other Apps</div>}
                    {EXTERNAL_APPS.map((app) => {
                        const Icon = app.icon;
                        return (
                            <a
                                key={app.href}
                                href={app.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={collapsed ? app.label : undefined}
                                className={`sidebar-link sidebar-link--app ${collapsed ? 'is-icon-only' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Icon className="sidebar-icon" size={16} />
                                {!collapsed && <span className="sidebar-app-label">{app.label}</span>}
                                {!collapsed && <ArrowUpRight size={12} className="sidebar-app-arrow" />}
                            </a>
                        );
                    })}
                </div>
            </aside>

            {/* Right column — fixed header + scrollable content.
                Outlet swaps, header + sidebar stay fixed. */}
            <div className="app-main">
                <Header onToggleSidebar={() => setCollapsed(c => !c)} />
                <main className="main-content">
                    <Suspense fallback={<ContentLoader />}>
                        <div className="page-enter" key={location.pathname}>
                            <Outlet />
                        </div>
                    </Suspense>
                </main>
            </div>
        </div>
    );
}
