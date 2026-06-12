import { useState, Suspense } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import ContentLoader from './shared/ContentLoader';
import Header from './Header';
import {
    LayoutDashboard, ShoppingCart, History,
    ChevronDown, ChevronRight, Pill, FileText,
    Menu as MenuIcon, X as XIcon,
    Activity, BarChart2, Boxes, BookOpen, LayoutGrid, ArrowUpRight
} from 'lucide-react';

const EXTERNAL_APPS = [
    { label: 'HMS',       href: 'https://hms.zenohosp.com',       icon: Activity },
    { label: 'Finance',   href: 'https://finance.zenohosp.com',   icon: BarChart2 },
    { label: 'Inventory', href: 'https://inventory.zenohosp.com', icon: Boxes },
    { label: 'Directory', href: 'https://directory.zenohosp.com', icon: BookOpen },
    { label: 'Assets',    href: 'https://asset.zenohosp.com',     icon: LayoutGrid },
];

export default function Layout() {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [dispensingOpen, setDispensingOpen] = useState(
        location.pathname.startsWith('/pharmacy/dispensing')
    );
    const [inventoryOpen, setInventoryOpen] = useState(
        ['/pharmacy/stock', '/pharmacy/racks', '/pharmacy/drugs'].some(p => location.pathname.startsWith(p))
    );
    const [reportsOpen, setReportsOpen] = useState(
        ['/pharmacy/sales-ledger', '/pharmacy/reports'].some(p => location.pathname.startsWith(p))
    );

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    const NavLink = ({ to, icon: Icon, label }) => (
        <Link
            to={to}
            className={`sidebar-link sidebar-submenu-link ${isActive(to) ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
        >
            <Icon className="sidebar-icon" size={15} />
            {label}
        </Link>
    );

    const CollapseToggle = ({ open, onToggle, icon: Icon, label }) => (
        <button onClick={onToggle} className="sidebar-link sidebar-submenu-toggle">
            <div className="sidebar-submenu-inner">
                <Icon className="sidebar-icon" size={18} />
                {label}
            </div>
            {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
    );

    return (
        <div className="app-layout">
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
            <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-brand">
                    <Pill size={20} className="sidebar-brand-icon" />
                    <span className="sidebar-brand-text">ZenoPharmacy</span>
                </div>

                <nav className="sidebar-nav">
                    <ul className="sidebar-menu">
                        {/* Dashboard */}
                        <li>
                            <Link
                                to="/pharmacy/dashboard"
                                className={`sidebar-link ${isActive('/pharmacy/dashboard') ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <LayoutDashboard className="sidebar-icon" size={18} />
                                Dashboard
                            </Link>
                        </li>

                        {/* Dispensing Section — Counter Sale (anchor) + IPD collapsible */}
                        <li className="sidebar-section">
                            <div className="sidebar-section-title">Dispensing</div>

                            <Link
                                to="/pharmacy/counter-sale"
                                className={`sidebar-link ${isActive('/pharmacy/counter-sale') ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <ShoppingCart className="sidebar-icon" size={18} />
                                Counter Sale
                            </Link>

                            <div className="sidebar-subsection">
                                <CollapseToggle
                                    open={dispensingOpen}
                                    onToggle={() => setDispensingOpen(o => !o)}
                                    icon={Pill}
                                    label="IPD Dispensing"
                                />
                                {dispensingOpen && (
                                    <div className="sidebar-submenu">
                                        <NavLink to="/pharmacy/dispensing/queue" icon={Pill} label="Queue" />
                                        <NavLink to="/pharmacy/dispensing/logs" icon={History} label="Dispensing Logs" />
                                    </div>
                                )}
                            </div>
                        </li>

                        {/* Inventory Section — Stock (anchor) + Racks + Drug Master */}
                        <li className="sidebar-section">
                            <div className="sidebar-section-title">Inventory</div>

                            <div className="sidebar-subsection">
                                <CollapseToggle
                                    open={inventoryOpen}
                                    onToggle={() => setInventoryOpen(o => !o)}
                                    icon={Boxes}
                                    label="Stock"
                                />
                                {inventoryOpen && (
                                    <div className="sidebar-submenu">
                                        <NavLink to="/pharmacy/stock" icon={Boxes} label="Stock Dashboard" />
                                        <NavLink to="/pharmacy/racks" icon={LayoutGrid} label="Rack Master" />
                                        <NavLink to="/pharmacy/drugs" icon={Pill} label="Drug Master" />
                                    </div>
                                )}
                            </div>
                        </li>

                        {/* Reports & Ledger Section */}
                        <li className="sidebar-section">
                            <div className="sidebar-section-title">Reports</div>

                            <div className="sidebar-subsection">
                                <CollapseToggle
                                    open={reportsOpen}
                                    onToggle={() => setReportsOpen(o => !o)}
                                    icon={FileText}
                                    label="Ledger & Reports"
                                />
                                {reportsOpen && (
                                    <div className="sidebar-submenu">
                                        <NavLink to="/pharmacy/sales-ledger" icon={History} label="Sales Ledger" />
                                        <NavLink to="/pharmacy/reports" icon={FileText} label="Reports" />
                                    </div>
                                )}
                            </div>
                        </li>
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-section-title sidebar-section-title--footer">Other Apps</div>
                    {EXTERNAL_APPS.map((app) => {
                        const Icon = app.icon;
                        return (
                            <a
                                key={app.href}
                                href={app.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sidebar-link sidebar-link--app"
                            >
                                <Icon className="sidebar-icon" size={16} />
                                <span className="sidebar-app-label">{app.label}</span>
                                <ArrowUpRight size={12} className="sidebar-app-arrow" />
                            </a>
                        );
                    })}

                    <div className="sidebar-copyright">© 2026 Pharmacy Manager</div>
                </div>
            </aside>

            {/* Right column — fixed header + scrollable content.
                Outlet swaps, header + sidebar stay fixed. */}
            <div className="app-main">
                <Header />
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
