import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, ShoppingCart, History,
    LogOut, ChevronDown, ChevronRight, Pill, FileText,
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

export default function Layout({ children }) {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [reportsOpen, setReportsOpen] = useState(
        ['/pharmacy/sales-ledger', '/pharmacy/reports'].includes(location.pathname)
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

                        {/* Counter Sale */}
                        <li>
                            <Link
                                to="/pharmacy/counter-sale"
                                className={`sidebar-link ${isActive('/pharmacy/counter-sale') ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <ShoppingCart className="sidebar-icon" size={18} />
                                Counter Sale
                            </Link>
                        </li>

                        {/* Ward Dispensing */}
                        <li>
                            <Link
                                to="/pharmacy/ward-dispensing"
                                className={`sidebar-link ${isActive('/pharmacy/ward-dispensing') ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Pill className="sidebar-icon" size={18} />
                                Ward Dispensing
                            </Link>
                        </li>

                        {/* Dispensing Queue */}
                        <li>
                            <Link
                                to="/pharmacy/dispensing/queue"
                                className={`sidebar-link ${isActive('/pharmacy/dispensing/queue') ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Pill className="sidebar-icon" size={18} />
                                Dispensing Queue
                            </Link>
                        </li>

                        {/* Stock Dashboard */}
                        <li>
                            <Link
                                to="/pharmacy/stock"
                                className={`sidebar-link ${isActive('/pharmacy/stock') ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <LayoutDashboard className="sidebar-icon" size={18} />
                                Stock Dashboard
                            </Link>
                        </li>

                        <li>
                            <Link
                                to="/pharmacy/drugs"
                                className={`sidebar-link ${isActive('/pharmacy/drugs') ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Pill className="sidebar-icon" size={18} />
                                Drug Master
                            </Link>
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
                    <div className="sidebar-section-title" style={{ marginTop: 0, marginBottom: 6 }}>Other Apps</div>
                    {EXTERNAL_APPS.map((app) => {
                        const Icon = app.icon;
                        return (
                            <a
                                key={app.href}
                                href={app.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sidebar-link"
                                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                            >
                                <Icon className="sidebar-icon" size={16} />
                                <span style={{ flex: 1 }}>{app.label}</span>
                                <ArrowUpRight size={12} style={{ opacity: 0.45 }} />
                            </a>
                        );
                    })}

                    <button onClick={() => console.log('logout')} className="btn btn-sm sidebar-footer-signout" style={{ marginTop: 12 }}>
                        <LogOut size={14} />
                        Sign Out
                    </button>
                    <div className="sidebar-copyright">© 2026 Pharmacy Manager</div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
